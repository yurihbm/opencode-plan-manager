import { z } from "zod";

import { PlanTaskStatusSchema } from "./plan-task-status";

/**
 * Schema for an individual task within a phase of the implementation plan.
 */
export const PlanTaskSchema = z
	.object({
		content: z
			.string("Task content must be a string")
			.min(1, "Task content must be at least 1 character")
			.max(150, "Task content must be at most 150 characters")
			.meta({
				description: "Description of the task to be performed",
			}),
		status: PlanTaskStatusSchema,
	})
	.meta({
		description: "An individual task within a phase of the implementation plan",
	});
