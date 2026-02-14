import { z } from "zod";

import { ImplementationSchema } from "./implementation";
import { PlanMetadataSchema } from "./plan-metadata";
import { PlanProgressSchema } from "./plan-progress";
import { SpecificationsSchema } from "./specifications";

/**
 * Full schema for the content of a plan, including metadata, progress stats,
 * implementation details, and specifications.
 */
export const PlanContentSchema = z
	.object({
		metadata: PlanMetadataSchema,
		progress: PlanProgressSchema.optional(),
		implementation: ImplementationSchema.optional(),
		specifications: SpecificationsSchema.optional(),
	})
	.meta({
		description: "Complete content of a plan",
	});
