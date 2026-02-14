import type { PlanContent } from "../../types";

import { encode } from "@toon-format/toon";

/**
 * Generates a TOON string representing the plan content, including metadata,
 * progress, specifications and implementation details.
 *
 * Undefined sections will be skipped, allowing for partial content to be rendered
 * as needed.
 *
 * @param content - Partial plan content
 *
 * @returns TOON string representing the plan content
 */
export function generatePlanTOON(content: Partial<PlanContent>): string {
	return encode(content);
}
