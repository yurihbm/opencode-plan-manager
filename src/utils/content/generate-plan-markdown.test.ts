import type { PlanContent } from "../../types";

import { describe, expect, test } from "bun:test";

import { generatePlanMarkdown } from "./generate-plan-markdown";

describe("generatePlanMarkdown", () => {
	const mockMetadata = {
		id: "plan-1",
		type: "feature" as const,
		status: "pending" as const,
		description: "Test Description",
		created_at: "2024-01-01",
		updated_at: "2024-01-02",
	};

	const mockProgress = {
		total: 10,
		done: 5,
		in_progress: 1,
		pending: 4,
		percentage: 50,
	};

	const mockSpecs = {
		overview: "Test Overview",
		functionals: ["Func 1", "Func 2"],
		nonFunctionals: ["Non-Func 1"],
		acceptanceCriterias: ["AC 1"],
		outOfScope: ["OOS 1"],
	};

	const mockImpl = {
		description: "Impl Description",
		phases: [
			{
				name: "Phase 1",
				tasks: [
					{ content: "Task 1", status: "done" as const },
					{ content: "Task 2", status: "pending" as const },
				],
			},
		],
	};

	test("generates full plan markdown", () => {
		const content: Partial<PlanContent> = {
			metadata: mockMetadata,
			progress: mockProgress,
			specifications: mockSpecs,
			implementation: mockImpl,
		};

		const markdown = generatePlanMarkdown(content);

		expect(markdown).toContain("**Plan ID:** plan-1");
		expect(markdown).toContain("**Progress:** 5/10 tasks done (50%)");
		expect(markdown).toContain("# Specifications");
		expect(markdown).toContain("- Func 1");
		expect(markdown).toContain("# Implementation Plan");
		expect(markdown).toContain("## Phase 1");
		expect(markdown).toContain("- [x] Task 1");
		expect(markdown).toContain("- [ ] Task 2");
	});

	test("generates partial plan (metadata only)", () => {
		const content: Partial<PlanContent> = {
			metadata: mockMetadata,
		};

		const markdown = generatePlanMarkdown(content);

		expect(markdown).toContain("**Plan ID:** plan-1");
		expect(markdown).not.toContain("**Progress:**");
		expect(markdown).not.toContain("# Specifications");
		expect(markdown).not.toContain("# Implementation Plan");
	});

	test("generates partial plan (metadata + specs)", () => {
		const content: Partial<PlanContent> = {
			metadata: mockMetadata,
			specifications: mockSpecs,
		};

		const markdown = generatePlanMarkdown(content);

		expect(markdown).toContain("**Plan ID:** plan-1");
		expect(markdown).toContain("# Specifications");
		expect(markdown).toContain("- Func 1");
		expect(markdown).not.toContain("# Implementation Plan");
	});

	test("generates partial plan (metadata + impl)", () => {
		const content: Partial<PlanContent> = {
			metadata: mockMetadata,
			implementation: mockImpl,
		};

		const markdown = generatePlanMarkdown(content);

		expect(markdown).toContain("**Plan ID:** plan-1");
		expect(markdown).not.toContain("# Specifications");
		expect(markdown).toContain("# Implementation Plan");
		expect(markdown).toContain("## Phase 1");
	});

	test("handles empty lists in specs", () => {
		const content: Partial<PlanContent> = {
			metadata: mockMetadata,
			specifications: {
				overview: "Overview",
				functionals: [],
				nonFunctionals: [],
				acceptanceCriterias: [],
				outOfScope: [],
			},
		};

		const markdown = generatePlanMarkdown(content);

		expect(markdown).toContain("# Specifications");
		expect(markdown).toContain("Overview");
		expect(markdown).not.toContain("## Functional Requirements");
		expect(markdown).not.toContain("## Non-Functional Requirements");
	});
});
