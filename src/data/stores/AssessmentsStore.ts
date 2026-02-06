import {
  type AssessmentApiInterface,
  type CalculateAssessmentClusterRequirementsRequest,
} from "@migration-planner-ui/api-client/apis";
import { type Assessment } from "@migration-planner-ui/api-client/models";
import { type InitOverrideFunction } from "@migration-planner-ui/api-client/runtime";

import { PollableStoreBase } from "../../lib/mvvm/PollableStore";
import {
  type AssessmentModel,
  createAssessmentModel,
} from "../../models/AssessmentModel";
import type { IAssessmentsStore } from "./interfaces/IAssessmentsStore";

type AssessmentListResponse =
  | Assessment[]
  | { items?: Assessment[] }
  | { assessments?: Assessment[] };

type AssessmentCreateForm = Parameters<
  AssessmentApiInterface["createAssessment"]
>[0]["assessmentForm"];
type AssessmentUpdateForm = Parameters<
  AssessmentApiInterface["updateAssessment"]
>[0]["assessmentUpdate"];

const normalizeListResponse = (
  response: AssessmentListResponse,
): Assessment[] => {
  if (Array.isArray(response)) {
    return response;
  }
  if ("items" in response && Array.isArray(response.items)) {
    return response.items;
  }
  if ("assessments" in response && Array.isArray(response.assessments)) {
    return response.assessments;
  }
  return [];
};

export class AssessmentsStore
  extends PollableStoreBase<AssessmentModel[]>
  implements IAssessmentsStore
{
  private assessments: AssessmentModel[] = [];
  private api: AssessmentApiInterface;

  constructor(api: AssessmentApiInterface) {
    super();
    this.api = api;
  }

  async list(
    sourceId?: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel[]> {
    const response = (await this.api.listAssessments(
      { sourceId },
      initOverrides,
    )) as AssessmentListResponse;
    this.assessments = normalizeListResponse(response).map(
      createAssessmentModel,
    );
    this.notify();
    return this.assessments;
  }

  getById(id: string): AssessmentModel | undefined {
    return this.assessments.find((assessment) => assessment.id === id);
  }

  async create(
    assessmentForm: AssessmentCreateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel> {
    const created = await this.api.createAssessment(
      { assessmentForm },
      initOverrides,
    );
    const model = createAssessmentModel(created);
    this.assessments = [...this.assessments, model];
    this.notify();
    return model;
  }

  async update(
    id: string,
    assessmentUpdate: AssessmentUpdateForm,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel> {
    const updated = await this.api.updateAssessment(
      { id, assessmentUpdate },
      initOverrides,
    );
    const model = createAssessmentModel(updated);
    this.assessments = this.assessments.map((assessment) =>
      assessment.id === model.id ? model : assessment,
    );
    this.notify();
    return model;
  }

  async remove(
    id: string,
    initOverrides?: RequestInit | InitOverrideFunction,
  ): Promise<AssessmentModel> {
    const deleted = await this.api.deleteAssessment({ id }, initOverrides);
    this.assessments = this.assessments.filter(
      (assessment) => assessment.id !== deleted.id,
    );
    this.notify();
    return createAssessmentModel(deleted);
  }

  calculateAssessmentClusterRequirements(
    requestParameters: CalculateAssessmentClusterRequirementsRequest,
    initOverrides?: RequestInit | InitOverrideFunction,
  ) {
    return this.api.calculateAssessmentClusterRequirements(
      requestParameters,
      initOverrides,
    );
  }

  override getSnapshot(): AssessmentModel[] {
    return this.assessments;
  }

  protected override async poll(signal: AbortSignal): Promise<void> {
    await this.list(undefined, { signal });
  }
}
