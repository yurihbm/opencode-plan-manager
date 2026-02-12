import { test, expect, describe } from "bun:test";
import {
	parseTasks,
	updateTaskStatus,
	calculateProgress,
	validateUniqueTaskNames,
} from "../../src/utils/plan-content";
import type { PlanTask } from "../../src/types";

// ============================================================================
// parseTasks
// ============================================================================

describe("parseTasks", () => {
	test("parses pending tasks (- [ ])", () => {
		const content = "- [ ] Write tests\n- [ ] Update docs";
		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(2);
		expect(tasks[0]!.content).toBe("Write tests");
		expect(tasks[0]!.status).toBe("pending");
		expect(tasks[1]!.content).toBe("Update docs");
		expect(tasks[1]!.status).toBe("pending");
	});

	test("parses in-progress tasks (- [~])", () => {
		const content = "- [~] Implement feature\n- [~] Code review";
		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(2);
		expect(tasks[0]!.content).toBe("Implement feature");
		expect(tasks[0]!.status).toBe("in_progress");
		expect(tasks[1]!.content).toBe("Code review");
		expect(tasks[1]!.status).toBe("in_progress");
	});

	test("parses done tasks (- [x])", () => {
		const content = "- [x] Setup CI\n- [x] Deploy v1";
		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(2);
		expect(tasks[0]!.content).toBe("Setup CI");
		expect(tasks[0]!.status).toBe("done");
		expect(tasks[1]!.content).toBe("Deploy v1");
		expect(tasks[1]!.status).toBe("done");
	});

	test("parses mixed-status tasks", () => {
		const content = [
			"## Phase 1",
			"",
			"- [x] Write types",
			"- [~] Write schemas",
			"- [ ] Write tests",
		].join("\n");

		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(3);
		expect(tasks[0]!.status).toBe("done");
		expect(tasks[1]!.status).toBe("in_progress");
		expect(tasks[2]!.status).toBe("pending");
	});

	test("tracks correct line numbers", () => {
		const content = [
			"# Plan", // line 0
			"", // line 1
			"## Phase 1", // line 2
			"", // line 3
			"- [x] First task", // line 4
			"- [ ] Second task", // line 5
		].join("\n");

		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(2);
		expect(tasks[0]!.lineNumber).toBe(4);
		expect(tasks[1]!.lineNumber).toBe(5);
	});

	test("returns empty array when no tasks found", () => {
		const content = "# Plan\n\nThis is just a heading with no tasks.";
		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(0);
	});

	test("returns empty array for empty content", () => {
		expect(parseTasks("")).toHaveLength(0);
	});

	test("ignores non-checkbox list items", () => {
		const content = [
			"- Regular list item",
			"- [ ] Task item",
			"- Another regular item",
			"* Bullet with star",
		].join("\n");

		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(1);
		expect(tasks[0]!.content).toBe("Task item");
	});

	test("handles tasks across multiple phases", () => {
		const content = [
			"## Phase 1: Foundation",
			"",
			"- [x] Create types",
			"- [x] Create schemas",
			"",
			"## Phase 2: Implementation",
			"",
			"- [~] Rewrite tools",
			"- [ ] Write integration tests",
			"",
			"## Phase 3: Cleanup",
			"",
			"- [ ] Remove old files",
			"- [ ] Update README",
		].join("\n");

		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(6);
		expect(tasks.filter((t) => t.status === "done")).toHaveLength(2);
		expect(tasks.filter((t) => t.status === "in_progress")).toHaveLength(1);
		expect(tasks.filter((t) => t.status === "pending")).toHaveLength(3);
	});

	test("preserves whitespace-trimmed task content", () => {
		const content = "- [ ] Task with trailing space  ";
		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(1);
		expect(tasks[0]!.content).toBe("Task with trailing space");
	});

	test("handles CRLF line endings", () => {
		const content = "- [x] First task\r\n- [~] Second task\r\n- [ ] Third task";
		const tasks = parseTasks(content);

		expect(tasks).toHaveLength(3);
		expect(tasks[0]!.status).toBe("done");
		expect(tasks[1]!.status).toBe("in_progress");
		expect(tasks[2]!.status).toBe("pending");
	});
});

// ============================================================================
// updateTaskStatus
// ============================================================================

describe("updateTaskStatus", () => {
	test("updates pending -> done", () => {
		const content = "- [ ] Write tests\n- [ ] Update docs";
		const result = updateTaskStatus(content, "Write tests", "done");

		expect(result).toBe("- [x] Write tests\n- [ ] Update docs");
	});

	test("updates pending -> in_progress", () => {
		const content = "- [ ] Write tests";
		const result = updateTaskStatus(content, "Write tests", "in_progress");

		expect(result).toBe("- [~] Write tests");
	});

	test("updates in_progress -> done", () => {
		const content = "- [~] Write tests";
		const result = updateTaskStatus(content, "Write tests", "done");

		expect(result).toBe("- [x] Write tests");
	});

	test("updates done -> pending (revert)", () => {
		const content = "- [x] Write tests";
		const result = updateTaskStatus(content, "Write tests", "pending");

		expect(result).toBe("- [ ] Write tests");
	});

	test("updates in_progress -> pending (revert)", () => {
		const content = "- [~] Write tests";
		const result = updateTaskStatus(content, "Write tests", "pending");

		expect(result).toBe("- [ ] Write tests");
	});

	test("throws when task content not found", () => {
		const content = "- [ ] Write tests";

		expect(() =>
			updateTaskStatus(content, "Non-existent task", "done"),
		).toThrow('Task not found: "Non-existent task"');
	});

	test("only updates first occurrence of duplicate tasks", () => {
		const content = "- [ ] Write tests\n- [ ] Write tests";
		const result = updateTaskStatus(content, "Write tests", "done");

		// Only the first occurrence should be updated
		expect(result).toBe("- [x] Write tests\n- [ ] Write tests");
	});

	test("does not affect other tasks", () => {
		const content = ["- [ ] Task A", "- [~] Task B", "- [x] Task C"].join("\n");

		const result = updateTaskStatus(content, "Task B", "done");

		expect(result).toBe(
			["- [ ] Task A", "- [x] Task B", "- [x] Task C"].join("\n"),
		);
	});

	test("preserves surrounding markdown content", () => {
		const content = [
			"# My Plan",
			"",
			"Some description here.",
			"",
			"## Tasks",
			"",
			"- [ ] Write tests",
			"",
			"## Notes",
			"",
			"Some notes.",
		].join("\n");

		const result = updateTaskStatus(content, "Write tests", "done");

		expect(result).toContain("# My Plan");
		expect(result).toContain("Some description here.");
		expect(result).toContain("- [x] Write tests");
		expect(result).toContain("## Notes");
		expect(result).toContain("Some notes.");
	});

	test("handles task content with special replacement patterns ($&)", () => {
		const content = "- [ ] Refactor $& logic";
		const result = updateTaskStatus(content, "Refactor $& logic", "done");

		expect(result).toBe("- [x] Refactor $& logic");
	});

	test("handles task content with $` and $' patterns", () => {
		const content = "- [ ] Fix $` and $' edge case";
		const result = updateTaskStatus(content, "Fix $` and $' edge case", "done");

		expect(result).toBe("- [x] Fix $` and $' edge case");
	});
});

// ============================================================================
// calculateProgress
// ============================================================================

describe("calculateProgress", () => {
	test("returns 100% for empty task list", () => {
		const progress = calculateProgress([]);

		expect(progress.total).toBe(0);
		expect(progress.done).toBe(0);
		expect(progress.in_progress).toBe(0);
		expect(progress.pending).toBe(0);
		expect(progress.percentage).toBe(100);
	});

	test("calculates correct counts for mixed statuses", () => {
		const tasks: PlanTask[] = [
			{ content: "A", status: "done", lineNumber: 0 },
			{ content: "B", status: "done", lineNumber: 1 },
			{ content: "C", status: "in_progress", lineNumber: 2 },
			{ content: "D", status: "pending", lineNumber: 3 },
			{ content: "E", status: "pending", lineNumber: 4 },
		];

		const progress = calculateProgress(tasks);

		expect(progress.total).toBe(5);
		expect(progress.done).toBe(2);
		expect(progress.in_progress).toBe(1);
		expect(progress.pending).toBe(2);
		expect(progress.percentage).toBe(40);
	});

	test("returns 0% when no tasks are done", () => {
		const tasks: PlanTask[] = [
			{ content: "A", status: "pending", lineNumber: 0 },
			{ content: "B", status: "in_progress", lineNumber: 1 },
		];

		const progress = calculateProgress(tasks);

		expect(progress.percentage).toBe(0);
	});

	test("returns 100% when all tasks are done", () => {
		const tasks: PlanTask[] = [
			{ content: "A", status: "done", lineNumber: 0 },
			{ content: "B", status: "done", lineNumber: 1 },
			{ content: "C", status: "done", lineNumber: 2 },
		];

		const progress = calculateProgress(tasks);

		expect(progress.total).toBe(3);
		expect(progress.done).toBe(3);
		expect(progress.percentage).toBe(100);
	});

	test("rounds percentage correctly", () => {
		const tasks: PlanTask[] = [
			{ content: "A", status: "done", lineNumber: 0 },
			{ content: "B", status: "pending", lineNumber: 1 },
			{ content: "C", status: "pending", lineNumber: 2 },
		];

		const progress = calculateProgress(tasks);

		// 1/3 = 33.33... -> rounds to 33
		expect(progress.percentage).toBe(33);
	});

	test("handles single task", () => {
		const pending: PlanTask[] = [
			{ content: "A", status: "pending", lineNumber: 0 },
		];
		const done: PlanTask[] = [{ content: "A", status: "done", lineNumber: 0 }];

		expect(calculateProgress(pending).percentage).toBe(0);
		expect(calculateProgress(done).percentage).toBe(100);
	});
});

// ============================================================================
// validateUniqueTaskNames
// ============================================================================

describe("validateUniqueTaskNames", () => {
	test("returns empty array when all tasks are unique", () => {
		const impl = {
			description: "Test plan",
			phases: [
				{ phase: "Phase 1", tasks: ["Task 1", "Task 2"] },
				{ phase: "Phase 2", tasks: ["Task 3", "Task 4"] },
			],
		};
		expect(validateUniqueTaskNames(impl)).toEqual([]);
	});

	test("returns duplicates within same phase", () => {
		const impl = {
			description: "Test plan",
			phases: [{ phase: "Phase 1", tasks: ["Task 1", "Task 1"] }],
		};
		expect(validateUniqueTaskNames(impl)).toEqual(["Task 1"]);
	});

	test("returns duplicates across phases", () => {
		const impl = {
			description: "Test plan",
			phases: [
				{ phase: "Phase 1", tasks: ["Task 1"] },
				{ phase: "Phase 2", tasks: ["Task 1"] },
			],
		};
		expect(validateUniqueTaskNames(impl)).toEqual(["Task 1"]);
	});

	test("returns multiple duplicates", () => {
		const impl = {
			description: "Test plan",
			phases: [
				{ phase: "Phase 1", tasks: ["Task A", "Task B", "Task A"] },
				{ phase: "Phase 2", tasks: ["Task B", "Task C"] },
			],
		};
		const result = validateUniqueTaskNames(impl);
		expect(result).toContain("Task A");
		expect(result).toContain("Task B");
		expect(result).toHaveLength(2);
	});
});
