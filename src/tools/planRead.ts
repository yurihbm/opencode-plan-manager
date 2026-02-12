import { tool } from "@opencode-ai/plugin";
import { PlanViewEnum } from "../schemas";
import {
	resolvePlanFolder,
	readMetadata,
	parseTasks,
	calculateProgress,
} from "../utils";
import { join } from "node:path";

/**
 * PLAN_READ: Read a plan with selective views
 */
export const planRead = tool({
	description:
		"Read a specific plan's content, metadata, and tasks. Supports selective views to minimize token usage: 'summary' (metadata + progress only), 'spec' (metadata + spec.md), 'plan' (metadata + plan.md + tasks), 'full' (everything).",
	args: {
		plan_id: tool.schema
			.string()
			.min(1)
			.describe("The plan's plan_id (folder name)"),
		view: PlanViewEnum.optional()
			.default("full")
			.describe(
				"What to return: 'summary' (cheapest), 'spec', 'plan', or 'full' (default)",
			),
	},
	async execute(args, context) {
		try {
			const location = await resolvePlanFolder(context.directory, args.plan_id);

			if (!location) {
				return `Plan '${args.plan_id}' not found in any status directory.\n\nUse plan_list to see available plans.`;
			}

			// Always read metadata
			const metadata = await readMetadata(location.path);

			// Build output sections based on view
			const sections: string[] = [];

			sections.push(`✓ Plan loaded successfully!`);
			sections.push(``);
			sections.push(`**Plan ID:** ${metadata.plan_id}`);
			sections.push(`**Type:** ${metadata.type}`);
			sections.push(`**Status:** ${metadata.status}`);
			sections.push(`**Description:** ${metadata.description}`);
			sections.push(`**Created:** ${metadata.created_at}`);
			sections.push(`**Updated:** ${metadata.updated_at}`);

			// Read plan.md for progress stats (needed for summary too)
			let planContent: string | undefined;
			if (
				args.view === "summary" ||
				args.view === "plan" ||
				args.view === "full"
			) {
				const planFile = Bun.file(join(location.path, "plan.md"));
				if (await planFile.exists()) {
					planContent = await planFile.text();
				}
			}

			// Calculate and display progress
			if (planContent !== undefined) {
				const tasks = parseTasks(planContent);
				const progress = calculateProgress(tasks);
				sections.push(
					`**Progress:** ${progress.done}/${progress.total} tasks done (${progress.percentage}%) | ${progress.in_progress} in progress | ${progress.pending} pending`,
				);
			}

			// Include spec content
			if (args.view === "spec" || args.view === "full") {
				const specFile = Bun.file(join(location.path, "spec.md"));
				if (await specFile.exists()) {
					const specContent = await specFile.text();
					sections.push(``);
					sections.push(`---`);
					sections.push(`## Specification (spec.md)`);
					sections.push(``);
					sections.push(specContent);
				}
			}

			// Include plan content and tasks
			if (args.view === "plan" || args.view === "full") {
				if (planContent !== undefined) {
					sections.push(``);
					sections.push(`---`);
					sections.push(`## Implementation Plan (plan.md)`);
					sections.push(``);
					sections.push(planContent);

					// Show parsed tasks summary
					const tasks = parseTasks(planContent);
					if (tasks.length > 0) {
						sections.push(``);
						sections.push(`---`);
						sections.push(`**Parsed Tasks (${tasks.length}):**`);
						for (const t of tasks) {
							const marker =
								t.status === "done"
									? "x"
									: t.status === "in_progress"
										? "~"
										: " ";
							sections.push(`- [${marker}] ${t.content}`);
						}
					}
				}
			}

			return sections.join("\n");
		} catch (error) {
			return `Error reading plan: ${error instanceof Error ? error.message : "Unknown error"}`;
		}
	},
});
