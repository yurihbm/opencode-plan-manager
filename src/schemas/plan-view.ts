import { z } from "zod";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../constants";

/**
 * Enumeration for plan view levels when reading a plan, used to control the amount
 * of detail returned and optimize token usage for the AI agent.
 */
export const PlanViewSchema = z
	.enum(["summary", "spec", "plan", "full"], "Invalid plan view")
	.meta({
		description: `
		Defines the level of detail to return when reading a plan:
			- 'summary' (metadata + progress only)
		  - 'spec' (metadata + ${SPECIFICATIONS_FILE_NAME})
			- 'plan' (metadata + ${IMPLEMENTATION_FILE_NAME})
			- 'full' (everything)
	`,
	});
