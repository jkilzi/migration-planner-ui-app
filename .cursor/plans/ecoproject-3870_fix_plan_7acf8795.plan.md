---
name: ECOPROJECT-3870 fix plan
overview: Adjust the assessment data validation to recognize legacy v1 inventory shapes so old assessments can open their reports without warnings or disabled actions.
todos:
  - id: update-validation
    content: Expand hasUsefulData for legacy inventory shapes
    status: completed
  - id: add-tests
    content: Add unit tests for legacy snapshots behavior
    status: completed
  - id: sanity-check
    content: Verify AssessmentsTable uses new logic for report availability
    status: completed
---

# Plan

## Context

- Current report availability is driven by `hasUsefulData()` in [`src/pages/assessment/utils/snapshotParser.ts`](src/pages/assessment/utils/snapshotParser.ts), which only checks `lastSnapshot.inventory?.clusters`.
- The attached legacy v1 inventory example (`old-inventory-scheme.json`) has useful data under `inventory.infra` and `inventory.vms` but no `inventory.clusters`, so it is incorrectly flagged as unusable.
- The report itself already handles legacy inventory shapes (`inventory.infra`, `inventory.vcenter.infra`, `snapshot.infra`, etc.) in [`src/pages/report/Report.tsx`](src/pages/report/Report.tsx).

## Approach

1. Update `hasUsefulData()` to treat a snapshot as “useful” if any legacy inventory paths are present on the latest snapshot:

- `lastSnapshot.inventory?.clusters` (current behavior)
- `lastSnapshot.inventory?.vcenter?.infra` or `lastSnapshot.inventory?.vcenter?.vms`
- `lastSnapshot.inventory?.infra` or `lastSnapshot.inventory?.vms` (matches legacy v1 JSON example)
- `lastSnapshot.infra` or `lastSnapshot.vms` (top-level legacy)

2. Keep the logic “latest snapshot only” but ensure it’s aligned with what the report can render, so old v1 assessments are no longer blocked.

3. Add unit tests for the updated behavior in a new test file (e.g., [`src/pages/assessment/utils/snapshotParser.test.ts`](src/pages/assessment/utils/snapshotParser.test.ts)):

- returns `false` with no snapshots
- returns `true` when `inventory.vcenter.infra` exists but `inventory.clusters` is missing
- returns `true` when `inventory.infra`/`inventory.vms` exist (legacy v1 example)
- returns `true` when top-level `infra`/`vms` exist
- returns `false` when latest snapshot lacks any expected inventory fields

## Notes

- This keeps the UI warnings and disabled actions tied strictly to “no usable inventory” rather than “no clusters field,” which is what breaks legacy v1 data.
- If we later decide to consider “any snapshot” (not only latest) as usable, we can extend the logic, but that’s not required to fix ECOPROJECT-3870.

## Files to change

- [`src/pages/assessment/utils/snapshotParser.ts`](src/pages/assessment/utils/snapshotParser.ts)
- [`src/pages/assessment/utils/snapshotParser.test.ts`](src/pages/assessment/utils/snapshotParser.test.ts)