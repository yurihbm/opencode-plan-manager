/**
 * Markdown generation utilities for deterministic plan file creation.
 *
 * These pure functions convert structured input objects into consistent,
 * well-formatted markdown for spec.md and plan.md files.
 */

import type { SpecInput, ImplementationInput } from "../types";

/**
 * Generates deterministic spec.md content from structured input.
 *
 * Always produces the same markdown format:
 * - ## Overview
 * - ## Functional Requirements (bulleted list)
 * - ## Non-Functional Requirements (bulleted list)
 * - ## Acceptance Criteria (bulleted list)
 * - ## Out of Scope (bulleted list)
 *
 * @param spec - Structured specification input
 * @returns Formatted markdown string for spec.md
 */
export function generateSpecMarkdown(spec: SpecInput): string {
	const sections: string[] = [];

	// Overview section
	sections.push("## Overview");
	sections.push("");
	sections.push(spec.overview);
	sections.push("");

	// Functional Requirements
	sections.push("## Functional Requirements");
	sections.push("");
	for (const req of spec.functionals) {
		sections.push(`- ${req}`);
	}
	sections.push("");

	// Non-Functional Requirements
	sections.push("## Non-Functional Requirements");
	sections.push("");
	for (const req of spec.nonFunctionals) {
		sections.push(`- ${req}`);
	}
	sections.push("");

	// Acceptance Criteria
	sections.push("## Acceptance Criteria");
	sections.push("");
	for (const criteria of spec.acceptanceCriterias) {
		sections.push(`- ${criteria}`);
	}
	sections.push("");

	// Out of Scope
	sections.push("## Out of Scope");
	sections.push("");
	for (const item of spec.outOfScope) {
		sections.push(`- ${item}`);
	}
	sections.push("");

	return sections.join("\n");
}

/**
 * Generates deterministic plan.md content from structured input.
 *
 * Always produces the same markdown format:
 * - ## Description (implementation strategy overview)
 * - ## Phases (H3 headings for each phase with checkbox tasks)
 *
 * All tasks are generated as `- [ ]` (pending) by default.
 *
 * @param impl - Structured implementation plan input
 * @returns Formatted markdown string for plan.md
 */
export function generatePlanMarkdown(impl: ImplementationInput): string {
	const sections: string[] = [];

	// Description section
	sections.push("## Description");
	sections.push("");
	sections.push(impl.description);
	sections.push("");

	// Phases section
	sections.push("## Phases");
	sections.push("");

	for (const phase of impl.phases) {
		sections.push(`### ${phase.phase}`);
		sections.push("");
		for (const task of phase.tasks) {
			sections.push(`- [ ] ${task}`);
		}
		sections.push("");
	}

	return sections.join("\n");
}
