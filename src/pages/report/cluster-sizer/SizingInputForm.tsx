import React from 'react';

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
} from '@patternfly/react-core';

import { CPU_OPTIONS, MEMORY_OPTIONS, OVERCOMMIT_OPTIONS } from './constants';
import PopoverIcon from './PopoverIcon';
import type { OvercommitRatio, SizingFormValues } from './types';

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
      workerNodePreset: 'custom',
      customCpu: parseInt(cpu, 10),
    });
  };

  const handleMemoryChange = (
    _event: React.FormEvent<HTMLSelectElement>,
    memory: string,
  ): void => {
    onChange({
      ...values,
      workerNodePreset: 'custom',
      customMemoryGb: parseInt(memory, 10),
    });
  };

  const handleOvercommitChange = (
    _event: React.FormEvent<HTMLSelectElement>,
    ratio: string,
  ): void => {
    onChange({
      ...values,
      overcommitRatio: parseInt(ratio, 10) as OvercommitRatio,
    });
  };

  return (
    <Form>
      <Grid>
        <GridItem span={8}>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h2">Migration preferences</Title>
            </StackItem>

            {/* Run workloads on control plane nodes - checkbox */}
            <StackItem>
              <Checkbox
                id="control-plane-scheduling"
                label={
                  <>
                    {'Run workloads on control plane nodes'}{' '}
                    <PopoverIcon
                      noVerticalAlign
                      bodyContent={
                        'Enable this to use spare capacity on control plane nodes for your workloads. This reduces the total number of nodes needed but may impact cluster management stability.'
                      }
                    />
                  </>
                }
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

            {/* Overcommitment (CPU & memory) */}
            <StackItem>
              <FormGroup
                label="Overcommitment (CPU & memory)"
                isRequired
                fieldId="overcommit-ratio"
                labelHelp={
                  <PopoverIcon
                    noVerticalAlign
                    headerContent="Overcommitment (CPU & memory)"
                    bodyContent="The ratio of virtual resources to physical resources. Higher ratios allow more VMs but may impact performance if all VMs peak at once. Example: At 1:4, you can run 400 virtual CPUs on 100 physical cores."
                  />
                }
              >
                <FormSelect
                  id="overcommit-ratio"
                  value={String(values.overcommitRatio)}
                  onChange={handleOvercommitChange}
                  aria-label="Overcommitment ratio"
                >
                  {OVERCOMMIT_OPTIONS.map((option) => (
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

SizingInputForm.displayName = 'SizingInputForm';

export default SizingInputForm;
