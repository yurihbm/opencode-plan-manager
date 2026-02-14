import type { PluginConfig } from "./types";

export const IMPLEMENTATION_FILE_NAME = "implementation.md";
export const SPECIFICATIONS_FILE_NAME = "specifications.md";

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG: PluginConfig = {
	outputFormat: "markdown",
};
