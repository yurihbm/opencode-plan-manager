import { describe, expect, test } from "bun:test";

import { isValidTransition } from "./is-valid-transition";

describe("isValidTransition", () => {
	test("allows pending to in_progress", () => {
		expect(isValidTransition("pending", "in_progress")).toBe(true);
	});

	test("allows in_progress to done", () => {
		expect(isValidTransition("in_progress", "done")).toBe(true);
	});

	test("allows in_progress to pending", () => {
		expect(isValidTransition("in_progress", "pending")).toBe(true);
	});

	test("rejects pending to done", () => {
		expect(isValidTransition("pending", "done")).toBe(false);
	});

	test("rejects any transition from done", () => {
		expect(isValidTransition("done", "pending")).toBe(false);
		expect(isValidTransition("done", "in_progress")).toBe(false);
		expect(isValidTransition("done", "done")).toBe(false);
	});

	test("rejects unknown from states", () => {
		expect(isValidTransition("unknown", "pending")).toBe(false);
		expect(isValidTransition("", "pending")).toBe(false);
	});
});
