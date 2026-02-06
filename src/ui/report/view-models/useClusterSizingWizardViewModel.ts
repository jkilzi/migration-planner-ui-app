import { ResponseError } from "@migration-planner-ui/api-client/runtime";
import { useInjection } from "@migration-planner-ui/ioc";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useAsyncFn } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import {
  DEFAULT_FORM_VALUES,
  WORKER_NODE_PRESETS,
} from "../views/cluster-sizer/constants";
import type {
  ClusterRequirementsResponse,
  SizingFormValues,
} from "../views/cluster-sizer/types";
import { formValuesToRequest } from "../views/cluster-sizer/types";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface ClusterSizingWizardViewModel {
  formValues: SizingFormValues;
  setFormValues: (v: SizingFormValues) => void;
  sizerOutput: ClusterRequirementsResponse | null;
  isCalculating: boolean;
  calculateError: Error | undefined;
  calculate: () => Promise<void>;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useClusterSizingWizardViewModel = (
  assessmentId: string,
  clusterId: string,
): ClusterSizingWizardViewModel => {
  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  useSyncExternalStore(
    assessmentsStore.subscribe.bind(assessmentsStore),
    assessmentsStore.getSnapshot.bind(assessmentsStore),
  );

  const [formValues, setFormValues] =
    useState<SizingFormValues>(DEFAULT_FORM_VALUES);
  const [sizerOutput, setSizerOutput] =
    useState<ClusterRequirementsResponse | null>(null);

  const [calculateState, doCalculate] = useAsyncFn(async () => {
    // Get worker node CPU and memory based on preset or custom values
    const workerCpu =
      formValues.workerNodePreset !== "custom"
        ? WORKER_NODE_PRESETS[formValues.workerNodePreset].cpu
        : formValues.customCpu;
    const workerMemory =
      formValues.workerNodePreset !== "custom"
        ? WORKER_NODE_PRESETS[formValues.workerNodePreset].memoryGb
        : formValues.customMemoryGb;

    // Build the API request payload
    const clusterRequirementsRequest = formValuesToRequest(
      clusterId,
      formValues,
      workerCpu,
      workerMemory,
    );

    try {
      // POST /api/v1/assessments/{id}/cluster-requirements
      const result =
        await assessmentsStore.calculateAssessmentClusterRequirements({
          id: assessmentId,
          clusterRequirementsRequest,
        });

      setSizerOutput(result);
    } catch (err) {
      if (err instanceof ResponseError) {
        const message = await err.response.text();
        throw new Error(err.message, { cause: message });
      }
      throw err instanceof Error
        ? err
        : new Error("Failed to calculate sizing");
    }
  }, [assessmentId, assessmentsStore, clusterId, formValues]);

  const reset = useCallback(() => {
    setFormValues(DEFAULT_FORM_VALUES);
    setSizerOutput(null);
  }, []);

  return {
    formValues,
    setFormValues,
    sizerOutput,
    isCalculating: calculateState.loading,
    calculateError: calculateState.error,
    calculate: doCalculate,
    reset,
  };
};
