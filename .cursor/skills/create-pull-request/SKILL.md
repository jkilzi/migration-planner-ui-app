---
name: create-pull-request
description: Create pull request. Use when the user asks to create a pull request after some refactor.
disable-model-invocation: true
---

# Create Pull Request

Create a pull request for the current changes.

## Authentication Blockers

The agent cannot perform operations requiring user credentials:

- **GPG-signed commits**: Requires user's passphrase
- **Git push**: May require GitHub authentication
- **GitHub PR creation (upstream)**: MCP token may lack permissions

For these operations, provide ready-to-use commands for the user to copy-paste.

## Steps

1. Check git status to see staged and unstaged changes
2. Run `make validate-all` to ensure code quality checks pass. Fix any issues before proceeding.
3. Stage all relevant files with `git add -A`
4. Write a commit message following the format below.
5. **Provide commit command to user** (do not attempt to execute)
6. Wait for user to confirm commit is done
7. **Provide push command to user**
8. Wait for user to confirm push is done
9. **Provide PR creation command to user**
10. Ask user to share the PR URL when created
11. **Update Jira issue with PR URL and transition to Code Review** (see Jira Integration below)

## Commit Message Format

**Title**: `<ticket-id> | <type>: <description>`

- `<ticket-id>`: matches pattern `ECOPROJECT-\d+`
- `<type>`: one of: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `style`, `test`
- If no JIRA ticket: `NO-JIRA | <type>: <description>`

**Body**: bullet-list summarizing the changes (use `-` prefix)

> **Important**: Do NOT use conventional commit format like `fix(scope):`. Always use `TICKET-ID | type:` format.

### Commit command template

```bash
git add -A && git commit -s -m '<ticket-id> | <type>: <description>

- Change 1
- Change 2
- Change 3'
```

> Note: The `-s` flag adds a Signed-off-by line (required).

### Push command template

```bash
git push -u origin <branch-name>
```

### PR creation command template

Use heredoc syntax to avoid shell escaping issues:

```bash
gh pr create --repo kubev2v/migration-planner-ui-app \
  --title "<ticket-id> | <type>: <description>" \
  --body "$(cat <<'EOF'
## Summary

- Change 1
- Change 2

Fixes [<TICKET-ID>](https://issues.redhat.com/browse/<TICKET-ID>)

## Test Plan

- [ ] Test step 1
- [ ] Test step 2
EOF
)"
```

## Jira Integration

After the PR is created, update the Jira issue:

### 1. Update the Jira issue with the PR URL

The "Git Pull Request" custom field ID is: **`customfield_12310220`**

Use `jira_update_issue` tool:

```json
{
  "issue_key": "<TICKET-ID>",
  "fields": {
    "customfield_12310220": "<PR-URL>"
  }
}
```

### 2. Fallback: Add as Web Link

If the custom field update fails (field removed or changed), add the PR as a remote issue link:

```json
{
  "issue_key": "<TICKET-ID>",
  "url": "<PR-URL>",
  "title": "Pull Request #<PR-NUMBER>",
  "summary": "<PR-TITLE>",
  "relationship": "pull request",
  "icon_url": "https://github.githubassets.com/favicons/favicon.svg"
}
```

### 3. Transition the issue to "Code Review"

The "Code Review" transition ID is: **`61`**

Use `jira_transition_issue` tool:

```json
{
  "issue_key": "<TICKET-ID>",
  "transition_id": "61",
  "comment": "PR created: <PR-URL>"
}
```

### 4. Fallback: Find transition ID dynamically

If the transition fails (ID changed or not available for current status), use `jira_get_transitions` to find the correct ID:

```json
{
  "issue_key": "<TICKET-ID>"
}
```

Then look for the transition named "Code Review" in the response and use that ID.

### Example Jira Update Flow

```
1. jira_update_issue(
     issue_key="ECOPROJECT-1234",
     fields={"customfield_12310220": "https://github.com/kubev2v/migration-planner-ui-app/pull/371"}
   )

   If this fails, fallback to:

   jira_create_remote_issue_link(
     issue_key="ECOPROJECT-1234",
     url="https://github.com/kubev2v/migration-planner-ui-app/pull/371",
     title="Pull Request #371",
     summary="ECOPROJECT-1234 | fix: Default report view to first cluster",
     relationship="pull request",
     icon_url="https://github.githubassets.com/favicons/favicon.svg"
   )

2. jira_transition_issue(
     issue_key="ECOPROJECT-1234",
     transition_id="61",
     comment="PR created: https://github.com/kubev2v/migration-planner-ui-app/pull/371"
   )

   If this fails, fallback to:

   jira_get_transitions(issue_key="ECOPROJECT-1234")
   → Find "Code Review" in response, then retry with correct ID
```
