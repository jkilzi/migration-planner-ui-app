import type { CalculateAssessmentClusterRequirementsRequest } from "@migration-planner-ui/api-client/apis";
import type { ClusterRequirementsResponse } from "@migration-planner-ui/api-client/models";
import type { InitOverrideFunction } from "@migration-planner-ui/api-client/runtime";

import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";
import type { AssessmentModel } from "../../../models/AssessmentModel";

type AssessmentCreateForm = {
  name: string;
  sourceType?: string;
  sourceId?: string;
};

type AssessmentUpdateForm = {
  name?: string;
};

export interface IAssessmentsStore extends ExternalStore<AssessmentModel[]> {
  list(
    sourceId?: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel[]>;
  getById(id: string): AssessmentModel | undefined;
  create(
    assessmentForm: AssessmentCreateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  update(
    id: string,
    assessmentUpdate: AssessmentUpdateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  remove(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel>;
  calculateAssessmentClusterRequirements(
    requestParameters: CalculateAssessmentClusterRequirementsRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<ClusterRequirementsResponse>;
  startPolling(intervalMs?: number): void;
  stopPolling(): void;
}
