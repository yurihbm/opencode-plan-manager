import type { Implementation } from "../../types";

/**
 * Validates that all phase names in the implementation plan are unique.
 *
 * @param impl - The implementation plan input
 *
 * @returns Array of duplicate phase names (empty if all unique)
 */
export function validateUniquePhaseNames(impl: Implementation): string[] {
	const seen = new Set<string>();
	const duplicates = new Set<string>();

	for (const phase of impl.phases) {
		if (seen.has(phase.name)) {
			duplicates.add(phase.name);
		} else {
			seen.add(phase.name);
		}
	}

	return Array.from(duplicates);
}
