import type { PlanProgress, PlanTask } from "../../types";

/**
 * Calculates progress statistics from a list of tasks.
 *
 * @param tasks - Array of parsed tasks
 * @returns Progress object with counts and percentage
 *
 * @example
 * ```typescript
 * const progress = calculateProgress(tasks);
 * // { total: 10, done: 4, in_progress: 1, pending: 5, percentage: 40 }
 * ```
 */
export function calculateProgress(tasks: PlanTask[]): PlanProgress {
	const total = tasks.length;

	if (total === 0) {
		return { total: 0, done: 0, in_progress: 0, pending: 0, percentage: 0 };
	}

	const done = tasks.filter((t) => t.status === "done").length;
	const in_progress = tasks.filter((t) => t.status === "in_progress").length;
	const pending = tasks.filter((t) => t.status === "pending").length;
	const percentage = Math.round((done / total) * 100);

	return { total, done, in_progress, pending, percentage };
}
