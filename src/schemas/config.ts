import { z } from "zod";

import { OutputFormatSchema } from "./output-format";

/**
 * Schema for plugin configuration.
 *
 * Configuration can be provided at two levels:
 * - User config: `~/.config/opencode/plan-manager.json`
 * - Local config: `<cwd>/.opencode/plan-manager.json`
 *
 * Local config takes precedence over user config.
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
