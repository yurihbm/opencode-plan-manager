import type { PlanMetadata, PlanType } from "../types";

import { join } from "node:path";

import { tool } from "@opencode-ai/plugin";

import { CreatePlanInputSchema } from "../schemas";
import {
	calculateProgress,
	ensurePlanDirectories,
	generatePlanId,
	generatePlanMarkdown,
	generateSpecMarkdown,
	getPlanPaths,
	parseTasks,
	resolvePlanFolder,
	validateUniqueTaskNames,
	writeMetadata,
} from "../utils";

/**
 * PLAN_CREATE: Create a new folder-per-plan in pending/
 */
export const planCreate = tool({
	description:
		"Create a new implementation plan. Generates a deterministic plan_id from the title and type, then creates a folder in the pending directory with metadata.json, spec.md, and plan.md.",
	args: CreatePlanInputSchema.shape,
	async execute(args, context) {
		try {
			await ensurePlanDirectories(context.directory);
			const paths = getPlanPaths(context.directory);

			// Generate deterministic plan_id
			const planId = generatePlanId(args.type, args.title);

			// Handle duplicate Plan IDs by appending a counter suffix
			let finalPlanId = planId;
			let counter = 2;
			while (
				await Bun.file(
					join(paths.pending, finalPlanId, "metadata.json"),
				).exists()
			) {
				finalPlanId = `${planId}-${counter}`;
				counter++;
			}

			// Also check in_progress and done to avoid cross-status duplicates
			const existingLocation = await resolvePlanFolder(
				context.directory,
				finalPlanId,
			);
			if (existingLocation) {
				return `Error: A plan with plan_id '${finalPlanId}' already exists in '${existingLocation.status}/' directory.\n\nUse plan_list to see existing plans.`;
			}

			// Validate duplicate task names across phases
			const duplicates = validateUniqueTaskNames(args.implementation);
			if (duplicates.length > 0) {
				return `Error: Duplicate task names found. Task names must be unique across all phases to ensure reliable updates.\n\nDuplicates: ${duplicates.join(", ")}`;
			}

			// Create plan folder
			const folderPath = join(paths.pending, finalPlanId);
			await Bun.write(join(folderPath, ".gitkeep"), "");

			// Build metadata
			const now = new Date().toISOString();
			const metadata: PlanMetadata = {
				plan_id: finalPlanId,
				type: args.type as PlanType,
				status: "pending",
				created_at: now,
				updated_at: now,
				description: args.description,
			};

			// Write all 3 files
			// Generate markdown from structured input
			const specMarkdown = generateSpecMarkdown(args.spec);
			const planMarkdown = generatePlanMarkdown(args.implementation);

			await Promise.all([
				writeMetadata(folderPath, metadata),
				Bun.write(join(folderPath, "spec.md"), specMarkdown),
				Bun.write(join(folderPath, "plan.md"), planMarkdown),
			]);

			// Calculate initial progress
			const tasks = parseTasks(planMarkdown);
			const progress = calculateProgress(tasks);

			return `✓ Plan created successfully!

**Plan ID:** ${finalPlanId}
**Location:** .opencode/plans/pending/${finalPlanId}/
**Type:** ${args.type}
**Status:** pending
**Description:** ${args.description}
**Tasks:** ${progress.total} (${progress.percentage}% done)

Files created:
- \`metadata.json\` — Plan identity and state
- \`spec.md\` — Requirements and acceptance criteria
- \`plan.md\` — Phased implementation tasks

Use \`plan_read\` with plan_id "${finalPlanId}" to load this plan.`;
		} catch (error) {
			return `Error creating plan: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
});
