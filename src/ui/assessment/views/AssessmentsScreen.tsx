import { Bullseye, Spinner } from "@patternfly/react-core";
import React from "react";

import { useAssessmentsScreenViewModel } from "../view-models/useAssessmentsScreenViewModel";
import AssessmentPage from "./Assessment";

export const AssessmentsScreen: React.FC = () => {
  const { assessments, isLoading, hasInitialLoad, rvtoolsOpenToken } =
    useAssessmentsScreenViewModel();

  // Show loading only before the first successful assessments fetch
  if (isLoading && !hasInitialLoad) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  // Always show assessment component
  return (
    <AssessmentPage
      assessments={assessments}
      isLoading={isLoading}
      rvtoolsOpenToken={rvtoolsOpenToken}
    />
  );
};
AssessmentsScreen.displayName = "AssessmentsScreen";
