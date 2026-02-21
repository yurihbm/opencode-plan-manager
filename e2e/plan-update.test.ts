import type { CreatePlanInput } from "../src/types";
import type { TestContext } from "./setup";

import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../src/constants";
import { planCreate } from "../src/tools/plan-create";
import { planUpdate } from "../src/tools/plan-update";
import { buildToolOutput } from "../src/utils/output/buildToolOutput";
import { createTestContext } from "./setup";

describe("plan_update", () => {
	let ctx: TestContext;
	let planId: string;
	let originalBuildToolOutput: typeof buildToolOutput;
	let mockBuildToolOutput: ReturnType<typeof mock>;

	beforeEach(async () => {
		ctx = await createTestContext();

		originalBuildToolOutput = buildToolOutput;
		mockBuildToolOutput = mock(({ text }) => {
			return text.join("\n");
		});
		mock.module("../src/utils/output/buildToolOutput", () => ({
			buildToolOutput: mockBuildToolOutput,
		}));

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

		mock.module("../src/utils/output/buildToolOutput", () => ({
			buildToolOutput: originalBuildToolOutput,
		}));
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

		expect(result).toContain("Invalid status transition 'pending' → 'done'");

		// Verify buildToolOutput was called with error type
		expect(mockBuildToolOutput).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "error",
				text: expect.arrayContaining([
					expect.stringContaining("Invalid status transition"),
				]),
			}),
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

		expect(result).toContain("Duplicate task names found");

		// Verify buildToolOutput was called with warning type
		expect(mockBuildToolOutput).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "warning",
				text: expect.arrayContaining([
					expect.stringContaining("Duplicate task names found"),
				]),
			}),
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
			IMPLEMENTATION_FILE_NAME,
		); // Still in pending
		const content = await fs.readFile(planPath, "utf-8");

		expect(content).toContain("- [x] Task 1");
		expect(content).toContain("- [ ] Task 2");
	});

	test("updates implementation content (replaces implementation file)", async () => {
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

		expect(result).toContain(`${IMPLEMENTATION_FILE_NAME} updated`);

		const fs = await import("node:fs/promises");
		const planPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"pending",
			planId,
			IMPLEMENTATION_FILE_NAME,
		);
		const content = await fs.readFile(planPath, "utf-8");

		expect(content).toContain("New Description");
		expect(content).toContain("New Phase");
		expect(content).toContain("New Task");
		expect(content).not.toContain("Initial description");
	});

	test("updates specifications (replaces specifications file)", async () => {
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

		expect(result).toContain(`${SPECIFICATIONS_FILE_NAME} updated`);

		const fs = await import("node:fs/promises");
		const specPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"pending",
			planId,
			SPECIFICATIONS_FILE_NAME,
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
		const implPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"in_progress",
			planId,
			IMPLEMENTATION_FILE_NAME,
		);
		const content = await fs.readFile(implPath, "utf-8");

		expect(content).toContain("- [~] Task 1");
	});

	test("status-only update does NOT trigger ask flow", async () => {
		// First, create a plan in the no-ask context so we have something to update
		const input: CreatePlanInput = {
			metadata: {
				title: "Status Only Plan",
				type: "feature",
				description: "For status-only update test",
			},
			implementation: {
				description: "Impl",
				phases: [
					{
						name: "Phase 1",
						tasks: [{ content: "Task 1", status: "pending" }],
					},
				],
			},
			specifications: {
				description: "Spec",
				functionals: [],
				nonFunctionals: [],
				acceptanceCriterias: [],
				outOfScope: [],
			},
		};

		// Create plan with context that approves all asks
		const createResult = await planCreate.execute(input, ctx.context);
		const createMatch = createResult.match(
			/\*\*Plan ID:\*\* (feature_status-only-plan_[0-9]+)/,
		);
		const statusOnlyPlanId = createMatch ? createMatch[1] : "";

		// Use context that rejects any ask to test the update
		const rejectAskContext = {
			...ctx.context,
			ask: async () => {
				throw new Error("ask should NOT be called for status-only updates");
			},
		};

		const result = await planUpdate.execute(
			{ id: statusOnlyPlanId || planId, status: "in_progress" },
			rejectAskContext,
		);

		// Should succeed despite the rejecting ask, because status-only skips ask
		expect(result).toContain("Status changed: pending → in_progress");
	});

	test("returns warning and leaves files unchanged when user rejects spec update", async () => {
		// Create plan in an approving context first
		const input: CreatePlanInput = {
			metadata: {
				title: "User Reject Update",
				type: "feature",
				description: "User will cancel the spec update",
			},
			implementation: {
				description: "Impl",
				phases: [
					{
						name: "Phase 1",
						tasks: [{ content: "T1", status: "pending" }],
					},
				],
			},
			specifications: {
				description: "Original Spec",
				functionals: ["Original Func"],
				nonFunctionals: [],
				acceptanceCriterias: [],
				outOfScope: [],
			},
		};

		await planCreate.execute(input, ctx.context);

		// Find plan id from pending folder
		const fs = await import("node:fs/promises");
		const pending = join(ctx.directory, ".opencode", "plans", "pending");
		const entries = await fs.readdir(pending);
		const targetPlanId =
			entries.find((e) => e.startsWith("feature_user-reject-update")) || "";

		// Read original spec content before attempting update
		const specPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"pending",
			targetPlanId,
			SPECIFICATIONS_FILE_NAME,
		);
		const originalSpecContent = await fs.readFile(specPath, "utf-8");

		// Now attempt a spec update with a user-reject context pointing at the same directory
		const rejectCtx = {
			directory: ctx.directory,
			ask: async () => {
				throw new Error("User cancelled");
			},
		};

		const result = await planUpdate.execute(
			{
				id: targetPlanId,
				specifications: {
					description: "Updated Spec",
					functionals: ["Updated Func"],
					nonFunctionals: [],
					acceptanceCriterias: [],
					outOfScope: [],
				},
			},
			// @ts-expect-error — partial context for test
			rejectCtx,
		);

		expect(result).toContain("Operation cancelled by user");

		// Verify buildToolOutput was called with warning type
		expect(mockBuildToolOutput).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "warning",
				text: expect.arrayContaining([
					expect.stringContaining("Operation cancelled by user"),
				]),
			}),
		);

		// Verify spec file content is unchanged
		const specAfter = await fs.readFile(specPath, "utf-8");
		expect(specAfter).toBe(originalSpecContent);
	});

	test("returns error and leaves files unchanged when config policy blocks impl update", async () => {
		const input: CreatePlanInput = {
			metadata: {
				title: "Config Block Update",
				type: "feature",
				description: "Config will block the impl update",
			},
			implementation: {
				description: "Original Impl",
				phases: [
					{
						name: "Phase 1",
						tasks: [{ content: "T1", status: "pending" }],
					},
				],
			},
			specifications: {
				description: "Spec",
				functionals: [],
				nonFunctionals: [],
				acceptanceCriterias: [],
				outOfScope: [],
			},
		};

		await planCreate.execute(input, ctx.context);

		const fs = await import("node:fs/promises");
		const pending = join(ctx.directory, ".opencode", "plans", "pending");
		const entries = await fs.readdir(pending);
		const targetPlanId =
			entries.find((e) => e.startsWith("feature_config-block-update")) || "";

		const implPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"pending",
			targetPlanId,
			IMPLEMENTATION_FILE_NAME,
		);
		const originalImplContent = await fs.readFile(implPath, "utf-8");

		// Config-reject context targeting the same directory
		const configRejectCtx = {
			directory: ctx.directory,
			ask: async () => {
				// biome-ignore lint/complexity/noThrow: intentional config rejection simulation
				throw { ruleset: "policy" };
			},
		};

		const result = await planUpdate.execute(
			{
				id: targetPlanId,
				implementation: {
					description: "New Impl",
					phases: [
						{
							name: "New Phase",
							tasks: [{ content: "New Task", status: "pending" }],
						},
					],
				},
			},
			// @ts-expect-error — partial context for test
			configRejectCtx,
		);

		expect(result).toContain("BLOCKED by a security policy");

		// Verify buildToolOutput was called with error type
		expect(mockBuildToolOutput).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "error",
				text: expect.arrayContaining([
					expect.stringContaining("BLOCKED by a security policy"),
				]),
			}),
		);

		// Verify impl file content is unchanged
		const implAfter = await fs.readFile(implPath, "utf-8");
		expect(implAfter).toBe(originalImplContent);
	});

	test("restores original file content when write fails after approval", async () => {
		const input: CreatePlanInput = {
			metadata: {
				title: "Write Fail Update",
				type: "feature",
				description: "Impl write will fail after approval",
			},
			implementation: {
				description: "Original Impl",
				phases: [
					{
						name: "Phase 1",
						tasks: [{ content: "T1", status: "pending" }],
					},
				],
			},
			specifications: {
				description: "Spec",
				functionals: [],
				nonFunctionals: [],
				acceptanceCriterias: [],
				outOfScope: [],
			},
		};

		await planCreate.execute(input, ctx.context);

		const fs = await import("node:fs/promises");
		const pending = join(ctx.directory, ".opencode", "plans", "pending");
		const entries = await fs.readdir(pending);
		const targetPlanId =
			entries.find((e) => e.startsWith("feature_write-fail-update")) || "";

		const implPath = join(
			ctx.directory,
			".opencode",
			"plans",
			"pending",
			targetPlanId,
			IMPLEMENTATION_FILE_NAME,
		);
		const originalImplContent = await fs.readFile(implPath, "utf-8");

		// Mock Bun.write to throw once for the impl file write (after ask approval)
		const originalWrite = Bun.write;
		let writeCallCount = 0;
		// @ts-expect-error — spying on Bun global for test purposes
		Bun.write = async (...args: Parameters<typeof Bun.write>) => {
			writeCallCount++;
			// Fail on the first call (the impl write inside plan-update)
			if (writeCallCount === 1) {
				throw new Error("Simulated impl write failure");
			}
			// Allow subsequent calls (the restore write)
			return originalWrite(...args);
		};

		try {
			const result = await planUpdate.execute(
				{
					id: targetPlanId,
					implementation: {
						description: "New Impl After Write Fail",
						phases: [
							{
								name: "New Phase",
								tasks: [{ content: "New Task", status: "pending" }],
							},
						],
					},
				},
				ctx.context,
			);

			expect(result).toContain(
				"Failed to update plan files after user approval",
			);
			expect(result).toContain("Original file contents have been restored");

			// Verify buildToolOutput was called with error type
			expect(mockBuildToolOutput).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "error",
					text: expect.arrayContaining([
						expect.stringContaining("Failed to update plan files"),
					]),
				}),
			);

			// Verify impl file was restored to the original content
			// (restore write was allowed by our mock, so content should match original)
			const implAfter = await fs.readFile(implPath, "utf-8");
			expect(implAfter).toBe(originalImplContent);
		} finally {
			// Restore Bun.write
			Bun.write = originalWrite;
		}
	});

	test("taskUpdates triggers ask and updates task status in file", async () => {
		let askWasCalled = false;
		let askPayload: unknown;

		// Custom context that records the ask call and approves it
		const spyCtx = {
			directory: ctx.directory,
			ask: async (payload: unknown) => {
				askWasCalled = true;
				askPayload = payload;
				return Promise.resolve();
			},
		};

		const result = await planUpdate.execute(
			{
				id: planId,
				taskUpdates: [{ content: "Task 1", status: "done" }],
			},
			// @ts-expect-error — partial context for test
			spyCtx,
		);

		// ask must have been invoked for a taskUpdates change
		expect(askWasCalled).toBe(true);

		// The ask payload should be a proper edit permission request
		expect(askPayload).toMatchObject({
			permission: "edit",
			patterns: expect.arrayContaining([
				expect.stringContaining(IMPLEMENTATION_FILE_NAME),
			]),
		});

		// File should reflect the updated task
		expect(result).toContain('Task "Task 1" → done');

		const fs = await import("node:fs/promises");
		const implContent = await fs.readFile(
			join(
				ctx.directory,
				".opencode",
				"plans",
				"pending",
				planId,
				IMPLEMENTATION_FILE_NAME,
			),
			"utf-8",
		);
		expect(implContent).toContain("- [x] Task 1");
	});
});
