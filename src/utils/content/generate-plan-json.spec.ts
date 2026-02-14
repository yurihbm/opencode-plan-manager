import type { PlanContent } from "../../types";

import { describe, expect, test } from "bun:test";

import { generatePlanJSON } from "./generate-plan-json";

describe("generatePlanJSON", () => {
	const mockContent: Partial<PlanContent> = {
		metadata: {
			id: "test-plan",
			type: "feature" as const,
			description: "Test description",
			status: "pending" as const,
			created_at: "2024-01-01T00:00:00.000Z",
			updated_at: "2024-01-01T00:00:00.000Z",
		},
	};

	test("should generate JSON string from plan content", () => {
		const json = generatePlanJSON(mockContent);
		expect(json).toBe(JSON.stringify(mockContent, null, 2));
	});
});
