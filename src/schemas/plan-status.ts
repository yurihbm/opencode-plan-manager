import { z } from "zod";

/**
 * Enumeration for plan lifecycle status, used for folder organization and workflow
 * management.
 */
export const PlanStatusSchema = z
	.enum(["pending", "in_progress", "done"], "Invalid plan status")
	.meta({
		description: "Lifecycle status of the plan, determines folder location",
	});
