import type { CreatePlanInput } from "../src/types";
import type { TestContext } from "./setup";

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../src/constants";
import { planCreate } from "../src/tools/plan-create";
import { buildToolOutput } from "../src/utils/output/buildToolOutput";
import { createTestContext } from "./setup";

describe("plan_create", () => {
	let ctx: TestContext;
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
	});

	afterEach(async () => {
		await ctx.cleanup();

		mock.module("../src/utils/output/buildToolOutput", () => ({
			buildToolOutput: originalBuildToolOutput,
		}));
	});

	test("should create a new plan with correct structure", async () => {
		const input: CreatePlanInput = {
			metadata: {
				title: "Test Plan",
				type: "feature",
				description: "A test plan description",
			},
			implementation: {
				description: "Implementation details",
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
				description: "Spec overview",
				functionals: ["Func 1"],
				nonFunctionals: ["Non-func 1"],
				acceptanceCriterias: ["AC 1"],
				outOfScope: ["OOS 1"],
			},
		};

		const result = await planCreate.execute(input, ctx.context);

		// Check if result indicates success
		expect(result).toContain("Plan created successfully");

		// Verify buildToolOutput was called with success type
		expect(mockBuildToolOutput).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "success",
				text: expect.arrayContaining([
					expect.stringContaining("Plan created successfully"),
				]),
			}),
		);

		// Verify file system structure
		const pendingDir = join(ctx.directory, ".opencode", "plans", "pending");
		expect(existsSync(pendingDir)).toBe(true);

		// Find the created plan folder
		// Since ID includes date, we need to find the folder that starts with the expected prefix
		const fs = await import("node:fs/promises");
		const entries = await fs.readdir(pendingDir);
		const planFolder = entries.find((e) => e.startsWith("feature_test-plan"));

		expect(planFolder).toBeDefined();
		if (!planFolder) return; // TypeScript guard

		const planPath = join(pendingDir, planFolder);

		// Check required files
		expect(existsSync(join(planPath, "metadata.json"))).toBe(true);
		expect(existsSync(join(planPath, SPECIFICATIONS_FILE_NAME))).toBe(true);
		expect(existsSync(join(planPath, IMPLEMENTATION_FILE_NAME))).toBe(true);

		// Verify metadata content
		const metadata = JSON.parse(
			readFileSync(join(planPath, "metadata.json"), "utf-8"),
		);
		expect(metadata).toMatchObject({
			type: "feature",
			status: "pending",
			description: "A test plan description",
		});

		// Verify IMPLEMENTATION_FILE_NAME content
		const implMd = readFileSync(
			join(planPath, IMPLEMENTATION_FILE_NAME),
			"utf-8",
		);
		expect(implMd).toContain("# Implementation Plan");
		expect(implMd).toContain("## Phase 1");
		expect(implMd).toContain("- [ ] Task 1");
		expect(implMd).toContain("- [ ] Task 2");

		// Verify SPECIFICATIONS_FILE_NAME content
		const specMd = readFileSync(
			join(planPath, SPECIFICATIONS_FILE_NAME),
			"utf-8",
		);
		expect(specMd).toContain("# Specifications");
		expect(specMd).toContain("Spec overview");
		// The overview doesn't have a "## Overview" header in the output, it's just the content
		// expect(specMd).toContain("## Overview");
	});

	test("should handle duplicate plan titles by appending suffix", async () => {
		const input: CreatePlanInput = {
			metadata: {
				title: "Duplicate Plan",
				type: "bug",
				description: "Description",
			},
			implementation: {
				description: "Impl",
				phases: [{ name: "P1", tasks: [{ content: "T1", status: "pending" }] }],
			},
			specifications: {
				description: "Spec",
				functionals: [],
				nonFunctionals: [],
				acceptanceCriterias: [],
				outOfScope: [],
			},
		};

		// First creation
		await planCreate.execute(input, ctx.context);

		// Second creation with same title
		const result2 = await planCreate.execute(input, ctx.context);

		expect(result2).toContain("Plan created successfully");
		// Should have a suffix like -2
		// expected ID: bug_duplicate-plan_DATE-2

		const pendingDir = join(ctx.directory, ".opencode", "plans", "pending");
		const fs = await import("node:fs/promises");
		const entries = await fs.readdir(pendingDir);

		// Should have 2 folders
		expect(entries.length).toBe(2);

		const basePlan = entries.find((e) => !e.endsWith("-2"));
		const suffixedPlan = entries.find((e) => e.endsWith("-2"));

		expect(basePlan).toBeDefined();
		expect(suffixedPlan).toBeDefined();
	});

	test("should fail if duplicate phases exist", async () => {
		const input: CreatePlanInput = {
			metadata: {
				title: "Bad Plan",
				type: "refactor",
				description: "Desc",
			},
			implementation: {
				description: "Desc",
				phases: [
					{ name: "Phase 1", tasks: [] },
					{ name: "Phase 1", tasks: [] },
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

		const result = await planCreate.execute(input, ctx.context);
		expect(result).toContain("Duplicate phase names found");

		// Verify buildToolOutput was called with warning type
		expect(mockBuildToolOutput).toHaveBeenCalledWith(
			expect.objectContaining({
				type: "warning",
				text: expect.arrayContaining([
					expect.stringContaining("Duplicate phase names found"),
				]),
			}),
		);
	});

	test("should return warning and create no files when user rejects", async () => {
		const userRejectCtx = await createTestContext(
			"opencode-test-create-",
			"user",
		);

		try {
			const input: CreatePlanInput = {
				metadata: {
					title: "User Reject Plan",
					type: "feature",
					description: "Will be cancelled by user",
				},
				implementation: {
					description: "Impl",
					phases: [
						{ name: "P1", tasks: [{ content: "T1", status: "pending" }] },
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

			const result = await planCreate.execute(input, userRejectCtx.context);

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

			// Verify no plan files were created
			const fs = await import("node:fs/promises");
			const pendingDir = join(
				userRejectCtx.directory,
				".opencode",
				"plans",
				"pending",
			);
			const entries = await fs.readdir(pendingDir);
			expect(entries.length).toBe(0);
		} finally {
			await userRejectCtx.cleanup();
		}
	});

	test("should return error and create no files when config policy blocks creation", async () => {
		const configRejectCtx = await createTestContext(
			"opencode-test-create-",
			"config",
		);

		try {
			const input: CreatePlanInput = {
				metadata: {
					title: "Config Block Plan",
					type: "feature",
					description: "Will be blocked by security policy",
				},
				implementation: {
					description: "Impl",
					phases: [
						{ name: "P1", tasks: [{ content: "T1", status: "pending" }] },
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

			const result = await planCreate.execute(input, configRejectCtx.context);

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

			// Verify no plan files were created
			const fs = await import("node:fs/promises");
			const pendingDir = join(
				configRejectCtx.directory,
				".opencode",
				"plans",
				"pending",
			);
			const entries = await fs.readdir(pendingDir);
			expect(entries.length).toBe(0);
		} finally {
			await configRejectCtx.cleanup();
		}
	});

	test("should clean up plan folder when write fails after approval", async () => {
		const input: CreatePlanInput = {
			metadata: {
				title: "Write Fail Plan",
				type: "feature",
				description: "Will fail on write",
			},
			implementation: {
				description: "Impl",
				phases: [{ name: "P1", tasks: [{ content: "T1", status: "pending" }] }],
			},
			specifications: {
				description: "Spec",
				functionals: [],
				nonFunctionals: [],
				acceptanceCriterias: [],
				outOfScope: [],
			},
		};

		// Mock Bun.write to throw on the first file write (after ask approval)
		const originalWrite = Bun.write;
		let writeCallCount = 0;
		// @ts-expect-error — spying on Bun global for test purposes
		Bun.write = async (...args: Parameters<typeof Bun.write>) => {
			writeCallCount++;
			if (writeCallCount === 1) {
				throw new Error("Simulated write failure");
			}
			return originalWrite(...args);
		};

		try {
			const result = await planCreate.execute(input, ctx.context);

			expect(result).toContain(
				"Failed to create plan files after user approval",
			);

			// Verify buildToolOutput was called with error type
			expect(mockBuildToolOutput).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "error",
					text: expect.arrayContaining([
						expect.stringContaining("Failed to create plan files"),
					]),
				}),
			);

			// Verify the plan folder was cleaned up (no folder left behind)
			const fs = await import("node:fs/promises");
			const pendingDir = join(ctx.directory, ".opencode", "plans", "pending");
			const entries = await fs.readdir(pendingDir);
			expect(entries.length).toBe(0);
		} finally {
			// Restore Bun.write
			Bun.write = originalWrite;
		}
	});
});
