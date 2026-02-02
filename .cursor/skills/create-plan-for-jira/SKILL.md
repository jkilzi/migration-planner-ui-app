---
name: create-plan-for-jira
description: Creates a plan to address a Jira issue. Use it when the user wants you to suggest how to address an issue or implement a feature.
disable-model-invocation: true
---

# Create plan for Jira

## Overview

Creates a plan describing how to fix or implement the specified Jira issue or refine an existing one

## Prerequisites

- Cursor must be in Plan mode (user can switch via Shift+Tab or the mode selector in the UI)
- The `kubev2v` remote must be configured (typically as `upstream` or `kubev2v`)

If not in Plan mode, ask the user: "Please switch to Plan mode (Shift+Tab) so I can create a properly registered plan."

## Inputs

A Jira issue ID matching the pattern: `ECOPROJECT-\d+`

## Authentication Blockers

The agent cannot perform operations requiring user credentials. For these operations, provide ready-to-use commands for the user to copy-paste:

- **GPG-signed commits**: User's private key requires a passphrase
- **Git push**: May require GitHub authentication
- **GitHub PR creation**: MCP token may lack upstream repo permissions

Always prepare complete commands so the user can execute them directly.

## Steps

### Phase 1: Planning (Plan Mode)

1. Use `jira_get_issue` to fetch the issue details; always pay attention to linked issues (parent and child issues) to understand the full context of the task.
2. Search for an existing plan matching the issue ID. If more than one is found, ask the user which one should be refined.
3. Understand the root cause before making changes.
4. Use TDD as part of the implementation strategy.
5. Create a plan describing how to address the issue:
   - If not already in Plan mode, ask the user to switch to Plan mode (Shift+Tab or via Cursor UI)
   - The Plan name must contain the issue ID and a short summary, e.g.: `ECOPROJECT-3871 | fix: Default report view to first cluster`
   - Cursor will automatically register the plan when created in Plan mode
6. Wait for user approval or refinement of the plan.

### Phase 2: Implementation (Agent Mode)

7. After user approves the plan and switches to Agent mode:
   - Create a git branch based on `kubev2v/master` (see "Branch Creation" below)
   - **Transition the Jira issue to "In Progress"** (see Jira Integration below)
8. Implement the changes following the approved plan.
9. After implementation is done:
   - Run validation (see "Validation Targets" below)
   - Fix any outstanding issues
   - Create a pull request using the `/create-pull-request` skill

## Branch Creation

**Important**: Always base the new branch on the upstream `kubev2v/master` to ensure it includes the latest changes.

### Steps

1. Fetch the latest from kubev2v remote:

   ```bash
   git fetch kubev2v
   ```

2. Create and checkout the branch based on `kubev2v/master`:
   ```bash
   git checkout -b <TICKET-ID> kubev2v/master
   ```

### Example

```bash
git fetch kubev2v && git checkout -b ECOPROJECT-1234 kubev2v/master
```

> **Note**: If the remote is named differently (e.g., `upstream`), adjust accordingly. Use `git remote -v` to check available remotes.

## Validation Targets

The `make validate-all` target runs all quality checks, but individual targets can be run selectively based on context:

| Target            | Command              | When to Run                                                                                |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| **lint**          | `make lint`          | Always - after any code changes                                                            |
| **format**        | `make format`        | Always - after any code changes                                                            |
| **type-check**    | `make type-check`    | Always - after any code changes                                                            |
| **test**          | `make test`          | Always - after any code changes                                                            |
| **security-scan** | `make security-scan` | Only when dependencies change (package.json/package-lock.json modified) or before final PR |

### Recommended validation workflow

**During development:**

```bash
make lint format type-check test
```

**Before creating PR** (or if dependencies changed):

```bash
make validate-all
```

### Auto-fix options

- `FIX=1 make lint` - Auto-fix ESLint issues
- `FIX=1 make format` - Auto-format code with Prettier

## Jira Integration

### Transition to "In Progress" when starting implementation

The "In Progress" transition ID is: **`31`**

Use `jira_transition_issue` tool:

```json
{
  "issue_key": "<TICKET-ID>",
  "transition_id": "31",
  "comment": "Starting implementation"
}
```

### Fallback: Find transition ID dynamically

If the transition fails (ID changed or not available for current status), use `jira_get_transitions` to find the correct ID:

```json
{
  "issue_key": "<TICKET-ID>"
}
```

Then look for the transition named "In Progress" in the response and use that ID.

## Workflow Checkpoints

Track progress through these phases:

- [ ] Cursor is in Plan mode
- [ ] Jira issue fetched and analyzed
- [ ] Plan created and registered by Cursor
- [ ] User approved plan
- [ ] Switched to Agent mode
- [ ] Fetched latest from kubev2v remote
- [ ] Branch created from kubev2v/master
- [ ] Jira issue transitioned to "In Progress"
- [ ] Implementation complete
- [ ] Tests pass
- [ ] Validation passes
- [ ] User committed (manual - provide command)
- [ ] User pushed (manual - provide command)
- [ ] PR created (manual - provide command)
- [ ] PR URL recorded
- [ ] Jira issue updated with PR URL
- [ ] Jira issue transitioned to "Code Review"
