import { z } from "zod";

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
		  - 'spec' (metadata + spec.md)
			- 'plan' (metadata + plan.md)
			- 'full' (everything)
	`,
	});
