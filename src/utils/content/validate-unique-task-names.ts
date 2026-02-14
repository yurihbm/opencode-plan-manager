import type { Implementation } from "../../types";

/**
 * Validates that all task names in the implementation plan are unique.
 *
 * @param impl - The implementation plan input
 *
 * @returns Array of duplicate task names (empty if all unique)
 */
export function validateUniqueTaskNames(impl: Implementation): string[] {
	const seen = new Set<string>();
	const duplicates = new Set<string>();

	for (const phase of impl.phases) {
		for (const task of phase.tasks) {
			if (seen.has(task.content)) {
				duplicates.add(task.content);
			} else {
				seen.add(task.content);
			}
		}
	}

	return Array.from(duplicates);
}
