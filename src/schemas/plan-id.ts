import { z } from "zod";

/**
 * Schema for validating plan IDs.
 */
export const PlanIDSchema = z
	.string("ID must be a string")
	.min(1, "ID cannot be empty")
	.regex(
		/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/,
		"ID must be lowercase alphanumeric with hyphens/underscores",
	)
	.meta({
		description:
			"Unique identifier for the plan, used as folder name (e.g., 'feature_auth_20260206').",
	});
