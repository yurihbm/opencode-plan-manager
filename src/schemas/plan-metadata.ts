import { z } from "zod";

import { PlanIDSchema } from "./plan-id";
import { PlanStatusSchema } from "./plan-status";
import { PlanTypeSchema } from "./plan-type";

/**
 * Schema for `metadata.json` — validates the structure on read and write.
 */
export const PlanMetadataSchema = z
	.object({
		id: PlanIDSchema,
		type: PlanTypeSchema,
		status: PlanStatusSchema,
		created_at: z.iso
			.datetime("Creation timestamp must be in ISO 8601 format")
			.meta({
				description: "Timestamp of when the plan was created (ISO 8601 format)",
			}),
		updated_at: z.iso
			.datetime("Update timestamp must be in ISO 8601 format")
			.meta({
				description:
					"Timestamp of the last update to the plan (ISO 8601 format)",
			}),
		description: z
			.string("Plan description must be a string")
			.min(10, "Description must be at least 10 characters")
			.max(500, "Description must be at most 500 characters")
			.meta({
				description:
					"Short human-readable summary of the plan's purpose and scope",
			}),
	})
	.meta({
		description: "Metadata for the plan, stored in metadata.json",
	});
