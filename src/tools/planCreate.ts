import type { PlanMetadata, PlanType } from "../types";

import { join } from "node:path";

import { tool } from "@opencode-ai/plugin";

import { CreatePlanInputSchema } from "../schemas";
import {
	calculateProgress,
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
	description:
		"Create a new implementation plan. Generates a deterministic plan ID from the title and type, then creates a folder in the pending directory with metadata.json, spec.md, and plan.md.",
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
					return "Error: Too many plans with similar titles. Please choose a more unique title or check existing plans with plan_list.";
				}
			}

			// Also check in_progress and done to avoid cross-status duplicates
			const existingLocation = await resolvePlanFolder(
				context.directory,
				planId,
			);
			if (existingLocation) {
				return `Error: A plan with ID '${planId}' already exists in '${existingLocation.status}/' directory.
Use plan_list to see existing plans.`;
			}

			const phaseDuplicates = validateUniquePhaseNames(args.implementation);
			if (phaseDuplicates.length > 0) {
				return `Error: Duplicate phase names found. Phase names must be unique across the implementation document to ensure reliable updates.
Duplicates: ${phaseDuplicates.join(", ")}`;
			}

			// Validate duplicate task names across phases
			const taskDuplicates = validateUniqueTaskNames(args.implementation);
			if (taskDuplicates.length > 0) {
				return `Error: Duplicate task names found. Task names must be unique across all phases to ensure reliable updates.
Duplicates: ${taskDuplicates.join(", ")}`;
			}

			// Create plan folder
			const folderPath = join(paths.pending, planId);
			await Bun.write(join(folderPath, ".gitkeep"), "");

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

			await Promise.all([
				writeMetadata(folderPath, metadata),
				Bun.write(join(folderPath, "spec.md"), specMarkdown),
				Bun.write(join(folderPath, "plan.md"), planMarkdown),
			]);

			const tasks = args.implementation.phases.flatMap((phase) => phase.tasks);
			const progress = calculateProgress(tasks);

			return `✓ Plan created successfully!

**Plan ID:** ${planId}
**Location:** .opencode/plans/pending/${planId}/
**Type:** ${args.metadata.type}
**Status:** pending
**Description:** ${args.metadata.description}
**Tasks:** ${progress.total} (${progress.percentage}% done)

Files created:
- \`metadata.json\` — Plan identity and state
- \`spec.md\` — Requirements and acceptance criteria
- \`plan.md\` — Phased implementation tasks

Use \`plan_read\` with id "${planId}" to load this plan.`;
		} catch (error) {
			return `Error creating plan: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
});
