import { describe, expect, test } from "bun:test";

import { CONFIG_FILE_NAME } from "../../constants";
import { getConfigPaths } from "./get-config-paths";

describe("getConfigPaths", () => {
	test("returns correct user config path", () => {
		const paths = getConfigPaths("/test/project");
		expect(paths.user).toContain(`.config/opencode/${CONFIG_FILE_NAME}`);
		expect(paths.user).toMatch(
			new RegExp(`^/.*.config/opencode/${CONFIG_FILE_NAME}$`),
		);
	});

	test("returns correct local config path", () => {
		const paths = getConfigPaths("/test/project");
		expect(paths.local).toBe(`/test/project/.opencode/${CONFIG_FILE_NAME}`);
	});

	test("handles different working directories", () => {
		const paths1 = getConfigPaths("/foo");
		const paths2 = getConfigPaths("/bar");

		expect(paths1.local).toBe(`/foo/.opencode/${CONFIG_FILE_NAME}`);
		expect(paths2.local).toBe(`/bar/.opencode/${CONFIG_FILE_NAME}`);

		// User path should be the same
		expect(paths1.user).toBe(paths2.user);
	});
});
