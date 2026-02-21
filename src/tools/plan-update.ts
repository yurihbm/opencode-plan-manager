import type { PlanMetadata, PlanStatus } from "../types";
import type { PlanFileChange } from "../utils";

import { join, relative } from "node:path";

import { tool } from "@opencode-ai/plugin";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../constants";
import { UpdatePlanInputBaseSchema } from "../schemas";
import {
	askPlanEdit,
	buildToolOutput,
	generatePlanMarkdown,
	isValidTransition,
	movePlanFolder,
	prepareUnifiedPlanDiff,
	readMetadata,
	resolvePlanFolder,
	updateTaskStatus,
	validateUniqueTaskNames,
	writeMetadata,
} from "../utils";

/**
 * PLAN_UPDATE: Update status, content, or tasks
 */
export const planUpdate = tool({
	description: `Update a plan's status, content, or tasks. Supports: changing status (moves folder between pending/in_progress/done), replacing ${SPECIFICATIONS_FILE_NAME} or ${IMPLEMENTATION_FILE_NAME} content, and toggling individual task statuses. Auto-updates the updated_at timestamp.`,
	args: UpdatePlanInputBaseSchema.shape,
	async execute(args, context) {
		try {
			// Resolve plan location
			const location = await resolvePlanFolder(context.directory, args.id);

			if (!location) {
				return buildToolOutput({
					type: "error",
					text: [
						`Plan '${args.id}' not found in any status directory.`,
						"Use `plan_list` tool to see available plans.",
					],
				});
			}

			const updateMessages: string[] = [];
			let currentPath = location.path;
			let currentStatus = location.status;

			// --- Status transition (folder move) ---
			if (args.status !== undefined && args.status !== currentStatus) {
				if (!isValidTransition(currentStatus, args.status)) {
					return buildToolOutput({
						type: "error",
						text: [
							`Invalid status transition '${currentStatus}' → '${args.status}'.`,
							"Allowed transitions:",
							"- pending → in_progress",
							"- in_progress → done",
							"- in_progress → pending",
						],
					});
				}

				const newPath = await movePlanFolder(
					context.directory,
					args.id,
					currentStatus,
					args.status as PlanStatus,
				);

				currentPath = newPath;
				currentStatus = args.status as PlanStatus;
				updateMessages.push(
					`Status changed: ${location.status} → ${args.status} (folder moved)`,
				);
			}

			// --- Content changes: spec, implementation, and/or taskUpdates ---
			// Note: schema enforces that implementation and taskUpdates are mutually exclusive.
			const willChangeSpec = args.specifications !== undefined;
			const willChangeImpl =
				args.implementation !== undefined ||
				(args.taskUpdates !== undefined && args.taskUpdates.length > 0);

			if (willChangeSpec || willChangeImpl) {
				const specFilePath = join(currentPath, SPECIFICATIONS_FILE_NAME);
				const implFilePath = join(currentPath, IMPLEMENTATION_FILE_NAME);

				// Validate duplicate task names early (before reading files or asking)
				if (args.implementation !== undefined) {
					const taskDuplicates = validateUniqueTaskNames(args.implementation);
					if (taskDuplicates.length > 0) {
						return buildToolOutput({
							type: "warning",
							text: [
								"Duplicate task names found.",
								"Task names must be unique across all phases to ensure reliable updates.",
								`Duplicates: ${taskDuplicates.join(", ")}`,
								"NEXT STEP: Change duplicate task names to be unique and try creating the plan again.",
							],
						});
					}
				}

				// Check that the implementation file exists when taskUpdates are requested
				if (args.taskUpdates && args.taskUpdates.length > 0) {
					const implFile = Bun.file(implFilePath);
					if (!(await implFile.exists())) {
						return buildToolOutput({
							type: "error",
							text: [
								`${IMPLEMENTATION_FILE_NAME} not found in plan folder.`,
								"Cannot update tasks without an implementation file.",
							],
						});
					}
				}

				// Read current file contents for diff generation and restoration on failure
				const currentSpecContent = willChangeSpec
					? await Bun.file(specFilePath).text()
					: "";
				const currentImplContent = willChangeImpl
					? await Bun.file(implFilePath).text()
					: "";

				// Compute new spec content
				const newSpecContent = willChangeSpec
					? generatePlanMarkdown({ specifications: args.specifications })
					: "";

				// Compute new impl content.
				// Schema guarantees implementation and taskUpdates are mutually exclusive.
				const taskErrors: string[] = [];
				let newImplContent = "";
				if (willChangeImpl) {
					if (args.implementation !== undefined) {
						newImplContent = generatePlanMarkdown({
							implementation: args.implementation,
						});
					} else {
						// taskUpdates: apply each update onto the current file content
						newImplContent = currentImplContent;
						for (const update of args.taskUpdates!) {
							try {
								newImplContent = updateTaskStatus(
									newImplContent,
									update.content,
									update.status,
								);
							} catch (error) {
								taskErrors.push(
									`Failed to update task "${update.content}": ${error instanceof Error ? error.message : "Unknown error"}`,
								);
							}
						}
					}
				}

				// Build a single unified diff for the .ask call.
				// OpenCode supports only one diff block, so when both files change we
				// combine them into a single virtual file (same pattern as plan-create).
				const specRelPath = relative(context.directory, specFilePath);
				const implRelPath = relative(context.directory, implFilePath);

				// Build changeset for files that are changing
				const changes: PlanFileChange[] = [];
				if (willChangeSpec) {
					changes.push({
						filename: SPECIFICATIONS_FILE_NAME,
						current: currentSpecContent,
						updated: newSpecContent,
						relativePath: specRelPath,
					});
				}
				if (willChangeImpl) {
					changes.push({
						filename: IMPLEMENTATION_FILE_NAME,
						current: currentImplContent,
						updated: newImplContent,
						relativePath: implRelPath,
					});
				}

				// Prepare unified diff
				const { diff, relPath } = prepareUnifiedPlanDiff(
					args.id,
					changes as [PlanFileChange] | [PlanFileChange, PlanFileChange],
				);

				const askOutput = await askPlanEdit({
					planId: args.id,
					relPath,
					diff,
					context,
				});

				if (askOutput.rejected) {
					return askOutput.toolOutput;
				}

				// Write files, restoring originals on failure
				try {
					if (willChangeSpec) {
						await Bun.write(specFilePath, newSpecContent);
						updateMessages.push(`${SPECIFICATIONS_FILE_NAME} updated`);
					}

					if (willChangeImpl) {
						await Bun.write(implFilePath, newImplContent);

						if (args.implementation !== undefined) {
							updateMessages.push(`${IMPLEMENTATION_FILE_NAME} updated`);
						}

						if (args.taskUpdates && args.taskUpdates.length > 0) {
							for (const update of args.taskUpdates) {
								// Only surface success for tasks that did not error
								if (
									!taskErrors.some((e) => e.includes(`"${update.content}"`))
								) {
									updateMessages.push(
										`Task "${update.content}" → ${update.status}`,
									);
								}
							}
						}
					}
				} catch (error) {
					// Attempt to restore original file contents to avoid leaving the plan
					// in a partially updated state
					const restoreOps: Promise<number>[] = [];
					if (willChangeSpec) {
						restoreOps.push(Bun.write(specFilePath, currentSpecContent));
					}
					if (willChangeImpl) {
						restoreOps.push(Bun.write(implFilePath, currentImplContent));
					}
					await Promise.allSettled(restoreOps);

					return buildToolOutput({
						type: "error",
						text: [
							"Failed to update plan files after user approval.",
							"Original file contents have been restored.",
							error instanceof Error ? error.message : "Unknown error",
						],
					});
				}

				// Surface any per-task warnings
				if (taskErrors.length > 0) {
					updateMessages.push(
						`Warnings:\n${taskErrors.map((e) => `- ${e}`).join("\n")}`,
					);
				}
			}

			// --- Update metadata timestamp ---
			const metadata = await readMetadata(currentPath);
			const updatedMetadata: PlanMetadata = {
				...metadata,
				status: currentStatus,
				updated_at: new Date().toISOString(),
			};
			await writeMetadata(currentPath, updatedMetadata);

			// Build response
			const changesList = updateMessages.map((m) => `- ${m}`).join("\n");

			return buildToolOutput({
				type: "success",
				text: [
					"Plan updated successfully:",
					`- Plan ID: ${args.id}`,
					`- Status: ${currentStatus}`,
					`- Updated: ${updatedMetadata.updated_at}`,
					"",
					"Changes:",
					changesList,
				],
			});
		} catch (error) {
			return buildToolOutput({
				type: "error",
				text: [
					"An error occurred while updating the plan.",
					error instanceof Error ? error.message : "Unknown error",
				],
			});
		}
	},
});
