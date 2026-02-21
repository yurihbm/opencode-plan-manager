import type { PlanMetadata, PlanType } from "../types";

import { rm } from "node:fs/promises";
import { join, relative } from "node:path";

import { tool } from "@opencode-ai/plugin";
import { createPatch } from "diff";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../constants";
import { CreatePlanInputSchema } from "../schemas";
import {
	askPlanEdit,
	buildToolOutput,
	ensurePlanDirectories,
	generatePlanId,
	generatePlanMarkdown,
	getPlanPaths,
	resolvePlanFolder,
	validateUniquePhaseNames,
	validateUniqueTaskNames,
	writeMetadata,
} from "../utils";

/**
 * PLAN_CREATE: Create a new folder-per-plan in pending/
 */
export const planCreate = tool({
	description: `Create a new plan. Generates a deterministic plan ID from the title and type, then creates a folder in the pending directory with metadata.json, ${SPECIFICATIONS_FILE_NAME}, and ${IMPLEMENTATION_FILE_NAME}.`,
	args: CreatePlanInputSchema.shape,
	async execute(args, context) {
		try {
			await ensurePlanDirectories(context.directory);
			const paths = getPlanPaths(context.directory);

			// Generate deterministic id
			let planId = generatePlanId(args.metadata.type, args.metadata.title);

			// Handle duplicate Plan IDs by appending a counter suffix
			let counter = 2;
			while (
				await Bun.file(join(paths.pending, planId, "metadata.json")).exists()
			) {
				planId = `${planId}-${counter}`;
				counter++;
				if (counter > 5) {
					return buildToolOutput({
						type: "warning",
						text: [
							"Too many plans with similar titles.",
							"Please choose a more unique title or check existing plans with `plan_list` tool.",
						],
					});
				}
			}

			// Also check in_progress and done to avoid cross-status duplicates
			const existingLocation = await resolvePlanFolder(
				context.directory,
				planId,
			);
			if (existingLocation) {
				return buildToolOutput({
					type: "warning",
					text: [
						`A plan with ID '${planId}' already exists in '${existingLocation.status}/' directory.`,
						"Please choose a different title or check existing plans with `plan_list` tool.",
					],
				});
			}

			const phaseDuplicates = validateUniquePhaseNames(args.implementation);
			if (phaseDuplicates.length > 0) {
				return buildToolOutput({
					type: "warning",
					text: [
						"Duplicate phase names found.",
						"Phase names must be unique across the implementation document to ensure reliable updates.",
						`Duplicates: ${phaseDuplicates.join(", ")}`,
						"NEXT STEP: Change duplicate phase names to be unique and try creating the plan again.",
					],
				});
			}

			// Validate duplicate task names across phases
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

			// Build metadata
			const now = new Date().toISOString();
			const metadata: PlanMetadata = {
				id: planId,
				type: args.metadata.type as PlanType,
				status: "pending",
				created_at: now,
				updated_at: now,
				description: args.metadata.description,
			};

			const specMarkdown = generatePlanMarkdown({
				specifications: args.specifications,
			});
			const planMarkdown = generatePlanMarkdown({
				implementation: args.implementation,
			});

			// Create plan folder
			const folderPath = join(paths.pending, planId);

			const specFilePath = join(folderPath, SPECIFICATIONS_FILE_NAME);
			const implFilePath = join(folderPath, IMPLEMENTATION_FILE_NAME);

			const combinedContent = specMarkdown + "\n\n---\n\n" + planMarkdown;
			const totalDiff = createPatch(planId, "", combinedContent);

			const specRelativePath = relative(context.directory, specFilePath);
			const implRelativePath = relative(context.directory, implFilePath);

			const askOutput = await askPlanEdit({
				planId,
				relPath: {
					specifications: specRelativePath,
					implementation: implRelativePath,
				},
				diff: totalDiff,
				context,
			});

			if (askOutput.rejected) {
				return askOutput.toolOutput;
			}

			try {
				// Create plan files
				await Promise.all([
					writeMetadata(folderPath, metadata),
					Bun.write(specFilePath, specMarkdown),
					Bun.write(implFilePath, planMarkdown),
				]);
			} catch (error) {
				// If writing files fails, attempt to clean up the created folder to avoid clutter
				await rm(folderPath, { recursive: true, force: true });

				return buildToolOutput({
					type: "error",
					text: [
						"Failed to create plan files after user approval.",
						error instanceof Error ? error.message : "Unknown error",
					],
				});
			}

			return buildToolOutput({
				type: "success",
				text: [
					"Plan created successfully.",
					"NEXT STEP: Tell the user that it can switch to the Build agent to start implementing the plan.",
				],
			});
		} catch (error) {
			return buildToolOutput({
				type: "error",
				text: [
					"An error occurred while creating the plan.",
					error instanceof Error ? error.message : "Unknown error",
				],
			});
		}
	},
});
