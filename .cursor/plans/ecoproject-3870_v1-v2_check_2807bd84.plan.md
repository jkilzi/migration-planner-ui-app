---
name: ECOPROJECT-3870 v1-v2 check
overview: Refine snapshot validation to distinguish v2 inventory by clusters presence/value, and fall back to v1 legacy fields when clusters is missing or null, plus update tests.
todos:
  - id: update-validation
    content: Refine v2/v1 detection using clusters property
    status: completed
  - id: update-tests
    content: Update snapshotParser tests for v2/v1 cases
    status: completed
  - id: sanity-check
    content: Confirm AssessmentsTable uses hasUsefulData
    status: completed
---

# Plan

## Context

- `hasUsefulData()` in [`src/pages/assessment/utils/snapshotParser.ts`](src/pages/assessment/utils/snapshotParser.ts) decides whether report actions are enabled.
- Legacy v1 payloads (see `old-inventory-scheme.json`) contain `inventory.infra` and `inventory.vms` but no `inventory.clusters`.
- You confirmed v2 should be detected only when `inventory` has its own `clusters` property and its value is not `null`/`undefined`.

## Approach

1. Update `hasUsefulData()` to explicitly detect v2 vs v1:

- Compute `hasClustersProp = inventory && Object.prototype.hasOwnProperty.call(inventory, 'clusters')`.
- If `hasClustersProp` and `inventory.clusters != null`, treat as v2 and return `true` (clusters exists, even if empty).
- Otherwise, treat as v1 and return `true` only if any legacy fields exist: `inventory.infra`, `inventory.vms`, `inventory.vcenter.infra`, `inventory.vcenter.vms`, `snapshot.infra`, or `snapshot.vms`.

2. Update tests in [`src/pages/assessment/utils/snapshotParser.test.ts`](src/pages/assessment/utils/snapshotParser.test.ts) to cover:

- v2: clusters present and non-null → `true`
- v2: clusters present but null → fall back to v1 check
- v1: `inventory.infra`/`inventory.vms` present without clusters → `true` (matches example JSON)
- latest snapshot without any of these fields → `false`

3. Ensure `AssessmentsTable` continues to use `hasUsefulData()` as the single gate for enabling report actions (no additional code changes expected).

## Files to change

- [`src/pages/assessment/utils/snapshotParser.ts`](src/pages/assessment/utils/snapshotParser.ts)
- [`src/pages/assessment/utils/snapshotParser.test.ts`](src/pages/assessment/utils/snapshotParser.test.ts)