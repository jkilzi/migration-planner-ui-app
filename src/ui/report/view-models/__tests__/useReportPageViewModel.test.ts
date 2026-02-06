import type {
  Assessment,
  Host,
  Infra,
  InventoryData,
  Source,
  VMResourceBreakdown,
  VMs,
} from "@migration-planner-ui/api-client/models";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSourceModel } from "../../../../models/SourceModel";
import { useReportPageViewModel } from "../useReportPageViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock react-router-dom
let mockRouteId = "assessment-1";
vi.mock("react-router-dom", () => ({
  useParams: () => ({ id: mockRouteId }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-use
const mountCallbacks: (() => void)[] = [];
vi.mock("react-use", () => ({
  useMount: vi.fn((cb: () => void) => {
    mountCallbacks.push(cb);
    cb();
  }),
  useAsyncFn: vi.fn(
    (
      fn: (...args: unknown[]) => Promise<unknown>,
      _deps: unknown[],
    ): [
      { loading: boolean; error?: Error; value?: unknown },
      (...args: unknown[]) => Promise<unknown>,
    ] => {
      // Simple implementation: return initial state and the function itself
      const state = { loading: false, error: undefined, value: undefined };
      return [state, fn];
    },
  ),
}));

// Mock DI
const mockAssessmentsStore = {
  subscribe: vi.fn(() => () => {}),
  getSnapshot: vi.fn((): Assessment[] => []),
  list: vi.fn().mockResolvedValue([]),
  getById: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
};

const mockSourcesStore = {
  subscribe: vi.fn(() => () => {}),
  getSnapshot: vi.fn(() => []),
  list: vi.fn().mockResolvedValue([]),
  getById: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
};

const idleExportState = { loadingState: "idle" as const, error: null };

const mockReportStore = {
  subscribe: vi.fn(() => () => {}),
  getSnapshot: vi.fn(() => idleExportState),
  exportPdf: vi.fn().mockResolvedValue(undefined),
  exportHtml: vi.fn().mockResolvedValue(undefined),
  clearError: vi.fn(),
};

vi.mock("@migration-planner-ui/ioc", () => ({
  useInjection: vi.fn((symbol: symbol) => {
    const key = symbol.description;
    if (key === "AssessmentsStore") return mockAssessmentsStore;
    if (key === "SourcesStore") return mockSourcesStore;
    if (key === "ReportStore") return mockReportStore;
    throw new Error(`Unknown symbol: ${String(symbol)}`);
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const emptyBreakdown: VMResourceBreakdown = {
  total: 0,
  totalForMigratable: 0,
  totalForMigratableWithWarnings: 0,
  totalForNotMigratable: 0,
};

const createInfra = (totalHosts: number, hostsCount = 0): Infra => ({
  clustersPerDatacenter: [],
  hosts: Array(hostsCount).fill({}) as Host[],
  totalHosts,
  hostPowerStates: {},
  networks: [],
  datastores: [],
});

const createVMs = (total: number): VMs => ({
  os: { Linux: total },
  total,
  totalMigratable: total,
  cpuCores: { ...emptyBreakdown, total },
  ramGB: { ...emptyBreakdown, total: total * 4 },
  diskGB: emptyBreakdown,
  diskCount: emptyBreakdown,
  diskSizeTier: {},
  diskTypes: {},
  nicCount: emptyBreakdown,
  migrationWarnings: [],
  notMigratableReasons: [],
  powerStates: {},
  distributionByCpuTier: {},
  distributionByMemoryTier: {},
});

const createAssessment = (
  id: string,
  clusterData?: { [key: string]: InventoryData },
): Assessment => {
  const aggregateInfra = clusterData
    ? Object.values(clusterData).reduce(
        (acc, cluster) => {
          const ci = cluster.infra as Infra | undefined;
          if (ci) {
            acc.totalHosts += ci.totalHosts || 0;
            acc.hosts = [...acc.hosts, ...(ci.hosts || [])];
          }
          return acc;
        },
        { ...createInfra(0, 0), hosts: [] as Host[] },
      )
    : createInfra(5, 5);

  const aggregateVms = clusterData
    ? Object.values(clusterData).reduce((acc, cluster) => {
        const cv = cluster.vms as VMs | undefined;
        if (cv) {
          acc.total += cv.total || 0;
          acc.totalMigratable += cv.totalMigratable || 0;
        }
        return acc;
      }, createVMs(0))
    : createVMs(10);

  return {
    id,
    name: `Assessment ${id}`,
    sourceId: "source-1",
    sourceType: "vcenter" as unknown as Assessment["sourceType"],
    createdAt: new Date(),
    snapshots: [
      {
        createdAt: new Date(),
        inventory: {
          vcenterId: "vcenter-1",
          clusters: clusterData ?? {},
          vcenter: {
            infra: aggregateInfra,
            vms: aggregateVms,
          },
        },
      },
    ],
  };
};

const mockSource = createSourceModel({
  id: "source-1",
  name: "Test Source",
  createdAt: new Date(),
  updatedAt: new Date(),
  onPremises: false,
  agent: {
    id: "agent-1",
    status: "up-to-date" as unknown as NonNullable<Source["agent"]>["status"],
    statusInfo: "",
    credentialUrl: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    version: "",
  },
} as Source);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useReportPageViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mountCallbacks.length = 0;
    mockRouteId = "assessment-1";
    mockAssessmentsStore.getSnapshot.mockReturnValue([]);
    mockSourcesStore.getSnapshot.mockReturnValue([]);
    mockSourcesStore.getById.mockReturnValue(undefined);
  });

  it("exposes the route assessment ID", () => {
    const { result } = renderHook(() => useReportPageViewModel());
    expect(result.current.assessmentId).toBe("assessment-1");
  });

  it("returns undefined assessment when store has no matching assessment", () => {
    mockAssessmentsStore.getSnapshot.mockReturnValue([]);
    const { result } = renderHook(() => useReportPageViewModel());
    expect(result.current.assessment).toBeUndefined();
  });

  it("finds assessment by ID from the store snapshot", () => {
    const assessment = createAssessment("assessment-1");
    mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

    const { result } = renderHook(() => useReportPageViewModel());
    expect(result.current.assessment).toBeDefined();
    expect(result.current.assessment?.name).toBe("Assessment assessment-1");
  });

  it("fetches data on mount when assessments are empty", () => {
    mockAssessmentsStore.getSnapshot.mockReturnValue([]);
    renderHook(() => useReportPageViewModel());

    // useMount triggers and calls the fetch fn
    expect(mockAssessmentsStore.list).toHaveBeenCalled();
    expect(mockSourcesStore.list).toHaveBeenCalled();
  });

  it("resolves source from the assessment's sourceId", () => {
    const assessment = createAssessment("assessment-1");
    mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);
    mockSourcesStore.getById.mockReturnValue(mockSource);

    const { result } = renderHook(() => useReportPageViewModel());
    expect(result.current.source).toBe(mockSource);
    expect(mockSourcesStore.getById).toHaveBeenCalledWith("source-1");
  });

  it("returns undefined source when assessment has no sourceId", () => {
    const assessment = {
      ...createAssessment("assessment-1"),
      sourceId: undefined,
    };
    mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

    const { result } = renderHook(() => useReportPageViewModel());
    expect(result.current.source).toBeUndefined();
  });

  describe("cluster selection", () => {
    it("auto-selects first cluster when clusters are present", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(2, 2), vms: createVMs(5) },
        "Cluster-B": { infra: createInfra(3, 3), vms: createVMs(7) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.selectedClusterId).toBe("Cluster-A");
    });

    it("defaults to 'all' when no clusters exist", () => {
      const assessment = createAssessment("assessment-1");
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.selectedClusterId).toBe("all");
    });

    it("allows selecting a different cluster", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(2, 2), vms: createVMs(5) },
        "Cluster-B": { infra: createInfra(3, 3), vms: createVMs(7) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.selectedClusterId).toBe("Cluster-A");

      act(() => {
        result.current.selectCluster("Cluster-B");
      });

      expect(result.current.selectedClusterId).toBe("Cluster-B");
    });
  });

  describe("cluster view model", () => {
    it("builds aggregate view when selectedClusterId is 'all'", () => {
      const assessment = createAssessment("assessment-1");
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.clusterView.isAggregateView).toBe(true);
      expect(result.current.clusterView.selectionId).toBe("all");
    });

    it("builds per-cluster view when a specific cluster is selected", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(2, 2), vms: createVMs(5) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      // Auto-selects first cluster
      expect(result.current.clusterView.isAggregateView).toBe(false);
      expect(result.current.clusterView.selectionId).toBe("Cluster-A");
    });
  });

  describe("scoped cluster view", () => {
    it("returns undefined when data is missing (no infra/vms)", () => {
      mockAssessmentsStore.getSnapshot.mockReturnValue([]);
      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.scopedClusterView).toBeUndefined();
    });

    it("returns scoped view when cluster has infra, vms, cpuCores, ramGB", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(2, 2), vms: createVMs(5) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.scopedClusterView).toBeDefined();
      expect(result.current.scopedClusterView?.viewInfra).toBeDefined();
      expect(result.current.scopedClusterView?.viewVms).toBeDefined();
    });
  });

  describe("resource checks", () => {
    it("canShowClusterRecommendations is true when cluster has hosts and VMs", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(2, 2), vms: createVMs(5) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.canShowClusterRecommendations).toBe(true);
    });

    it("canShowClusterRecommendations is false on aggregate view", () => {
      const assessment = createAssessment("assessment-1");
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      // Default is "all" (aggregate)
      expect(result.current.canShowClusterRecommendations).toBe(false);
    });

    it("canExportReport is true when cluster has hosts and VMs", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(2, 2), vms: createVMs(5) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.canExportReport).toBe(true);
    });

    it("canExportReport is false when cluster has no hosts", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(0, 0), vms: createVMs(5) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.canExportReport).toBe(false);
    });
  });

  describe("export", () => {
    it("starts with null exportError and not exporting", () => {
      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.exportError).toBeNull();
      expect(result.current.isExporting).toBe(false);
      expect(result.current.exportLoadingLabel).toBeNull();
    });

    it("clearExportError delegates to store.clearError()", () => {
      const { result } = renderHook(() => useReportPageViewModel());

      act(() => {
        result.current.clearExportError();
      });

      expect(mockReportStore.clearError).toHaveBeenCalledTimes(1);
    });

    it("exportPdf delegates to store.exportPdf()", () => {
      const { result } = renderHook(() => useReportPageViewModel());
      const mockContainer = document.createElement("div");

      act(() => {
        result.current.exportPdf(mockContainer);
      });

      expect(mockReportStore.exportPdf).toHaveBeenCalledTimes(1);
      expect(mockReportStore.exportPdf).toHaveBeenCalledWith(
        mockContainer,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ documentTitle: expect.any(String) }),
      );
    });

    it("exportHtml delegates to store.exportHtml()", () => {
      const { result } = renderHook(() => useReportPageViewModel());

      act(() => {
        result.current.exportHtml();
      });

      expect(mockReportStore.exportHtml).toHaveBeenCalledTimes(1);
    });
  });

  describe("sizing wizard", () => {
    it("starts with isSizingWizardOpen = false", () => {
      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.isSizingWizardOpen).toBe(false);
    });

    it("toggles sizing wizard open state", () => {
      const { result } = renderHook(() => useReportPageViewModel());

      act(() => {
        result.current.setIsSizingWizardOpen(true);
      });
      expect(result.current.isSizingWizardOpen).toBe(true);

      act(() => {
        result.current.setIsSizingWizardOpen(false);
      });
      expect(result.current.isSizingWizardOpen).toBe(false);
    });
  });

  describe("cluster select open state", () => {
    it("starts with isClusterSelectOpen = false", () => {
      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.isClusterSelectOpen).toBe(false);
    });

    it("toggles cluster select", () => {
      const { result } = renderHook(() => useReportPageViewModel());

      act(() => {
        result.current.setClusterSelectOpen(true);
      });
      expect(result.current.isClusterSelectOpen).toBe(true);
    });
  });

  describe("clusterSelectDisabled", () => {
    it("returns true when there is 1 or fewer cluster options", () => {
      // No clusters → only "all" option → length 1
      const assessment = createAssessment("assessment-1");
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.clusterSelectDisabled).toBe(true);
    });

    it("returns false when there are multiple cluster options", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(2, 2), vms: createVMs(5) },
        "Cluster-B": { infra: createInfra(3, 3), vms: createVMs(7) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.clusterSelectDisabled).toBe(false);
    });
  });

  describe("computed data", () => {
    it("extracts infra and vms from latest snapshot", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(2, 2), vms: createVMs(5) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      // Per-cluster selection extracts cluster-level infra/vms
      expect(result.current.infra).toBeDefined();
      expect(result.current.vms).toBeDefined();
    });

    it("computes clusterCount from clusters map", () => {
      const assessment = createAssessment("assessment-1", {
        "Cluster-A": { infra: createInfra(2, 2), vms: createVMs(5) },
        "Cluster-B": { infra: createInfra(3, 3), vms: createVMs(7) },
      });
      mockAssessmentsStore.getSnapshot.mockReturnValue([assessment]);

      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.clusterCount).toBe(2);
    });

    it("returns clusterCount 0 when no clusters", () => {
      mockAssessmentsStore.getSnapshot.mockReturnValue([]);
      const { result } = renderHook(() => useReportPageViewModel());
      expect(result.current.clusterCount).toBe(0);
    });
  });
});
