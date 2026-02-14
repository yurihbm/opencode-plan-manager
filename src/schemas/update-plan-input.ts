import { z } from "zod";

import { ImplementationSchema } from "./implementation";
import { ImplementationPhaseSchema } from "./implementation-phase";
import { PlanIDSchema } from "./plan-id";
import { PlanStatusSchema } from "./plan-status";
import { SpecificationsSchema } from "./specifications";

/**
 * Schema for `plan_update` tool input.
 *
 * Rules:
 * - At least one update field must be provided
 * - Cannot provide both `implementation` and `taskUpdates` simultaneously
 * - Empty `taskUpdates` array is treated as no update
 */
export const UpdatePlanInputBaseSchema = z
	.object({
		id: PlanIDSchema,
		status: PlanStatusSchema.optional().meta({
			description:
				"New status — triggers folder move. Valid: pending→in_progress, in_progress→done, in_progress→pending",
		}),
		specifications: SpecificationsSchema.optional().meta({
			description:
				"New spec content as structured object (replaces entire file)",
		}),
		implementation: ImplementationSchema.optional(),
		taskUpdates: ImplementationPhaseSchema.shape.tasks.optional().meta({
			description:
				"List of tasks with updated status. The task is identified by its content (exact match) and updated with the new status.",
		}),
	})
	.meta({
		description:
			"Input schema for updating a plan. At least one of 'status', 'spec', 'plan', or 'taskUpdates' must be provided to perform an update.",
	})
	.refine((data) => {
		if (
			!data.status &&
			!data.specifications &&
			!data.implementation &&
			(!data.taskUpdates || data.taskUpdates.length === 0)
		) {
			return false;
		}

		if (data.implementation && data.taskUpdates) {
			return false;
		}

		return true;
	}, "At least one of 'status', 'specifications', 'implementation', or 'taskUpdates' must be provided, but not both 'implementation' and 'taskUpdates' together.")
	.meta({
		description:
			"Input for updating an existing plan. It requires at least one field to update.",
	});
