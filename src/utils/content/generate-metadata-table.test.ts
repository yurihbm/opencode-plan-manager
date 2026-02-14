import type { PlanMetadata } from "../../types";

import { describe, expect, test } from "bun:test";

import { generateMetadatasTable } from "./generate-metadata-table";

describe("generateMetadatasTable", () => {
	test("generates table with header and separator for empty list", () => {
		const list: PlanMetadata[] = [];
		const table = generateMetadatasTable(list);

		const lines = table.split("\n");
		expect(lines.length).toBe(2);
		expect(lines[0]).toBe(
			"| Plan ID | Description | Type | Status | Updated |",
		);
		expect(lines[1]).toBe(
			"|---------|-------------|------|--------|---------|",
		);
	});

	test("generates table with rows for populated list", () => {
		const list: PlanMetadata[] = [
			{
				id: "plan-1",
				description: "First plan",
				type: "feature",
				status: "pending",
				created_at: "2024-01-01T00:00:00.000Z",
				updated_at: "2024-01-02T00:00:00.000Z",
			},
			{
				id: "plan-2",
				description: "Second plan",
				type: "bug",
				status: "done",
				created_at: "2024-01-03T00:00:00.000Z",
				updated_at: "2024-01-04T00:00:00.000Z",
			},
		];
		const table = generateMetadatasTable(list);
		const lines = table.split("\n");

		expect(lines.length).toBe(4);
		expect(lines[2]).toBe(
			"| plan-1 | First plan | feature | pending | 2024-01-02T00:00:00.000Z |",
		);
		expect(lines[3]).toBe(
			"| plan-2 | Second plan | bug | done | 2024-01-04T00:00:00.000Z |",
		);
	});
});
