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
 * Builds the warning line appended to plan-list output when one or more plan
 * folders could not be read (e.g. corrupt or missing metadata.json).
 */
function skippedFoldersWarning(folders: string[]): string {
	return `Warning: ${folders.length} folder(s) could not be read: ${folders.join(", ")}`;
}

/**
 * PLAN_LIST: List plans by reading only metadata.json files
 */
export const planList = tool({
	description:
		"List plans filtered by status and/or type. Defaults to active (pending + in_progress). Returns a table with id, description, type, status, and last updated date.",
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
			const skippedFolders: string[] = [];

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
						// Track folders that could not be read instead of silently skipping
						skippedFolders.push(folderName);
					}
				}
			}

			if (results.length === 0) {
				let filterDesc = "";
				if (args.status !== "all") {
					filterDesc += `${args.status} `;
				}

				const noPlansText: string[] = [
					`No ${filterDesc}plans found.`,
					"NEXT STEP: Use plan_create to create a new plan.",
				];

				if (skippedFolders.length > 0) {
					noPlansText.push(skippedFoldersWarning(skippedFolders));
				}

				return buildToolOutput({
					type: "info",
					text: noPlansText,
				});
			}

			// Format results as a table
			const table = generateMetadatasTable(results);

			const successText: string[] = [
				`Found ${results.length} plan(s):`,
				"",
				table,
			];

			if (skippedFolders.length > 0) {
				successText.push(skippedFoldersWarning(skippedFolders));
			}

			return buildToolOutput({
				type: "success",
				text: successText,
			});
		} catch (error) {
			return buildToolOutput({
				type: "error",
				text: [
					"Failed to list plans.",
					error instanceof Error ? error.message : "Unknown error",
				],
			});
		}
	},
});
