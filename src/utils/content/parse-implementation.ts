import type {
	Implementation,
	ImplementationPhase,
	PlanTask,
	PlanTaskStatus,
} from "../../types";

/**
 * Parses tasks from a markdown content string.
 *
 * Recognizes task lines in the format:
 * - [ ] Task content (pending)"
 * - [~] Task content (in progress)"
 * - [x] Task content (done)
 *
 * @param content - The markdown content to parse
 *
 * @return An array of parsed tasks with their content and status
 */
function parseTasks(content: string): PlanTask[] {
	const TASK_REGEX = /^- \[([ ~x])\] (.+)$/gm;

	const MARKER_TO_STATUS: Record<string, PlanTaskStatus> = {
		" ": "pending",
		"~": "in_progress",
		x: "done",
	};

	const tasks: PlanTask[] = [];

	// Reset regex state
	TASK_REGEX.lastIndex = 0;

	let match: RegExpExecArray | null;

	while ((match = TASK_REGEX.exec(content)) !== null) {
		const marker = match[1]!;
		const taskContent = match[2]?.trim() ?? "";

		if (!taskContent) continue;

		const status = MARKER_TO_STATUS[marker] ?? "pending";

		tasks.push({
			content: taskContent,
			status,
		});
	}

	return tasks;
}

export function parseImplementation(content: string): Implementation {
	const DESCRIPTION_REGEX =
		/^# Implementation Plan\s*\n([\s\S]+?)(?=\n## |\n$)/m;
	// Use a regex that handles newlines and EOF correctly without the 'm' flag's $ ambiguity
	const PHASE_REGEX = /(?:^|\n)## (.+?)(?:\n|$)([\s\S]+?)(?=\n## |$)/g;

	const descriptionMatch = content.match(DESCRIPTION_REGEX);
	const description = descriptionMatch?.[1]?.trim() ?? "";

	const phases: ImplementationPhase[] = [];

	let match: RegExpExecArray | null;
	while ((match = PHASE_REGEX.exec(content)) !== null) {
		const phaseName = match[1]?.trim() ?? "";
		const phaseContent = match[2] ?? "";

		const tasks = parseTasks(phaseContent);

		if (phaseName) {
			phases.push({ name: phaseName, tasks });
		}
	}

	return { description, phases };
}
