import {
  Alert,
  Button,
  Content,
  Flex,
  FlexItem,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
  Spinner,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import { CopyIcon } from "@patternfly/react-icons";
import React, { useCallback, useMemo } from "react";

import { CPU_OVERCOMMIT_OPTIONS, MEMORY_OVERCOMMIT_OPTIONS } from "./constants";
import type { ClusterRequirementsResponse, SizingFormValues } from "./types";

const DISCLAIMER_TEXT =
  "Note: Resource requirements are estimates based on current workloads. Please verify this architecture with your SME team to ensure optimal performance.";

interface SizingResultProps {
  clusterName: string;
  formValues: SizingFormValues;
  sizerOutput: ClusterRequirementsResponse | null;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Format a number with locale-specific thousands separators
 */
const formatNumber = (value: number): string => value.toLocaleString();

/**
 * Format a ratio value
 */
const formatRatio = (value: number): string => value.toFixed(2);

/**
 * Get the CPU over-commit ratio label
 */
const getCpuOvercommitLabel = (ratio: number): string => {
  const option = CPU_OVERCOMMIT_OPTIONS.find((opt) => opt.value === ratio);
  return option?.label || `1:${ratio}`;
};

/**
 * Get the memory over-commit ratio label
 */
const getMemoryOvercommitLabel = (ratio: number): string => {
  const option = MEMORY_OVERCOMMIT_OPTIONS.find((opt) => opt.value === ratio);
  return option?.label || `1:${ratio}`;
};

/**
 * Generate the plain text recommendation for clipboard copy
 */
const generatePlainTextRecommendation = (
  clusterName: string,
  formValues: SizingFormValues,
  output: ClusterRequirementsResponse,
): string => {
  const cpuOverCommitRatio =
    output.resourceConsumption.overCommitRatio?.cpu ?? 0;
  const memoryOverCommitRatio =
    output.resourceConsumption.overCommitRatio?.memory ?? 0;
  const cpuLimits = output.resourceConsumption.limits?.cpu ?? 0;
  const memoryLimits = output.resourceConsumption.limits?.memory ?? 0;

  return `
Cluster: ${clusterName}
Total Nodes: ${output.clusterSizing.totalNodes} (${output.clusterSizing.workerNodes} workers + ${output.clusterSizing.controlPlaneNodes} control plane)
Node Size: ${formValues.customCpu} CPU / ${formValues.customMemoryGb} GB

Additional info
Target Platform: BareMetal
Over-Commitment: CPU ${getCpuOvercommitLabel(formValues.cpuOvercommitRatio)}, Memory ${getMemoryOvercommitLabel(formValues.memoryOvercommitRatio)}
VMs to Migrate: ${formatNumber(output.inventoryTotals.totalVMs)} VMs
- CPU Over-Commit Ratio: ${formatRatio(cpuOverCommitRatio)}
- Memory Over-Commit Ratio: ${formatRatio(memoryOverCommitRatio)}
Resource Breakdown
VM Resources (requested): ${formatNumber(output.inventoryTotals.totalCPU)} CPU / ${formatNumber(output.inventoryTotals.totalMemory)} GB
With Over-commit (limits): ${formatNumber(cpuLimits)} CPU / ${formatNumber(memoryLimits)} GB
Physical Capacity: ${formatNumber(output.clusterSizing.totalCPU)} CPU / ${formatNumber(output.clusterSizing.totalMemory)} GB

${DISCLAIMER_TEXT}
`.trim();
};

export const SizingResult: React.FC<SizingResultProps> = ({
  clusterName,
  formValues,
  sizerOutput,
  isLoading = false,
  error = null,
}) => {
  const plainTextRecommendation = useMemo(() => {
    if (!sizerOutput) return "";
    return generatePlainTextRecommendation(
      clusterName,
      formValues,
      sizerOutput,
    );
  }, [clusterName, formValues, sizerOutput]);

  const handleCopyRecommendations = useCallback(() => {
    void navigator.clipboard.writeText(plainTextRecommendation).catch((err) => {
      console.error("Failed to copy recommendations:", err);
    });
  }, [plainTextRecommendation]);

  if (isLoading) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Flex
            alignItems={{ default: "alignItemsCenter" }}
            justifyContent={{ default: "justifyContentCenter" }}
            style={{ minHeight: "200px" }}
          >
            <FlexItem>
              <Spinner size="lg" aria-label="Loading recommendations" />
            </FlexItem>
          </Flex>
        </StackItem>
      </Stack>
    );
  }

  if (error) {
    const title = "Failed to calculate sizing recommendation";
    let message = error.message;
    if (error.cause && typeof error.cause === "string") {
      try {
        const parsedCause = JSON.parse(error.cause) as { message: string };
        const m = parsedCause.message;
        const firstChar = m.charAt(0);
        message = firstChar ? firstChar.toUpperCase() + m.slice(1) : m;
      } catch {
        // Fall back to original message without crashing
      }
    }

    return (
      <Stack hasGutter>
        <StackItem>
          <Alert isInline variant="danger" title={title}>
            {message}
          </Alert>
        </StackItem>
      </Stack>
    );
  }

  if (!sizerOutput) {
    return (
      <Stack hasGutter>
        <StackItem>
          <Content>
            <Content component="p">No sizing data available.</Content>
          </Content>
        </StackItem>
      </Stack>
    );
  }

  // Extract optional fields with defaults
  const cpuOverCommitRatio =
    sizerOutput.resourceConsumption.overCommitRatio?.cpu ?? 0;
  const memoryOverCommitRatio =
    sizerOutput.resourceConsumption.overCommitRatio?.memory ?? 0;
  const cpuLimits = sizerOutput.resourceConsumption.limits?.cpu ?? 0;
  const memoryLimits = sizerOutput.resourceConsumption.limits?.memory ?? 0;

  return (
    <Panel>
      {/* Sticky Header with title and copy button */}
      <PanelHeader>
        <Flex justifyContent={{ default: "justifyContentSpaceBetween" }}>
          <FlexItem>
            <Title headingLevel="h2">Review cluster recommendations</Title>
          </FlexItem>
          <FlexItem>
            <Button
              variant="link"
              icon={<CopyIcon />}
              iconPosition="end"
              onClick={handleCopyRecommendations}
            >
              Copy recommendations
            </Button>
          </FlexItem>
        </Flex>
      </PanelHeader>

      {/* Scrollable Content */}
      <PanelMain>
        <PanelMainBody>
          <Stack hasGutter>
            {/* Main cluster info */}

            <StackItem>
              <Alert isInline variant="info" title={DISCLAIMER_TEXT} />
            </StackItem>
            <StackItem>
              <Content>
                <Content>
                  <strong>Cluster:</strong> {clusterName}
                </Content>
                <Content>
                  <strong>
                    Total Nodes: {sizerOutput.clusterSizing.totalNodes} (
                    {sizerOutput.clusterSizing.workerNodes} workers +{" "}
                    {sizerOutput.clusterSizing.controlPlaneNodes} control plane)
                  </strong>
                </Content>
                <Content>
                  <strong>
                    Node Size: {formValues.customCpu} CPU /{" "}
                    {formValues.customMemoryGb} GB
                  </strong>
                </Content>
              </Content>
            </StackItem>

            {/* Additional info section */}
            <StackItem>
              <Content>
                <Content>
                  <strong>Additional info</strong>
                </Content>
                <Content>Target Platform: BareMetal</Content>
                <Content>
                  Over-Commitment: CPU{" "}
                  {getCpuOvercommitLabel(formValues.cpuOvercommitRatio)}, Memory{" "}
                  {getMemoryOvercommitLabel(formValues.memoryOvercommitRatio)}
                </Content>
                <Content>
                  VMs to Migrate:{" "}
                  {formatNumber(sizerOutput.inventoryTotals.totalVMs)} VMs
                </Content>
                <Content>
                  ~ CPU Over-Commit Ratio: {formatRatio(cpuOverCommitRatio)}
                </Content>
                <Content>
                  - Memory Over-Commit Ratio:{" "}
                  {formatRatio(memoryOverCommitRatio)}
                </Content>
                <Content>Resource Breakdown</Content>
                <Content>
                  VM Resources (requested):{" "}
                  {formatNumber(sizerOutput.inventoryTotals.totalCPU)} CPU /{" "}
                  {formatNumber(sizerOutput.inventoryTotals.totalMemory)} GB
                </Content>
                <Content>
                  With Over-commit (limits): {formatNumber(cpuLimits)} CPU /{" "}
                  {formatNumber(memoryLimits)} GB
                </Content>
                <Content>
                  Physical Capacity:{" "}
                  {formatNumber(sizerOutput.clusterSizing.totalCPU)} CPU /{" "}
                  {formatNumber(sizerOutput.clusterSizing.totalMemory)} GB
                </Content>
              </Content>
            </StackItem>
          </Stack>
        </PanelMainBody>
      </PanelMain>
    </Panel>
  );
};

SizingResult.displayName = "SizingResult";

export default SizingResult;
