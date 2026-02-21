import { describe, expect, test } from "bun:test";

import { buildToolOutput } from "./buildToolOutput";

describe("buildToolOutput", () => {
	test("should build a success output with text", () => {
		const output = buildToolOutput({
			type: "success",
			text: ["Operation completed successfully."],
		});

		expect(output).toBe(
			`<tool-success>\n\tOperation completed successfully.\n</tool-success>`,
		);
	});

	test("should build an error output with multiple paragraphs", () => {
		const output = buildToolOutput({
			type: "error",
			text: [
				"An error occurred while processing your request.",
				"Please try again later.",
			],
		});

		expect(output).toBe(
			`<tool-error>\n\tAn error occurred while processing your request.\n\tPlease try again later.\n</tool-error>`,
		);
	});

	test("should build a warning output with empty text", () => {
		const output = buildToolOutput({
			type: "warning",
			text: [],
		});

		expect(output).toBe(`<tool-warning>\n</tool-warning>`);
	});
});
