import type { Implementation } from "../../types";

import { describe, expect, test } from "bun:test";

import { validateUniqueTaskNames } from "./validate-unique-task-names";

describe("validateUniqueTaskNames", () => {
	test("returns empty array for unique task names", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [
				{
					name: "Phase 1",
					tasks: [
						{ content: "Task 1", status: "pending" },
						{ content: "Task 2", status: "pending" },
					],
				},
				{
					name: "Phase 2",
					tasks: [
						{ content: "Task 3", status: "pending" },
						{ content: "Task 4", status: "pending" },
					],
				},
			],
		};
		expect(validateUniqueTaskNames(impl)).toEqual([]);
	});

	test("identifies duplicates within the same phase", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [
				{
					name: "Phase 1",
					tasks: [
						{ content: "Task 1", status: "pending" },
						{ content: "Task 1", status: "pending" },
					],
				},
			],
		};
		expect(validateUniqueTaskNames(impl)).toEqual(["Task 1"]);
	});

	test("identifies duplicates across different phases", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [
				{
					name: "Phase 1",
					tasks: [{ content: "Task 1", status: "pending" }],
				},
				{
					name: "Phase 2",
					tasks: [{ content: "Task 1", status: "pending" }],
				},
			],
		};
		expect(validateUniqueTaskNames(impl)).toEqual(["Task 1"]);
	});

	test("handles empty phases and tasks", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [
				{ name: "Phase 1", tasks: [] },
				{ name: "Phase 2", tasks: [] },
			],
		};
		expect(validateUniqueTaskNames(impl)).toEqual([]);
	});

	test("handles multiple duplicates", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [
				{
					name: "Phase 1",
					tasks: [
						{ content: "A", status: "pending" },
						{ content: "B", status: "pending" },
					],
				},
				{
					name: "Phase 2",
					tasks: [
						{ content: "A", status: "pending" },
						{ content: "C", status: "pending" },
						{ content: "B", status: "pending" },
					],
				},
			],
		};
		const duplicates = validateUniqueTaskNames(impl);
		expect(duplicates).toContain("A");
		expect(duplicates).toContain("B");
		expect(duplicates.length).toBe(2);
	});
});
