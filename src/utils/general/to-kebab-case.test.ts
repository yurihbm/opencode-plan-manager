import { describe, expect, test } from "bun:test";

import { toKebabCase } from "./to-kebab-case";

describe("toKebabCase", () => {
	test("converts basic string to kebab-case", () => {
		expect(toKebabCase("User Authentication")).toBe("user-authentication");
	});

	test("handles mixed case", () => {
		expect(toKebabCase("API v2.0 Setup")).toBe("api-v2-0-setup");
	});

	test("collapses multiple spaces", () => {
		expect(toKebabCase("  Spaced  Out  ")).toBe("spaced-out");
	});

	test("converts underscores to hyphens", () => {
		expect(toKebabCase("Hello_World")).toBe("hello-world");
	});

	test("handles special characters", () => {
		expect(toKebabCase("Special!@#$Chars")).toBe("special-chars");
	});

	test("normalizes accents", () => {
		expect(toKebabCase("Café & Restaurant")).toBe("cafe-restaurant");
		expect(toKebabCase("Façade")).toBe("facade");
	});

	test("handles numeric characters", () => {
		expect(toKebabCase("Plan 123 Update")).toBe("plan-123-update");
	});

	test("removes leading and trailing hyphens", () => {
		expect(toKebabCase("-start-end-")).toBe("start-end");
	});

	test("collapses multiple hyphens", () => {
		expect(toKebabCase("foo--bar---baz")).toBe("foo-bar-baz");
	});

	test("handles empty string", () => {
		expect(toKebabCase("")).toBe("");
	});
});
