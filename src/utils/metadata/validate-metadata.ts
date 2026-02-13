import type { PlanMetadata } from "../../types";

import { PlanMetadataSchema } from "../../schemas";

/**
 * Validates raw data against the metadata schema.
 *
 * @param data - Raw data to validate
 * @returns Validated plan metadata
 * @throws {Error} If validation fails with descriptive message
 */
export function validateMetadata(data: unknown): PlanMetadata {
	const result = PlanMetadataSchema.safeParse(data);

	if (!result.success) {
		const issues = result.error.issues
			.map((i) => `  - ${i.path.join(".")}: ${i.message}`)
			.join("\n");
		throw new Error(`Invalid metadata:\n${issues}`);
	}

	return result.data;
}
