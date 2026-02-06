import "@testing-library/jest-dom";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ClusterSizingWizard } from "../ClusterSizingWizard";

// Mock the IoC hook
const mockCalculateAssessmentClusterRequirements = vi.fn();

const noop = (): void => {};
const EMPTY: unknown[] = [];
const mockStore = {
  calculateAssessmentClusterRequirements:
    mockCalculateAssessmentClusterRequirements,
  subscribe: (_cb: () => void): (() => void) => noop,
  getSnapshot: (): unknown[] => EMPTY,
};
vi.mock("@migration-planner-ui/ioc", () => ({
  useInjection: vi.fn(() => mockStore),
}));

// Mock child components to simplify testing
vi.mock("../SizingInputForm", () => ({
  SizingInputForm: (): React.ReactElement => (
    <div data-testid="sizing-input-form">Migration Preferences Form</div>
  ),
}));

vi.mock("../SizingResult", () => ({
  SizingResult: (): React.ReactElement => (
    <div data-testid="sizing-result">Sizing Results</div>
  ),
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  clusterName: "test-cluster",
  clusterId: "cluster-1",
  assessmentId: "assessment-1",
};

describe("ClusterSizingWizard", () => {
  beforeEach(() => {
    mockCalculateAssessmentClusterRequirements.mockResolvedValue({
      sizing: {
        workerNodes: 3,
        controlPlaneNodes: 3,
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the wizard when open", () => {
    render(<ClusterSizingWizard {...defaultProps} />);

    expect(
      screen.getByText("Target cluster recommendations"),
    ).toBeInTheDocument();
    // PatternFly wizard shows step names in multiple places (sidebar and toggle)
    expect(screen.getAllByText("Migration preferences").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getAllByText("Review cluster recommendations").length,
    ).toBeGreaterThan(0);
  });

  it("does not render when closed", () => {
    render(<ClusterSizingWizard {...defaultProps} isOpen={false} />);

    expect(
      screen.queryByText("Target cluster recommendations"),
    ).not.toBeInTheDocument();
  });

  describe("navigation and calculation", () => {
    it("triggers calculation when clicking Next button to go to review step", async () => {
      render(<ClusterSizingWizard {...defaultProps} />);

      // Click Next button
      const nextButton = screen.getByRole("button", { name: "Next" });
      fireEvent.click(nextButton);

      // Calculation should be triggered via onStepChange
      await waitFor(() => {
        expect(
          mockCalculateAssessmentClusterRequirements,
        ).toHaveBeenCalledTimes(1);
      });
    });

    it("triggers calculation when clicking sidebar to navigate to review step", async () => {
      render(<ClusterSizingWizard {...defaultProps} />);

      // Click the sidebar nav item for step 2
      const reviewStepNav = screen.getByRole("button", {
        name: /Review cluster recommendations/,
      });
      fireEvent.click(reviewStepNav);

      // Calculation should be triggered via onStepChange
      await waitFor(() => {
        expect(
          mockCalculateAssessmentClusterRequirements,
        ).toHaveBeenCalledTimes(1);
      });
    });

    it("does not trigger calculation when navigating back to preferences step", async () => {
      render(<ClusterSizingWizard {...defaultProps} />);

      // First navigate to review step
      const nextButton = screen.getByRole("button", { name: "Next" });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          mockCalculateAssessmentClusterRequirements,
        ).toHaveBeenCalledTimes(1);
      });

      // Clear the mock to track new calls
      mockCalculateAssessmentClusterRequirements.mockClear();

      // Click Back button to go back to preferences step
      const backButton = screen.getByRole("button", { name: "Back" });
      fireEvent.click(backButton);

      // Wait a bit and verify no new calculation was triggered
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockCalculateAssessmentClusterRequirements).not.toHaveBeenCalled();
    });

    it("triggers calculation again when returning to review step after going back", async () => {
      render(<ClusterSizingWizard {...defaultProps} />);

      // Navigate to review step
      const nextButton = screen.getByRole("button", { name: "Next" });
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(
          mockCalculateAssessmentClusterRequirements,
        ).toHaveBeenCalledTimes(1);
      });

      // Go back to preferences
      const backButton = screen.getByRole("button", { name: "Back" });
      fireEvent.click(backButton);

      // Navigate to review step again
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Next" }),
        ).toBeInTheDocument();
      });

      const nextButtonAgain = screen.getByRole("button", { name: "Next" });
      fireEvent.click(nextButtonAgain);

      // Calculation should be triggered again
      await waitFor(() => {
        expect(
          mockCalculateAssessmentClusterRequirements,
        ).toHaveBeenCalledTimes(2);
      });
    });
  });
});
