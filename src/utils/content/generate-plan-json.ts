import type { PlanContent } from "../../types";

/**
 * Generates JSON representation of plan content.
 *
 * Returns a formatted JSON string with 2-space indentation for readability.
 *
 * @param content - Plan content to format
 * @returns Formatted JSON string
 *
 * @example
 * ```ts
 * const json = generatePlanJSON({ metadata: { ... }, ... });
 * console.log(json); // Pretty-printed JSON
 * ```
 */
export function generatePlanJSON(content: Partial<PlanContent>): string {
	return JSON.stringify(content, null, 2);
}
