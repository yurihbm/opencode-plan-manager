import type { PlanMetadata } from "../../types";

import { join } from "node:path";

import { validateMetadata } from "./validate-metadata";

/**
 * Reads and validates `metadata.json` from a plan folder.
 *
 * @param folderPath - Absolute path to the plan folder
 * @returns Validated plan metadata
 * @throws {Error} If the file doesn't exist or fails validation
 *
 * @example
 * ```typescript
 * const meta = await readMetadata('/path/to/plans/pending/feature_auth_20260206');
 * console.log(meta.id);  // 'feature_auth_20260206'
 * console.log(meta.status);    // 'pending'
 * ```
 */
export async function readMetadata(folderPath: string): Promise<PlanMetadata> {
	const filePath = join(folderPath, "metadata.json");
	const file = Bun.file(filePath);

	if (!(await file.exists())) {
		throw new Error(`metadata.json not found in ${folderPath}`);
	}

	const raw = await file.text();
	const parsed = JSON.parse(raw);

	return validateMetadata(parsed);
}
