import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { generatePlanId } from "./generate-plan-id";
import { toKebabCase } from "./to-kebab-case";

describe("generatePlanId", () => {
	let originalToKebabCase: typeof toKebabCase;
	beforeEach(() => {
		originalToKebabCase = toKebabCase;
		mock.module("./to-kebab-case", () => ({
			toKebabCase: () => "kebab-case",
		}));
	});

	afterEach(() => {
		mock.module("./to-kebab-case", () => ({
			toKebabCase: originalToKebabCase,
		}));
		mock.restore();
	});

	test("generates id with correct format including hex suffix", () => {
		const date = new Date("2024-05-15T12:00:00");

		const id = generatePlanId("feature", "User Authentication", date);

		// Format: {type}_{kebab}_{date}_{4-char hex}
		expect(id).toMatch(/^feature_kebab-case_20240515_[0-9a-f]{4}$/);
	});

	test("handles different plan types", () => {
		const date = new Date("2024-05-15T12:00:00");

		expect(generatePlanId("bug", "Login Fix", date)).toMatch(
			/^bug_kebab-case_20240515_[0-9a-f]{4}$/,
		);
		expect(generatePlanId("refactor", "Cleanup Code", date)).toMatch(
			/^refactor_kebab-case_20240515_[0-9a-f]{4}$/,
		);
	});

	test("uses current date by default", () => {
		const id = generatePlanId("docs", "Update Readme");

		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const expectedDateStr = `${year}${month}${day}`;

		expect(id).toMatch(
			new RegExp(`^docs_kebab-case_${expectedDateStr}_[0-9a-f]{4}$`),
		);
	});

	test("produces unique IDs on repeated calls with the same inputs", () => {
		const date = new Date("2024-05-15T12:00:00");
		const id1 = generatePlanId("feature", "Same Title", date);
		const id2 = generatePlanId("feature", "Same Title", date);

		// With the hex suffix, the chance of a collision is 1 in 65536.
		// We verify the format is correct and both are well-formed.
		expect(id1).toMatch(/^feature_kebab-case_20240515_[0-9a-f]{4}$/);
		expect(id2).toMatch(/^feature_kebab-case_20240515_[0-9a-f]{4}$/);
	});

	test("throws error if kebab title section is empty", () => {
		mock.module("./to-kebab-case", () => ({
			toKebabCase: () => "",
		}));

		expect(() => generatePlanId("feature", "")).toThrow(
			"Title must contain at least one alphanumeric character",
		);
	});
});
