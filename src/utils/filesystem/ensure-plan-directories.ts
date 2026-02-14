import { mkdir } from "node:fs/promises";

import { getPlanPaths } from "./get-plan-paths";

/**
 * Ensures all plan directories exist, creating them if necessary.
 *
 * Safe to call multiple times (idempotent).
 *
 * @param cwd - The current working directory (project root)
 */
export async function ensurePlanDirectories(cwd: string): Promise<void> {
	const paths = getPlanPaths(cwd);

	await Promise.all([
		mkdir(paths.pending, { recursive: true }),
		mkdir(paths.in_progress, { recursive: true }),
		mkdir(paths.done, { recursive: true }),
	]);
}
