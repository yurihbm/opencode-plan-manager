import { createPatch } from "diff";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../../constants";

/**
 * Represents a file change for a plan operation (create or update).
 */
export interface PlanFileChange {
	/** The filename constant (SPECIFICATIONS_FILE_NAME or IMPLEMENTATION_FILE_NAME) */
	filename: typeof SPECIFICATIONS_FILE_NAME | typeof IMPLEMENTATION_FILE_NAME;
	/** Current content of the file ("" for create, actual content for update) */
	current: string;
	/** Updated content to write to the file */
	updated: string;
	/** Relative path from the project root to the file */
	relativePath: string;
}

/**
 * The prepared diff payload ready to pass to askPlanEdit
 */
export interface PreparedPlanDiff {
	/** The unified diff string for the ask UI */
	diff: string;
	/** Relative paths for both spec and impl files */
	relPath: {
		specifications?: string;
		implementation?: string;
	};
}

/**
 * Prepares a unified diff for plan edit operations (create or update).
 *
 * This function handles the OpenCode limitation of displaying only one diff block
 * by combining multiple file changes into a single "virtual file" when needed.
 *
 * @param planId - The plan identifier
 * @param changes - Array of file changes (1 or 2 items for spec and/or impl)
 * @returns Prepared diff payload ready to pass to askPlanEdit
 *
 * @example
 * // For plan creation (both files, current = ""):
 * const diff = prepareUnifiedPlanDiff("feature_example", [
 *   { filename: SPECIFICATIONS_FILE_NAME, current: "", updated: specContent, relativePath: "..." },
 *   { filename: IMPLEMENTATION_FILE_NAME, current: "", updated: implContent, relativePath: "..." }
 * ]);
 *
 * @example
 * // For plan update (only implementation changed):
 * const diff = prepareUnifiedPlanDiff("feature_example", [
 *   { filename: IMPLEMENTATION_FILE_NAME, current: oldContent, updated: newContent, relativePath: "..." }
 * ]);
 */
export function prepareUnifiedPlanDiff(
	planId: string,
	changes: [PlanFileChange] | [PlanFileChange, PlanFileChange],
): PreparedPlanDiff {
	// Find spec and impl changes
	const specChange = changes.find(
		(c) => c.filename === SPECIFICATIONS_FILE_NAME,
	);
	const implChange = changes.find(
		(c) => c.filename === IMPLEMENTATION_FILE_NAME,
	);

	// Case 1: Both files are changing
	if (specChange && implChange) {
		// Create a virtual combined file: spec + separator + impl
		const currentCombined =
			specChange.current + "\n\n---\n\n" + implChange.current;
		const updatedCombined =
			specChange.updated + "\n\n---\n\n" + implChange.updated;

		const diff = createPatch(planId, currentCombined, updatedCombined);

		return {
			diff,
			relPath: {
				specifications: specChange.relativePath,
				implementation: implChange.relativePath,
			},
		};
	}

	// Case 2: Only one file is changing
	// At least one change is garanteed by the function signature.
	const change = (specChange || implChange) as PlanFileChange;
	const diff = createPatch(change.relativePath, change.current, change.updated);

	return {
		diff,
		relPath: {
			[change.filename === SPECIFICATIONS_FILE_NAME
				? "specifications"
				: "implementation"]: change.relativePath,
		},
	};
}
