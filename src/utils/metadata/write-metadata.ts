import type { PlanMetadata } from "../../types";

import { join } from "node:path";

import { validateMetadata } from "./validate-metadata";

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
 *   id: 'feature_auth_20260206',
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
