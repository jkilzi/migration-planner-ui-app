import { useInjection } from "@migration-planner-ui/ioc";
import { useRef, useSyncExternalStore } from "react";
import { useOutletContext } from "react-router-dom";
import { useAsyncFn, useMount, useUnmount } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import { DEFAULT_POLLING_DELAY } from "../../../lib/mvvm/PollableStore";
import type { AssessmentModel } from "../../../models/AssessmentModel";
import type { HomeScreenOutletContext } from "../../home/view-models/useHomeScreenViewModel";

export interface AssessmentsScreenViewModel {
  assessments: AssessmentModel[];
  isLoading: boolean;
  hasInitialLoad: boolean;
  rvtoolsOpenToken?: string;
}

export const useAssessmentsScreenViewModel = (): AssessmentsScreenViewModel => {
  const { rvtoolsOpenToken } = useOutletContext<HomeScreenOutletContext>();

  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  const assessments = useSyncExternalStore(
    assessmentsStore.subscribe.bind(assessmentsStore),
    assessmentsStore.getSnapshot.bind(assessmentsStore),
  );

  const hasInitialLoadRef = useRef(false);

  const [fetchState, fetchAssessments] = useAsyncFn(async () => {
    try {
      return await assessmentsStore.list();
    } finally {
      hasInitialLoadRef.current = true;
    }
  }, [assessmentsStore]);

  useMount(() => {
    void fetchAssessments();
    assessmentsStore.startPolling(DEFAULT_POLLING_DELAY);
  });

  useUnmount(() => {
    assessmentsStore.stopPolling();
  });

  return {
    assessments,
    isLoading: fetchState.loading,
    hasInitialLoad: hasInitialLoadRef.current,
    rvtoolsOpenToken,
  };
};
