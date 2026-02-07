/**
 * Parsing and manipulation of `plan.md` content.
 *
 * Supports three task status markers:
 * - `- [ ]` — Pending
 * - `- [~]` — In Progress
 * - `- [x]` — Completed/Done
 *
 * Replaces the old `tasks.ts` and `frontmatter.ts` modules.
 */

import type { PlanTask, TaskStatus, PlanProgress, ImplementationInput } from "../types";

// ... existing code ...

// ============================================================================
// Validation
// ============================================================================

/**
 * Validates that all task names in the implementation plan are unique.
 *
 * @param impl - The implementation plan input
 * @returns Array of duplicate task names (empty if all unique)
 */
export function validateUniqueTaskNames(impl: ImplementationInput): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const phase of impl.phases) {
    for (const task of phase.tasks) {
      if (seen.has(task)) {
        duplicates.add(task);
      } else {
        seen.add(task);
      }
    }
  }

  return Array.from(duplicates);
}


// ============================================================================
// Constants
// ============================================================================

/**
 * Regex to match all three task checkbox states.
 * Captures: the status marker character and the task content.
 */
const TASK_REGEX = /^- \[([ ~x])\] (.+)$/gm;

/**
 * Maps checkbox characters to TaskStatus values.
 */
const MARKER_TO_STATUS: Record<string, TaskStatus> = {
  " ": "pending",
  "~": "in_progress",
  x: "done",
};

/**
 * Maps TaskStatus values to checkbox characters.
 */
const STATUS_TO_MARKER: Record<TaskStatus, string> = {
  pending: " ",
  in_progress: "~",
  done: "x",
};

// ============================================================================
// Task Parsing
// ============================================================================

/**
 * Parses all tasks from plan.md content.
 *
 * Unlike the old implementation, this parses ALL tasks in the document,
 * not just those under a specific section header. This makes the parser
 * resilient to section naming changes.
 *
 * @param content - The full plan.md content
 * @returns Array of parsed tasks with line numbers
 *
 * @example
 * ```typescript
 * const tasks = parseTasks(planContent);
 * // [
 * //   { content: 'Write tests', status: 'done', lineNumber: 5 },
 * //   { content: 'Implement feature', status: 'in_progress', lineNumber: 6 },
 * //   { content: 'Update docs', status: 'pending', lineNumber: 7 },
 * // ]
 * ```
 */
export function parseTasks(content: string): PlanTask[] {
  const tasks: PlanTask[] = [];

  // Reset regex state
  TASK_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  let lineNumber = 0;
  let lastSearchIndex = 0;

  while ((match = TASK_REGEX.exec(content)) !== null) {
    const marker = match[1]!;
    const taskContent = match[2]?.trim() ?? "";

    // Update line number counter based on newlines skipped since last match
    // This avoids the O(N^2) substring split of the entire prefix
    const skippedContent = content.substring(lastSearchIndex, match.index);
    lineNumber += (skippedContent.match(/\n/g) || []).length;
    lastSearchIndex = match.index;

    if (!taskContent) continue;

    const status = MARKER_TO_STATUS[marker] ?? "pending";

    tasks.push({
      content: taskContent,
      status,
      lineNumber,
    });
  }

  return tasks;
}

// ============================================================================
// Task Status Update
// ============================================================================

/**
 * Updates a specific task's status in plan.md content.
 *
 * Uses exact string matching to find the task, then replaces the
 * checkbox marker with the new status.
 *
 * @param content - The full plan.md content
 * @param taskContent - The exact task text to match (without checkbox prefix)
 * @param newStatus - The new status to set
 * @returns Updated plan.md content
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
  newStatus: TaskStatus,
): string {
  // Escape special regex characters in the task content
  const escapedContent = taskContent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Match the task line with any status marker: "- [?] taskContent"
  // Capture group 1: "- ["
  // Capture group 2: "] taskContent"
  const pattern = new RegExp(`(- \\[)[ ~x](\\] ${escapedContent})`);

  if (!pattern.test(content)) {
    throw new Error(`Task not found: "${taskContent}"`);
  }

  const newMarker = STATUS_TO_MARKER[newStatus];

  // Replace only the marker char
  // $1 is prefix "- ["
  // $2 is suffix "] taskContent"
  return content.replace(pattern, `$1${newMarker}$2`);
}

// ============================================================================
// Progress Calculation
// ============================================================================

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
    return { total: 0, done: 0, in_progress: 0, pending: 0, percentage: 100 };
  }

  const done = tasks.filter((t) => t.status === "done").length;
  const in_progress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const percentage = Math.round((done / total) * 100);

  return { total, done, in_progress, pending, percentage };
}
