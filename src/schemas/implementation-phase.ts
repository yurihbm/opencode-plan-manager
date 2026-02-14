import { z } from "zod";

import { PlanTaskSchema } from "./plan-task";

/**
 * Schema for a phase in the implementation plan, which contains a name and a
 * list of tasks.
 */
export const ImplementationPhaseSchema = z
	.object({
		name: z
			.string("Phase name must be a string")
			.min(3, "Phase name must be at least 3 characters")
			.max(100, "Phase name must be at most 100 characters")
			.meta({
				description: "Name of the implementation phase",
			}),
		tasks: z
			.array(PlanTaskSchema, "Tasks must be an array of PlanTask objects")
			.min(1, "At least one task is required in a phase")
			.meta({
				description: "List of tasks within this implementation phase",
			}),
	})
	.meta({
		description: "A phase in the implementation plan, containing tasks",
	});
