/**
 * Cluster Sizer API Types
 *
 * Types for the integration between the Migration Planner UI and the sizer library.
 * The backend combines user preferences with inventory data to generate sizing recommendations.
 *
 * API Endpoint: POST /api/v1/assessments/{id}/cluster-requirements
 * @see ECOPROJECT-3631
 */

/**
 * Worker node size preset options
 */
export type WorkerNodePreset = 'small' | 'medium' | 'large' | 'custom';

/**
 * Over-commit ratio options as string representation (e.g., "1:4")
 */
export type OvercommitRatioString = '1:1' | '1:2' | '1:4' | '1:6';

/**
 * Over-commit ratio options (CPU sharing factor) - numeric value
 */
export type OvercommitRatio = 1 | 2 | 4 | 6;

/**
 * High availability replica count
 */
export type HAReplicaCount = 1 | 2 | 3;

/**
 * User input for cluster sizing configuration (form state)
 */
export interface SizingFormValues {
  /** Selected worker node size preset */
  workerNodePreset: WorkerNodePreset;
  /** Custom CPU cores per worker (when preset is 'custom') */
  customCpu: number;
  /** Custom memory in GB per worker (when preset is 'custom') */
  customMemoryGb: number;
  /** High availability replica count */
  haReplicas: HAReplicaCount;
  /** Over-commit ratio for resource sharing */
  overcommitRatio: OvercommitRatio;
  /** Whether to schedule VMs on control plane nodes */
  scheduleOnControlPlane: boolean;
}

/**
 * Request payload sent to the cluster-requirements API
 * POST /api/v1/assessments/{id}/cluster-requirements
 */
export interface ClusterRequirementsRequest {
  /** VMware cluster ID from inventory */
  clusterId: string;
  /** Over-commit ratio as string (e.g., "1:4") */
  overCommitRatio: OvercommitRatioString;
  /** Worker node CPU cores */
  workerNodeCPU: number;
  /** Worker node memory in GB */
  workerNodeMemory: number;
  /** Whether control plane nodes can schedule workloads */
  controlPlaneSchedulable: boolean;
}

/**
 * Cluster sizing section of the API response
 */
export interface ClusterSizing {
  /** Number of control plane nodes */
  controlPlaneNodes: number;
  /** Total CPU cores across the cluster */
  totalCPU: number;
  /** Total memory in GB across the cluster */
  totalMemory: number;
  /** Total number of nodes (workers + control plane) */
  totalNodes: number;
  /** Number of worker nodes */
  workerNodes: number;
}

/**
 * Inventory totals section of the API response
 */
export interface InventoryTotals {
  /** Total CPU from VM inventory */
  totalCPU: number;
  /** Total memory from VM inventory in GB */
  totalMemory: number;
  /** Total number of VMs to migrate */
  totalVMs: number;
}

/**
 * Resource consumption section of the API response
 */
export interface ResourceConsumption {
  /** CPU consumption percentage */
  cpu: number;
  /** Memory consumption percentage */
  memory: number;
  /** Resource limits */
  limits: {
    /** CPU limit */
    cpu: number;
    /** Memory limit in GB */
    memory: number;
  };
  /** Over-commit ratios */
  overCommitRatio: {
    /** CPU over-commit ratio */
    cpu: number;
    /** Memory over-commit ratio */
    memory: number;
  };
}

/**
 * Response payload from the cluster-requirements API
 */
export interface ClusterRequirementsResponse {
  /** Cluster sizing recommendation */
  clusterSizing: ClusterSizing;
  /** Inventory totals from the source VMware cluster */
  inventoryTotals: InventoryTotals;
  /** Resource consumption metrics */
  resourceConsumption: ResourceConsumption;
}

/**
 * Wizard step identifiers
 */
export type WizardStep = 'input' | 'result';

/**
 * Helper function to convert numeric over-commit ratio to string format
 */
export const overcommitRatioToString = (
  ratio: OvercommitRatio,
): OvercommitRatioString => {
  return `1:${ratio}` as OvercommitRatioString;
};

/**
 * Helper function to convert form values to API request payload
 */
export const formValuesToRequest = (
  clusterId: string,
  values: SizingFormValues,
  workerCpu: number,
  workerMemory: number,
): ClusterRequirementsRequest => ({
  clusterId,
  overCommitRatio: overcommitRatioToString(values.overcommitRatio),
  workerNodeCPU: workerCpu,
  workerNodeMemory: workerMemory,
  controlPlaneSchedulable: values.scheduleOnControlPlane,
});
