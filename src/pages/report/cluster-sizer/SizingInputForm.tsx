import {
  Checkbox,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Grid,
  GridItem,
  Stack,
  StackItem,
  Title,
} from "@patternfly/react-core";
import React from "react";

import {
  CPU_OPTIONS,
  CPU_OVERCOMMIT_OPTIONS,
  MEMORY_OPTIONS,
  MEMORY_OVERCOMMIT_OPTIONS,
} from "./constants";
import PopoverIcon from "./PopoverIcon";
import type {
  MemoryOvercommitRatio,
  OvercommitRatio,
  SizingFormValues,
} from "./types";

interface SizingInputFormProps {
  values: SizingFormValues;
  onChange: (values: SizingFormValues) => void;
}

export const SizingInputForm: React.FC<SizingInputFormProps> = ({
  values,
  onChange,
}) => {
  const handleControlPlaneChange = (
    _event: React.FormEvent<HTMLInputElement>,
    checked: boolean,
  ): void => {
    onChange({ ...values, scheduleOnControlPlane: checked });
  };

  const handleCpuChange = (
    _event: React.FormEvent<HTMLSelectElement>,
    cpu: string,
  ): void => {
    onChange({
      ...values,
      workerNodePreset: "custom",
      customCpu: parseInt(cpu, 10),
    });
  };

  const handleMemoryChange = (
    _event: React.FormEvent<HTMLSelectElement>,
    memory: string,
  ): void => {
    onChange({
      ...values,
      workerNodePreset: "custom",
      customMemoryGb: parseInt(memory, 10),
    });
  };

  const handleCpuOvercommitChange = (
    _event: React.FormEvent<HTMLSelectElement>,
    ratio: string,
  ): void => {
    onChange({
      ...values,
      cpuOvercommitRatio: parseInt(ratio, 10) as OvercommitRatio,
    });
  };

  const handleMemoryOvercommitChange = (
    _event: React.FormEvent<HTMLSelectElement>,
    ratio: string,
  ): void => {
    onChange({
      ...values,
      memoryOvercommitRatio: parseInt(ratio, 10) as MemoryOvercommitRatio,
    });
  };

  return (
    <Form>
      <Grid>
        <GridItem span={12}>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h2">Migration preferences</Title>
            </StackItem>

            <StackItem>
              <Checkbox
                isLabelWrapped
                id="control-plane-scheduling"
                label="Run workloads on control plane nodes"
                isChecked={values.scheduleOnControlPlane}
                onChange={handleControlPlaneChange}
              />
            </StackItem>

            {/* Worker node CPU cores */}
            <StackItem>
              <FormGroup
                label="Worker node CPU cores"
                isRequired
                fieldId="worker-cpu"
                labelHelp={
                  <PopoverIcon
                    noVerticalAlign
                    headerContent="Worker node CPU cores"
                    bodyContent="The number of CPU cores allocated to each worker node. Choose based on your workload requirements."
                  />
                }
              >
                <FormSelect
                  id="worker-cpu"
                  value={String(values.customCpu)}
                  onChange={handleCpuChange}
                  aria-label="Worker node CPU cores"
                >
                  {CPU_OPTIONS.map((option) => (
                    <FormSelectOption
                      key={option.value}
                      value={String(option.value)}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              </FormGroup>
            </StackItem>

            {/* Worker node memory size (GB) */}
            <StackItem>
              <FormGroup
                label="Worker node memory size (GB)"
                isRequired
                fieldId="worker-memory"
                labelHelp={
                  <PopoverIcon
                    noVerticalAlign
                    headerContent="Worker node memory size"
                    bodyContent="The amount of memory in GB allocated to each worker node. Choose based on your workload requirements."
                  />
                }
              >
                <FormSelect
                  id="worker-memory"
                  value={String(values.customMemoryGb)}
                  onChange={handleMemoryChange}
                  aria-label="Worker node memory size"
                >
                  {MEMORY_OPTIONS.map((option) => (
                    <FormSelectOption
                      key={option.value}
                      value={String(option.value)}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              </FormGroup>
            </StackItem>

            {/* CPU overcommitment */}
            <StackItem>
              <FormGroup
                label="CPU overcommitment"
                isRequired
                fieldId="cpu-overcommit-ratio"
                labelHelp={
                  <PopoverIcon
                    noVerticalAlign
                    headerContent="CPU overcommitment"
                    bodyContent="The ratio of virtual CPUs to physical cores. Higher ratios allow more VMs but may impact performance if all VMs peak at once. Example: At 1:4, you can run 400 virtual CPUs on 100 physical cores."
                  />
                }
              >
                <FormSelect
                  id="cpu-overcommit-ratio"
                  value={String(values.cpuOvercommitRatio)}
                  onChange={handleCpuOvercommitChange}
                  aria-label="CPU overcommitment ratio"
                >
                  {CPU_OVERCOMMIT_OPTIONS.map((option) => (
                    <FormSelectOption
                      key={option.value}
                      value={String(option.value)}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              </FormGroup>
            </StackItem>

            {/* Memory overcommitment */}
            <StackItem>
              <FormGroup
                label="Memory overcommitment"
                isRequired
                fieldId="memory-overcommit-ratio"
                labelHelp={
                  <PopoverIcon
                    noVerticalAlign
                    headerContent="Memory overcommitment"
                    bodyContent="The ratio of virtual memory to physical memory. Higher ratios allow more VMs; memory overcommit is typically more conservative than CPU (max 1:4)."
                  />
                }
              >
                <FormSelect
                  id="memory-overcommit-ratio"
                  value={String(values.memoryOvercommitRatio)}
                  onChange={handleMemoryOvercommitChange}
                  aria-label="Memory overcommitment ratio"
                >
                  {MEMORY_OVERCOMMIT_OPTIONS.map((option) => (
                    <FormSelectOption
                      key={option.value}
                      value={String(option.value)}
                      label={option.label}
                    />
                  ))}
                </FormSelect>
              </FormGroup>
            </StackItem>
          </Stack>
        </GridItem>
      </Grid>
    </Form>
  );
};

SizingInputForm.displayName = "SizingInputForm";

export default SizingInputForm;
