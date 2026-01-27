---
name: validate
description: Executes code quality checks. Use when the user asks to validate changes after a refactor or to report test coverage
disable-model-invocation: true
---

# Validate Code

Run all validation checks on the codebase.

## Steps

1. Run `make validate-all` which includes:
   - `make lint` - ESLint checks
   - `make format` - Prettier formatting check
   - `make type-check` - TypeScript type checking
   - `make security-scan` - Security vulnerability scan
   - `make test` - Runs unit tests using Vitest
2. If the user requests to report test coverage, run: `make coverage`
3. If any checks fail, but report shows some issues are fixable, always attempt the automatic fix befor applying fixes yourself.
   - For lint errors: Run `make lint FIX=1`
   - For format errors: Run `make format FIX=1`
   - For security issues ONLY with non-breaking changes: Run `make security-fix` to review and address vulnerabilities in the same run.
4. Report the results and any issues that need attention
