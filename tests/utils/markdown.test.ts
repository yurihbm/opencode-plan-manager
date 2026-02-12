import type { ImplementationInput, SpecInput } from "../../src/types";

import { describe, expect, test } from "bun:test";

import {
	generatePlanMarkdown,
	generateSpecMarkdown,
} from "../../src/utils/markdown";
import { calculateProgress, parseTasks } from "../../src/utils/plan-content";

// ============================================================================
// generateSpecMarkdown
// ============================================================================

describe("generateSpecMarkdown", () => {
	test("generates deterministic markdown with all sections", () => {
		const spec: SpecInput = {
			overview: "This is a detailed overview of the specification.",
			functionals: [
				"User can log in with email and password",
				"User can reset password via email",
			],
			nonFunctionals: [
				"System must handle 1000 concurrent users",
				"Response time must be under 200ms",
			],
			acceptanceCriterias: [
				"Login form validates credentials correctly",
				"Password reset email is sent within 5 seconds",
			],
			outOfScope: ["OAuth2 integration", "Two-factor authentication"],
		};

		const result = generateSpecMarkdown(spec);

		// Check sections are present and in correct order
		expect(result).toContain("## Overview");
		expect(result).toContain("## Functional Requirements");
		expect(result).toContain("## Non-Functional Requirements");
		expect(result).toContain("## Acceptance Criteria");
		expect(result).toContain("## Out of Scope");

		// Check content is properly formatted
		expect(result).toContain("This is a detailed overview");
		expect(result).toContain("- User can log in with email and password");
		expect(result).toContain("- System must handle 1000 concurrent users");
		expect(result).toContain("- Login form validates credentials correctly");
		expect(result).toContain("- OAuth2 integration");
	});

	test("generates consistent format for minimal input", () => {
		const spec: SpecInput = {
			overview: "Minimal spec",
			functionals: ["One functional requirement"],
			nonFunctionals: ["One non-functional requirement"],
			acceptanceCriterias: ["One acceptance criteria"],
			outOfScope: ["One out of scope item"],
		};

		const result = generateSpecMarkdown(spec);

		// Verify structure
		expect(result).toContain("## Overview");
		expect(result).toContain("Minimal spec");
		expect(result).toContain("- One functional requirement");
		expect(result).toContain("- One non-functional requirement");
		expect(result).toContain("- One acceptance criteria");
		expect(result).toContain("- One out of scope item");
	});

	test("handles multiple items in each section", () => {
		const spec: SpecInput = {
			overview: "Test",
			functionals: ["Req 1", "Req 2", "Req 3"],
			nonFunctionals: ["NonFunc 1", "NonFunc 2"],
			acceptanceCriterias: [
				"Criteria 1",
				"Criteria 2",
				"Criteria 3",
				"Criteria 4",
			],
			outOfScope: ["Out 1"],
		};

		const result = generateSpecMarkdown(spec);

		expect(result).toContain("- Req 1");
		expect(result).toContain("- Req 2");
		expect(result).toContain("- Req 3");
		expect(result).toContain("- NonFunc 1");
		expect(result).toContain("- NonFunc 2");
		expect(result).toContain("- Criteria 4");
	});

	test("escapes markdown special characters correctly", () => {
		const spec: SpecInput = {
			overview: "Overview with **bold** and _italic_",
			functionals: ["Requirement with `code` block"],
			nonFunctionals: ["Non-functional with [link](url)"],
			acceptanceCriterias: ["Criteria with - nested - bullets"],
			outOfScope: ["Out of scope with # heading"],
		};

		const result = generateSpecMarkdown(spec);

		// Markdown should be preserved as-is (not escaped)
		expect(result).toContain("**bold**");
		expect(result).toContain("`code`");
		expect(result).toContain("[link](url)");
	});

	test("produces markdown ending with newline", () => {
		const spec: SpecInput = {
			overview: "Test",
			functionals: ["F"],
			nonFunctionals: ["NF"],
			acceptanceCriterias: ["AC"],
			outOfScope: ["OS"],
		};

		const result = generateSpecMarkdown(spec);

		expect(result.endsWith("\n")).toBe(true);
	});
});

// ============================================================================
// generatePlanMarkdown
// ============================================================================

describe("generatePlanMarkdown", () => {
	test("generates deterministic markdown with description and phases", () => {
		const impl: ImplementationInput = {
			description: "This is the implementation strategy overview.",
			phases: [
				{
					phase: "Phase 1: Foundation",
					tasks: ["Create base types and interfaces", "Set up configuration"],
				},
				{
					phase: "Phase 2: Implementation",
					tasks: [
						"Implement core logic",
						"Add error handling",
						"Write unit tests",
					],
				},
			],
		};

		const result = generatePlanMarkdown(impl);

		// Check main sections
		expect(result).toContain("## Description");
		expect(result).toContain("## Phases");
		expect(result).toContain("This is the implementation strategy overview");

		// Check phase headings (H3)
		expect(result).toContain("### Phase 1: Foundation");
		expect(result).toContain("### Phase 2: Implementation");

		// Check tasks are formatted as checkboxes
		expect(result).toContain("- [ ] Create base types and interfaces");
		expect(result).toContain("- [ ] Set up configuration");
		expect(result).toContain("- [ ] Implement core logic");
		expect(result).toContain("- [ ] Add error handling");
		expect(result).toContain("- [ ] Write unit tests");
	});

	test("generates consistent format for single phase", () => {
		const impl: ImplementationInput = {
			description: "Single phase implementation",
			phases: [
				{
					phase: "Phase 1",
					tasks: ["Task one", "Task two"],
				},
			],
		};

		const result = generatePlanMarkdown(impl);

		expect(result).toContain("## Description");
		expect(result).toContain("Single phase implementation");
		expect(result).toContain("### Phase 1");
		expect(result).toContain("- [ ] Task one");
		expect(result).toContain("- [ ] Task two");
	});

	test("handles multiple phases with varying task counts", () => {
		const impl: ImplementationInput = {
			description: "Multi-phase plan",
			phases: [
				{ phase: "Phase A", tasks: ["Task 1"] },
				{ phase: "Phase B", tasks: ["Task 2", "Task 3", "Task 4"] },
				{ phase: "Phase C", tasks: ["Task 5", "Task 6"] },
			],
		};

		const result = generatePlanMarkdown(impl);

		expect(result).toContain("### Phase A");
		expect(result).toContain("### Phase B");
		expect(result).toContain("### Phase C");
		expect(result).toContain("- [ ] Task 1");
		expect(result).toContain("- [ ] Task 4");
		expect(result).toContain("- [ ] Task 6");
	});

	test("all tasks are generated as pending (- [ ])", () => {
		const impl: ImplementationInput = {
			description: "Test",
			phases: [
				{
					phase: "Phase 1",
					tasks: ["Task A", "Task B", "Task C"],
				},
			],
		};

		const result = generatePlanMarkdown(impl);

		// Count checkbox markers
		const pendingCount = (result.match(/- \[ \]/g) || []).length;
		const inProgressCount = (result.match(/- \[~\]/g) || []).length;
		const doneCount = (result.match(/- \[x\]/g) || []).length;

		expect(pendingCount).toBe(3);
		expect(inProgressCount).toBe(0);
		expect(doneCount).toBe(0);
	});

	test("produces markdown ending with newline", () => {
		const impl: ImplementationInput = {
			description: "Test",
			phases: [{ phase: "P1", tasks: ["T1"] }],
		};

		const result = generatePlanMarkdown(impl);

		expect(result.endsWith("\n")).toBe(true);
	});
});

// ============================================================================
// Roundtrip Test: generatePlanMarkdown → parseTasks
// ============================================================================

describe("Roundtrip: generatePlanMarkdown → parseTasks", () => {
	test("generated markdown can be parsed back to extract tasks", () => {
		const impl: ImplementationInput = {
			description: "Implementation plan for testing roundtrip",
			phases: [
				{
					phase: "Phase 1: Setup",
					tasks: ["Install dependencies", "Configure environment"],
				},
				{
					phase: "Phase 2: Development",
					tasks: [
						"Write core functionality",
						"Add validation layer",
						"Implement error handling",
					],
				},
				{
					phase: "Phase 3: Testing",
					tasks: ["Write unit tests", "Run integration tests"],
				},
			],
		};

		// Generate markdown
		const markdown = generatePlanMarkdown(impl);

		// Parse tasks back
		const tasks = parseTasks(markdown);

		// Verify task count
		const totalTasks = impl.phases.reduce(
			(sum, phase) => sum + phase.tasks.length,
			0,
		);
		expect(tasks).toHaveLength(totalTasks);

		// Verify all tasks are pending
		expect(tasks.every((t) => t.status === "pending")).toBe(true);

		// Verify task content matches
		expect(tasks[0]!.content).toBe("Install dependencies");
		expect(tasks[1]!.content).toBe("Configure environment");
		expect(tasks[2]!.content).toBe("Write core functionality");
		expect(tasks[3]!.content).toBe("Add validation layer");
		expect(tasks[4]!.content).toBe("Implement error handling");
		expect(tasks[5]!.content).toBe("Write unit tests");
		expect(tasks[6]!.content).toBe("Run integration tests");
	});

	test("roundtrip preserves task order", () => {
		const impl: ImplementationInput = {
			description: "Order test",
			phases: [
				{ phase: "Phase 1", tasks: ["First", "Second", "Third"] },
				{ phase: "Phase 2", tasks: ["Fourth", "Fifth"] },
			],
		};

		const markdown = generatePlanMarkdown(impl);
		const tasks = parseTasks(markdown);

		expect(tasks.map((t) => t.content)).toEqual([
			"First",
			"Second",
			"Third",
			"Fourth",
			"Fifth",
		]);
	});

	test("roundtrip with calculateProgress shows 0% completion", () => {
		const impl: ImplementationInput = {
			description: "Progress test",
			phases: [{ phase: "Phase 1", tasks: ["Task 1", "Task 2", "Task 3"] }],
		};

		const markdown = generatePlanMarkdown(impl);
		const tasks = parseTasks(markdown);
		const progress = calculateProgress(tasks);

		expect(progress.total).toBe(3);
		expect(progress.done).toBe(0);
		expect(progress.in_progress).toBe(0);
		expect(progress.pending).toBe(3);
		expect(progress.percentage).toBe(0);
	});
});
