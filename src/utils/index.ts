/**
 * Utility functions for the OpenPlan Manager plugin.
 *
 * This module re-exports all utility functions organized by category.
 */

// String utilities
export { toKebabCase } from "./kebab-case";

// Date utilities
export { formatDate } from "./date";

// Plan ID utilities
export { generatePlanId } from "./plan-id";

// Metadata utilities
export { readMetadata, writeMetadata, validateMetadata } from "./metadata";

// Plan content utilities
export {
	parseTasks,
	updateTaskStatus,
	calculateProgress,
	validateUniqueTaskNames,
} from "./plan-content";

// Markdown generation utilities
export { generateSpecMarkdown, generatePlanMarkdown } from "./markdown";

// Path utilities
export {
	getPlanPaths,
	ensurePlanDirectories,
	resolvePlanFolder,
	listPlanFolders,
	movePlanFolder,
} from "./paths";
