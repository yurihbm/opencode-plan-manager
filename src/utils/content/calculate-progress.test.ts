import type { PlanTask } from "../../types";

import { describe, expect, test } from "bun:test";

import { calculateProgress } from "./calculate-progress";

describe("calculateProgress", () => {
	test("calculates progress for mixed tasks", () => {
		const tasks: PlanTask[] = [
			{ content: "Task 1", status: "done" },
			{ content: "Task 2", status: "done" },
			{ content: "Task 3", status: "in_progress" },
			{ content: "Task 4", status: "pending" },
			{ content: "Task 5", status: "pending" },
		];

		const progress = calculateProgress(tasks);

		expect(progress).toEqual({
			total: 5,
			done: 2,
			in_progress: 1,
			pending: 2,
			percentage: 40,
		});
	});

	test("handles empty task list", () => {
		const tasks: PlanTask[] = [];
		const progress = calculateProgress(tasks);

		expect(progress).toEqual({
			total: 0,
			done: 0,
			in_progress: 0,
			pending: 0,
			percentage: 0,
		});
	});

	test("calculates 100% completion", () => {
		const tasks: PlanTask[] = [
			{ content: "Task 1", status: "done" },
			{ content: "Task 2", status: "done" },
		];
		const progress = calculateProgress(tasks);

		expect(progress.percentage).toBe(100);
	});

	test("calculates 0% completion", () => {
		const tasks: PlanTask[] = [
			{ content: "Task 1", status: "pending" },
			{ content: "Task 2", status: "in_progress" },
		];
		const progress = calculateProgress(tasks);

		expect(progress.percentage).toBe(0);
	});

	test("rounds percentage correctly", () => {
		// 1 done out of 3 total = 33.33% -> 33%
		const tasks1: PlanTask[] = [
			{ content: "Task 1", status: "done" },
			{ content: "Task 2", status: "pending" },
			{ content: "Task 3", status: "pending" },
		];
		expect(calculateProgress(tasks1).percentage).toBe(33);

		// 2 done out of 3 total = 66.66% -> 67%
		const tasks2: PlanTask[] = [
			{ content: "Task 1", status: "done" },
			{ content: "Task 2", status: "done" },
			{ content: "Task 3", status: "pending" },
		];
		expect(calculateProgress(tasks2).percentage).toBe(67);
	});
});
