import type { Implementation } from "../../types";

import { describe, expect, test } from "bun:test";

import { validateUniquePhaseNames } from "./validate-unique-phase-names";

describe("validateUniquePhaseNames", () => {
	test("returns empty array for unique phase names", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [
				{ name: "Phase 1", tasks: [] },
				{ name: "Phase 2", tasks: [] },
			],
		};
		expect(validateUniquePhaseNames(impl)).toEqual([]);
	});

	test("identifies single duplicate", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [
				{ name: "Phase 1", tasks: [] },
				{ name: "Phase 1", tasks: [] },
			],
		};
		expect(validateUniquePhaseNames(impl)).toEqual(["Phase 1"]);
	});

	test("identifies multiple duplicates", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [
				{ name: "Phase 1", tasks: [] },
				{ name: "Phase 2", tasks: [] },
				{ name: "Phase 1", tasks: [] },
				{ name: "Phase 2", tasks: [] },
			],
		};
		const duplicates = validateUniquePhaseNames(impl);
		expect(duplicates).toContain("Phase 1");
		expect(duplicates).toContain("Phase 2");
		expect(duplicates.length).toBe(2);
	});

	test("handles empty implementation", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [],
		};
		expect(validateUniquePhaseNames(impl)).toEqual([]);
	});

	test("is case sensitive", () => {
		const impl: Implementation = {
			description: "Test",
			phases: [
				{ name: "Phase 1", tasks: [] },
				{ name: "phase 1", tasks: [] },
			],
		};
		expect(validateUniquePhaseNames(impl)).toEqual([]);
	});
});
