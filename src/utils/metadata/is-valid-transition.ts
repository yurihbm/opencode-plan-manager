import type { PlanStatus } from "../../types";

/**
 * Valid status transitions map.
 *
 * ```
 * pending ──→ in_progress ──→ done
 *              ↑_____________↓ (revert)
 * ```
 */
const VALID_TRANSITIONS: Record<string, PlanStatus[]> = {
	pending: ["in_progress"],
	in_progress: ["done", "pending"],
	done: [], // immutable once done
};

/**
 * Validates whether a status transition is allowed.
 *
 * @param from - Current status
 * @param to - Target status
 * @returns `true` if the transition is valid
 */
export function isValidTransition(from: string, to: PlanStatus): boolean {
	return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
