/**
 * Zod schemas for strict validation of plan data structures.
 *
 * These schemas enforce deterministic file content and tool input,
 * ensuring that plans are always well-formed regardless of what
 * the AI agent passes in.
 */

import { z } from "zod";

// ============================================================================
// Enums
// ============================================================================

export const PlanStatusEnum = z.enum(["pending", "in_progress", "done"]);
export const PlanTypeEnum = z.enum(["feature", "bug", "refactor", "docs"]);
export const TaskStatusEnum = z.enum(["pending", "in_progress", "done"]);
export const PlanViewEnum = z.enum(["summary", "spec", "plan", "full"]);

// ============================================================================
// Metadata Schema (metadata.json)
// ============================================================================

/**
 * Schema for `metadata.json` — validates the structure on read and write.
 */
export const MetadataSchema = z.object({
	plan_id: z
		.string()
		.min(1)
		.regex(
			/^[a-z0-9]+(?:[_-][a-z0-9]+)*$/,
			"plan_id must be lowercase alphanumeric with hyphens/underscores",
		),
	type: PlanTypeEnum,
	status: PlanStatusEnum,
	created_at: z.iso.datetime(),
	updated_at: z.iso.datetime(),
	description: z.string().min(1).max(500),
});

// ============================================================================
// Tool Input Schemas
// ============================================================================

/**
 * Schema for structured specification input.
 */
export const SpecInputSchema = z.object({
	overview: z
		.string()
		.min(10, "Overview must be at least 10 characters")
		.describe("Detailed overview of what needs to be done"),
	functionals: z
		.array(
			z
				.string()
				.min(1, "Functional requirement must be at least 1 character")
				.max(300, "Functional requirement must be at most 300 characters")
				.describe("Functional requirement (user-facing behavior)"),
		)
		.min(1, "At least one functional requirement is required")
		.describe("List of functional requirements (user-facing behavior)"),
	nonFunctionals: z
		.array(
			z
				.string()
				.min(1, "Non-functional requirement must be at least 1 character")
				.max(300, "Non-functional requirement must be at most 300 characters")
				.describe("Non-functional requirement (performance, security, etc.)"),
		)
		.min(1, "At least one non-functional requirement is required")
		.describe(
			"List of non-functional requirements (performance, security, etc.)",
		),
	acceptanceCriterias: z
		.array(
			z
				.string()
				.min(1, "Acceptance criteria must be at least 1 character")
				.max(300, "Acceptance criteria must be at most 300 characters")
				.describe("Acceptance criteria for validating the implementation"),
		)
		.min(1, "At least one acceptance criteria is required")
		.describe("List of acceptance criteria (testable outcomes)"),
	outOfScope: z
		.array(
			z
				.string()
				.min(1, "Out of scope item must be at least 1 character")
				.max(300, "Out of scope item must be at most 300 characters")
				.describe("Item explicitly out of scope for this plan"),
		)
		.min(1, "At least one out of scope item is required")
		.describe("List of items explicitly out of scope for this plan"),
});

/**
 * Schema for a single phase in the implementation plan.
 */
export const PhaseInputSchema = z.object({
	phase: z
		.string()
		.min(1, "Phase name must be at least 1 character")
		.describe("Phase name (e.g., 'Phase 1: Foundation')"),
	tasks: z
		.array(
			z
				.string()
				.min(10, "Task description must be at least 10 characters")
				.max(150, "Task description must be at most 150 characters")
				.describe("Task description"),
		)
		.min(1, "At least one task is required for each phase")
		.describe("List of tasks for this phase"),
});

/**
 * Schema for structured implementation plan input.
 */
export const ImplementationInputSchema = z.object({
	description: z
		.string()
		.min(10, "Implementation description must be at least 10 characters")
		.describe("High-level description of the implementation strategy"),
	phases: z
		.array(PhaseInputSchema)
		.min(1, "At least one phase is required in the implementation plan")
		.describe("List of phases, each containing tasks"),
});

/**
 * Schema for `plan_create` tool input.
 */
export const CreatePlanInputSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must be at most 100 characters")
		.describe("The title of the plan (e.g., 'User Authentication Flow')"),
	type: PlanTypeEnum.describe("Classification of the plan's purpose"),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters")
		.max(500, "Description must be at most 500 characters")
		.describe("Short human-readable summary of the plan"),
	spec: SpecInputSchema,
	implementation: ImplementationInputSchema,
});

/**
 * Schema for `plan_update` tool input.
 *
 * At least one of `status`, `spec`, `plan`, `taskContent` must be provided.
 */
export const UpdatePlanInputBaseSchema = z.object({
	plan_id: z.string().min(1).describe("The plan's plan_id (folder name)"),
	status: PlanStatusEnum.optional().describe(
		"New status — triggers folder move. Valid: pending→in_progress, in_progress→done, in_progress→pending",
	),
	spec: SpecInputSchema.optional().describe(
		"New spec content as structured object (replaces entire file)",
	),
	plan: ImplementationInputSchema.optional().describe(
		"New plan content as structured object (replaces entire file)",
	),
	taskUpdates: z
		.array(
			z.object({
				content: z
					.string()
					.min(1)
					.describe(
						"Task text to match for status toggle (exact match, without checkbox prefix)",
					),
				status: TaskStatusEnum.describe("New status for the matched task."),
			}),
		)
		.optional()
		.describe("List of task updates to apply in batch."),
});

export const UpdatePlanInputSchema = UpdatePlanInputBaseSchema.refine(
	(data) =>
		data.status !== undefined ||
		data.spec !== undefined ||
		data.plan !== undefined ||
		data.taskUpdates !== undefined,
	{
		message:
			"At least one of 'status', 'spec', 'plan', or 'taskUpdates' must be provided",
	},
);

// ============================================================================
// Status Transition Validation
// ============================================================================

/**
 * Valid status transitions map.
 *
 * ```
 * pending ──→ in_progress ──→ done
 *              ↑_____________↓ (revert)
 * ```
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
	pending: ["in_progress"],
	in_progress: ["done", "pending"],
	done: [], // immutable once done
};

/**
 * Validates whether a status transition is allowed.
 *
 * @param from - Current status
 * @param to - Target status
 * @returns `true` if the transition is valid
 */
export function isValidTransition(from: string, to: string): boolean {
	return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
