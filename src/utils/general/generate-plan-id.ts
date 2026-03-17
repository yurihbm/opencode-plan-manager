import { randomBytes } from "node:crypto";

import { toKebabCase } from "./to-kebab-case";

/**
 * Generates a unique plan ID from a plan type, title, and date.
 *
 * A 4-character random hex suffix is appended to ensure uniqueness across
 * plans created on the same day with the same title, eliminating the need
 * for runtime collision checks.
 *
 * @param type - The plan type (feature, bug, refactor, docs)
 * @param title - The human-readable plan title
 * @param date - Optional date for the ID (defaults to current date)
 * @returns A unique plan ID string
 *
 * @example
 * ```typescript
 * generatePlanId('feature', 'User Authentication')
 * // 'feature_user-authentication_20260206_a3f1'
 *
 * generatePlanId('bug', 'Login Crash Fix')
 * // 'bug_login-crash-fix_20260206_9c2b'
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

	const hex = randomBytes(2).toString("hex");

	return `${type}_${kebab}_${dateStr}_${hex}`;
}
