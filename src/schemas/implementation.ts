import { z } from "zod";

import { ImplementationPhaseSchema } from "./implementation-phase";

/**
 * Schema for the structured implementation plan.
 */
export const ImplementationSchema = z
	.object({
		description: z
			.string("Implementation description must be a string")
			.min(10, "Implementation description must be at least 10 characters")
			.meta({
				description: "Detailed description of the implementation approach",
			}),
		phases: z
			.array(
				ImplementationPhaseSchema,
				"Phases must be an array of ImplementationPhase objects",
			)
			.min(1, "At least one phase is required in the implementation plan")
			.meta({
				description: "List of phases in the implementation plan",
			}),
	})
	.meta({
		description: "Structured implementation plan with phases and tasks",
	});
