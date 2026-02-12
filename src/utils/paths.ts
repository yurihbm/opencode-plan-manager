/**
 * Filesystem path resolution for the 3-folder plan architecture.
 *
 * Plans are organized in status-based directories:
 * ```
 * .opencode/plans/
 *   pending/        ← Queued plans
 *   in_progress/    ← Active plans
 *   done/           ← Completed plans
 * ```
 *
 * Each plan is a folder containing `metadata.json`, `spec.md`, and `plan.md`.
 */

import type { PlanLocation, PlanPaths, PlanStatus } from "../types";

import { mkdir, readdir, rename } from "node:fs/promises";
import { join } from "node:path";

import { PlanStatusEnum } from "../schemas";

// ============================================================================
// Directory order for resolution
// ============================================================================

// Sort order: in_progress (highest priority) -> pending -> done
const STATUS_DIRS = [...PlanStatusEnum.options].sort((a, b) => {
	const priority = { in_progress: 0, pending: 1, done: 2 };
	return priority[a] - priority[b];
});

// ============================================================================
// Path Helpers
// ============================================================================

/**
 * Gets the directory paths for all three plan status folders.
 *
 * @param cwd - The current working directory (project root)
 * @returns Object containing root and all three status directory paths
 *
 * @example
 * ```typescript
 * const paths = getPlanPaths('/home/user/project');
 * // {
 * //   root: '/home/user/project/.opencode/plans',
 * //   pending: '/home/user/project/.opencode/plans/pending',
 * //   in_progress: '/home/user/project/.opencode/plans/in_progress',
 * //   done: '/home/user/project/.opencode/plans/done',
 * // }
 * ```
 */
export function getPlanPaths(cwd: string): PlanPaths {
	const root = join(cwd, ".opencode", "plans");
	return {
		root,
		pending: join(root, "pending"),
		in_progress: join(root, "in_progress"),
		done: join(root, "done"),
	};
}

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
