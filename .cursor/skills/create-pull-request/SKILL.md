---
name: create-pull-request
description: Create pull request. Use when the user asks to create a pull request after some refactor.
disable-model-invocation: true
---

# Create Pull Request

Create a pull request for the current changes.

## Steps

1. Look ONLY at staged changes with `git diff --cached`
2. Run the following subagents in parallel:
   1. Validator Agent: Runs `make validate-all` to ensure code quality checks pass
   2. Reviewer Agent: Performs a code review.
3. Write a commit message following the format:
   - Title: One line with format: `<ticket-id> | <type>: <description>`, where <ticket-id> has the regex pattern: `ECOPROJECT-\d+`, and <type> is one of: types: build, chore, ci, docs, feat, fix, perf, refactor, style, test
   - If no JIRA ticket is provided, use this format: `NO-JIRA | <type>: <description>`
   - Keep the <description> part short.
   - Message: a bullet-list summarizing the changes
4. Commit signing off the commit with the `-s` flag
5. Push to the current branch
6. Use `gh pr create` to open a pull request with:
   - The commit title (the first line)
   - The commit description (the rest of the commit message)
   - (Optional) Screenshots if UI changes were made
7. Display the PR URL when done
