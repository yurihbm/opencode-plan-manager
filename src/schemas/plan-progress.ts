import { z } from "zod";

/**
 * Schema for progress statistics of a plan, calculated from tasks in `implementation file`.
 */
export const PlanProgressSchema = z
	.object({
		total: z
			.int("Total must be an integer")
			.nonnegative("Total tasks cannot be negative")
			.meta({
				description: "Total number of tasks in the implementation plan",
			}),
		done: z
			.int("Done must be an integer")
			.nonnegative("Done tasks cannot be negative")
			.meta({
				description: "Number of tasks completed",
			}),
		in_progress: z
			.int("In Progress must be an integer")
			.nonnegative("In-progress tasks cannot be negative")
			.meta({
				description: "Number of tasks currently in progress",
			}),
		pending: z
			.int("Pending must be an integer")
			.nonnegative("Pending tasks cannot be negative")
			.meta({
				description: "Number of tasks not yet started",
			}),
		percentage: z
			.number("Percentage must be a number")
			.min(0, "Percentage cannot be less than 0")
			.max(100, "Percentage cannot be more than 100")
			.meta({
				description: "Overall completion percentage of the implementation plan",
			}),
	})
	.meta({
		description: "Progress statistics for the implementation plan",
	});
