import type { PlanMetadata } from "../../types";

import { join } from "node:path";

import {
	afterEach,
	beforeEach,
	describe,
	expect,
	mock,
	spyOn,
	test,
} from "bun:test";

import { readMetadata } from "./read-metadata";
import { validateMetadata } from "./validate-metadata";

describe("readMetadata", () => {
	const folderPath = "/plans/pending/feature_auth_20260206";
	const rawMetadata: PlanMetadata = {
		id: "feature_auth_20260206",
		type: "feature",
		status: "pending",
		created_at: "2026-02-06T14:00:00Z",
		updated_at: "2026-02-06T14:00:00Z",
		description: "Add user authentication flow",
	};

	let originalValidateMetadata: typeof validateMetadata;
	beforeEach(() => {
		originalValidateMetadata = validateMetadata;
		mock.module("./validate-metadata", () => ({
			validateMetadata: mock((data: unknown) => data),
		}));
	});

	afterEach(() => {
		mock.module("./validate-metadata", () => ({
			validateMetadata: originalValidateMetadata,
		}));
		mock.restore();
		mock.clearAllMocks();
	});

	test("throws when metadata.json is missing", async () => {
		const existsMock = mock(async () => false);
		const textMock = mock(async () => "");
		const fileSpy = spyOn(Bun, "file").mockImplementation(
			() =>
				({
					exists: existsMock,
					text: textMock,
				}) as unknown as ReturnType<typeof Bun.file>,
		);

		expect(readMetadata(folderPath)).rejects.toThrow(
			`metadata.json not found in ${folderPath}`,
		);

		expect(fileSpy).toHaveBeenCalledWith(join(folderPath, "metadata.json"));
		expect(validateMetadata).not.toHaveBeenCalled();
	});

	test("throws on invalid JSON", async () => {
		const existsMock = mock(async () => true);
		const textMock = mock(async () => "not-json");
		const fileSpy = spyOn(Bun, "file").mockImplementation(
			() =>
				({
					exists: existsMock,
					text: textMock,
				}) as unknown as ReturnType<typeof Bun.file>,
		);

		try {
			await readMetadata(folderPath);
			throw new Error("Expected JSON parse to fail");
		} catch (error) {
			expect(error).toBeInstanceOf(SyntaxError);
		}

		expect(fileSpy).toHaveBeenCalledWith(join(folderPath, "metadata.json"));
		expect(validateMetadata).not.toHaveBeenCalled();
	});

	test("returns validated metadata", async () => {
		const existsMock = mock(async () => true);
		const textMock = mock(async () => JSON.stringify(rawMetadata));
		const fileSpy = spyOn(Bun, "file").mockImplementation(
			() =>
				({
					exists: existsMock,
					text: textMock,
				}) as unknown as ReturnType<typeof Bun.file>,
		);

		const result = await readMetadata(folderPath);

		expect(fileSpy).toHaveBeenCalledWith(join(folderPath, "metadata.json"));
		expect(validateMetadata).toHaveBeenCalledWith(rawMetadata);
		expect(result).toEqual(rawMetadata);
	});
});
