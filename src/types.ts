import z from "zod";

import {
	CreatePlanInputSchema,
	ImplementationPhaseSchema,
	ImplementationSchema,
	OutputFormatSchema,
	PlanContentSchema,
	PlanMetadataSchema,
	PlanProgressSchema,
	PlanStatusSchema,
	PlanTaskSchema,
	PlanTaskStatusSchema,
	PlanTypeSchema,
	PlanViewSchema,
	PluginConfigSchema,
	SpecificationsSchema,
	UpdatePlanInputBaseSchema,
} from "./schemas";

// ============================================================================
// Plan Content and Metadata
// ============================================================================

/**
 * Lifecycle status of a plan, mapped to filesystem directories.
 *
 * - `pending` — Plan is queued but not yet started (`.opencode/plans/pending/`)
 * - `in_progress` — Plan is actively being worked on (`.opencode/plans/in_progress/`)
 * - `done` — Plan is completed and archived (`.opencode/plans/done/`)
 */
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

/**
 * Classification of the plan's purpose.
 */
export type PlanType = z.infer<typeof PlanTypeSchema>;

/**
 * Status of an individual task within a plan's implementation file.
 *
 * Corresponds to Markdown checkbox markers:
 * - `pending`     → `- [ ]`
 * - `in_progress` → `- [~]`
 * - `done`        → `- [x]`
 */
export type PlanTaskStatus = z.infer<typeof PlanTaskStatusSchema>;

/**
 * Defines the level of detail to return when reading a plan.
 */
export type PlanView = z.infer<typeof PlanViewSchema>;

/**
 * Machine-readable metadata stored in `metadata.json`.
 *
 * This is the single source of truth for a plan's identity and state.
 * It is intentionally small and cheap to parse.
 */
export type PlanMetadata = z.infer<typeof PlanMetadataSchema>;

/**
 * Progress statistics calculated from task statuses.
 */
export type PlanProgress = z.infer<typeof PlanProgressSchema>;

/**
 * A task extracted from a plan's implementation content.
 *
 * Tasks are identified by checkbox syntax: `- [ ]`, `- [~]`, or `- [x]`.
 */
export type PlanTask = z.infer<typeof PlanTaskSchema>;

/**
 * Structured phases from the plan's implementation document.
 * */
export type ImplementationPhase = z.infer<typeof ImplementationPhaseSchema>;

/**
 * Complete implementation plan structure, including description and phases.
 */
export type Implementation = z.infer<typeof ImplementationSchema>;

/**
 * Structured content of plan specifications, parsed from specifications file.
 * Contains functional and non-functional requirements, acceptance criteria
 * and out of scope items.
 */
export type Specifications = z.infer<typeof SpecificationsSchema>;

/**
 * Full content of a plan.
 */
export type PlanContent = z.infer<typeof PlanContentSchema>;

/**
 * Interface for plan creation arguments.
 */
export type CreatePlanInput = z.infer<typeof CreatePlanInputSchema>;

/**
 * Interface for plan update arguments.
 */
export type UpdatePlanInput = z.infer<typeof UpdatePlanInputBaseSchema>;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Output format for plan content.
 *
 * - `markdown`: Human-readable markdown format (default)
 * - `json`: Structured JSON format for programmatic use
 * - `toon`: TOON format for interoperability
 */
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

/**
 * Plugin configuration.
 */
export type PluginConfig = z.infer<typeof PluginConfigSchema>;

// ============================================================================
// Filesystem Paths
// ============================================================================

/**
 * Directory paths for the three plan status folders.
 */
export interface PlanPaths {
	/** Root plans directory */
	root: string;

	/** Path to pending plans directory */
	pending: string;

	/** Path to in-progress plans directory */
	in_progress: string;

	/** Path to completed plans directory */
	done: string;
}

/**
 * Result of resolving a plan folder location.
 */
export interface PlanLocation {
	/** Full path to the plan folder */
	path: string;

	/** Current status/directory of the plan */
	status: PlanStatus;
}
