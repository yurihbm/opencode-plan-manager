/**
 * Generates deterministic plan IDs for plan folders.
 *
 * The plan ID serves as both the unique identifier and the folder name.
 * Format: `{type}_{kebab_title}_{YYYYMMDD}`
 *
 * Examples:
 * - `feature_user-auth_20260206`
 * - `bug_login-crash_20260205`
 * - `refactor_database_20260120`
 */

import { toKebabCase } from "./kebab-case";

/**
 * Generates a deterministic plan ID from a plan type and title.
 *
 * @param type - The plan type (feature, bug, refactor, docs)
 * @param title - The human-readable plan title
 * @param date - Optional date for the ID (defaults to current date)
 * @returns A deterministic plan ID string
 *
 * @example
 * ```typescript
 * generatePlanId('feature', 'User Authentication')
 * // 'feature_user-authentication_20260206'
 *
 * generatePlanId('bug', 'Login Crash Fix')
 * // 'bug_login-crash-fix_20260206'
 * ```
 */
export function generatePlanId(
	type: string,
	title: string,
	date: Date = new Date(),
): string {
	const kebab = toKebabCase(title);

	if (!kebab) {
		throw new Error("Title must contain at least one alphanumeric character");
	}

	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const dateStr = `${year}${month}${day}`;

	return `${type}_${kebab}_${dateStr}`;
}
