import type { PlanContent } from "../../types";

import { describe, expect, test } from "bun:test";

import { generatePlanTOON } from "./generate-plan-toon";

describe("generate-plan-toon", () => {
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

	test("generates full plan toon", () => {
		const content: Partial<PlanContent> = {
			metadata: mockMetadata,
			progress: mockProgress,
			specifications: mockSpecs,
			implementation: mockImpl,
		};

		const toon = generatePlanTOON(content);

		expect(toon).toContain("metadata:");
		expect(toon).toContain("id: plan-1");
		expect(toon).toContain(
			"progress:\n  total: 10\n  done: 5\n  in_progress: 1\n  pending: 4\n  percentage: 50",
		);
		expect(toon).toContain("specifications:");
		expect(toon).toContain("Func 1");
		expect(toon).toContain("implementation:");
		expect(toon).toContain("Phase 1");
		expect(toon).toContain("Task 1");
		expect(toon).toContain("Task 2");
	});

	test("generates partial plan (metadata only)", () => {
		const content: Partial<PlanContent> = {
			metadata: mockMetadata,
		};

		const toon = generatePlanTOON(content);

		expect(toon).toContain("metadata:");
		expect(toon).toContain("id: plan-1");

		expect(toon).not.toContain(
			"progress:\n  total: 10\n  done: 5\n  in_progress: 1\n  pending: 4\n  percentage: 50",
		);
		expect(toon).not.toContain("specifications:");
		expect(toon).not.toContain("Func 1");
		expect(toon).not.toContain("implementation:");
		expect(toon).not.toContain("Phase 1");
		expect(toon).not.toContain("Task 1");
		expect(toon).not.toContain("Task 2");
	});

	test("generates partial plan (metadata + specs)", () => {
		const content: Partial<PlanContent> = {
			metadata: mockMetadata,
			specifications: mockSpecs,
		};

		const toon = generatePlanTOON(content);

		expect(toon).toContain("metadata:");
		expect(toon).toContain("id: plan-1");
		expect(toon).toContain("specifications:");
		expect(toon).toContain("Func 1");

		expect(toon).not.toContain(
			"progress:\n  total: 10\n  done: 5\n  in_progress: 1\n  pending: 4\n  percentage: 50",
		);
		expect(toon).not.toContain("implementation:");
		expect(toon).not.toContain("Phase 1");
		expect(toon).not.toContain("Task 1");
		expect(toon).not.toContain("Task 2");
	});

	test("generates partial plan (metadata + impl)", () => {
		const content: Partial<PlanContent> = {
			metadata: mockMetadata,
			implementation: mockImpl,
		};

		const toon = generatePlanTOON(content);

		expect(toon).toContain("metadata:");
		expect(toon).toContain("id: plan-1");
		expect(toon).toContain("implementation:");
		expect(toon).toContain("Phase 1");
		expect(toon).toContain("Task 1");
		expect(toon).toContain("Task 2");

		expect(toon).not.toContain(
			"progress:\n  total: 10\n  done: 5\n  in_progress: 1\n  pending: 4\n  percentage: 50",
		);
		expect(toon).not.toContain("specifications:");
		expect(toon).not.toContain("Func 1");
	});
});
