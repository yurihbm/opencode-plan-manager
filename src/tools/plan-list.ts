import type { PlanMetadata, PlanStatus } from "../types";

import { join } from "node:path";

import { tool } from "@opencode-ai/plugin";
import { z } from "zod";

import { PlanStatusSchema, PlanTypeSchema } from "../schemas";
import {
	buildToolOutput,
	generateMetadatasTable,
	getPlanPaths,
	listPlanFolders,
	readMetadata,
} from "../utils";

/**
 * PLAN_LIST: List plans by reading only metadata.json files
 */
export const planList = tool({
	description:
		"List plans with their metadata. Reads only metadata.json files for performance. Defaults to showing pending + in_progress plans. Returns a table with id, description, type, status, and last updated date.",
	args: {
		status: z
			.union([PlanStatusSchema, z.enum(["active", "all"])])
			.optional()
			.default("active")
			.meta({
				description:
					"Filter by plan status. 'active' = pending + in_progress (default). 'all' = everything.",
			}),
		type: PlanTypeSchema.optional().meta({
			description: "Optional: filter by plan type",
		}),
	},
	async execute(args, context) {
		try {
			// Determine which status directories to scan
			const statusesToScan: PlanStatus[] = [];

			if (args.status === "active") {
				statusesToScan.push("pending", "in_progress");
			} else if (args.status === "all") {
				statusesToScan.push("pending", "in_progress", "done");
			} else {
				statusesToScan.push(args.status as PlanStatus);
			}

			const results: Array<PlanMetadata> = [];

			// Scan each status directory
			const paths = getPlanPaths(context.directory);
			for (const status of statusesToScan) {
				const folders = await listPlanFolders(context.directory, status);

				for (const folderName of folders) {
					try {
						const folderPath = join(paths[status], folderName);
						const metadata = await readMetadata(folderPath);

						// Apply type filter if provided
						if (args.type && metadata.type !== args.type) {
							continue;
						}

						results.push(metadata);
					} catch {
						// Skip folders with invalid metadata
						continue;
					}
				}
			}

			if (results.length === 0) {
				let filterDesc = "";
				if (args.status !== "all") {
					filterDesc += `${args.status} `;
				}

				return buildToolOutput({
					type: "info",
					text: [
						`No ${filterDesc}plans found.`,
						"To create a new plan, use the `plan_create` tool.",
					],
				});
			}

			// Format results as a table
			const table = generateMetadatasTable(results);

			return buildToolOutput({
				type: "success",
				text: [`Found ${results.length} plan(s):`, "", table],
			});
		} catch (error) {
			return buildToolOutput({
				type: "error",
				text: [
					"An error occurred while listing plans.",
					`Error details: ${error instanceof Error ? error.message : "Unknown error"}`,
				],
			});
		}
	},
});
