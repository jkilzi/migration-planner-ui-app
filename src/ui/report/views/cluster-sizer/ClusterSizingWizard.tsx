import {
  Modal,
  Wizard,
  WizardHeader,
  WizardStep,
  type WizardStepType,
} from "@patternfly/react-core";
import React, { useCallback } from "react";

import { useClusterSizingWizardViewModel } from "../../view-models/useClusterSizingWizardViewModel";
import { SizingInputForm } from "./SizingInputForm";
import { SizingInputFormWizardStepFooter } from "./SizingInputFormWizardStepFooter";
import { SizingResult } from "./SizingResult";
import { SizingResultWizardStepFooter } from "./SizingResultWizardStepFooter";

interface ClusterSizingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  clusterName: string;
  clusterId: string;
  /** Assessment ID for the API endpoint */
  assessmentId: string;
}

export const ClusterSizingWizard: React.FC<ClusterSizingWizardProps> = ({
  isOpen,
  onClose,
  clusterName,
  clusterId,
  assessmentId,
}) => {
  const vm = useClusterSizingWizardViewModel(assessmentId, clusterId);

  const handleClose = useCallback(() => {
    vm.reset();
    onClose();
  }, [onClose, vm]);

  const handleStepChange = useCallback(
    async (
      _event: React.MouseEvent<HTMLButtonElement>,
      currentStep: WizardStepType,
      _prevStep: WizardStepType,
    ): Promise<void> => {
      // Trigger calculation when entering the review step
      if (currentStep.id === "review-step") {
        await vm.calculate();
      }
    },
    [vm],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      aria-label="Cluster sizing wizard modal"
      onEscapePress={handleClose}
      variant="medium"
    >
      <Wizard
        height={700}
        onClose={handleClose}
        onStepChange={handleStepChange}
        header={
          <WizardHeader
            onClose={handleClose}
            title="Target cluster recommendations"
          />
        }
      >
        <WizardStep
          name="Migration preferences"
          id="preferences-step"
          footer={
            <SizingInputFormWizardStepFooter
              onClose={handleClose}
              isLoading={vm.isCalculating}
            />
          }
        >
          <SizingInputForm values={vm.formValues} onChange={vm.setFormValues} />
        </WizardStep>

        <WizardStep
          name="Review cluster recommendations"
          id="review-step"
          footer={<SizingResultWizardStepFooter onClose={handleClose} />}
        >
          <SizingResult
            clusterName={clusterName}
            formValues={vm.formValues}
            sizerOutput={vm.sizerOutput}
            isLoading={vm.isCalculating}
            error={vm.calculateError ?? null}
          />
        </WizardStep>
      </Wizard>
    </Modal>
  );
};

ClusterSizingWizard.displayName = "ClusterSizingWizard";

export default ClusterSizingWizard;
