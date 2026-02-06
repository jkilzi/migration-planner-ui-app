import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExportReportButton } from "../ExportReportButton";

// PatternFly Dropdown requires a Popper mock (provided in vitest.setup.ts).
// For reliable toggle testing, mock the Dropdown to render children directly.
vi.mock("@patternfly/react-core", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@patternfly/react-core")>();

  return {
    ...actual,
    Dropdown: ({
      children,
      toggle,
    }: {
      children?: React.ReactNode;
      toggle?: React.ReactNode | ((ref: React.Ref<unknown>) => React.ReactNode);
    }) => (
      <div>
        {typeof toggle === "function" ? toggle(null) : toggle}
        {children}
      </div>
    ),
  };
});

describe("ExportReportButton", () => {
  const baseProps = {
    isLoading: false,
    loadingLabel: null as string | null,
    onExportPdf: vi.fn(),
    onExportHtml: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -- Aggregate view (dropdown) --------------------------------------------

  describe("aggregate view (dropdown)", () => {
    it("renders dropdown with Export Report toggle", () => {
      render(<ExportReportButton {...baseProps} isAggregateView={true} />);

      expect(
        screen.getByRole("button", { name: /export report/i }),
      ).toBeInTheDocument();
    });

    it("shows PDF and HTML options", () => {
      render(<ExportReportButton {...baseProps} isAggregateView={true} />);

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /export report/i }));
      });

      expect(
        screen.getByRole("menuitem", { name: /pdf/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: /html/i }),
      ).toBeInTheDocument();
    });

    it("calls onExportPdf when PDF option is clicked", () => {
      render(<ExportReportButton {...baseProps} isAggregateView={true} />);

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /export report/i }));
      });

      act(() => {
        fireEvent.click(screen.getByRole("menuitem", { name: /pdf/i }));
      });

      expect(baseProps.onExportPdf).toHaveBeenCalledTimes(1);
    });

    it("calls onExportHtml when HTML option is clicked", () => {
      render(<ExportReportButton {...baseProps} isAggregateView={true} />);

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /export report/i }));
      });

      act(() => {
        fireEvent.click(screen.getByRole("menuitem", { name: /html/i }));
      });

      expect(baseProps.onExportHtml).toHaveBeenCalledTimes(1);
    });

    it("shows loading state with label", () => {
      render(
        <ExportReportButton
          {...baseProps}
          isLoading={true}
          loadingLabel="Generating PDF..."
          isAggregateView={true}
        />,
      );

      expect(screen.getByText("Generating PDF...")).toBeInTheDocument();
    });

    it("disables toggle when loading", () => {
      render(
        <ExportReportButton
          {...baseProps}
          isLoading={true}
          loadingLabel="Generating..."
          isAggregateView={true}
        />,
      );

      const toggle = screen.getByRole("button", { name: /export report/i });
      expect(toggle).toBeDisabled();
    });

    it("disables toggle when isDisabled is true", () => {
      render(
        <ExportReportButton
          {...baseProps}
          isDisabled={true}
          isAggregateView={true}
        />,
      );

      const toggle = screen.getByRole("button", { name: /export report/i });
      expect(toggle).toBeDisabled();
    });
  });

  // -- Non-aggregate view (single button) -----------------------------------

  describe("non-aggregate view (single button)", () => {
    it("renders Export to PDF button", () => {
      render(<ExportReportButton {...baseProps} isAggregateView={false} />);

      expect(
        screen.getByRole("button", { name: /export to pdf/i }),
      ).toBeInTheDocument();
    });

    it("does not render HTML option", () => {
      render(<ExportReportButton {...baseProps} isAggregateView={false} />);

      expect(
        screen.queryByRole("menuitem", { name: /html/i }),
      ).not.toBeInTheDocument();
    });

    it("calls onExportPdf when button is clicked", () => {
      render(<ExportReportButton {...baseProps} isAggregateView={false} />);

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: /export to pdf/i }));
      });

      expect(baseProps.onExportPdf).toHaveBeenCalledTimes(1);
    });

    it("shows loading state", () => {
      render(
        <ExportReportButton
          {...baseProps}
          isLoading={true}
          loadingLabel="Generating PDF..."
          isAggregateView={false}
        />,
      );

      expect(screen.getByText("Generating PDF...")).toBeInTheDocument();
    });

    it("disables button when loading", () => {
      render(
        <ExportReportButton
          {...baseProps}
          isLoading={true}
          loadingLabel="Generating..."
          isAggregateView={false}
        />,
      );

      const button = screen.getByRole("button", { name: /export to pdf/i });
      expect(button).toBeDisabled();
    });
  });
});
