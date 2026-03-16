import { buildToolOutput } from "./buildToolOutput";

/**
 * Generates a warning output for duplicate phase names.
 */
export const DUPLICATE_PHASES_OUTPUT = (phaseIds: string[]) => {
	return buildToolOutput({
		type: "warning",
		text: [
			"Duplicate phase names found. Phase names must be unique.",
			`Duplicates: ${phaseIds.join(", ")}`,
			"NEXT STEP: Rename duplicate phases and retry.",
		],
	});
};

/**
 * Generates a warning output for duplicate task names across phases.
 */
export const DUPLICATE_TASKS_OUTPUT = (taskIds: string[]) => {
	return buildToolOutput({
		type: "warning",
		text: [
			"Duplicate task names found. Task names must be unique across all phases.",
			`Duplicates: ${taskIds.join(", ")}`,
			"NEXT STEP: Rename duplicate tasks and retry.",
		],
	});
};
