import { describe, expect, test } from "bun:test";

import { parseImplementation } from "./parse-implementation";

describe("parseImplementation", () => {
	test("parses simple implementation plan", () => {
		const markdown = `
# Implementation Plan

This is the description.

## Phase 1

- [ ] Task 1
- [x] Task 2
		`;

		const result = parseImplementation(markdown);

		expect(result.description).toBe("This is the description.");
		expect(result.phases.length).toBe(1);
		expect(result.phases[0]!.name).toBe("Phase 1");
		expect(result.phases[0]!.tasks.length).toBe(2);
		expect(result.phases[0]!.tasks[0]).toEqual({
			content: "Task 1",
			status: "pending",
		});
		expect(result.phases[0]!.tasks[1]).toEqual({
			content: "Task 2",
			status: "done",
		});
	});

	test("parses multiple phases", () => {
		const markdown = `
# Implementation Plan

Desc

## Phase 1

- [ ] Task 1

## Phase 2

- [~] Task 2
		`;

		const result = parseImplementation(markdown);

		expect(result.phases.length).toBe(2);
		expect(result.phases[0]!.name).toBe("Phase 1");
		expect(result.phases[1]!.name).toBe("Phase 2");
		expect(result.phases[1]!.tasks[0]!.status).toBe("in_progress");
	});

	test("handles empty tasks", () => {
		const markdown = `
# Implementation Plan

Desc

## Phase 1
		`;

		const result = parseImplementation(markdown);

		expect(result.phases.length).toBe(1);
		expect(result.phases[0]!.tasks.length).toBe(0);
	});

	test("ignores malformed tasks", () => {
		const markdown = `
# Implementation Plan

## Phase 1

- Task without checkbox
- [ ]
- [?] Unknown status
		`;

		const result = parseImplementation(markdown);

		expect(result.phases[0]!.tasks.length).toBe(0);
	});

	test("parses multiline descriptions", () => {
		const markdown = `
# Implementation Plan

Line 1
Line 2

## Phase 1
		`;

		const result = parseImplementation(markdown);
		expect(result.description).toBe("Line 1\nLine 2");
	});
});
