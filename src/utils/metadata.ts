/**
 * Read/write operations for plan `metadata.json` files.
 *
 * Uses native JSON parsing (fast) with Zod validation (strict).
 * No external dependencies beyond Zod.
 */

import { join } from "node:path";
import { MetadataSchema } from "../schemas";
import type { PlanMetadata } from "../types";

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
 * console.log(meta.plan_id);  // 'feature_auth_20260206'
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

/**
 * Writes validated metadata to `metadata.json` in a plan folder.
 *
 * The data is validated before writing to ensure file integrity.
 *
 * @param folderPath - Absolute path to the plan folder
 * @param data - The metadata to write
 * @returns The validated metadata that was written
 * @throws {Error} If validation fails
 *
 * @example
 * ```typescript
 * await writeMetadata('/path/to/plans/pending/feature_auth_20260206', {
 *   plan_id: 'feature_auth_20260206',
 *   type: 'feature',
 *   status: 'pending',
 *   created_at: '2026-02-06T14:00:00Z',
 *   updated_at: '2026-02-06T14:00:00Z',
 *   description: 'Add user authentication flow',
 * });
 * ```
 */
export async function writeMetadata(
	folderPath: string,
	data: PlanMetadata,
): Promise<PlanMetadata> {
	const validated = validateMetadata(data);
	const filePath = join(folderPath, "metadata.json");
	const content = JSON.stringify(validated, null, 2) + "\n";

	await Bun.write(filePath, content);

	return validated;
}

/**
 * Validates raw data against the metadata schema.
 *
 * @param data - Raw data to validate
 * @returns Validated plan metadata
 * @throws {Error} If validation fails with descriptive message
 */
export function validateMetadata(data: unknown): PlanMetadata {
	const result = MetadataSchema.safeParse(data);

	if (!result.success) {
		const issues = result.error.issues
			.map((i) => `  - ${i.path.join(".")}: ${i.message}`)
			.join("\n");
		throw new Error(`Invalid metadata:\n${issues}`);
	}

	return result.data;
}
