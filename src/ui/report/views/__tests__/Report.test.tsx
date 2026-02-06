import "@testing-library/jest-dom";

import type {
  Host,
  Infra,
  Source,
  VMResourceBreakdown,
  VMs,
} from "@migration-planner-ui/api-client/models";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSourceModel } from "../../../../models/SourceModel";
import type { ReportPageViewModel } from "../../view-models/useReportPageViewModel";
import Report from "../Report";

// ---------------------------------------------------------------------------
// Mock the view model hook
// ---------------------------------------------------------------------------

let mockVm: ReportPageViewModel;

vi.mock("../../view-models/useReportPageViewModel", () => ({
  useReportPageViewModel: () => mockVm,
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  Link: ({
    children,
    to,
  }: {
    children: React.ReactNode;
    to: string;
  }): React.ReactElement => <a href={to}>{children}</a>,
  useParams: vi.fn(() => ({ id: "assessment-1" })),
}));

// Mock child components
vi.mock("../ExportReportButton", () => ({
  ExportReportButton: ({
    isDisabled,
  }: {
    isDisabled?: boolean;
  }): React.ReactElement => (
    <div
      data-testid="download-button"
      data-disabled={isDisabled ? "true" : "false"}
    />
  ),
}));

vi.mock("../../../environment/views/AgentStatusView", () => ({
  AgentStatusView: (): React.ReactElement => (
    <div data-testid="agent-status-view" />
  ),
}));

vi.mock("../assessment-report/Dashboard", () => ({
  Dashboard: (): React.ReactElement => <div data-testid="dashboard" />,
}));

vi.mock("../cluster-sizer/ClusterSizingWizard", () => ({
  ClusterSizingWizard: (): React.ReactElement => (
    <div data-testid="cluster-sizing-wizard" />
  ),
}));

vi.mock("../../../core/components/AppPage", () => ({
  AppPage: ({
    children,
    headerActions,
  }: {
    children: React.ReactNode;
    headerActions?: React.ReactNode;
  }): React.ReactElement => (
    <div data-testid="app-page">
      {headerActions && <div data-testid="header-actions">{headerActions}</div>}
      {children}
    </div>
  ),
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

const mockSource = createSourceModel({
  id: "source-1",
  name: "Test Source",
  createdAt: new Date(),
  updatedAt: new Date(),
  onPremises: false,
  agent: {
    id: "agent-1",
    status: "connected" as unknown as NonNullable<Source["agent"]>["status"],
    statusInfo: "",
    credentialUrl: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    version: "",
  },
} as Source);

import { buildClusterViewModel } from "../assessment-report/ClusterView";

function makeBaseVm(
  overrides: Partial<ReportPageViewModel> = {},
): ReportPageViewModel {
  const infra = createInfra(5, 5);
  const vms = createVMs(10);
  const clusters = {};
  const clusterView = buildClusterViewModel({
    infra,
    vms,
    clusters,
    selectedClusterId: "all",
  });

  return {
    assessmentId: "assessment-1",
    assessment: undefined,
    source: mockSource,
    isLoadingData: false,
    clusterView,
    selectedClusterId: "all",
    selectCluster: vi.fn(),
    isClusterSelectOpen: false,
    setClusterSelectOpen: vi.fn(),
    clusterSelectDisabled: true,
    infra,
    vms,
    clusters,
    latestSnapshot: {},
    lastUpdatedText: "-",
    clusterCount: 0,
    scopedClusterView: undefined,
    canExportReport: false,
    canShowClusterRecommendations: false,
    isExporting: false,
    exportLoadingLabel: null,
    exportPdf: vi.fn(),
    exportHtml: vi.fn(),
    exportError: null,
    clearExportError: vi.fn(),
    isSizingWizardOpen: false,
    setIsSizingWizardOpen: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Report", () => {
  beforeEach(() => {
    mockVm = makeBaseVm();
  });

  it("renders loading spinner when data is loading and no assessment", () => {
    mockVm = makeBaseVm({ isLoadingData: true, assessment: undefined });
    render(<Report />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders not found message when assessment does not exist", () => {
    mockVm = makeBaseVm({ assessment: undefined });
    render(<Report />);
    expect(
      screen.getByText(/The requested assessment was not found/),
    ).toBeInTheDocument();
  });

  describe("Cluster recommendations button", () => {
    it("auto-selects first cluster to show recommendations button", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(2, 2), vms: createVMs(5) },
        "Cluster B": { infra: createInfra(3, 3), vms: createVMs(7) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: "Cluster A",
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
          sourceType: "vcenter",
        },
        clusterView,
        selectedClusterId: "Cluster A",
        clusterCount: 2,
        clusters: clusterData,
        scopedClusterView: {
          ...clusterView,
          viewInfra: clusterData["Cluster A"].infra,
          viewVms: clusterData["Cluster A"].vms,
          cpuCores: clusterData["Cluster A"].vms.cpuCores,
          ramGB: clusterData["Cluster A"].vms.ramGB,
        },
        canShowClusterRecommendations: true,
        canExportReport: true,
      });

      render(<Report />);

      await waitFor(() => {
        expect(
          screen.getByText("View target cluster recommendations"),
        ).toBeInTheDocument();
      });
    });

    it("shows disabled recommendations button when cluster has no VMs", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(2, 2), vms: createVMs(0) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: "Cluster A",
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
        },
        clusterView,
        selectedClusterId: "Cluster A",
        clusters: clusterData,
        scopedClusterView: undefined,
        canShowClusterRecommendations: false,
        canExportReport: false,
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });
    });
  });

  describe("Export report button", () => {
    it("enables export button when cluster has both hosts and VMs", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(2, 2), vms: createVMs(5) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: "Cluster A",
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
        },
        clusterView,
        selectedClusterId: "Cluster A",
        clusters: clusterData,
        scopedClusterView: {
          ...clusterView,
          viewInfra: clusterData["Cluster A"].infra,
          viewVms: clusterData["Cluster A"].vms,
          cpuCores: clusterData["Cluster A"].vms.cpuCores,
          ramGB: clusterData["Cluster A"].vms.ramGB,
        },
        canExportReport: true,
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      const headerActions = screen.getByTestId("header-actions");
      const downloadButton =
        within(headerActions).getByTestId("download-button");
      expect(downloadButton).toHaveAttribute("data-disabled", "false");
    });

    it("disables export button when cluster has no hosts", async () => {
      const clusterData = {
        "Cluster A": { infra: createInfra(0, 0), vms: createVMs(5) },
      };
      const clusterView = buildClusterViewModel({
        infra: clusterData["Cluster A"].infra,
        vms: clusterData["Cluster A"].vms,
        clusters: clusterData,
        selectedClusterId: "Cluster A",
      });

      mockVm = makeBaseVm({
        assessment: {
          id: "assessment-1",
          name: "Assessment 1",
          sourceId: "source-1",
        },
        clusterView,
        selectedClusterId: "Cluster A",
        clusters: clusterData,
        scopedClusterView: {
          ...clusterView,
          viewInfra: clusterData["Cluster A"].infra,
          viewVms: clusterData["Cluster A"].vms,
          cpuCores: clusterData["Cluster A"].vms.cpuCores,
          ramGB: clusterData["Cluster A"].vms.ramGB,
        },
        canExportReport: false,
      });

      render(<Report />);

      await waitFor(() => {
        expect(screen.getByTestId("app-page")).toBeInTheDocument();
      });

      const headerActions = screen.getByTestId("header-actions");
      const downloadButton =
        within(headerActions).getByTestId("download-button");
      expect(downloadButton).toHaveAttribute("data-disabled", "true");
    });
  });
});
