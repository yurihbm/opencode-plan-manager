import type { OutputFormat, PlanContent } from "../../types";

import { generatePlanJSON } from "./generate-plan-json";
import { generatePlanMarkdown } from "./generate-plan-markdown";
import { generatePlanTOON } from "./generate-plan-toon";

/**
 * Formats plan content according to the specified output format.
 *
 * Dispatches to the appropriate formatter based on format type:
 * - `markdown`: Human-readable markdown (default)
 * - `json`: Structured JSON
 * - `toon`: TOON format for interoperability
 *
 * @param content - Plan content to format (metadata, specs, implementation, progress)
 * @param format - Output format to use
 * @returns Formatted plan content as a string
 *
 * @example
 * ```ts
 * const output = formatPlanOutput(planContent, "json");
 * console.log(output); // JSON string
 * ```
 */
export function formatPlanOutput(
	content: Partial<PlanContent>,
	format: OutputFormat,
): string {
	switch (format) {
		case "json":
			return generatePlanJSON(content);
		case "toon":
			return generatePlanTOON(content);
		case "markdown":
		default:
			return generatePlanMarkdown(content);
	}
}
