import type { PlanFileChange } from ".";

import { describe, expect, test } from "bun:test";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../../constants";
import { prepareUnifiedPlanDiff } from "./prepareUnifiedPlanDiff";

describe("prepareUnifiedPlanDiff", () => {
	const mockSpecChange: PlanFileChange = {
		filename: SPECIFICATIONS_FILE_NAME,
		current: "Old spec content",
		updated: "New spec content",
		relativePath: ".opencode/plans/pending/test-plan/specifications.md",
	};

	const mockImplChange: PlanFileChange = {
		filename: IMPLEMENTATION_FILE_NAME,
		current: "Old impl content",
		updated: "New impl content",
		relativePath: ".opencode/plans/pending/test-plan/implementation.md",
	};

	test("generates unified diff for single file change (spec only)", () => {
		const result = prepareUnifiedPlanDiff("test-plan", [mockSpecChange]);

		// Should contain a diff
		expect(result.diff).toContain("Old spec content");
		expect(result.diff).toContain("New spec content");
		expect(result.diff).toContain("---"); // Diff header
		expect(result.diff).toContain("+++"); // Diff header

		// Should have relative paths
		expect(result.relPath.specifications).toBe(mockSpecChange.relativePath);
	});

	test("generates unified diff for single file change (impl only)", () => {
		const result = prepareUnifiedPlanDiff("test-plan", [mockImplChange]);

		// Should contain a diff
		expect(result.diff).toContain("Old impl content");
		expect(result.diff).toContain("New impl content");

		// Should have relative paths
		expect(result.relPath.implementation).toBe(mockImplChange.relativePath);
	});

	test("generates combined virtual file diff for both files changing", () => {
		const result = prepareUnifiedPlanDiff("test-plan", [
			mockSpecChange,
			mockImplChange,
		]);

		// Should contain content from both files
		expect(result.diff).toContain("Old spec content");
		expect(result.diff).toContain("New spec content");
		expect(result.diff).toContain("Old impl content");
		expect(result.diff).toContain("New impl content");

		// Should contain the separator used for virtual combined file
		expect(result.diff).toContain("---");

		// Should have relative paths for both
		expect(result.relPath.specifications).toBe(mockSpecChange.relativePath);
		expect(result.relPath.implementation).toBe(mockImplChange.relativePath);
	});

	test("handles creation scenario (current content is empty)", () => {
		const createSpecChange: PlanFileChange = {
			filename: SPECIFICATIONS_FILE_NAME,
			current: "",
			updated: "New spec content",
			relativePath: ".opencode/plans/pending/test-plan/specifications.md",
		};

		const createImplChange: PlanFileChange = {
			filename: IMPLEMENTATION_FILE_NAME,
			current: "",
			updated: "New impl content",
			relativePath: ".opencode/plans/pending/test-plan/implementation.md",
		};

		const result = prepareUnifiedPlanDiff("test-plan", [
			createSpecChange,
			createImplChange,
		]);

		// Should show additions only (no deletions)
		expect(result.diff).toContain("New spec content");
		expect(result.diff).toContain("New impl content");

		// The diff should indicate additions
		expect(result.diff).toMatch(/\+.*New spec content/);
		expect(result.diff).toMatch(/\+.*New impl content/);
	});

	test("order of changes doesn't matter", () => {
		const result1 = prepareUnifiedPlanDiff("test-plan", [
			mockSpecChange,
			mockImplChange,
		]);

		const result2 = prepareUnifiedPlanDiff("test-plan", [
			mockImplChange,
			mockSpecChange,
		]);

		// Both should produce identical results
		expect(result1.diff).toBe(result2.diff);
		expect(result1.relPath).toEqual(result2.relPath);
	});

	test("uses planId as virtual filename when both files change", () => {
		const result = prepareUnifiedPlanDiff("feature_test-plan_20260221", [
			mockSpecChange,
			mockImplChange,
		]);

		// The diff header should use the planId as the filename
		expect(result.diff).toContain("feature_test-plan_20260221");
	});

	test("uses relativePath as filename when single file changes", () => {
		const result = prepareUnifiedPlanDiff("test-plan", [mockSpecChange]);

		// The diff header should use the relative path
		expect(result.diff).toContain(mockSpecChange.relativePath);
	});
});
