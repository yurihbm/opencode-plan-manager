import { test, expect } from "bun:test";
import { toKebabCase } from "../../src/utils/kebab-case";

test("toKebabCase - basic conversion", () => {
	expect(toKebabCase("User Authentication")).toBe("user-authentication");
	expect(toKebabCase("Hello World")).toBe("hello-world");
});

test("toKebabCase - numbers and versions", () => {
	expect(toKebabCase("API v2.0 Setup")).toBe("api-v2-0-setup");
	expect(toKebabCase("Version 1.2.3")).toBe("version-1-2-3");
	expect(toKebabCase("Test123")).toBe("test123");
});

test("toKebabCase - special characters", () => {
	expect(toKebabCase("Special!@#$Chars")).toBe("special-chars");
	expect(toKebabCase("Hello & Goodbye")).toBe("hello-goodbye");
	expect(toKebabCase("Test (with) [brackets]")).toBe("test-with-brackets");
	expect(toKebabCase("Colon:Semicolon;Comma,")).toBe("colon-semicolon-comma");
});

test("toKebabCase - whitespace normalization", () => {
	expect(toKebabCase("  Spaced  Out  ")).toBe("spaced-out");
	expect(toKebabCase("Multiple   Spaces")).toBe("multiple-spaces");
	expect(toKebabCase("Tab\tSeparated")).toBe("tab-separated");
	expect(toKebabCase("New\nLine")).toBe("new-line");
});

test("toKebabCase - underscores and hyphens", () => {
	expect(toKebabCase("Hello_World")).toBe("hello-world");
	expect(toKebabCase("already-kebab-case")).toBe("already-kebab-case");
	expect(toKebabCase("Mixed_And-Combined")).toBe("mixed-and-combined");
	expect(toKebabCase("___multiple___underscores___")).toBe(
		"multiple-underscores",
	);
});

test("toKebabCase - accents and unicode", () => {
	expect(toKebabCase("Café")).toBe("cafe");
	expect(toKebabCase("Résumé")).toBe("resume");
	expect(toKebabCase("Naïve")).toBe("naive");
	expect(toKebabCase("São Paulo")).toBe("sao-paulo");
});

test("toKebabCase - edge cases", () => {
	expect(toKebabCase("")).toBe("");
	expect(toKebabCase("   ")).toBe("");
	expect(toKebabCase("---")).toBe("");
	expect(toKebabCase("a")).toBe("a");
	expect(toKebabCase("A")).toBe("a");
});

test("toKebabCase - consecutive separators", () => {
	expect(toKebabCase("Hello--World")).toBe("hello-world");
	expect(toKebabCase("Test___Case")).toBe("test-case");
	expect(toKebabCase("Multiple - - - Hyphens")).toBe("multiple-hyphens");
});

test("toKebabCase - leading and trailing separators", () => {
	expect(toKebabCase("-Leading")).toBe("leading");
	expect(toKebabCase("Trailing-")).toBe("trailing");
	expect(toKebabCase("-Both-")).toBe("both");
	expect(toKebabCase("___Underscores___")).toBe("underscores");
});

test("toKebabCase - real-world examples", () => {
	expect(toKebabCase("Implement User Authentication System")).toBe(
		"implement-user-authentication-system",
	);
	expect(toKebabCase("Fix: API Bug #42")).toBe("fix-api-bug-42");
	expect(toKebabCase("Feature/Add-Payment-Gateway")).toBe(
		"feature-add-payment-gateway",
	);
	expect(toKebabCase("v2.0 Migration (Phase 1)")).toBe(
		"v2-0-migration-phase-1",
	);
});
