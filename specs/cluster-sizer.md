# Cluster Sizer – Target Cluster Recommendations

## Overview
The Cluster Sizer feature helps users generate OpenShift cluster sizing recommendations based on their VMware inventory data and migration preferences. It presents a two-step wizard that collects user preferences and displays calculated requirements for the target OpenShift cluster.

## Related Jira Tickets
- **ECOPROJECT-3637**: Implement "Recommend me an OpenShift cluster" wizard
- **ECOPROJECT-3631**: Cluster requirements API integration (backend sizer library)

## Figma Mockups
- Configuration step: `node-id=6896-15678`
- Results step: `node-id=7181-9318`
- File: `Migration-assessment` design file

## Wizard Steps

### Step 1: Migration Preferences
Users configure their target cluster parameters:
- **Run workloads on control plane nodes** (checkbox): Whether to schedule VM workloads on control plane nodes
- **Worker node CPU cores** (dropdown, required): CPU cores per worker node (8, 16, 32, 64, 96, 128)
- **Worker node memory** (dropdown, required): Memory in GB per worker node (16, 32, 64, 128, 256, 512)
- **Over-commit ratio** (dropdown, required): Resource sharing factor (1:1, 1:2, 1:4, 1:6)
  - 1:1 = No over-commit (dedicated)
  - 1:2 = Low density
  - 1:4 = Standard density
  - 1:6 = High density

### Step 2: Review Cluster Recommendations
Displays calculated sizing based on inventory data and user preferences:
- **Inventory Summary**: Total VMs, CPU cores, and memory from source VMware cluster
- **Cluster Sizing**: Recommended worker nodes, control plane nodes, total nodes, total CPU, total memory
- **Resource Utilization**: CPU consumption %, memory consumption %, resource limits, over-commit ratios

## API Integration

### Endpoint
```
POST /api/v1/assessments/{id}/cluster-requirements
```

### Request Payload
```typescript
interface ClusterRequirementsRequest {
  clusterId: string;              // VMware cluster ID
  overCommitRatio: "1:1" | "1:2" | "1:4" | "1:6";
  workerNodeCPU: number;          // CPU cores per worker
  workerNodeMemory: number;       // Memory in GB per worker
  controlPlaneSchedulable: boolean;
}
```

### Response Payload
```typescript
interface ClusterRequirementsResponse {
  clusterSizing: {
    controlPlaneNodes: number;
    totalCPU: number;
    totalMemory: number;
    totalNodes: number;
    workerNodes: number;
  };
  inventoryTotals: {
    totalCPU: number;
    totalMemory: number;
    totalVMs: number;
  };
  resourceConsumption: {
    cpu: number;       // percentage
    memory: number;    // percentage
    limits: { cpu: number; memory: number };
    overCommitRatio: { cpu: number; memory: number };
  };
}
```

## File Structure
```
src/pages/report/cluster-sizer/
├── index.ts                  # Re-exports
├── types.ts                  # TypeScript interfaces and type definitions
├── constants.ts              # Form options (CPU, memory, over-commit dropdowns)
├── ClusterSizingWizard.tsx   # Main wizard modal component
├── SizingInputForm.tsx       # Step 1: Migration preferences form
├── SizingResult.tsx          # Step 2: Results display
└── mockData.ts               # Mock API responses for development
```

## UX Behavior Notes
- Modal title: "Target cluster recommendations"
- Default values: Control plane schedulable = false, CPU = 32, Memory = 32GB, Over-commit = 1:6
- Footer buttons:
  - Step 1: "Next" (primary) + "Cancel" (link)
  - Step 2: "Close" (primary) + "Back" (link)
- Copy to clipboard: Results can be copied as plain text for sharing
- Loading state: Shows spinner while calculating recommendations
- Error handling: Displays error message if API call fails

## Integration Point
The wizard is triggered from the Report page (`src/pages/report/Report.tsx`) via a "Get cluster sizing recommendation" button. It receives the `assessmentId` as a prop to identify which VMware cluster inventory to use.

