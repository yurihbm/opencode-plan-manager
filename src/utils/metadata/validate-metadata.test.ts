import type { PlanMetadata } from "../../types";

import { describe, expect, test } from "bun:test";

import { validateMetadata } from "./validate-metadata";

describe("validateMetadata", () => {
	const validMetadata: PlanMetadata = {
		id: "feature_auth_20260206",
		type: "feature",
		status: "pending",
		created_at: "2026-02-06T14:00:00Z",
		updated_at: "2026-02-06T14:00:00Z",
		description: "Add user authentication flow",
	};

	test("returns validated metadata", () => {
		const result = validateMetadata(validMetadata);

		expect(result).toEqual(validMetadata);
	});

	test("throws for invalid status", () => {
		const invalid = {
			...validMetadata,
			status: "archived" as PlanMetadata["status"],
		};

		expect(() => validateMetadata(invalid)).toThrow("Invalid metadata:");

		try {
			validateMetadata(invalid);
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain("status: Invalid plan status");
		}
	});

	test("throws for invalid type", () => {
		const invalid = {
			...validMetadata,
			type: "chore" as PlanMetadata["type"],
		};

		expect(() => validateMetadata(invalid)).toThrow("Invalid metadata:");

		try {
			validateMetadata(invalid);
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain("type: Invalid plan type");
		}
	});

	test("throws for invalid id pattern", () => {
		const invalid = {
			...validMetadata,
			id: "Feature Auth 2026",
		};

		expect(() => validateMetadata(invalid)).toThrow("Invalid metadata:");

		try {
			validateMetadata(invalid);
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain(
				"id: ID must be lowercase alphanumeric with hyphens/underscores",
			);
		}
	});

	test("throws for invalid ISO timestamps", () => {
		const invalid = {
			...validMetadata,
			created_at: "not-a-date",
		};

		expect(() => validateMetadata(invalid)).toThrow("Invalid metadata:");

		try {
			validateMetadata(invalid);
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain(
				"created_at: Creation timestamp must be in ISO 8601 format",
			);
		}
	});

	test("throws for short description", () => {
		const invalid = {
			...validMetadata,
			description: "Too short",
		};

		expect(() => validateMetadata(invalid)).toThrow("Invalid metadata:");

		try {
			validateMetadata(invalid);
		} catch (error) {
			expect(error).toBeInstanceOf(Error);
			expect((error as Error).message).toContain(
				"description: Description must be at least 10 characters",
			);
		}
	});
});
