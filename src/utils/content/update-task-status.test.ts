import { describe, expect, test } from "bun:test";

import { updateTaskStatus } from "./update-task-status";

describe("updateTaskStatus", () => {
	test("updates pending task to in_progress", () => {
		const content = `
## Phase 1
- [ ] Task 1
- [ ] Task 2
`;
		const newContent = updateTaskStatus(content, "Task 1", "in_progress");

		expect(newContent).toContain("- [~] Task 1");
		expect(newContent).toContain("- [ ] Task 2");
	});

	test("updates in_progress task to done", () => {
		const content = `
- [~] Task 1
`;
		const newContent = updateTaskStatus(content, "Task 1", "done");

		expect(newContent).toContain("- [x] Task 1");
	});

	test("updates done task to pending", () => {
		const content = `
- [x] Task 1
`;
		const newContent = updateTaskStatus(content, "Task 1", "pending");

		expect(newContent).toContain("- [ ] Task 1");
	});

	test("handles special characters in task name", () => {
		const taskName = "Task (with) [special] {chars} *+?";
		const content = `
- [ ] ${taskName}
`;
		const newContent = updateTaskStatus(content, taskName, "done");

		expect(newContent).toContain(`- [x] ${taskName}`);
	});

	test("throws error if task not found", () => {
		const content = `
- [ ] Task 1
`;
		expect(() => {
			updateTaskStatus(content, "Non-existent Task", "done");
		}).toThrow('Task not found: "Non-existent Task"');
	});

	test("does not match partial task names", () => {
		const content = `
- [ ] Task 10
`;
		expect(() => {
			updateTaskStatus(content, "Task 1", "done");
		}).toThrow('Task not found: "Task 1"');
	});
});
