import { z } from "zod";

/**
 * Enumeration for plan type classification, used for categorization and filtering.
 */
export const PlanTypeSchema = z
	.enum(["feature", "bug", "refactor", "docs"], "Invalid plan type")
	.meta({
		description:
			"Classification of the plan's purpose (e.g., feature, bug, etc.)",
	});
