import { z } from "zod";

/**
 * Enumeration for task status within the implementation plan, used for tracking
 * progress of individual tasks and calculating overall plan progress.
 */
export const PlanTaskStatusSchema = z
	.enum(["pending", "in_progress", "done"], "Invalid task status")
	.meta({
		description: "Status of an individual task within the implementation plan",
	});
