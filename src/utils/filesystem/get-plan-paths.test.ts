import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import { getPlanPaths } from "./get-plan-paths";

describe("getPlanPaths", () => {
	test("returns expected plan directory paths", () => {
		const cwd = "/home/user/project";
		const paths = getPlanPaths(cwd);

		const root = join(cwd, ".opencode", "plans");

		expect(paths.root).toBe(root);
		expect(paths.pending).toBe(join(root, "pending"));
		expect(paths.in_progress).toBe(join(root, "in_progress"));
		expect(paths.done).toBe(join(root, "done"));
	});
});
