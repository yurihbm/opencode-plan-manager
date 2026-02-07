import type { Plugin } from "@opencode-ai/plugin";
import PLAN_PROMPT from "./prompts/plan.txt";
import BUILD_PROMPT from "./prompts/build.txt";
import PLAN_SYSTEM_REMINDER from "./system/plan.txt";
import { planCreate, planList, planRead, planUpdate } from "./tools";

const SESSION_AGENT_MAP = new Map<string, string>();

const PLUGIN_NAME = "opencode-plan-manager";

/**
 * OpenCode Plan Manager plugin factory.
 *
 * Returns a plugin instance with 4 tools for managing implementation plans
 * using a folder-per-plan architecture with status-based directories.
 *
 * It also injects a system reminder for the "plan" agent to ensure it uses the
 * tools correctly, and tracks which agent is active in each session to apply
 * the reminder conditionally.
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
    // 1. Detect agent when user sends a message
    "chat.message": async (input) => {
      if (input.agent) {
        SESSION_AGENT_MAP.set(input.sessionID, input.agent);
      }
    },
    event: async (input) => {
      const { event } = input;

      if (event.type === "message.updated") {
        const props = event.properties as any;
        const info = props?.info;

        if (info?.sessionID && info?.agent) {
          SESSION_AGENT_MAP.set(info.sessionID, info.agent);
        }
      }
    },
    "experimental.chat.system.transform": async (input, output) => {
      if (input.sessionID && SESSION_AGENT_MAP.has(input.sessionID)) {
        const agent = SESSION_AGENT_MAP.get(input.sessionID);

        switch (agent) {
          case "plan":
            output.system.splice(0, output.system.length, PLAN_SYSTEM_REMINDER);
            break;
        }
      }
    },
    config: async (input) => {
      if (input.agent?.plan) {
        input.agent.plan = {
          ...input.agent.plan,
          prompt: PLAN_PROMPT,
        };
      }

      if (input.agent?.build) {
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
