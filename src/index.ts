import type { Plugin } from "@opencode-ai/plugin";

import BUILD_PROMPT from "./prompts/build.txt";
import PLAN_PROMPT from "./prompts/plan.txt";
import { planCreate, planList, planRead, planUpdate } from "./tools";

const PLUGIN_NAME = "opencode-plan-manager";

/**
 * OpenCode Plan Manager plugin factory.
 *
 * Returns a plugin instance with 4 tools for managing implementation plans
 * using a folder-per-plan architecture with status-based directories.
 *
 * It also injects system prompts for the Plan and Build agents if not already
 * provided in the configuration.
 *
 * @returns Plugin instance with tool definitions
 */
export const OpenPlanManagerPlugin: Plugin = async ({ client }) => {
	await client.app.log({
		body: {
			service: PLUGIN_NAME,
			level: "info",
			message: "Plugin initialized",
		},
	});

	return {
		name: PLUGIN_NAME,
		config: async (input) => {
			if (input.agent?.plan && !input.agent.plan.prompt) {
				input.agent.plan = {
					...input.agent.plan,
					prompt: PLAN_PROMPT,
				};
			}

			if (input.agent?.build && !input.agent.build.prompt) {
				input.agent.build = {
					...input.agent.build,
					prompt: BUILD_PROMPT,
				};
			}
		},
		tool: {
			plan_create: planCreate,
			plan_list: planList,
			plan_read: planRead,
			plan_update: planUpdate,
		},
	};
};
