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

import { validateMetadata } from "./validate-metadata";
import { writeMetadata } from "./write-metadata";

describe("writeMetadata", () => {
	const folderPath = "/plans/pending/feature_auth_20260206";
	const metadata: PlanMetadata = {
		id: "feature_auth_20260206",
		type: "feature",
		status: "pending",
		created_at: "2026-02-06T14:00:00Z",
		updated_at: "2026-02-06T14:00:00Z",
		description: "Add user authentication flow",
	};

	beforeEach(() => {
		mock.module("./validate-metadata", () => ({
			validateMetadata: mock((data: PlanMetadata) => data),
		}));
	});

	afterEach(() => {
		mock.restore();
		mock.clearAllMocks();
	});

	test("writes validated metadata with correct formatting", async () => {
		const writeSpy = spyOn(Bun, "write").mockImplementation(async () => 0);

		const result = await writeMetadata(folderPath, metadata);

		expect(validateMetadata).toHaveBeenCalledWith(metadata);
		expect(writeSpy).toHaveBeenCalledWith(
			join(folderPath, "metadata.json"),
			JSON.stringify(metadata, null, 2) + "\n",
		);
		expect(result).toEqual(metadata);
	});

	test("does not write when validation fails", async () => {
		const writeSpy = spyOn(Bun, "write").mockImplementation(async () => 0);
		const validationError = new Error("Invalid metadata");

		mock.module("./validate-metadata", () => ({
			validateMetadata: mock(() => {
				throw validationError;
			}),
		}));

		expect(writeMetadata(folderPath, metadata)).rejects.toThrow(
			validationError.message,
		);

		expect(writeSpy).not.toHaveBeenCalled();
	});
});
