import { z } from "zod";

/**
 * Schema for structured specification.
 */
export const SpecificationsSchema = z
	.object({
		description: z
			.string()
			.min(10, "Description must be at least 10 characters")
			.meta({ description: "Detailed description of what needs to be done" }),
		functionals: z
			.array(
				z
					.string()
					.min(1, "Functional requirement must be at least 1 character")
					.max(300, "Functional requirement must be at most 300 characters")
					.meta({
						description: "Functional requirement (user-facing behavior)",
					}),
			)
			.min(1, "At least one functional requirement is required")
			.meta({
				description: "List of functional requirements (user-facing behavior)",
			}),
		nonFunctionals: z
			.array(
				z
					.string()
					.min(1, "Non-functional requirement must be at least 1 character")
					.max(300, "Non-functional requirement must be at most 300 characters")
					.meta({
						description:
							"Non-functional requirement (performance, security, etc.)",
					}),
			)
			.min(1, "At least one non-functional requirement is required")
			.meta({
				description:
					"List of non-functional requirements (performance, security, etc.)",
			}),
		acceptanceCriterias: z
			.array(
				z
					.string()
					.min(1, "Acceptance criteria must be at least 1 character")
					.max(300, "Acceptance criteria must be at most 300 characters")
					.meta({
						description:
							"Acceptance criteria for validating the implementation",
					}),
			)
			.min(1, "At least one acceptance criteria is required")
			.meta({ description: "List of acceptance criteria (testable outcomes)" }),
		outOfScope: z
			.array(
				z
					.string()
					.min(1, "Out of scope item must be at least 1 character")
					.max(300, "Out of scope item must be at most 300 characters")
					.meta({ description: "Item explicitly out of scope for this plan" }),
			)
			.min(1, "At least one out of scope item is required")
			.meta({
				description: "List of items explicitly out of scope for this plan",
			}),
	})
	.meta({
		description:
			"Structured specifications for the plan, including functional and non-functional requirements, acceptance criteria, and out-of-scope items.",
	});
