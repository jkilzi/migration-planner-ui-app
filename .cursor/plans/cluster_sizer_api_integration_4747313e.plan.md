---
name: Cluster Sizer API Integration
overview: Integrate the ClusterSizingWizard with the real AssessmentApi by replacing mock data with the calculateAssessmentClusterRequirements endpoint, using the existing DI container pattern.
todos:
  - id: update-types
    content: Update types.ts to re-export API types from api-client and keep only UI-specific types
    status: completed
  - id: update-wizard
    content: Update ClusterSizingWizard to use AssessmentApi via DI container instead of mocks
    status: completed
  - id: update-result
    content: Add null checks in SizingResult for optional resourceConsumption fields
    status: completed
  - id: cleanup-report
    content: Remove unused onCalculate prop from ClusterSizingWizard usage in Report.tsx
    status: completed
  - id: remove-ha-text
    content: "Remove \"High Availability: Yes\" text from SizingResult component"
    status: completed
  - id: update-default-overcommit
    content: Change default overcommit ratio from 1:6 to 1:4 in constants.ts
    status: completed
---

# Cluster Sizer API Integration Plan

## Overview

The `@migration-planner-ui/api-client` package now includes the `calculateAssessmentClusterRequirements` method in `AssessmentApi` along with the `ClusterRequirementsRequest` and `ClusterRequirementsResponse` types. The wizard will use the existing DI pattern (`useInjection` hook) to access the API.

## Key Files

- [`src/pages/report/cluster-sizer/ClusterSizingWizard.tsx`](src/pages/report/cluster-sizer/ClusterSizingWizard.tsx) - Main component to update
- [`src/pages/report/cluster-sizer/types.ts`](src/pages/report/cluster-sizer/types.ts) - Replace API types with api-client imports
- [`src/pages/report/cluster-sizer/SizingResult.tsx`](src/pages/report/cluster-sizer/SizingResult.tsx) - Add null checks for optional fields
- [`src/main/Symbols.ts`](src/main/Symbols.ts) - Already has `AssessmentApi` symbol registered

## API Details

The api-client provides:

- `AssessmentApi.calculateAssessmentClusterRequirements({ id, clusterRequirementsRequest })`
- Returns `ClusterRequirementsResponse` with `clusterSizing`, `resourceConsumption`, and `inventoryTotals`

Note: `resourceConsumption.limits` and `resourceConsumption.overCommitRatio` are optional in the api-client types.

## Implementation Steps

### 1. Update types.ts

Remove duplicate API types and re-export from api-client:

```typescript
// Re-export API types from api-client
export type {
  ClusterRequirementsRequest,
  ClusterRequirementsResponse,
  ClusterSizing,
  InventoryTotals,
  SizingResourceConsumption,
} from '@migration-planner-ui/api-client/models';

// Keep UI-specific types (SizingFormValues, WorkerNodePreset, etc.)
```

### 2. Update ClusterSizingWizard.tsx

- Import `useInjection` from `@migration-planner-ui/ioc`
- Import `AssessmentApi` from `@migration-planner-ui/api-client/apis`
- Import `Symbols` from `@/main/Symbols`
- Remove `fetchMockClusterRequirements` import
- Remove `onCalculate` prop (no longer needed)
- Use `assessmentApi.calculateAssessmentClusterRequirements()` directly
```typescript
const assessmentApi = useInjection<AssessmentApi>(Symbols.AssessmentApi);

const result = await assessmentApi.calculateAssessmentClusterRequirements({
  id: assessmentId,
  clusterRequirementsRequest: request,
});
```


### 3. Update SizingResult.tsx

Add null checks for optional API response fields:

```typescript
sizerOutput.resourceConsumption.overCommitRatio?.cpu ?? 0
sizerOutput.resourceConsumption.limits?.cpu ?? 0
```

### 4. Clean up Report.tsx

Remove the unused `onCalculate` prop from `ClusterSizingWizard` usage.

### 5. Remove "High Availability: Yes" from SizingResult

Remove the hardcoded "High Availability: Yes" text from both:

- The `generatePlainTextRecommendation` function (clipboard copy text)
- The JSX render section in `SizingResult.tsx`

### 6. Change default overcommit ratio

In [`src/pages/report/cluster-sizer/constants.ts`](src/pages/report/cluster-sizer/constants.ts), update `DEFAULT_FORM_VALUES.overcommitRatio` from `6` (High Density 1:6) to `4` (Standard 1:4).

### 7. Mock files decision

Keep `src/pages/report/cluster-sizer/mocks/` folder for unit testing purposes, but remove the runtime dependency on `data.mock.ts`.