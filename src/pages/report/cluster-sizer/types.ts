/**
 * Cluster Sizer Types
 *
 * UI-specific types for the cluster sizing wizard.
 * API types are re-exported from @migration-planner-ui/api-client.
 *
 * @see ECOPROJECT-3631
 */

import {
  type ClusterRequirementsRequest,
  ClusterRequirementsRequestOverCommitRatioEnum,
} from '@migration-planner-ui/api-client/models';

// Re-export API types from api-client
export type {
  ClusterRequirementsRequest,
  ClusterRequirementsResponse,
  ClusterSizing,
  InventoryTotals,
  SizingOverCommitRatio,
  SizingResourceConsumption,
  SizingResourceLimits,
} from '@migration-planner-ui/api-client/models';

/**
 * Worker node size preset options
 */
export type WorkerNodePreset = 'small' | 'medium' | 'large' | 'custom';

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
 * Wizard step identifiers
 */
export type WizardStep = 'input' | 'result';

/**
 * Mapping from numeric over-commit ratio to API enum value
 */
const OVERCOMMIT_RATIO_MAP: Record<
  OvercommitRatio,
  ClusterRequirementsRequest['overCommitRatio']
> = {
  1: ClusterRequirementsRequestOverCommitRatioEnum.OneToOne,
  2: ClusterRequirementsRequestOverCommitRatioEnum.OneToTwo,
  4: ClusterRequirementsRequestOverCommitRatioEnum.OneToFour,
  6: ClusterRequirementsRequestOverCommitRatioEnum.OneToSix,
};

/**
 * Helper function to convert numeric over-commit ratio to API enum format
 */
export const overcommitRatioToApiEnum = (
  ratio: OvercommitRatio,
): ClusterRequirementsRequest['overCommitRatio'] => {
  return OVERCOMMIT_RATIO_MAP[ratio];
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
  overCommitRatio: overcommitRatioToApiEnum(values.overcommitRatio),
  workerNodeCPU: workerCpu,
  workerNodeMemory: workerMemory,
  controlPlaneSchedulable: values.scheduleOnControlPlane,
});
