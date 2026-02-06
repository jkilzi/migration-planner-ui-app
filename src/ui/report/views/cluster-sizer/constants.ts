import type {
  HAReplicaCount,
  MemoryOvercommitRatio,
  OvercommitRatio,
  SizingFormValues,
  WorkerNodePreset,
} from "./types";

/**
 * Worker node size presets with CPU and memory configurations
 */
export const WORKER_NODE_PRESETS: Record<
  Exclude<WorkerNodePreset, "custom">,
  { cpu: number; memoryGb: number; label: string; description: string }
> = {
  small: {
    cpu: 16,
    memoryGb: 64,
    label: "Small (16 CPU / 64 GB)",
    description: "Suitable for lightweight workloads",
  },
  medium: {
    cpu: 64,
    memoryGb: 256,
    label: "Medium (64 CPU / 256 GB)",
    description: "Balanced for general purpose workloads",
  },
  large: {
    cpu: 200,
    memoryGb: 512,
    label: "Large (200 CPU / 512 GB)",
    description: "For demanding, resource-intensive workloads",
  },
};

/**
 * CPU options for worker nodes (matching Figma design)
 */
export const CPU_OPTIONS: { value: number; label: string }[] = [
  { value: 16, label: "16" },
  { value: 32, label: "32" },
  { value: 64, label: "64" },
  { value: 128, label: "128" },
  { value: 200, label: "200" },
];

/**
 * Memory options for worker nodes in GB (matching Figma design)
 */
export const MEMORY_OPTIONS: { value: number; label: string }[] = [
  { value: 32, label: "32" },
  { value: 64, label: "64" },
  { value: 128, label: "128" },
  { value: 256, label: "256" },
  { value: 512, label: "512" },
];

/**
 * CPU over-commit ratio options for resource sharing
 */
export const CPU_OVERCOMMIT_OPTIONS: {
  value: OvercommitRatio;
  label: string;
  description: string;
  helpText: string;
}[] = [
  {
    value: 1,
    label: "Performance (1:1)",
    description: "No sharing. Dedicated power for every VM.",
    helpText: "Best for latency-sensitive or critical workloads.",
  },
  {
    value: 2,
    label: "Balanced (1:2)",
    description: "Light sharing. Safe for critical apps.",
    helpText: "Good balance between cost and performance.",
  },
  {
    value: 4,
    label: "Standard (1:4)",
    description: "Moderate sharing. Best for general use.",
    helpText:
      'Example: At 1:4, you can run 400 "virtual" CPUs on 100 "physical" cores.',
  },
  {
    value: 6,
    label: "High Density (1:6)",
    description: "Heavy sharing. Maximum savings for test environments.",
    helpText: "Only recommended for non-production workloads.",
  },
];

/**
 * Memory over-commit ratio options (1:6 not supported by API)
 */
export const MEMORY_OVERCOMMIT_OPTIONS: {
  value: MemoryOvercommitRatio;
  label: string;
  description: string;
  helpText: string;
}[] = [
  {
    value: 1,
    label: "Performance (1:1)",
    description: "No sharing. Dedicated memory for every VM.",
    helpText: "Best for latency-sensitive or critical workloads.",
  },
  {
    value: 2,
    label: "Balanced (1:2)",
    description: "Light sharing. Safe for critical apps.",
    helpText: "Good balance between cost and performance.",
  },
  {
    value: 4,
    label: "Standard (1:4)",
    description: "Moderate sharing. Best for general use.",
    helpText: "Typical choice for general purpose workloads.",
  },
];

/**
 * High availability configuration options
 */
export const HA_OPTIONS: {
  value: HAReplicaCount;
  label: string;
  description: string;
  helpText: string;
}[] = [
  {
    value: 1,
    label: "Development",
    description: "Low cost; no protection against crashes.",
    helpText: "Single replica - suitable for development and testing only.",
  },
  {
    value: 2,
    label: "Production",
    description: "Reliable; stays online if one node fails.",
    helpText: "Two replicas provide basic high availability.",
  },
  {
    value: 3,
    label: "Critical",
    description: "Maximum uptime; safe during updates and failures.",
    helpText: "Three replicas ensure availability during maintenance windows.",
  },
];

/**
 * Control plane scheduling options
 */
export const CONTROL_PLANE_OPTIONS = {
  yes: {
    label: "Yes",
    description:
      "Lower cost. Uses spare capacity on management nodes for your VMs.",
  },
  no: {
    label: "No",
    description:
      "Higher stability. Keeps cluster management isolated from your app workloads.",
  },
};

/**
 * Default form values (matching Figma design defaults)
 */
export const DEFAULT_FORM_VALUES: SizingFormValues = {
  workerNodePreset: "custom",
  customCpu: 32,
  customMemoryGb: 32,
  haReplicas: 3,
  cpuOvercommitRatio: 4, // Standard (1:4)
  memoryOvercommitRatio: 2, // Balanced (1:2)
  scheduleOnControlPlane: false,
};

/**
 * Validation constraints for custom worker node configuration
 */
export const WORKER_NODE_CONSTRAINTS = {
  cpu: {
    min: 2,
    max: 200,
    step: 2,
  },
  memory: {
    min: 4,
    max: 512,
    step: 4,
  },
};

/**
 * Form field labels and help text
 */
export const FORM_LABELS = {
  workerNodeSize: {
    label: "Worker Node Size",
    description:
      "Choose the CPU and memory for each node. Small nodes spread out risk, so a single failure affects fewer VMs. Large nodes are more efficient and reduce the total number of servers you need to manage.",
  },
  highAvailability: {
    label: "High Availability Configuration",
    description:
      "Choose how many copies of your services to run. Multiple replicas ensure your applications stay online even if a node fails or needs maintenance.",
  },
  overcommit: {
    label: "Resource Sharing",
    description:
      "Save money by letting VMs share physical hardware. High sharing reduces costs but can slow things down if all VMs peak at once.",
  },
  controlPlane: {
    label: "Share Management Nodes",
    description:
      "Allow your VMs to run on the same nodes that manage the cluster. This reduces the total number of servers you need.",
  },
};
