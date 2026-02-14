import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, test } from "bun:test";

import { ensurePlanDirectories } from "./ensure-plan-directories";

describe("ensurePlanDirectories", () => {
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

	test("creates all plan directories", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));

		await ensurePlanDirectories(cwd);

		await expectDirectory(join(cwd, ".opencode", "plans", "pending"));
		await expectDirectory(join(cwd, ".opencode", "plans", "in_progress"));
		await expectDirectory(join(cwd, ".opencode", "plans", "done"));
	});

	test("is idempotent", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));

		await ensurePlanDirectories(cwd);
		await ensurePlanDirectories(cwd);

		await expectDirectory(join(cwd, ".opencode", "plans", "pending"));
		await expectDirectory(join(cwd, ".opencode", "plans", "in_progress"));
		await expectDirectory(join(cwd, ".opencode", "plans", "done"));
	});

	test("does not fail when parent directory exists", async () => {
		cwd = await mkdtemp(join(tmpdir(), "opencode-plan-"));
		await mkdir(join(cwd, ".opencode"), { recursive: true });

		await ensurePlanDirectories(cwd);

		await expectDirectory(join(cwd, ".opencode", "plans", "pending"));
		await expectDirectory(join(cwd, ".opencode", "plans", "in_progress"));
		await expectDirectory(join(cwd, ".opencode", "plans", "done"));
	});
});
