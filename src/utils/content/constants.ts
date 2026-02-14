import type { PlanTaskStatus } from "../../types";

/**
 * Maps TaskStatus values to checkbox characters.
 */
export const STATUS_TO_MARKER: Record<PlanTaskStatus, string> = {
	pending: " ",
	in_progress: "~",
	done: "x",
};
