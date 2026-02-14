import type { PlanMetadata, PlanStatus } from "../types";

import { join } from "node:path";

import { tool } from "@opencode-ai/plugin";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../constants";
import { UpdatePlanInputBaseSchema } from "../schemas";
import {
	generatePlanMarkdown,
	isValidTransition,
	movePlanFolder,
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
				return `Plan '${args.id}' not found in any status directory.\n\nUse plan_list to see available plans.`;
			}

			const updateMessages: string[] = [];
			let currentPath = location.path;
			let currentStatus = location.status;

			// --- Status transition (folder move) ---
			if (args.status !== undefined && args.status !== currentStatus) {
				if (!isValidTransition(currentStatus, args.status)) {
					return `Error: Invalid status transition '${currentStatus}' → '${args.status}'.
Allowed transitions:
  - pending → in_progress
  - in_progress → done
	- in_progress → pending`;
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

			if (args.specifications !== undefined) {
				const specMarkdown = generatePlanMarkdown({
					specifications: args.specifications,
				});
				await Bun.write(
					join(currentPath, SPECIFICATIONS_FILE_NAME),
					specMarkdown,
				);
				updateMessages.push(`${SPECIFICATIONS_FILE_NAME} updated`);
			}

			if (args.implementation !== undefined) {
				// Validate duplicate task names
				const duplicates = validateUniqueTaskNames(args.implementation);
				if (duplicates.length > 0) {
					return `Error: Duplicate task names found. Task names must be unique across all phases.
Duplicates: ${duplicates.join(", ")}`;
				}

				const implMarkdown = generatePlanMarkdown({
					implementation: args.implementation,
				});

				await Bun.write(
					join(currentPath, IMPLEMENTATION_FILE_NAME),
					implMarkdown,
				);
				updateMessages.push(`${IMPLEMENTATION_FILE_NAME} updated`);
			}

			// --- Batch Update Tasks ---
			if (args.taskUpdates && args.taskUpdates.length > 0) {
				const planFilePath = join(currentPath, IMPLEMENTATION_FILE_NAME);
				const planFile = Bun.file(planFilePath);

				if (!(await planFile.exists())) {
					return `Error: ${IMPLEMENTATION_FILE_NAME} not found. Cannot update tasks without a plan file.`;
				}

				let planContent = await planFile.text();
				const taskErrors: string[] = [];

				for (const update of args.taskUpdates) {
					try {
						planContent = updateTaskStatus(
							planContent,
							update.content,
							update.status,
						);
						updateMessages.push(`Task "${update.content}" → ${update.status}`);
					} catch (error) {
						taskErrors.push(
							`Failed to update task "${update.content}": ${error instanceof Error ? error.message : "Unknown error"}`,
						);
					}
				}

				// Write updated content back to file
				await Bun.write(planFilePath, planContent);

				if (taskErrors.length > 0) {
					updateMessages.push(
						`\nWarnings:\n${taskErrors.map((e) => `- ${e}`).join("\n")}`,
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

			return `✓ Plan updated successfully!

**Plan ID:** ${args.id}
**Status:** ${currentStatus}
**Updated:** ${updatedMetadata.updated_at}

**Changes:**
${changesList}`;
		} catch (error) {
			return `Error updating plan: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
});
