import type { CreatePlanInput } from "../src/types";
import type { TestContext } from "./setup";

import { rename } from "node:fs/promises";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { planCreate } from "../src/tools/plan-create";
import { planList } from "../src/tools/plan-list";
import { createTestContext } from "./setup";

describe("plan_list", () => {
	let ctx: TestContext;

	beforeEach(async () => {
		ctx = await createTestContext();
	});

	afterEach(async () => {
		await ctx.cleanup();
	});

	const createPlan = async (
		title: string,
		type: "feature" | "bug" | "refactor" | "docs",
	) => {
		const input: CreatePlanInput = {
			metadata: {
				title,
				type,
				description: `Description for ${title}`,
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
				functionals: ["Func 1"],
				nonFunctionals: ["Non-func 1"],
				acceptanceCriterias: ["AC 1"],
				outOfScope: ["OOS 1"],
			},
		};
		await planCreate.execute(input, ctx.context);
		// Find the created ID
		const fs = await import("node:fs/promises");
		const pendingDir = join(ctx.directory, ".opencode", "plans", "pending");
		const entries = await fs.readdir(pendingDir);
		// Return the ID that contains the title (assuming simple titles)
		const id = entries.find((e) =>
			e.includes(title.toLowerCase().replace(/\s+/g, "-")),
		);
		return id!;
	};

	const movePlan = async (id: string, fromStatus: string, toStatus: string) => {
		const fromPath = join(ctx.directory, ".opencode", "plans", fromStatus, id);
		const toPath = join(ctx.directory, ".opencode", "plans", toStatus, id);
		// Create destination dir if not exists (though opencode creates them usually, planCreate ensures them)
		// planCreate ensures pending, verify others exist
		const fs = await import("node:fs/promises");
		await fs.mkdir(join(ctx.directory, ".opencode", "plans", toStatus), {
			recursive: true,
		});

		await rename(fromPath, toPath);

		// Update metadata status
		const metadataPath = join(toPath, "metadata.json");
		const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"));
		metadata.status = toStatus;
		await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
	};

	test("lists pending plans by default (active)", async () => {
		const id1 = await createPlan("Pending Plan 1", "feature");
		const id2 = await createPlan("Pending Plan 2", "bug");

		const result = await planList.execute({ status: "active" }, ctx.context);

		expect(result).toContain(id1);
		expect(result).toContain(id2);
		expect(result).toContain("feature");
		expect(result).toContain("bug");
		expect(result).toContain("pending");
	});

	test("lists in_progress plans when status is active", async () => {
		const id = await createPlan("Progress Plan", "feature");
		await movePlan(id, "pending", "in_progress");

		const result = await planList.execute({ status: "active" }, ctx.context);

		expect(result).toContain(id);
		expect(result).toContain("in_progress");
	});

	test("does not list done plans when status is active", async () => {
		const id = await createPlan("Done Plan", "feature");
		await movePlan(id, "pending", "done");

		const result = await planList.execute({ status: "active" }, ctx.context);

		expect(result).not.toContain(id);
		expect(result).toContain("No active plans found"); // Assuming this is the only plan
	});

	test("lists done plans when status is done", async () => {
		const id = await createPlan("Done Plan 2", "feature");
		await movePlan(id, "pending", "done");

		const result = await planList.execute({ status: "done" }, ctx.context);

		expect(result).toContain(id);
		expect(result).toContain("done");
	});

	test("lists all plans when status is all", async () => {
		const p1 = await createPlan("P1", "feature"); // pending
		const p2 = await createPlan("P2", "bug"); // in_progress
		await movePlan(p2, "pending", "in_progress");
		const p3 = await createPlan("P3", "docs"); // done
		await movePlan(p3, "pending", "done");

		const result = await planList.execute({ status: "all" }, ctx.context);

		expect(result).toContain(p1);
		expect(result).toContain(p2);
		expect(result).toContain(p3);
	});

	test("filters by type", async () => {
		const p1 = await createPlan("Feature Plan", "feature");
		const p2 = await createPlan("Bug Plan", "bug");

		const result = await planList.execute(
			{ status: "active", type: "feature" },
			ctx.context,
		);

		expect(result).toContain(p1);
		expect(result).not.toContain(p2);
	});
});
