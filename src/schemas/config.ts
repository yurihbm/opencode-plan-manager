import { z } from "zod";

import { OutputFormatSchema } from "./output-format";

/**
 * Schema for plugin configuration.
 *
 * Default values are used for any missing fields.
 */
export const PluginConfigSchema = z
	.object({
		outputFormat: OutputFormatSchema.meta({
			description:
				"Format for plan content output: 'markdown' (default), 'json', or 'toon'",
		}),
	})
	.meta({ description: "Plugin configuration with output format settings" });
