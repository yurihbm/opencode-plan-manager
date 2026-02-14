import { z } from "zod";

/**
 * Schema for output format configuration.
 *
 * Defines the format in which plan content is returned by tools.
 *
 * Available options:
 * - markdown: Human-readable markdown format (default)
 * - json: Structured JSON format for programmatic use
 * - toon: Structured format with less token usage than JSON
 */
export const OutputFormatSchema = z
	.enum(["markdown", "json", "toon"])
	.default("markdown")
	.meta({
		description:
			"Output format for plan content: 'markdown' (default), 'json', or 'toon'",
	});
