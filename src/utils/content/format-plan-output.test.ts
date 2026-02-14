import type { PlanContent } from "../../types";

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { formatPlanOutput } from "./format-plan-output";
import { generatePlanJSON } from "./generate-plan-json";
import { generatePlanMarkdown } from "./generate-plan-markdown";
import { generatePlanTOON } from "./generate-plan-toon";

describe("formatPlanOutput", () => {
	let originalGeneratePlanMarkdown: typeof generatePlanMarkdown;
	let originalGeneratePlanJSON: typeof generatePlanJSON;
	let originalGeneratePlanTOON: typeof generatePlanTOON;
	let mockGeneratePlanMarkdown: ReturnType<typeof mock>;
	let mockGeneratePlanJSON: ReturnType<typeof mock>;
	let mockGeneratePlanTOON: ReturnType<typeof mock>;

	beforeEach(() => {
		originalGeneratePlanMarkdown = generatePlanMarkdown;
		originalGeneratePlanJSON = generatePlanJSON;
		originalGeneratePlanTOON = generatePlanTOON;

		mockGeneratePlanMarkdown = mock(() => "markdown");
		mockGeneratePlanJSON = mock(() => "json");
		mockGeneratePlanTOON = mock(() => "toon");

		mock.module("./generate-plan-markdown", () => ({
			generatePlanMarkdown: mockGeneratePlanMarkdown,
		}));
		mock.module("./generate-plan-json", () => ({
			generatePlanJSON: mockGeneratePlanJSON,
		}));
		mock.module("./generate-plan-toon", () => ({
			generatePlanTOON: mockGeneratePlanTOON,
		}));
	});

	afterEach(() => {
		mock.module("./generate-plan-markdown", () => ({
			generatePlanMarkdown: originalGeneratePlanMarkdown,
		}));
		mock.module("./generate-plan-json", () => ({
			generatePlanJSON: originalGeneratePlanJSON,
		}));
		mock.module("./generate-plan-toon", () => ({
			generatePlanTOON: originalGeneratePlanTOON,
		}));
	});

	const sampleContent: Partial<PlanContent> = {
		metadata: {
			id: "test-plan",
			type: "feature" as const,
			description: "Test description",
			status: "pending" as const,
			created_at: "2024-01-01T00:00:00.000Z",
			updated_at: "2024-01-01T00:00:00.000Z",
		},
	};

	test("formats as markdown", () => {
		const output = formatPlanOutput(sampleContent, "markdown");
		expect(output).toBe("markdown");
	});

	test("formats as JSON", () => {
		const output = formatPlanOutput(sampleContent, "json");
		expect(output).toBe("json");
	});

	test("formats as TOON", () => {
		const output = formatPlanOutput(sampleContent, "toon");
		expect(output).toBe("toon");
	});
});
