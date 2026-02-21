const TAG_BY_TYPE = {
	confirmation: "tool-confirmation",
	warning: "tool-warning",
	error: "tool-error",
	reminder: "tool-reminder",
	info: "tool-info",
	success: "tool-success",
};

type MessageType = keyof typeof TAG_BY_TYPE;

interface BuildToolOutputInput {
	text: string[];
	type: MessageType;
}

/**
 * Builds a tool output message with the specified text and type.
 * Each item in text array is treated as a separate paragraph and indented
 * with a tab character.
 *
 * @param text - An array of strings, where each string is a paragraph of the message.
 * @param type - The type of the message. Defaults to "warning".
 *
 * @return A formatted string representing the tool output, wrapped in appropriate
 * tags based on the type.
 *
 * @example
 * ```typescript
 * const message = buildToolOutput(
 *  ["This is a warning message.", "Please check your input."],
 *  "warning"
 * );
 *
 * console.log(message);
 * // Output:
 * // <tool-warning>
 * //	This is a warning message.
 * //	Please check your input.
 * // </tool-warning>
 * ```
 */
export function buildToolOutput({ text, type }: BuildToolOutputInput): string {
	const tag = TAG_BY_TYPE[type];
	return [`<${tag}>`, ...text.map((paragraph) => `\t${paragraph}`), `</${tag}>`]
		.join("\n")
		.trim();
}
