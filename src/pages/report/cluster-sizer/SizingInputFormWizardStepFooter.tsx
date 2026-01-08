import React from 'react';

import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  useWizardContext,
  WizardFooterWrapper,
} from '@patternfly/react-core';

export interface SizingInputFormWizardStepFooterProps {
  onClose: () => void;
  onCalculate: () => Promise<void>;
  isLoading: boolean;
}

export const SizingInputFormWizardStepFooter: React.FC<
  SizingInputFormWizardStepFooterProps
> = ({ onClose, onCalculate, isLoading }) => {
  const { goToNextStep } = useWizardContext();

  const handleNext = async (): Promise<void> => {
    await onCalculate();
    goToNextStep();
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

SizingInputFormWizardStepFooter.displayName = 'SizingInputFormWizardStepFooter';
