import { z } from "zod";

import { ImplementationSchema } from "./implementation";
import { PlanMetadataSchema } from "./plan-metadata";
import { SpecificationsSchema } from "./specifications";

/**
 * Schema for `plan_create` tool input.
 */
export const CreatePlanInputSchema = z
	.object({
		metadata: PlanMetadataSchema.omit({
			id: true,
			created_at: true,
			updated_at: true,
			status: true,
		}).extend({
			title: z
				.string("Title must be a string")
				.min(1, "Title cannot be empty")
				.meta({
					description:
						"Title of the plan, used for ID generation and folder naming (e.g., 'Implement user authentication')",
				}),
		}),
		implementation: ImplementationSchema,
		specifications: SpecificationsSchema,
	})
	.meta({
		description: "Input for creating a new plan",
	});
