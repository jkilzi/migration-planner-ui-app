import {
  Alert,
  Button,
  EmptyState as PFEmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  StackItem,
} from "@patternfly/react-core";
import { ExclamationCircleIcon, SearchIcon } from "@patternfly/react-icons";
import React, { useCallback, useState } from "react";

import { useEnvironmentPage } from "../view-models/EnvironmentPageContext";
import { DiscoverySourceSetupModal } from "./DiscoverySourceSetupModal";

export const EmptyState: React.FC = () => {
  const vm = useEnvironmentPage();

  const [
    shouldShowDiscoverySourceSetupModal,
    setShouldShowDiscoverySetupModal,
  ] = useState(false);

  const toggleDiscoverySourceSetupModal = useCallback((): void => {
    setShouldShowDiscoverySetupModal((lastState) => {
      if (lastState === true) {
        void vm.listSources();
      }
      return !lastState;
    });
  }, [vm]);

  const handleTryAgain = useCallback(() => {
    if (!vm.isLoadingSources) {
      void vm.listSources();
    }
  }, [vm]);

  const [isOvaDownloading, setIsOvaDownloading] = useState(false);

  let emptyStateNode: React.ReactNode = (
    <PFEmptyState
      headingLevel="h4"
      icon={SearchIcon}
      titleText="No environments found"
      variant="sm"
    >
      <EmptyStateBody>
        Begin by adding an environment, then download and import the OVA file
        into your VMware environment.
      </EmptyStateBody>

      <EmptyStateFooter>
        <EmptyStateActions>
          <Button variant="secondary" onClick={toggleDiscoverySourceSetupModal}>
            Add environment
          </Button>
        </EmptyStateActions>
        <StackItem>
          {isOvaDownloading && (
            <Alert isInline variant="info" title="Download OVA image">
              The OVA image is downloading
            </Alert>
          )}
        </StackItem>
      </EmptyStateFooter>
    </PFEmptyState>
  );

  if (vm.errorLoadingSources) {
    emptyStateNode = (
      <PFEmptyState
        headingLevel="h4"
        icon={ExclamationCircleIcon}
        titleText="Something went wrong..."
        variant="sm"
      >
        <EmptyStateBody>
          An error occurred while attempting to detect existing discovery
          sources
        </EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="link" onClick={handleTryAgain}>
              Try again
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </PFEmptyState>
    );
  }

  return (
    <>
      {emptyStateNode}
      {shouldShowDiscoverySourceSetupModal && (
        <DiscoverySourceSetupModal
          isOpen={shouldShowDiscoverySourceSetupModal}
          onClose={toggleDiscoverySourceSetupModal}
          isDisabled={vm.isDownloadingSource}
          onStartDownload={() => setIsOvaDownloading(true)}
          onAfterDownload={async () => {
            await vm.listSources();
          }}
        />
      )}
    </>
  );
};

EmptyState.displayName = "SourcesTableEmptyState";
