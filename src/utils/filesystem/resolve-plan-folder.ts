import type { PlanLocation } from "../../types";

import { join } from "node:path";

import { PlanStatusSchema } from "../../schemas";
import { getPlanPaths } from "./get-plan-paths";

// Sort order: in_progress (highest priority) -> pending -> done
const STATUS_DIRS = [...PlanStatusSchema.options].sort((a, b) => {
	const priority = { in_progress: 0, pending: 1, done: 2 };
	return priority[a] - priority[b];
});

/**
 * Resolves a plan folder by its plan ID, searching all status directories.
 *
 * Searches in order: `in_progress` → `pending` → `done` (most likely first).
 *
 * @param cwd - The current working directory (project root)
 * @param planId - The plan's plan ID (folder name)
 * @returns Plan location with path and status, or null if not found
 *
 * @example
 * ```typescript
 * const location = await resolvePlanFolder('/home/user/project', 'feature_auth_20260206');
 * if (location) {
 *   console.log(location.path);    // '/home/user/project/.opencode/plans/in_progress/feature_auth_20260206'
 *   console.log(location.status);  // 'in_progress'
 * }
 * ```
 */
export async function resolvePlanFolder(
	cwd: string,
	planId: string,
): Promise<PlanLocation | null> {
	const paths = getPlanPaths(cwd);

	for (const status of STATUS_DIRS) {
		const folderPath = join(paths[status], planId);
		const metadataPath = join(folderPath, "metadata.json");

		if (await Bun.file(metadataPath).exists()) {
			return { path: folderPath, status };
		}
	}

	return null;
}
