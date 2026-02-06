import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  useWizardContext,
  WizardFooterWrapper,
} from "@patternfly/react-core";
import React from "react";

export interface SizingInputFormWizardStepFooterProps {
  onClose: () => void;
  isLoading: boolean;
}

export const SizingInputFormWizardStepFooter: React.FC<
  SizingInputFormWizardStepFooterProps
> = ({ onClose, isLoading }) => {
  const { goToNextStep } = useWizardContext();

  const handleNext = (): void => {
    void goToNextStep();
  };

  return (
    <WizardFooterWrapper>
      <ActionList>
        <ActionListGroup>
          <ActionListItem>
            <Button
              variant="primary"
              onClick={handleNext}
              isLoading={isLoading}
              isDisabled={isLoading}
            >
              Next
            </Button>
          </ActionListItem>
        </ActionListGroup>
        <ActionListGroup>
          <ActionListItem>
            <Button variant="link" onClick={onClose} isDisabled={isLoading}>
              Cancel
            </Button>
          </ActionListItem>
        </ActionListGroup>
      </ActionList>
    </WizardFooterWrapper>
  );
};

SizingInputFormWizardStepFooter.displayName = "SizingInputFormWizardStepFooter";
