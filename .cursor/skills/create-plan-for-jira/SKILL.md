---
name: create-plan-for-jira
description: Creates a plan to address a Jira issue. Use it when the user wants you to suggest how to address an issue or implement a feature.
disable-model-invocation: true
---

# Create plan for Jira

## Overview

Creates a plan describing how to fix or implement the specified Jira issue or refine an existing one

## Inputs

A Jira issue ID matching the pattern: `ECOPROJECT-\d+`

## Steps

1. Use the `jira_get_issue` tool to fetch the issue details; always pay attention to linked issues (parent and child issues) to understand the full context of the task.
2. Search for an existing plan matching the issue ID, if more than one is found ask the user which one should be refined.
3. Understand the root cause before making changes.
4. Use TDD as part of the refactor strategy.
5. Create a plan describing how to address the issue following project conventions.

- Use the issue ID to name the plan file (e.g.: ECOPROJECT-1234.plan.md).

5. Create a git branch, use the issue ID as branch name (e.g.: ECOPROJECT-1234).
6. Wait for user approval or refinement.
7. After refactor is done:

- Validate code quality using the `/validate` skill. Fix any outstanding issues.
- Create a pull request using the `/create-pull-request` skill.
