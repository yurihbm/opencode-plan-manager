import { expect, test } from "bun:test";

import { generatePlanId } from "../../src/utils/plan-id";

// ============================================================================
// Basic ID generation
// ============================================================================

test("generatePlanId - produces correct format {type}_{kebab}_{date}", () => {
	const date = new Date("2026-02-06");
	const id = generatePlanId("feature", "User Authentication", date);

	expect(id).toBe("feature_user-authentication_20260206");
});

test("generatePlanId - handles different plan types", () => {
	const date = new Date("2026-02-06");

	expect(generatePlanId("feature", "Login", date)).toBe(
		"feature_login_20260206",
	);
	expect(generatePlanId("bug", "Login", date)).toBe("bug_login_20260206");
	expect(generatePlanId("refactor", "Login", date)).toBe(
		"refactor_login_20260206",
	);
	expect(generatePlanId("docs", "Login", date)).toBe("docs_login_20260206");
});

test("generatePlanId - converts title to kebab-case", () => {
	const date = new Date("2026-01-15");

	expect(generatePlanId("feature", "Add Payment Gateway", date)).toBe(
		"feature_add-payment-gateway_20260115",
	);
	expect(generatePlanId("bug", "Fix Login Crash", date)).toBe(
		"bug_fix-login-crash_20260115",
	);
});

// ============================================================================
// Special characters & edge cases
// ============================================================================

test("generatePlanId - strips special characters from title", () => {
	const date = new Date("2026-03-01");

	expect(generatePlanId("feature", "Fix: API Bug #42", date)).toBe(
		"feature_fix-api-bug-42_20260301",
	);
	expect(generatePlanId("feature", "Hello & World!", date)).toBe(
		"feature_hello-world_20260301",
	);
});

test("generatePlanId - handles accented characters", () => {
	const date = new Date("2026-03-01");

	expect(generatePlanId("docs", "Café Setup", date)).toBe(
		"docs_cafe-setup_20260301",
	);
	expect(generatePlanId("feature", "São Paulo API", date)).toBe(
		"feature_sao-paulo-api_20260301",
	);
});

test("generatePlanId - throws on empty/whitespace-only title", () => {
	const date = new Date("2026-01-01");

	expect(() => generatePlanId("feature", "", date)).toThrow(
		"Title must contain at least one alphanumeric character",
	);
	expect(() => generatePlanId("feature", "   ", date)).toThrow(
		"Title must contain at least one alphanumeric character",
	);
	expect(() => generatePlanId("feature", "---", date)).toThrow(
		"Title must contain at least one alphanumeric character",
	);
});

test("generatePlanId - throws on symbols-only title", () => {
	const date = new Date("2026-01-01");

	expect(() => generatePlanId("feature", "###", date)).toThrow(
		"Title must contain at least one alphanumeric character",
	);
	expect(() => generatePlanId("feature", "!@#$%^&*()", date)).toThrow(
		"Title must contain at least one alphanumeric character",
	);
});

// ============================================================================
// Date formatting
// ============================================================================

test("generatePlanId - pads single-digit month and day", () => {
	const date = new Date("2026-01-05");

	expect(generatePlanId("bug", "Fix", date)).toBe("bug_fix_20260105");
});

test("generatePlanId - handles end-of-year date", () => {
	const date = new Date("2025-12-31");

	expect(generatePlanId("feature", "New Year", date)).toBe(
		"feature_new-year_20251231",
	);
});

test("generatePlanId - uses current date when none provided", () => {
	const id = generatePlanId("feature", "Test Plan");

	// Should end with today's date in YYYYMMDD format
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const expectedSuffix = `${year}${month}${day}`;

	expect(id).toBe(`feature_test-plan_${expectedSuffix}`);
});

// ============================================================================
// Multi-word and complex titles
// ============================================================================

test("generatePlanId - handles long multi-word titles", () => {
	const date = new Date("2026-02-06");

	const id = generatePlanId(
		"refactor",
		"Plugin Refactor Folder Per Plan Architecture",
		date,
	);
	expect(id).toBe(
		"refactor_plugin-refactor-folder-per-plan-architecture_20260206",
	);
});

test("generatePlanId - handles titles with numbers", () => {
	const date = new Date("2026-02-06");

	expect(generatePlanId("feature", "API v2 Setup", date)).toBe(
		"feature_api-v2-setup_20260206",
	);
	expect(generatePlanId("bug", "Issue 123", date)).toBe(
		"bug_issue-123_20260206",
	);
});

test("generatePlanId - handles underscores in title", () => {
	const date = new Date("2026-02-06");

	expect(generatePlanId("feature", "my_feature_name", date)).toBe(
		"feature_my-feature-name_20260206",
	);
});
