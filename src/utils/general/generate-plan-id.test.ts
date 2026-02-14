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

	test("generates id with correct format", () => {
		const date = new Date("2024-05-15T12:00:00");

		const id = generatePlanId("feature", "User Authentication", date);

		expect(id).toBe("feature_kebab-case_20240515");
	});

	test("handles different plan types", () => {
		const date = new Date("2024-05-15T12:00:00");

		expect(generatePlanId("bug", "Login Fix", date)).toBe(
			"bug_kebab-case_20240515",
		);
		expect(generatePlanId("refactor", "Cleanup Code", date)).toBe(
			"refactor_kebab-case_20240515",
		);
	});

	test("uses current date by default", () => {
		const id = generatePlanId("docs", "Update Readme");

		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const day = String(now.getDate()).padStart(2, "0");
		const expectedDateStr = `${year}${month}${day}`;

		expect(id).toBe(`docs_kebab-case_${expectedDateStr}`);
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
