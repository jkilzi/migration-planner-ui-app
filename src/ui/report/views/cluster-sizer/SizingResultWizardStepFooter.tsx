import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  useWizardContext,
  WizardFooterWrapper,
} from "@patternfly/react-core";
import React from "react";

export interface SizingResultWizardStepFooterProps {
  onClose: () => void;
}

export const SizingResultWizardStepFooter: React.FC<
  SizingResultWizardStepFooterProps
> = ({ onClose }) => {
  const { goToPrevStep } = useWizardContext();

  return (
    <WizardFooterWrapper>
      <ActionList>
        <ActionListGroup>
          <ActionListItem>
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </ActionListItem>
        </ActionListGroup>
        <ActionListGroup>
          <ActionListItem>
            <Button
              variant="link"
              onClick={() => {
                void goToPrevStep();
              }}
            >
              Back
            </Button>
          </ActionListItem>
        </ActionListGroup>
      </ActionList>
    </WizardFooterWrapper>
  );
};

SizingResultWizardStepFooter.displayName = "SizingResultWizardStepFooter";
