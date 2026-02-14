import type { PlanPaths } from "../../types";

import { join } from "node:path";

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
