import type { PlanContent } from "../types";

import { join } from "node:path";

import { tool } from "@opencode-ai/plugin";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../constants";
import { PlanViewSchema } from "../schemas";
import {
	buildToolOutput,
	calculateProgress,
	formatPlanOutput,
	loadConfig,
	parseImplementation,
	parseSpecifications,
	readMetadata,
	resolvePlanFolder,
} from "../utils";

/**
 * PLAN_READ: Read a plan with selective views
 */
export const planRead = tool({
	description:
		"Read a plan's content by ID. Use the 'view' parameter to control how much detail is returned (summary, spec, plan, or full).",
	args: {
		id: tool.schema
			.string()
			.min(1)
			.meta({ description: "The plan's ID (folder name)" }),
		view: PlanViewSchema.optional().default("full").meta({
			description:
				"What to return: 'summary' (cheapest), 'spec', 'plan', or 'full' (default)",
		}),
	},
	async execute(args, context) {
		try {
			// Load configuration
			const config = await loadConfig(context.directory);

			const location = await resolvePlanFolder(context.directory, args.id);

			if (!location) {
				return buildToolOutput({
					type: "error",
					text: [
						`Plan '${args.id}' not found.`,
						"NEXT STEP: Use plan_list to check available plans.",
					],
				});
			}

			// Always read metadata
			const metadata = await readMetadata(location.path);

			const outputPlanContent: PlanContent = {
				metadata,
			};

			// Read implementation file for progress stats (needed for summary too)
			if (
				args.view === "summary" ||
				args.view === "plan" ||
				args.view === "full"
			) {
				const implFile = Bun.file(
					join(location.path, IMPLEMENTATION_FILE_NAME),
				);
				if (await implFile.exists()) {
					const implContent = await implFile.text();

					const implementation = parseImplementation(implContent);
					const tasks = implementation.phases.flatMap((phase) => phase.tasks);
					const progress = calculateProgress(tasks);

					// Progress is always included if implementation is read
					outputPlanContent.progress = progress;

					if (args.view === "plan" || args.view === "full") {
						outputPlanContent.implementation = implementation;
					}
				}
			}

			// Include spec content
			if (args.view === "spec" || args.view === "full") {
				const specFile = Bun.file(
					join(location.path, SPECIFICATIONS_FILE_NAME),
				);
				if (await specFile.exists()) {
					const specContent = await specFile.text();
					const specifications = parseSpecifications(specContent);
					outputPlanContent.specifications = specifications;
				}
			}

			// Format output based on config
			const planOutput = formatPlanOutput(
				outputPlanContent,
				config.outputFormat,
			);

			return buildToolOutput({
				type: "success",
				text: [planOutput],
			});
		} catch (error) {
			return buildToolOutput({
				type: "error",
				text: [
					"Failed to read plan.",
					error instanceof Error ? error.message : "Unknown error",
				],
			});
		}
	},
});
