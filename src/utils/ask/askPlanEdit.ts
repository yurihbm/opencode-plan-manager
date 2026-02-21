import type { ToolContext } from "@opencode-ai/plugin";

import {
	IMPLEMENTATION_FILE_NAME,
	SPECIFICATIONS_FILE_NAME,
} from "../../constants";
import { buildToolOutput } from "../output";

export interface AskPlanEditInput {
	planId: string;
	relPath: {
		specifications: string;
		implementation: string;
	};
	diff: string;
	context: ToolContext;
}

type AskPlanEditOutput =
	| {
			rejected: false;
			toolOutput: null;
	  }
	| {
			rejected: true;
			toolOutput: string;
	  };
export async function askPlanEdit({
	planId,
	relPath,
	diff,
	context,
}: AskPlanEditInput): Promise<AskPlanEditOutput> {
	let rejectReason: "user" | "config" | null = null;

	try {
		await context.ask({
			permission: "edit",
			patterns: [relPath.specifications, relPath.implementation],
			always: [".opencode/plans/*"],
			metadata: {
				filepath: `${planId}: ${SPECIFICATIONS_FILE_NAME} & ${IMPLEMENTATION_FILE_NAME}`,
				diff,
			},
		});
	} catch (error) {
		// These are workarounds to classify the reason for rejection since error
		// types are not provided to OpenCode plugins at this time.

		// 1. Check if it's a DeniedError (Config-based)
		if (error && typeof error === "object" && "ruleset" in error) {
			rejectReason = "config";
		}
		// 2. Otherwise treat it as a User-based rejection
		else {
			rejectReason = "user";
		}
	}

	if (rejectReason == "config") {
		return {
			rejected: true,
			toolOutput: buildToolOutput({
				type: "error",
				text: [
					"Operation was BLOCKED by a security policy in the user's configuration.",
					"NEXT STEP: Inform the user that Plan Agent should be able to perform edits on `.opencode/plans/*`.",
				],
			}),
		};
	}

	if (rejectReason == "user") {
		return {
			rejected: true,
			toolOutput: buildToolOutput({
				type: "warning",
				text: [
					"Operation cancelled by user.",
					"NEXT STEP: Ask user for feedback and adjust the plan accordingly before trying to create again.",
				],
			}),
		};
	}

	return {
		rejected: false,
		toolOutput: null,
	};
}
