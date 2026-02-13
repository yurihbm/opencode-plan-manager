import { describe, expect, test } from "bun:test";

import { parseSpecifications } from "./parse-specifications";

describe("parseSpecifications", () => {
	test("parses full specifications", () => {
		const markdown = `# Specifications

Overview text.

## Functional Requirements

- Func 1
- Func 2

## Non-Functional Requirements

- Non-Func 1

## Acceptance Criteria

- AC 1

## Out of Scope

- OOS 1
		`;

		const result = parseSpecifications(markdown);

		expect(result.overview).toBe("Overview text.");
		expect(result.functionals).toEqual(["Func 1", "Func 2"]);
		expect(result.nonFunctionals).toEqual(["Non-Func 1"]);
		expect(result.acceptanceCriterias).toEqual(["AC 1"]);
		expect(result.outOfScope).toEqual(["OOS 1"]);
	});

	test("handles missing sections", () => {
		const markdown = `# Specifications

Overview text.

## Functional Requirements

- Func 1
		`;

		const result = parseSpecifications(markdown);

		expect(result.overview).toBe("Overview text.");
		expect(result.functionals).toEqual(["Func 1"]);
		expect(result.nonFunctionals).toEqual([]);
		expect(result.acceptanceCriterias).toEqual([]);
		expect(result.outOfScope).toEqual([]);
	});

	test("handles empty lists", () => {
		const markdown = `# Specifications

Overview text.

## Functional Requirements
		`;

		const result = parseSpecifications(markdown);

		expect(result.functionals).toEqual([]);
	});

	test("parses multiline overview", () => {
		const markdown = `# Specifications

Line 1
Line 2

## Functional Requirements
		`;

		const result = parseSpecifications(markdown);

		expect(result.overview).toBe("Line 1\nLine 2");
	});

	test("ignores extra headers", () => {
		const markdown = `# Specifications

Overview.

## Random Header

- Item

## Functional Requirements

- Func 1
		`;

		const result = parseSpecifications(markdown);

		expect(result.overview).toBe("Overview.");
		expect(result.functionals).toEqual(["Func 1"]);
	});
});
