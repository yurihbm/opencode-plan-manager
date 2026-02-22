import { describe, expect, test } from "bun:test";

import { buildToolOutput } from "./buildToolOutput";

describe("buildToolOutput", () => {
	test("should build a success output with text", () => {
		const output = buildToolOutput({
			type: "success",
			text: ["Operation completed successfully."],
		});

		expect(output).toBe(
			`<tool-success>\nOperation completed successfully.\n</tool-success>`,
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
			`<tool-error>\nAn error occurred while processing your request.\nPlease try again later.\n</tool-error>`,
		);
	});

	test("should build a warning output with empty text", () => {
		const output = buildToolOutput({
			type: "warning",
			text: [],
		});

		expect(output).toBe(`<tool-warning>\n</tool-warning>`);
	});

	test("should trim each paragraph in the text array", () => {
		const output = buildToolOutput({
			type: "info",
			text: [
				"   This is an info message.   ",
				"   Please read the documentation for more details.   ",
			],
		});

		expect(output).toBe(
			`<tool-info>\nThis is an info message.\nPlease read the documentation for more details.\n</tool-info>`,
		);
	});
});
