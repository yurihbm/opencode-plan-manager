import { describe, expect, test } from "bun:test";

import { getConfigPaths } from "./get-config-paths";

describe("getConfigPaths", () => {
	test("returns correct user config path", () => {
		const paths = getConfigPaths("/test/project");
		expect(paths.user).toContain(".config/opencode/plan-manager.json");
		expect(paths.user).toMatch(/^\/.*\.config\/opencode\/plan-manager\.json$/);
	});

	test("returns correct local config path", () => {
		const paths = getConfigPaths("/test/project");
		expect(paths.local).toBe("/test/project/.opencode/plan-manager.json");
	});

	test("handles different working directories", () => {
		const paths1 = getConfigPaths("/foo");
		const paths2 = getConfigPaths("/bar");

		expect(paths1.local).toBe("/foo/.opencode/plan-manager.json");
		expect(paths2.local).toBe("/bar/.opencode/plan-manager.json");

		// User path should be the same
		expect(paths1.user).toBe(paths2.user);
	});
});
