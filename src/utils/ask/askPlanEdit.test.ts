import type { ToolContext } from "@opencode-ai/plugin";
import type { AskPlanEditInput } from "./askPlanEdit";

import { beforeEach, describe, expect, test } from "bun:test";

import { askPlanEdit } from "./askPlanEdit";

describe("askPlanEdit", () => {
	let input: AskPlanEditInput;

	beforeEach(() => {
		input = {
			planId: "test-plan",
			relPath: {
				specifications: "plans/test-plan/spec.md",
				implementation: "plans/test-plan/impl.md",
			},
			diff: "diff",
			context: {
				ask: async () => Promise.resolve(),
			} as unknown as ToolContext,
		};
	});

	test("should return rejected: false when user accepts edit", async () => {
		const output = await askPlanEdit(input);

		expect(output).toEqual({
			rejected: false,
			toolOutput: null,
		});
	});

	test("should return rejected: true with toolOutput when user rejects edit", async () => {
		input.context.ask = async () =>
			Promise.reject(new Error("User rejected the edit"));

		const output = await askPlanEdit(input);

		expect(output).toEqual({
			rejected: true,
			toolOutput: expect.stringContaining("Operation cancelled by user"),
		});
	});

	test("should return rejected: true with toolOutput when config denies edit", async () => {
		input.context.ask = async () =>
			Promise.reject({
				ruleset: "deny-all",
			});

		const output = await askPlanEdit(input);

		expect(output).toEqual({
			rejected: true,
			toolOutput: expect.stringContaining(
				"Operation was BLOCKED by a security policy in the user's configuration",
			),
		});
	});
});
