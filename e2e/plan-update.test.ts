import type { CreatePlanInput } from "../src/types";
import type { TestContext } from "./setup";

import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { planCreate } from "../src/tools/plan-create";
import { planUpdate } from "../src/tools/plan-update";
import { createTestContext } from "./setup";

describe("plan_update", () => {
	let ctx: TestContext;
	let planId: string;

	beforeEach(async () => {
		ctx = await createTestContext();

		const input: CreatePlanInput = {
			metadata: {
				title: "Update Me",
				type: "feature",
				description: "A plan to be updated",
			},
			implementation: {
				description: "Initial description",
				phases: [
					{
						name: "Phase 1",
						tasks: [
							{ content: "Task 1", status: "pending" },
							{ content: "Task 2", status: "pending" },
						],
					},
				],
			},
			specifications: {
				description: "Initial Spec",
				functionals: [],
				nonFunctionals: [],
				acceptanceCriterias: [],
				outOfScope: [],
			},
		};

		const result = await planCreate.execute(input, ctx.context);
		const match = result.match(/\*\*Plan ID:\*\* (feature_update-me_[0-9]+)/);
		planId = (match && match[1]) || "";
		if (!planId) {
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

	test("returns error for non-existent plan", async () => {
		const result = await planUpdate.execute(
			{ id: "nonexistent_plan", status: "done" },
			ctx.context,
		);

		expect(result).toContain(
			"Plan 'nonexistent_plan' not found in any status directory.",
		);
	});

	test("returns error for invalid status transition", async () => {
		const result = await planUpdate.execute(
			{ id: planId, status: "done" },
			ctx.context,
		);

		expect(result).toContain(
			"Error: Invalid status transition 'pending' → 'done'.",
		);
	});

	test("returns error for duplicate task names in implementation update", async () => {
		const result = await planUpdate.execute(
			{
				id: planId,
				implementation: {
					description: "New Description",
					phases: [
						{
							name: "New Phase",
							tasks: [
								{ content: "Duplicate Task", status: "pending" },
								{ content: "Duplicate Task", status: "pending" },
							],
						},
					],
				},
			},
			ctx.context,
		);

		expect(result).toContain(
			"Error: Duplicate task names found. Task names must be unique across all phases.",
		);
	});

	test("updates plan status (moves folder)", async () => {
		const result = await planUpdate.execute(
			{ id: planId, status: "in_progress" },
			ctx.context,
		);

		expect(result).toContain("Status changed: pending → in_progress");

		// Verify folder moved
		const fs = await import("node:fs/promises");
		const existsInPending = await fs.exists(
			join(ctx.directory, ".opencode", "plans", "pending", planId),
		);
		const existsInProgress = await fs.exists(
			join(ctx.directory, ".opencode", "plans", "in_progress", planId),
		);

		expect(existsInPending).toBe(false);
		expect(existsInProgress).toBe(true);

		// Verify metadata updated
		const metadata = JSON.parse(
			await fs.readFile(
				join(
					ctx.directory,
					".opencode",
					"plans",
					"in_progress",
					planId,
					"metadata.json",
				),
				"utf-8",
			),
		);
		expect(metadata.status).toBe("in_progress");
	});

	test("updates task status", async () => {
		const result = await planUpdate.execute(
			{
				id: planId,
				taskUpdates: [{ content: "Task 1", status: "done" }],
			},
			ctx.context,
		);

		expect(result).toContain('Task "Task 1" → done');

		// Verify file content
		const fs = await import("node:fs/promises");
		const planPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"pending",
			planId,
			"plan.md",
		); // Still in pending
		const content = await fs.readFile(planPath, "utf-8");

		expect(content).toContain("- [x] Task 1");
		expect(content).toContain("- [ ] Task 2");
	});

	test("updates implementation content (replaces plan.md)", async () => {
		const newImpl = {
			description: "New Description",
			phases: [
				{
					name: "New Phase",
					tasks: [{ content: "New Task", status: "pending" as const }],
				},
			],
		};

		const result = await planUpdate.execute(
			{
				id: planId,
				implementation: newImpl,
			},
			ctx.context,
		);

		expect(result).toContain("plan.md updated");

		const fs = await import("node:fs/promises");
		const planPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"pending",
			planId,
			"plan.md",
		);
		const content = await fs.readFile(planPath, "utf-8");

		expect(content).toContain("New Description");
		expect(content).toContain("New Phase");
		expect(content).toContain("New Task");
		expect(content).not.toContain("Initial description");
	});

	test("updates specifications (replaces spec.md)", async () => {
		const newSpec = {
			description: "New Spec Overview",
			functionals: ["New Func"],
			nonFunctionals: [],
			acceptanceCriterias: [],
			outOfScope: [],
		};

		const result = await planUpdate.execute(
			{
				id: planId,
				specifications: newSpec,
			},
			ctx.context,
		);

		expect(result).toContain("spec.md updated");

		const fs = await import("node:fs/promises");
		const specPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"pending",
			planId,
			"spec.md",
		);
		const content = await fs.readFile(specPath, "utf-8");

		expect(content).toContain("New Spec Overview");
		expect(content).toContain("New Func");
		expect(content).not.toContain("Initial Spec");
	});

	test("handles multiple updates (status + task)", async () => {
		const result = await planUpdate.execute(
			{
				id: planId,
				status: "in_progress",
				taskUpdates: [{ content: "Task 1", status: "in_progress" }],
			},
			ctx.context,
		);

		expect(result).toContain("Status changed: pending → in_progress");
		expect(result).toContain('Task "Task 1" → in_progress');

		const fs = await import("node:fs/promises");
		const planPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"in_progress",
			planId,
			"plan.md",
		);
		const content = await fs.readFile(planPath, "utf-8");

		expect(content).toContain("- [~] Task 1");
	});
});
