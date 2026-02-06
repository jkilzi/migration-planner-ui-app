import type {
  Assessment,
  Snapshot,
  Source,
} from "@migration-planner-ui/api-client/models";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type AssessmentModel,
  createAssessmentModel,
} from "../../../../models/AssessmentModel";
import {
  createSourceModel,
  type SourceModel,
} from "../../../../models/SourceModel";
import { useAssessmentDetailsViewModel } from "../useAssessmentDetailsViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockId = "a-1";
let assessmentsData: AssessmentModel[];
let sourcesData: SourceModel[];
let assessmentsListeners: Set<() => void>;
let sourcesListeners: Set<() => void>;

let mockAssessmentsStore: {
  list: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
};

let mockSourcesStore: {
  list: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
  getSnapshot: ReturnType<typeof vi.fn>;
};

vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: mockId }),
}));

vi.mock("react-use", () => ({
  useMount: (fn: () => void) => fn(),
}));

vi.mock("@migration-planner-ui/ioc", () => ({
  useInjection: (symbol: symbol) => {
    const key = symbol.description;
    if (key === "AssessmentsStore") return mockAssessmentsStore;
    if (key === "SourcesStore") return mockSourcesStore;
    throw new Error(`Unexpected symbol: ${String(symbol)}`);
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeAssessment = (overrides: Partial<Assessment> = {}): AssessmentModel =>
  createAssessmentModel({
    id: "a-1",
    name: "Test",
    sourceId: "s-1",
    snapshots: [],
    ...overrides,
  } as Assessment);

const makeSource = (overrides: Partial<Source> = {}): SourceModel =>
  createSourceModel({
    id: "s-1",
    name: "test-source",
    agent: { status: "up-to-date" },
    ...overrides,
  } as Source);

const setAssessmentsData = (data: AssessmentModel[]): void => {
  assessmentsData = data;
  assessmentsListeners.forEach((fn) => fn());
};

const setSourcesData = (data: SourceModel[]): void => {
  sourcesData = data;
  sourcesListeners.forEach((fn) => fn());
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAssessmentDetailsViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockId = "a-1";
    assessmentsData = [];
    sourcesData = [];
    assessmentsListeners = new Set();
    sourcesListeners = new Set();

    mockAssessmentsStore = {
      list: vi.fn().mockResolvedValue([]),
      subscribe: vi.fn((listener: () => void) => {
        assessmentsListeners.add(listener);
        return () => assessmentsListeners.delete(listener);
      }),
      getSnapshot: vi.fn(() => assessmentsData),
    };

    mockSourcesStore = {
      list: vi.fn().mockResolvedValue([]),
      subscribe: vi.fn((listener: () => void) => {
        sourcesListeners.add(listener);
        return () => sourcesListeners.delete(listener);
      }),
      getSnapshot: vi.fn(() => sourcesData),
    };
  });

  it("returns isLoading: true when no assessments", () => {
    const { result } = renderHook(() => useAssessmentDetailsViewModel());
    expect(result.current.isLoading).toBe(true);
  });

  it("calls list() on both stores on mount when empty", () => {
    renderHook(() => useAssessmentDetailsViewModel());
    expect(mockAssessmentsStore.list).toHaveBeenCalledTimes(1);
    expect(mockSourcesStore.list).toHaveBeenCalledTimes(1);
  });

  it("does NOT call list() when stores already have data", () => {
    const assessment = makeAssessment();
    const source = makeSource();
    assessmentsData = [assessment];
    sourcesData = [source];

    renderHook(() => useAssessmentDetailsViewModel());

    expect(mockAssessmentsStore.list).not.toHaveBeenCalled();
    expect(mockSourcesStore.list).not.toHaveBeenCalled();
  });

  it("returns correct assessment matching the route id", () => {
    const assessment = makeAssessment({ id: "a-1" });
    const source = makeSource();
    act(() => {
      setAssessmentsData([assessment]);
      setSourcesData([source]);
    });

    const { result } = renderHook(() => useAssessmentDetailsViewModel());
    expect(result.current.assessment).toEqual(assessment);
  });

  it("returns undefined assessment when no match", () => {
    mockId = "nonexistent";
    const assessment = makeAssessment({ id: "a-1" });
    act(() => {
      setAssessmentsData([assessment]);
      setSourcesData([makeSource()]);
    });

    const { result } = renderHook(() => useAssessmentDetailsViewModel());
    expect(result.current.assessment).toBeUndefined();
  });

  it("resolves source from assessment's sourceId", () => {
    const assessment = makeAssessment({ sourceId: "s-1" });
    const source = makeSource({ id: "s-1" });
    act(() => {
      setAssessmentsData([assessment]);
      setSourcesData([source]);
    });

    const { result } = renderHook(() => useAssessmentDetailsViewModel());
    expect(result.current.source).toEqual(source);
  });

  it("returns undefined source when assessment has no sourceId", () => {
    const assessment = makeAssessment({ sourceId: undefined });
    const source = makeSource();
    act(() => {
      setAssessmentsData([assessment]);
      setSourcesData([source]);
    });

    const { result } = renderHook(() => useAssessmentDetailsViewModel());
    expect(result.current.source).toBeUndefined();
  });

  it("returns the agent from the source", () => {
    const agent = { status: "up-to-date" } as Source["agent"];
    const assessment = makeAssessment({ sourceId: "s-1" });
    const source = makeSource({ id: "s-1", agent });
    act(() => {
      setAssessmentsData([assessment]);
      setSourcesData([source]);
    });

    const { result } = renderHook(() => useAssessmentDetailsViewModel());
    expect(result.current.agent).toEqual(agent);
  });

  it("returns default latest SnapshotData when no assessment", () => {
    const { result } = renderHook(() => useAssessmentDetailsViewModel());
    expect(result.current.latest).toEqual({
      hosts: "-",
      vms: "-",
      networks: "-",
      datastores: "-",
      lastUpdated: "-",
    });
  });

  it("returns snapshotsSorted from assessment model", () => {
    const snapshots = [
      {
        createdAt: new Date("2024-01-02").toISOString(),
        inventory: { vcenterId: "vc-1", clusters: {} },
      } as unknown as Snapshot,
    ];
    const assessment = makeAssessment({ snapshots });
    const source = makeSource();
    act(() => {
      setAssessmentsData([assessment]);
      setSourcesData([source]);
    });

    const { result } = renderHook(() => useAssessmentDetailsViewModel());
    expect(result.current.snapshotsSorted).toEqual(assessment.snapshotsSorted);
  });
});
