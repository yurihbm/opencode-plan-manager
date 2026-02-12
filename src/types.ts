/**
 * Type definitions for the OpenCode Plan Manager plugin.
 *
 * These types define the folder-per-plan architecture where each plan
 * is a directory containing `metadata.json`, `spec.md`, and `plan.md`.
 */

// ============================================================================
// Plan Status & Type
// ============================================================================

/**
 * Lifecycle status of a plan, mapped to filesystem directories.
 *
 * - `pending` — Plan is queued but not yet started (`.opencode/plans/pending/`)
 * - `in_progress` — Plan is actively being worked on (`.opencode/plans/in_progress/`)
 * - `done` — Plan is completed and archived (`.opencode/plans/done/`)
 */
export type PlanStatus = "pending" | "in_progress" | "done";

/**
 * Classification of the plan's purpose.
 */
export type PlanType = "feature" | "bug" | "refactor" | "docs";

// ============================================================================
// Task Status
// ============================================================================

/**
 * Status of an individual task within a plan's `plan.md`.
 *
 * Corresponds to Markdown checkbox markers:
 * - `pending`     → `- [ ]`
 * - `in_progress` → `- [~]`
 * - `done`        → `- [x]`
 */
export type TaskStatus = "pending" | "in_progress" | "done";

// ============================================================================
// Metadata (metadata.json)
// ============================================================================

/**
 * Machine-readable metadata stored in `metadata.json`.
 *
 * This is the single source of truth for a plan's identity and state.
 * It is intentionally small and cheap to parse.
 */
export interface PlanMetadata {
	/** Unique identifier — matches the folder name */
	plan_id: string;

	/** Classification of the plan */
	type: PlanType;

	/** Current lifecycle status */
	status: PlanStatus;

	/** ISO 8601 timestamp of creation */
	created_at: string;

	/** ISO 8601 timestamp of last modification */
	updated_at: string;

	/** Short human-readable summary of the plan */
	description: string;
}

// ============================================================================
// Task (parsed from plan.md)
// ============================================================================

/**
 * A task extracted from a plan's `plan.md` content.
 *
 * Tasks are identified by checkbox syntax: `- [ ]`, `- [~]`, or `- [x]`.
 */
export interface PlanTask {
	/** Task description text (without checkbox prefix) */
	content: string;

	/** Current status of the task */
	status: TaskStatus;

	/** Original line number in plan.md (0-based) */
	lineNumber: number;
}

/**
 * Update request for a single task.
 * Used for batch updating multiple tasks at once.
 */
export interface TaskUpdate {
	/** The text content of the task to update (must match exactly) */
	content: string;

	/** The new status to set */
	status: TaskStatus;
}

// ============================================================================
// Parsed Plan (combined view)
// ============================================================================

/**
 * View mode for reading a plan. Controls how much data is returned.
 *
 * - `summary` — Only `metadata.json` + progress stats (cheapest)
 * - `spec`    — `metadata.json` + `spec.md` content
 * - `plan`    — `metadata.json` + `plan.md` content + parsed tasks
 * - `full`    — Everything: metadata + spec + plan + tasks (most expensive)
 */
export type PlanView = "summary" | "spec" | "plan" | "full";

/**
 * Progress statistics calculated from task statuses.
 */
export interface PlanProgress {
	/** Total number of tasks */
	total: number;

	/** Number of completed tasks */
	done: number;

	/** Number of in-progress tasks */
	in_progress: number;

	/** Number of pending tasks */
	pending: number;

	/** Completion percentage (0-100) */
	percentage: number;
}

/**
 * Complete parsed plan with metadata, content, and extracted tasks.
 * Fields are optional based on the requested `PlanView`.
 */
export interface ParsedPlan {
	/** Plan metadata (always present) */
	metadata: PlanMetadata;

	/** Progress statistics (always present) */
	progress: PlanProgress;

	/** Specification content from `spec.md` (present in `spec` and `full` views) */
	spec?: string;

	/** Implementation plan content from `plan.md` (present in `plan` and `full` views) */
	plan?: string;

	/** Parsed tasks from `plan.md` (present in `plan` and `full` views) */
	tasks?: PlanTask[];
}

// ============================================================================
// Structured Input for Plan Creation (Tool Inputs)
// ============================================================================

/**
 * Structured input for the specification section.
 * This replaces free-form markdown to ensure deterministic spec.md generation.
 */
export interface SpecInput {
	/** Detailed overview of what needs to be done */
	overview: string;

	/** List of functional requirements (user-facing behavior) */
	functionals: string[];

	/** List of non-functional requirements (performance, security, etc.) */
	nonFunctionals: string[];

	/** List of acceptance criteria (testable outcomes) */
	acceptanceCriterias: string[];

	/** List of items explicitly out of scope for this plan */
	outOfScope: string[];
}

/**
 * A single phase in the implementation plan.
 */
export interface PhaseInput {
	/** Phase name (e.g., "Phase 1: Foundation") */
	phase: string;

	/** List of tasks for this phase (will be converted to checkboxes) */
	tasks: string[];
}

/**
 * Structured input for the implementation plan section.
 * This replaces free-form markdown to ensure deterministic plan.md generation.
 */
export interface ImplementationInput {
	/** High-level description of the implementation strategy */
	description: string;

	/** List of phases, each containing tasks */
	phases: PhaseInput[];
}

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
