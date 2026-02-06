/**
 * Mock data for ClusterRequirementsRequest payload
 *
 * API Endpoint: POST /api/v1/assessments/{id}/cluster-requirements
 * @see PR #819 - ECOPROJECT-3719 | feat: add post endpoint for sizing calculations
 * @see ECOPROJECT-3967 - CPU and memory overcommit specified individually
 */
import type { ClusterRequirementsRequest } from "../../types";

/**
 * Default mock request with medium-sized worker nodes
 */
export const mockClusterRequirementsRequest: ClusterRequirementsRequest = {
  clusterId: "71cfef2c-5c64-4a0a-8238-2f7fbb2f6372",
  cpuOverCommitRatio: "1:4",
  memoryOverCommitRatio: "1:4",
  workerNodeCPU: 16,
  workerNodeMemory: 64,
  controlPlaneSchedulable: false,
};

/**
 * Mock request with small worker nodes (minimal configuration)
 */
export const mockSmallNodeRequest: ClusterRequirementsRequest = {
  clusterId: "123e4567-e89b-12d3-a456-426614174000",
  cpuOverCommitRatio: "1:2",
  memoryOverCommitRatio: "1:2",
  workerNodeCPU: 4,
  workerNodeMemory: 16,
  controlPlaneSchedulable: false,
};

/**
 * Mock request with large worker nodes (high-capacity configuration)
 */
export const mockLargeNodeRequest: ClusterRequirementsRequest = {
  clusterId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  cpuOverCommitRatio: "1:6",
  memoryOverCommitRatio: "1:4",
  workerNodeCPU: 64,
  workerNodeMemory: 256,
  controlPlaneSchedulable: false,
};

/**
 * Mock request with custom worker nodes and control plane scheduling enabled
 */
export const mockCustomNodeWithControlPlaneRequest: ClusterRequirementsRequest =
  {
    clusterId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    cpuOverCommitRatio: "1:1",
    memoryOverCommitRatio: "1:1",
    workerNodeCPU: 32,
    workerNodeMemory: 128,
    controlPlaneSchedulable: true,
  };

/**
 * Mock request with maximum allowed values
 */
export const mockMaxValuesRequest: ClusterRequirementsRequest = {
  clusterId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  cpuOverCommitRatio: "1:6",
  memoryOverCommitRatio: "1:4",
  workerNodeCPU: 200,
  workerNodeMemory: 512,
  controlPlaneSchedulable: true,
};

/**
 * Mock request with minimum allowed values
 */
export const mockMinValuesRequest: ClusterRequirementsRequest = {
  clusterId: "b2a7e4b6-91f4-4be7-bfcb-043dee7e50e9",
  cpuOverCommitRatio: "1:1",
  memoryOverCommitRatio: "1:1",
  workerNodeCPU: 2,
  workerNodeMemory: 4,
  controlPlaneSchedulable: false,
};

/**
 * Factory function to create a custom mock request
 */
export const createMockClusterRequirementsRequest = (
  overrides: Partial<ClusterRequirementsRequest> = {},
): ClusterRequirementsRequest => ({
  clusterId: overrides.clusterId ?? mockClusterRequirementsRequest.clusterId,
  cpuOverCommitRatio:
    overrides.cpuOverCommitRatio ??
    mockClusterRequirementsRequest.cpuOverCommitRatio,
  memoryOverCommitRatio:
    overrides.memoryOverCommitRatio ??
    mockClusterRequirementsRequest.memoryOverCommitRatio,
  workerNodeCPU:
    overrides.workerNodeCPU ?? mockClusterRequirementsRequest.workerNodeCPU,
  workerNodeMemory:
    overrides.workerNodeMemory ??
    mockClusterRequirementsRequest.workerNodeMemory,
  controlPlaneSchedulable:
    overrides.controlPlaneSchedulable ??
    mockClusterRequirementsRequest.controlPlaneSchedulable,
});

/**
 * Collection of CPU over-commit ratio variants for testing (memory fixed at 1:4)
 */
export const mockRequestsByCpuOvercommitRatio: Record<
  ClusterRequirementsRequest["cpuOverCommitRatio"],
  ClusterRequirementsRequest
> = {
  "1:1": createMockClusterRequirementsRequest({
    cpuOverCommitRatio: "1:1",
    memoryOverCommitRatio: "1:4",
  }),
  "1:2": createMockClusterRequirementsRequest({
    cpuOverCommitRatio: "1:2",
    memoryOverCommitRatio: "1:4",
  }),
  "1:4": createMockClusterRequirementsRequest({
    cpuOverCommitRatio: "1:4",
    memoryOverCommitRatio: "1:4",
  }),
  "1:6": createMockClusterRequirementsRequest({
    cpuOverCommitRatio: "1:6",
    memoryOverCommitRatio: "1:4",
  }),
};
