import { tool } from "@opencode-ai/plugin";
import { UpdatePlanInputBaseSchema, isValidTransition } from "../schemas";
import type { PlanStatus, PlanMetadata } from "../types";
import {
  resolvePlanFolder,
  movePlanFolder,
  generateSpecMarkdown,
  validateUniqueTaskNames,
  generatePlanMarkdown,
  updateTaskStatus,
  readMetadata,
  writeMetadata,
} from "../utils";
import { join } from "node:path";

/**
 * PLAN_UPDATE: Update status, content, or tasks
 */
export const planUpdate = tool({
  description:
    "Update a plan's status, content, or tasks. Supports: changing status (moves folder between pending/in_progress/done), replacing spec.md or plan.md content, and toggling individual task statuses. Auto-updates the updated_at timestamp.",
  args: UpdatePlanInputBaseSchema.shape,
  async execute(args, context) {
    try {
      // Validate: at least one update field must be provided
      if (
        args.status === undefined &&
        args.spec === undefined &&
        args.plan === undefined &&
        args.taskUpdates === undefined
      ) {
        return "Error: At least one of 'status', 'spec', 'plan', or 'taskUpdates' must be provided.";
      }

      // Resolve plan location
      const location = await resolvePlanFolder(context.directory, args.plan_id);

      if (!location) {
        return `Plan '${args.plan_id}' not found in any status directory.\n\nUse plan_list to see available plans.`;
      }

      const updateMessages: string[] = [];
      let currentPath = location.path;
      let currentStatus = location.status;

      // --- Status transition (folder move) ---
      if (args.status !== undefined && args.status !== currentStatus) {
        if (!isValidTransition(currentStatus, args.status)) {
          return `Error: Invalid status transition '${currentStatus}' → '${args.status}'.\n\nAllowed transitions:\n- pending → in_progress\n- in_progress → done\n- in_progress → pending`;
        }

        const newPath = await movePlanFolder(
          context.directory,
          args.plan_id,
          currentStatus,
          args.status as PlanStatus,
        );

        currentPath = newPath;
        currentStatus = args.status as PlanStatus;
        updateMessages.push(
          `Status changed: ${location.status} → ${args.status} (folder moved)`,
        );
      }

      // --- Update spec.md ---
      if (args.spec !== undefined) {
        const specMarkdown = generateSpecMarkdown(args.spec);
        await Bun.write(join(currentPath, "spec.md"), specMarkdown);
        updateMessages.push("spec.md updated");
      }

      // --- Update plan.md ---
      if (args.plan !== undefined) {
        // Validate duplicate task names
        const duplicates = validateUniqueTaskNames(args.plan);
        if (duplicates.length > 0) {
          return `Error: Duplicate task names found. Task names must be unique across all phases.\n\nDuplicates: ${duplicates.join(", ")}`;
        }

        const planMarkdown = generatePlanMarkdown(args.plan);
        await Bun.write(join(currentPath, "plan.md"), planMarkdown);
        updateMessages.push("plan.md updated");
      }

      // --- Batch Update Tasks ---
      if (args.taskUpdates && args.taskUpdates.length > 0) {
        const planFilePath = join(currentPath, "plan.md");
        const planFile = Bun.file(planFilePath);

        if (!(await planFile.exists())) {
          return "Error: plan.md not found. Cannot update tasks without a plan file.";
        }

        let planContent = await planFile.text();
        const taskErrors: string[] = [];

        for (const update of args.taskUpdates) {
          try {
            planContent = updateTaskStatus(
              planContent,
              update.content,
              update.status,
            );
            updateMessages.push(`Task "${update.content}" → ${update.status}`);
          } catch (error) {
            taskErrors.push(
              `Failed to update task "${update.content}": ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }

        // Write updated content back to file
        await Bun.write(planFilePath, planContent);

        if (taskErrors.length > 0) {
          updateMessages.push(
            `\nWarnings:\n${taskErrors.map((e) => `- ${e}`).join("\n")}`,
          );
        }
      }

      // --- Update metadata timestamp ---
      const metadata = await readMetadata(currentPath);
      const updatedMetadata: PlanMetadata = {
        ...metadata,
        status: currentStatus,
        updated_at: new Date().toISOString(),
      };
      await writeMetadata(currentPath, updatedMetadata);

      // Build response
      const changesList = updateMessages.map((m) => `- ${m}`).join("\n");

      return `✓ Plan updated successfully!

**Plan ID:** ${args.plan_id}
**Status:** ${currentStatus}
**Updated:** ${updatedMetadata.updated_at}

**Changes:**
${changesList}`;
    } catch (error) {
      return `Error updating plan: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});
