import type { PluginConfig } from "../../types";

import { PluginConfigSchema } from "../../schemas";

export const ERROR_MESSAGES = {
	FILE_NOT_FOUND: "File does not exist",
	VALIDATION_FAILED: "Validation failed",
	INVALID_JSON: "Invalid JSON",
};

/**
 * Result of loading a config file.
 */
export interface LoadConfigFileResult {
	/** Whether the file exists and was successfully loaded */
	success: boolean;

	/** Parsed and validated config, or undefined if failed */
	config?: Partial<PluginConfig>;

	/** Error message if loading or validation failed */
	error?: string;
}

/**
 * Loads and validates a configuration file.
 *
 * This function:
 * 1. Checks if the file exists
 * 2. Reads and parses JSON
 * 3. Validates against ConfigSchema (partial, allowing missing fields)
 * 4. Returns success/failure with config or error message
 *
 * @param filePath - Absolute path to the config file
 * @returns Load result with config data or error
 *
 * @example
 * ```typescript
 * const result = await loadConfigFile("/home/user/.config/opencode/plan-manager.json");
 * if (result.success) {
 *   console.log("Config:", result.config);
 * } else {
 *   console.warn("Failed to load config:", result.error);
 * }
 * ```
 */
export async function loadConfigFile(
	filePath: string,
): Promise<LoadConfigFileResult> {
	try {
		const file = Bun.file(filePath);

		// Check if file exists
		if (!(await file.exists())) {
			return {
				success: false,
				error: ERROR_MESSAGES.FILE_NOT_FOUND,
			};
		}

		// Read and parse JSON
		const content = await file.text();
		const json = JSON.parse(content);

		// Validate with partial schema (allow missing fields)
		const result = PluginConfigSchema.partial().safeParse(json);

		if (!result.success) {
			const issues = result.error.issues
				.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
				.join(", ");

			return {
				success: false,
				error: `${ERROR_MESSAGES.VALIDATION_FAILED}: ${issues}`,
			};
		}

		return {
			success: true,
			config: result.data,
		};
	} catch (error) {
		if (error instanceof SyntaxError) {
			return {
				success: false,
				error: `${ERROR_MESSAGES.INVALID_JSON}: ${error.message}`,
			};
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
