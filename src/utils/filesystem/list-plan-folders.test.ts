import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "bun:test";

import { listPlanFolders } from "./list-plan-folders";

describe("listPlanFolders", () => {
	let cwd: string;

	afterEach(async () => {
		if (cwd) {
			await rm(cwd, { recursive: true, force: true });
		}
	});

	test("returns only directories in the status folder", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));
		const statusPath = join(cwd, ".opencode", "plans", "pending");

		await mkdir(join(statusPath, "feature_auth_20260206"), {
			recursive: true,
		});
		await mkdir(join(statusPath, "bug_login_20260206"), { recursive: true });
		await writeFile(join(statusPath, "notes.txt"), "ignore");

		const result = await listPlanFolders(cwd, "pending");

		expect(result.sort()).toEqual([
			"bug_login_20260206",
			"feature_auth_20260206",
		]);
	});

	test("returns empty array when status folder is missing", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));

		const result = await listPlanFolders(cwd, "in_progress");

		expect(result).toEqual([]);
	});
});
