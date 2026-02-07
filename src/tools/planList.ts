import { tool } from "@opencode-ai/plugin";
import { PlanTypeEnum } from "../schemas";
import type { PlanStatus } from "../types";
import { listPlanFolders, getPlanPaths, readMetadata } from "../utils";
import { join } from "node:path";

/**
 * PLAN_LIST: List plans by reading only metadata.json files
 */
export const planList = tool({
  description:
    "List plans with their metadata. Reads only metadata.json files for performance. Defaults to showing pending + in_progress plans. Returns a table with plan_id, description, type, status, progress, and last updated date.",
  args: {
    status: tool.schema
      .enum(["pending", "in_progress", "done", "active", "all"])
      .optional()
      .default("active")
      .describe(
        "Filter by plan status. 'active' = pending + in_progress (default). 'all' = everything.",
      ),
    type: PlanTypeEnum.optional().describe("Optional: filter by plan type"),
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

      const results: Array<{
        plan_id: string;
        description: string;
        type: string;
        status: string;
        updated_at: string;
      }> = [];

      // Scan each status directory
      for (const status of statusesToScan) {
        const folders = await listPlanFolders(context.directory, status);

        for (const folderName of folders) {
          try {
            const paths = getPlanPaths(context.directory);
            const folderPath = join(paths[status], folderName);
            const metadata = await readMetadata(folderPath);

            // Apply type filter if provided
            if (args.type && metadata.type !== args.type) {
              continue;
            }

            results.push({
              plan_id: metadata.plan_id,
              description: metadata.description,
              type: metadata.type,
              status: metadata.status,
              updated_at: metadata.updated_at,
            });
          } catch {
            // Skip folders with invalid metadata
          }
        }
      }

      if (results.length === 0) {
        const filterDesc =
          args.status === "all"
            ? ""
            : args.status === "active"
              ? "active "
              : `${args.status} `;
        return `No ${filterDesc}plans found.\n\nTo create a new plan, use the plan_create tool.`;
      }

      // Format results as a table
      const header = "| Plan ID | Description | Type | Status | Updated |";
      const separator = "|---------|-------------|------|--------|---------|";
      const rows = results.map(
        (r) =>
          `| ${r.plan_id} | ${r.description} | ${r.type} | ${r.status} | ${r.updated_at} |`,
      );

      return [
        `Found ${results.length} plan(s):`,
        "",
        header,
        separator,
        ...rows,
      ].join("\n");
    } catch (error) {
      return `Error listing plans: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});
