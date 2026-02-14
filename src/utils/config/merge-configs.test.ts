import { describe, expect, test } from "bun:test";

import { mergeConfigs } from "./merge-configs";

describe("mergeConfigs", () => {
	test("uses default when no config provided", () => {
		const result = mergeConfigs({}, {});
		expect(result.outputFormat).toBe("markdown");
	});

	test("precedence: local > user > default", () => {
		// Test 1: Local wins
		expect(
			mergeConfigs({ outputFormat: "json" }, { outputFormat: "toon" })
				.outputFormat,
		).toBe("json");

		// Test 2: User wins over default
		expect(mergeConfigs({}, { outputFormat: "toon" }).outputFormat).toBe(
			"toon",
		);

		// Test 3: Default used
		expect(mergeConfigs({}, {}).outputFormat).toBe("markdown");
	});
});
