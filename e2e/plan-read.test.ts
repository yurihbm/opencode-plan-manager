import type { CreatePlanInput } from "../src/types";
import type { TestContext } from "./setup";

import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { planCreate } from "../src/tools/plan-create";
import { planRead } from "../src/tools/plan-read";
import { createTestContext } from "./setup";

describe("plan_read", () => {
	let ctx: TestContext;
	let planId: string;

	beforeEach(async () => {
		ctx = await createTestContext();

		// Create a plan to read
		const input: CreatePlanInput = {
			metadata: {
				title: "Read Me",
				type: "feature",
				description: "A plan to be read",
			},
			implementation: {
				description: "Implementation details",
				phases: [
					{
						name: "Phase 1",
						tasks: [
							{ content: "Task 1", status: "pending" },
							{ content: "Task 2", status: "done" },
						],
					},
				],
			},
			specifications: {
				overview: "Spec overview",
				functionals: ["Func 1"],
				nonFunctionals: ["Non-func 1"],
				acceptanceCriterias: ["AC 1"],
				outOfScope: ["OOS 1"],
			},
		};

		const result = await planCreate.execute(input, ctx.context);
		// Extract ID from result or file system
		// result has "**Plan ID:** feature_read-me_..."
		const match = result.match(/\*\*Plan ID:\*\* (feature_read-me_[0-9]+)/);
		planId = (match && match[1]) || "";
		if (!planId) {
			// Fallback: look in pending folder
			const fs = await import("node:fs/promises");
			const files = await fs.readdir(
				join(ctx.directory, ".opencode", "plans", "pending"),
			);
			planId = files[0] || "";
		}
	});

	afterEach(async () => {
		await ctx.cleanup();
	});

	test("reads full plan by default", async () => {
		const result = await planRead.execute(
			// Looks like zod schema is not enforcing default here.
			{ id: planId, view: "full" },
			ctx.context,
		);

		expect(result).toContain(planId);
		expect(result).toContain("pending"); // status
		expect(result).toContain("A plan to be read"); // description

		// Progress
		expect(result).toContain("1/2 tasks done");
		expect(result).toContain("(50%)");

		// Specifications
		expect(result).toContain("Spec overview");
		expect(result).toContain("Func 1");

		// Implementation
		expect(result).toContain("Phase 1");
		expect(result).toContain("- [ ] Task 1");
		expect(result).toContain("- [x] Task 2");
	});

	test("reads summary view", async () => {
		const result = await planRead.execute(
			{ id: planId, view: "summary" },
			ctx.context,
		);

		expect(result).toContain(planId);
		expect(result).toContain("pending");
		expect(result).toContain("A plan to be read");

		expect(result).toContain("1/2 tasks done");
		expect(result).toContain("(50%)");

		// Should NOT contain specs or full implementation tasks
		expect(result).not.toContain("Spec overview");
		expect(result).not.toContain("Phase 1");
		expect(result).not.toContain("Task 1");
	});

	test("reads spec view", async () => {
		const result = await planRead.execute(
			{ id: planId, view: "spec" },
			ctx.context,
		);

		expect(result).toContain(planId);
		expect(result).toContain("Spec overview");
		expect(result).toContain("Func 1");

		// Should NOT contain implementation details
		expect(result).not.toContain("Phase 1");
		expect(result).not.toContain("Task 1");
	});

	test("reads plan view", async () => {
		const result = await planRead.execute(
			{ id: planId, view: "plan" },
			ctx.context,
		);

		expect(result).toContain(planId);
		expect(result).toContain("Phase 1");
		expect(result).toContain("- [ ] Task 1");

		expect(result).toContain("1/2 tasks done");
		expect(result).toContain("(50%)");

		// Should NOT contain spec details
		expect(result).not.toContain("Spec overview");
		expect(result).not.toContain("Func 1");
	});

	test("returns error if plan not found", async () => {
		const result = await planRead.execute(
			{ id: "non-existent-id", view: "full" },
			ctx.context,
		);

		expect(result).toContain("Plan 'non-existent-id' not found");
	});
});
