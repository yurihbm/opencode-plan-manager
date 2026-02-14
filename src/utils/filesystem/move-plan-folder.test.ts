import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "bun:test";

import { movePlanFolder } from "./move-plan-folder";

describe("movePlanFolder", () => {
	let cwd: string;

	afterEach(async () => {
		if (cwd) {
			await rm(cwd, { recursive: true, force: true });
		}
	});

	const expectDirectory = async (path: string) => {
		const info = await stat(path);
		expect(info.isDirectory()).toBe(true);
	};

	test("moves plan folder to target status", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));
		const planId = "feature_auth_20260206";
		const source = join(cwd, ".opencode", "plans", "pending", planId);
		const target = join(cwd, ".opencode", "plans", "done", planId);

		await mkdir(source, { recursive: true });

		const result = await movePlanFolder(cwd, planId, "pending", "done");

		expect(result).toBe(target);
		await expectDirectory(target);
		expect(stat(source)).rejects.toThrow();
	});

	test("creates target status directory when missing", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));
		const planId = "feature_auth_20260206";
		const source = join(cwd, ".opencode", "plans", "pending", planId);
		const target = join(cwd, ".opencode", "plans", "in_progress", planId);

		await mkdir(source, { recursive: true });

		const result = await movePlanFolder(cwd, planId, "pending", "in_progress");

		expect(result).toBe(target);
		await expectDirectory(target);
	});

	test("throws when source folder does not exist", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));

		expect(
			movePlanFolder(cwd, "missing_plan", "pending", "done"),
		).rejects.toThrow();
	});
});
