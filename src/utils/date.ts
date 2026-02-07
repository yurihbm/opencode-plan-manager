/**
 * Formats a date to ISO date string (YYYY-MM-DD) for YAML frontmatter.
 *
 * This function ensures consistent date formatting across all plan files.
 * The YYYY-MM-DD format is:
 * - YAML-compatible
 * - Sortable
 * - Human-readable
 * - Timezone-independent
 *
 * @param date - The date to format. Defaults to current date if not provided.
 * @returns ISO date string in YYYY-MM-DD format
 *
 * @example
 * ```typescript
 * formatDate()                           // '2026-02-05' (today)
 * formatDate(new Date('2024-12-25'))     // '2024-12-25'
 * formatDate(new Date('2024-01-05'))     // '2024-01-05'
 * ```
 */
export function formatDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
