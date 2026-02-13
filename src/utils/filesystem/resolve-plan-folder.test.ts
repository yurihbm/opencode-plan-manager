import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "bun:test";

import { resolvePlanFolder } from "./resolve-plan-folder";

describe("resolvePlanFolder", () => {
	let cwd: string;

	afterEach(async () => {
		if (cwd) {
			await rm(cwd, { recursive: true, force: true });
		}
	});

	const writeMetadata = async (status: string, planId: string) => {
		const folderPath = join(cwd, ".opencode", "plans", status, planId);
		await mkdir(folderPath, { recursive: true });
		await writeFile(join(folderPath, "metadata.json"), "{}\n");
	};

	test("returns plan location when found", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));
		const planId = "feature_auth_20260206";

		await writeMetadata("pending", planId);

		const result = await resolvePlanFolder(cwd, planId);

		expect(result).toEqual({
			path: join(cwd, ".opencode", "plans", "pending", planId),
			status: "pending",
		});
	});

	test("prefers in_progress over other statuses", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));
		const planId = "feature_auth_20260206";

		await writeMetadata("pending", planId);
		await writeMetadata("in_progress", planId);
		await writeMetadata("done", planId);

		const result = await resolvePlanFolder(cwd, planId);

		expect(result).toEqual({
			path: join(cwd, ".opencode", "plans", "in_progress", planId),
			status: "in_progress",
		});
	});

	test("returns null when not found", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));

		const result = await resolvePlanFolder(cwd, "missing_plan");

		expect(result).toBeNull();
	});
});
