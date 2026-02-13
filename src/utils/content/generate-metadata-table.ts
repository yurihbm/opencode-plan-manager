import type { PlanMetadata } from "../../types";

/**
 * Generates a markdown table from a list of plan metadata.
 *
 * @param list - Array of plan metadata objects
 *
 * @returns Markdown string representing the table
 */
export function generateMetadatasTable(list: PlanMetadata[]): string {
	const header = "| Plan ID | Description | Type | Status | Updated |";
	const separator = "|---------|-------------|------|--------|---------|";
	const rows = list.map(
		(meta) =>
			`| ${meta.id} | ${meta.description} | ${meta.type} | ${meta.status} | ${meta.updated_at} |`,
	);

	return [header, separator, ...rows].join("\n");
}
