import type { PlanStatus } from "../../types";

import { readdir } from "node:fs/promises";

import { getPlanPaths } from "./get-plan-paths";

/**
 * Lists all plan folder names within a specific status directory.
 *
 * @param cwd - The current working directory (project root)
 * @param status - The status directory to list
 * @returns Array of folder names (plan IDs)
 */
export async function listPlanFolders(
	cwd: string,
	status: PlanStatus,
): Promise<string[]> {
	const paths = getPlanPaths(cwd);
	const dirPath = paths[status];

	try {
		const entries = await readdir(dirPath, { withFileTypes: true });
		return entries.filter((e) => e.isDirectory()).map((e) => e.name);
	} catch {
		// Directory doesn't exist yet — that's OK
		return [];
	}
}
