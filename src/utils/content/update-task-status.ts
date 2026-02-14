import type { PlanTaskStatus } from "../../types";

import { STATUS_TO_MARKER } from "./constants";

/**
 * Updates a specific task's status in implementation file content.
 *
 * Uses exact string matching to find the task, then replaces the
 * checkbox marker with the new status.
 *
 * @param content - The full implementation file content
 * @param taskContent - The exact task text to match (without checkbox prefix)
 * @param newStatus - The new status to set
 * @returns Updated implementation file content
 * @throws {Error} If the task content is not found
 *
 * @example
 * ```typescript
 * const updated = updateTaskStatus(content, 'Write tests', 'done');
 * // Changes: - [ ] Write tests
 * // To:      - [x] Write tests
 * ```
 */
export function updateTaskStatus(
	content: string,
	taskContent: string,
	newStatus: PlanTaskStatus,
): string {
	// Escape special regex characters in the task content
	const escapedContent = taskContent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

	// Match the task line with any status marker: "- [?] taskContent"
	// Capture group 1: "- ["
	// Capture group 2: "] taskContent"
	// Ensure it matches until before the end of line to prevent partial matches (e.g. "Task 1" matching "Task 10")
	const pattern = new RegExp(
		`(- \\[)[ ~x](\\] ${escapedContent})(?=$|\\r?\\n)`,
	);

	if (!pattern.test(content)) {
		throw new Error(`Task not found: "${taskContent}"`);
	}

	const newMarker = STATUS_TO_MARKER[newStatus];

	// Replace only the marker char
	// $1 is prefix "- ["
	// $2 is suffix "] taskContent"
	return content.replace(pattern, `$1${newMarker}$2`);
}
