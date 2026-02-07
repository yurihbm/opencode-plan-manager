# OpenCode Plan Manager

A OpenCode plugin for managing implementation plans with a **folder-per-plan** architecture. This plugin provides a structured, filesystem-based Kanban workflow for organizing development work with integrated task management and status tracking.

## Features

✨ **4 Powerful Tools:**

- `plan_create` - Create plans with structured metadata and content files
- `plan_list` - List plans with fast metadata-only reads and flexible filtering
- `plan_read` - Read plans with selective views (summary, spec, plan, full)
- `plan_update` - Update status, content, or toggle tasks with validation

🚀 **Production Ready:**

- TypeScript with full type safety
- Comprehensive test coverage (161 tests, 393 assertions)
- Fast native JSON parsing (no YAML dependencies)
- Status transition validation
- Clear, actionable error messages

📁 **Filesystem Kanban:**

- Pending plans: `.opencode/plans/pending/`
- Active plans: `.opencode/plans/in_progress/`
- Completed plans: `.opencode/plans/done/`
- Each plan is a folder with 3 files: `metadata.json`, `spec.md`, `plan.md`

## Architecture

### Folder-Per-Plan Structure

```
.opencode/plans/
  pending/
    feature_auth_20260206/
      metadata.json    ← Machine-readable state (JSON)
      spec.md          ← Requirements & acceptance criteria
      plan.md          ← Implementation tasks with checkboxes
  in_progress/
    bug_login_20260205/
      metadata.json
      spec.md
      plan.md
  done/
    refactor_db_20260120/
      metadata.json
      spec.md
      plan.md
```

### Why This Design?

1. **Performance** — `plan_list` reads only small JSON files (~200 bytes each) instead of parsing full Markdown
2. **Context Efficiency** — Selective views minimize token usage (agents can read just metadata, just spec, or just plan)
3. **Determinism** — Zod schemas enforce structure; agents cannot produce malformed plans
4. **Filesystem as State** — Changing status = moving folder (atomic, visible in file explorer)
5. **Separation of Concerns** — `spec.md` (the "what") is immutable; `plan.md` (the "how") evolves; `metadata.json` is cheap to read

### Status Lifecycle

```
pending → in_progress → done
           ↑_____________↓
          (revert allowed)
```

Valid transitions:

- `pending → in_progress` (start work)
- `in_progress → done` (complete)
- `in_progress → pending` (deprioritize/revert)

Invalid transitions:

- `pending → done` (cannot skip work)
- `done → *` (completed plans are immutable)

### Task Status Markers

Tasks in `plan.md` support 3 states:

- `- [ ] Task description` — Pending
- `- [~] Task description` — In Progress
- `- [x] Task description` — Done

## Installation

### Local Development

```bash
# Clone or copy this plugin to your OpenCode plugins directory
cp -r opencode-plan-manager ~/.config/opencode/plugins/

# Or for project-level installation
cp -r opencode-plan-manager /path/to/project/.opencode/plugins/
```

### From npm (when published)

Add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-plan-manager"]
}
```

## Usage

### Creating a Plan

```typescript
plan_create({
  title: "User Authentication System",
  type: "feature",
  description: "Implement secure JWT-based authentication with refresh tokens",
  spec: `# Requirements

## Functional Requirements
- User registration with email/password
- Login with JWT token generation
- Token refresh mechanism
- Logout (token invalidation)

## Acceptance Criteria
- [ ] Passwords hashed with bcrypt
- [ ] Tokens expire after 15 minutes
- [ ] Refresh tokens valid for 7 days`,
  implementation: `# Implementation Phases

## Phase 1: Database Schema
- [ ] Create users table
- [ ] Create refresh_tokens table
- [ ] Add indexes

## Phase 2: Authentication Logic
- [ ] Implement password hashing
- [ ] Create JWT signing/verification
- [ ] Build token refresh logic

## Phase 3: API Endpoints
- [ ] POST /auth/register
- [ ] POST /auth/login
- [ ] POST /auth/refresh
- [ ] POST /auth/logout`,
});
```

**Output:**

```
✓ Plan created successfully!

Plan ID: feature_user-authentication-system_20260206
Location: .opencode/plans/pending/feature_user-authentication-system_20260206/
Type: feature
Status: pending
Description: Implement secure JWT-based authentication with refresh tokens
Tasks: 9 (0% done)

Files created:
- metadata.json — Plan identity and state
- spec.md — Requirements and acceptance criteria
- plan.md — Phased implementation tasks

Use plan_read with plan_id "feature_user-authentication-system_20260206" to load this plan.
```

### Listing Plans

```typescript
// List active plans (pending + in_progress) — default
plan_list({ status: "active" });

// List only pending plans
plan_list({ status: "pending" });

// List only in-progress plans
plan_list({ status: "in_progress" });

// List completed plans
plan_list({ status: "done" });

// List all plans
plan_list({ status: "all" });

// Filter by type
plan_list({ status: "active", type: "feature" });
```

**Output:**

```
Found 3 plan(s):

| Plan ID | Description | Type | Status | Updated |
|----------|-------------|------|--------|---------|
| feature_user-authentication-system_20260206 | Implement secure JWT-based authentication | feature | pending | 2026-02-06T14:23:00Z |
| bug_login-crash_20260205 | Fix null pointer in login handler | bug | in_progress | 2026-02-05T10:15:00Z |
```

### Reading a Plan

```typescript
// Full view (default) — everything
plan_read({ plan_id: "feature_user-authentication-system_20260206" });

// Summary view (cheapest) — metadata + progress only
plan_read({
  plan_id: "feature_user-authentication-system_20260206",
  view: "summary",
});

// Spec view — metadata + spec.md
plan_read({
  plan_id: "feature_user-authentication-system_20260206",
  view: "spec",
});

// Plan view — metadata + plan.md + tasks
plan_read({
  plan_id: "feature_user-authentication-system_20260206",
  view: "plan",
});
```

**Output (summary view):**

```
✓ Plan loaded successfully!

Plan ID: feature_user-authentication-system_20260206
Type: feature
Status: pending
Description: Implement secure JWT-based authentication with refresh tokens
Created: 2026-02-06T14:23:00Z
Updated: 2026-02-06T14:23:00Z
Progress: 0/9 tasks done (0%) | 0 in progress | 9 pending
```

### Moving a Plan to In Progress

```typescript
plan_update({
  plan_id: "feature_user-authentication-system_20260206",
  status: "in_progress",
});
```

**Output:**

```
✓ Plan updated successfully!

Plan ID: feature_user-authentication-system_20260206
Status: in_progress
Updated: 2026-02-06T15:30:00Z

Changes:
- Status changed: pending → in_progress (folder moved)
```

### Updating a Task

```typescript
// Mark task as in progress
plan_update({
  plan_id: "feature_user-authentication-system_20260206",
  taskContent: "Create users table",
  taskStatus: "in_progress",
});

// Mark task as done
plan_update({
  plan_id: "feature_user-authentication-system_20260206",
  taskContent: "Create users table",
  taskStatus: "done",
});

// Revert task to pending
plan_update({
  plan_id: "feature_user-authentication-system_20260206",
  taskContent: "Create users table",
  taskStatus: "pending",
});
```

**Output:**

```
✓ Plan updated successfully!

Plan ID: feature_user-authentication-system_20260206
Status: in_progress
Updated: 2026-02-06T16:45:00Z

Changes:
- Task "Create users table" → done
```

### Updating Plan Content

```typescript
// Update spec.md
plan_update({
  plan_id: "feature_user-authentication-system_20260206",
  spec: `# Updated Requirements

New acceptance criteria added...`,
});

// Update plan.md
plan_update({
  plan_id: "feature_user-authentication-system_20260206",
  plan: `# Revised Implementation

Updated task breakdown...`,
});
```

### Combined Updates

```typescript
// Move to in_progress AND mark first task as started
plan_update({
  plan_id: "feature_user-authentication-system_20260206",
  status: "in_progress",
  taskContent: "Create users table",
  taskStatus: "in_progress",
});
```

### Completing a Plan

```typescript
plan_update({
  plan_id: "feature_user-authentication-system_20260206",
  status: "done",
});
```

**Output:**

```
✓ Plan updated successfully!

Plan ID: feature_user-authentication-system_20260206
Status: done
Updated: 2026-02-06T18:00:00Z

Changes:
- Status changed: in_progress → done (folder moved)
```

The plan folder is now in `.opencode/plans/done/` and is immutable.

## File Structure

### `metadata.json`

Machine-readable plan state:

```json
{
  "plan_id": "feature_user-authentication-system_20260206",
  "type": "feature",
  "status": "in_progress",
  "created_at": "2026-02-06T14:23:00Z",
  "updated_at": "2026-02-06T16:45:00Z",
  "description": "Implement secure JWT-based authentication with refresh tokens"
}
```

### `spec.md`

Requirements and acceptance criteria (immutable during implementation):

```markdown
# Requirements

## Functional Requirements

- User registration with email/password
- Login with JWT token generation

## Acceptance Criteria

- [ ] Passwords hashed with bcrypt
- [ ] Tokens expire after 15 minutes
```

### `plan.md`

Implementation tasks (evolves as work progresses):

```markdown
# Implementation Phases

## Phase 1: Database Schema

- [x] Create users table
- [~] Create refresh_tokens table
- [ ] Add indexes

## Phase 2: Authentication Logic

- [ ] Implement password hashing
- [ ] Create JWT signing/verification
```

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- TypeScript 5+

### Setup

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Build
bun build
```

### Project Structure

```
src/
├── index.ts              # Plugin entry & 4 tool definitions
├── types.ts              # TypeScript interfaces (PlanMetadata, etc.)
├── schemas.ts            # Zod schemas & transition validation
└── utils/
    ├── index.ts          # Re-exports all utilities
    ├── kebab-case.ts     # String → kebab-case conversion
    ├── date.ts           # Date formatting (ISO 8601)
    ├── plan-id.ts        # Generate deterministic plan IDs
    ├── metadata.ts       # Read/write/validate metadata.json
    ├── plan-content.ts   # Parse/update tasks in plan.md
    └── paths.ts          # 3-folder resolution & movement

tests/
├── utils/                # Unit tests for each utility
└── integration/          # End-to-end workflow tests (20 tests)
```

### Test Coverage

```bash
bun test

# Result:
# 161 pass, 0 fail
# 393 expect() calls
# 100ms execution time
```

## API Reference

### Tool: `plan_create`

**Arguments:**

- `title: string` (3-100 chars) — Plan title
- `type: "feature" | "bug" | "refactor" | "docs"` — Plan classification
- `description: string` (10-500 chars) — Short summary
- `spec: string` — Requirements content for `spec.md`
- `implementation: string` — Task breakdown for `plan.md`

**Returns:** Success message with generated `plan_id` and file locations

**Side Effects:** Creates folder in `pending/` with 3 files

---

### Tool: `plan_list`

**Arguments:**

- `status?: "pending" | "in_progress" | "done" | "active" | "all"` (default: `"active"`)
  - `"active"` = `pending` + `in_progress`
- `type?: "feature" | "bug" | "refactor" | "docs"` (optional filter)

**Returns:** Formatted table with plan_id, description, type, status, updated timestamp

**Performance:** Reads only `metadata.json` files (fast, scales to 100+ plans)

---

### Tool: `plan_read`

**Arguments:**

- `plan_id: string` — Plan folder name
- `view?: "summary" | "spec" | "plan" | "full"` (default: `"full"`)
  - `"summary"` — Metadata + progress only (cheapest)
  - `"spec"` — Metadata + `spec.md`
  - `"plan"` — Metadata + `plan.md` + parsed tasks
  - `"full"` — Everything

**Returns:** Plan content based on view mode

**Performance:**

- `summary`: ~5ms (1 JSON read)
- `spec`: ~10ms (JSON + 1 Markdown)
- `plan`: ~15ms (JSON + 1 Markdown + parsing)
- `full`: ~20ms (JSON + 2 Markdown + parsing)

---

### Tool: `plan_update`

**Arguments:** (at least one required)

- `plan_id: string` — Plan folder name
- `status?: "pending" | "in_progress" | "done"` — New status (triggers folder move)
- `spec?: string` — Replaces `spec.md` content
- `plan?: string` — Replaces `plan.md` content
- `taskContent?: string` — Task text to match (exact, without checkbox)
- `taskStatus?: "pending" | "in_progress" | "done"` — New task status (required with `taskContent`)

**Returns:** Success message with list of changes

**Validation:**

- Status transitions are validated (rejects `pending→done`, `done→*`)
- `taskContent` and `taskStatus` must be provided together
- Updates `updated_at` timestamp automatically

**Side Effects:** May move folder between status directories

## Design Principles

1. **Modular Utilities** — One file per concern, fully unit tested
2. **Type Safety** — Zod schemas enforce structure at runtime
3. **Performance** — Metadata-only reads, selective content loading
4. **Atomic Operations** — Folder moves via `rename()` (atomic on same filesystem)
5. **Clear Errors** — Actionable messages with suggestions

## Key Technologies

- **@opencode-ai/plugin** — Plugin framework (provides `tool()` wrapper)
- **zod** — Runtime schema validation
- **bun:test** — Fast, built-in test runner
- **TypeScript** — Full type safety

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`bun test`)
2. TypeScript compiles without errors (`bun build`)
3. New features include tests
4. Error messages are clear and actionable
5. Documentation is updated

## License

MIT

## Author

Built with ❤️ for the OpenCode ecosystem

---

**Need Help?** Check the [OpenCode documentation](https://opencode.ai/docs/plugins/) or open an issue.
