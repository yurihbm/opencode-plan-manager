import type { PlanContent } from "../../types";

import { STATUS_TO_MARKER } from "./constants";

/**
 * Generates a markdown string representing the plan content, including metadata,
 * progress, specifications, and implementation details.
 *
 * Undefined sections will be skipped, allowing for partial content to be rendered
 * as needed.
 *
 * @param content - Partial plan content containing metadata, progress, specifications, and implementation details
 *
 * @returns Markdown string representing the plan content
 */
export function generatePlanMarkdown(content: Partial<PlanContent>): string {
	const sections: string[] = [];

	if (content.metadata) {
		sections.push(`**Plan ID:** ${content.metadata.id}`);
		sections.push(`**Type:** ${content.metadata.type}`);
		sections.push(`**Status:** ${content.metadata.status}`);
		sections.push(`**Description:** ${content.metadata.description}`);
		sections.push(`**Created:** ${content.metadata.created_at}`);
		sections.push(`**Updated:** ${content.metadata.updated_at}`);
	}

	if (content.progress) {
		sections.push(
			`**Progress:** ${content.progress.done}/${content.progress.total} tasks done (${content.progress.percentage}%) | ${content.progress.in_progress} in progress | ${content.progress.pending} pending`,
		);
	}

	if (content.specifications) {
		if (sections.length > 0) {
			sections.push(``);
			sections.push(`---`);
			sections.push(``);
		}

		sections.push(`# Specifications`);
		sections.push(``);
		sections.push(content.specifications.overview);

		if (content.specifications.functionals.length > 0) {
			sections.push(``);
			sections.push(`## Functional Requirements`);
			sections.push(``);
			for (const item of content.specifications.functionals) {
				sections.push(`- ${item}`);
			}
		}

		if (content.specifications.nonFunctionals.length > 0) {
			sections.push(``);
			sections.push(`## Non-Functional Requirements`);
			sections.push(``);
			for (const item of content.specifications.nonFunctionals) {
				sections.push(`- ${item}`);
			}
		}

		if (content.specifications.acceptanceCriterias.length > 0) {
			sections.push(``);
			sections.push(`## Acceptance Criteria`);
			sections.push(``);
			for (const item of content.specifications.acceptanceCriterias) {
				sections.push(`- ${item}`);
			}
		}

		if (content.specifications.outOfScope.length > 0) {
			sections.push(``);
			sections.push(`## Out of Scope`);
			sections.push(``);
			for (const item of content.specifications.outOfScope) {
				sections.push(`- ${item}`);
			}
		}
	}

	if (content.implementation) {
		if (sections.length > 0) {
			sections.push(``);
			sections.push(`---`);
			sections.push(``);
		}

		sections.push(`# Implementation Plan`);
		sections.push(``);
		sections.push(content.implementation.description);

		for (const phase of content.implementation.phases) {
			sections.push(``);
			sections.push(`## ${phase.name}`);
			sections.push(``);

			for (const task of phase.tasks) {
				sections.push(`- [${STATUS_TO_MARKER[task.status]}] ${task.content}`);
			}
		}
	}

	return sections.join("\n");
}
