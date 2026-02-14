import type { PlanStatus } from "../../types";

import { mkdir, rename } from "node:fs/promises";
import { join } from "node:path";

import { getPlanPaths } from "./get-plan-paths";

/**
 * Moves a plan folder from one status directory to another.
 *
 * Uses `rename()` for atomic moves on the same filesystem.
 *
 * @param cwd - The current working directory (project root)
 * @param planId - The plan's plan ID (folder name)
 * @param fromStatus - Current status directory
 * @param toStatus - Target status directory
 * @returns The new folder path
 * @throws {Error} If the source folder doesn't exist
 */
export async function movePlanFolder(
	cwd: string,
	planId: string,
	fromStatus: PlanStatus,
	toStatus: PlanStatus,
): Promise<string> {
	const paths = getPlanPaths(cwd);
	const sourcePath = join(paths[fromStatus], planId);
	const targetPath = join(paths[toStatus], planId);

	// Ensure target directory exists
	await mkdir(paths[toStatus], { recursive: true });

	// Atomic move
	await rename(sourcePath, targetPath);

	return targetPath;
}
