import type { PlanMetadata } from "../types";

import { rm } from "node:fs/promises";
import { join, relative } from "node:path";

import { tool } from "@opencode-ai/plugin";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../constants";
import { CreatePlanInputSchema } from "../schemas";
import {
	askPlanEdit,
	buildToolOutput,
	DUPLICATE_PHASES_OUTPUT,
	DUPLICATE_TASKS_OUTPUT,
	ensurePlanDirectories,
	generatePlanId,
	generatePlanMarkdown,
	getPlanPaths,
	prepareUnifiedPlanDiff,
	resolvePlanFolder,
	validateUniquePhaseNames,
	validateUniqueTaskNames,
	writeMetadata,
} from "../utils";

/**
 * PLAN_CREATE: Create a new folder-per-plan in pending/
 */
export const planCreate = tool({
	description:
		"Create a new plan with metadata, specifications, and implementation phases. Returns the generated plan ID on success.",
	args: CreatePlanInputSchema.shape,
	async execute(args, context) {
		try {
			await ensurePlanDirectories(context.directory);
			const paths = getPlanPaths(context.directory);

			// Generate unique id (includes a 4-char hex suffix to avoid collisions)
			const planId = generatePlanId(args.metadata.type, args.metadata.title);

			// Verify no cross-status collision exists (extremely unlikely with hex suffix)
			const existingLocation = await resolvePlanFolder(
				context.directory,
				planId,
			);
			if (existingLocation) {
				return buildToolOutput({
					type: "warning",
					text: [
						`Plan '${planId}' already exists (status: ${existingLocation.status}).`,
						"NEXT STEP: Choose a different title or check existing plans with plan_list.",
					],
				});
			}

			const phaseDuplicates = validateUniquePhaseNames(args.implementation);
			if (phaseDuplicates.length > 0) {
				return DUPLICATE_PHASES_OUTPUT(phaseDuplicates);
			}

			// Validate duplicate task names across phases
			const taskDuplicates = validateUniqueTaskNames(args.implementation);
			if (taskDuplicates.length > 0) {
				return DUPLICATE_TASKS_OUTPUT(taskDuplicates);
			}

			// Build metadata
			const now = new Date().toISOString();
			const metadata: PlanMetadata = {
				id: planId,
				type: args.metadata.type,
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

			const specRelativePath = relative(context.directory, specFilePath);
			const implRelativePath = relative(context.directory, implFilePath);

			// Prepare unified diff for both files (create scenario: current = "")
			const { diff, relPath } = prepareUnifiedPlanDiff(planId, [
				{
					filename: SPECIFICATIONS_FILE_NAME,
					current: "",
					updated: specMarkdown,
					relativePath: specRelativePath,
				},
				{
					filename: IMPLEMENTATION_FILE_NAME,
					current: "",
					updated: planMarkdown,
					relativePath: implRelativePath,
				},
			]);

			const askOutput = await askPlanEdit({
				planId,
				relPath,
				diff,
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
						"Failed to write plan files.",
						error instanceof Error ? error.message : "Unknown error",
					],
				});
			}

			return buildToolOutput({
				type: "success",
				text: [
					`Plan created. ID: ${planId}`,
					"NEXT STEP: Tell the user they can switch to the Build agent to start implementation.",
				],
			});
		} catch (error) {
			return buildToolOutput({
				type: "error",
				text: [
					"Failed to create plan.",
					error instanceof Error ? error.message : "Unknown error",
				],
			});
		}
	},
});
