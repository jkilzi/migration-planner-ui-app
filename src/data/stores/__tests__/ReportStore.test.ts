import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HtmlExportService } from "../../../services/html-export/HtmlExportService";
import type { PdfExportService } from "../../../services/pdf-export/PdfExportService";
import { ReportStore } from "../ReportStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createMockPdfService = (): PdfExportService =>
  ({
    generate: vi.fn().mockResolvedValue(undefined),
  }) as unknown as PdfExportService;

const createMockHtmlService = (): HtmlExportService =>
  ({
    generate: vi.fn().mockResolvedValue(undefined),
  }) as unknown as HtmlExportService;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ReportStore", () => {
  let pdfService: PdfExportService;
  let htmlService: HtmlExportService;
  let store: ReportStore;

  beforeEach(() => {
    pdfService = createMockPdfService();
    htmlService = createMockHtmlService();
    store = new ReportStore(pdfService, htmlService);
  });

  it("initial snapshot is idle with no error", () => {
    expect(store.getSnapshot()).toEqual({
      loadingState: "idle",
      error: null,
    });
  });

  // -- exportPdf ------------------------------------------------------------

  describe("exportPdf()", () => {
    const mockContainer = document.createElement("div");

    it("delegates to PdfExportService and transitions idle -> generating-pdf -> idle", async () => {
      const listener = vi.fn();
      store.subscribe(listener);

      const options = { documentTitle: "Test" };

      await store.exportPdf(mockContainer, options);

      expect(pdfService.generate).toHaveBeenCalledWith(mockContainer, options);
      expect(store.getSnapshot()).toEqual({
        loadingState: "idle",
        error: null,
      });
      // notify() called at least twice: once for generating-pdf, once for idle
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("sets error state when PdfExportService throws Error", async () => {
      vi.mocked(pdfService.generate).mockRejectedValue(new Error("PDF failed"));

      await store.exportPdf(mockContainer);

      expect(store.getSnapshot()).toEqual({
        loadingState: "error",
        error: {
          message: "PDF failed",
          type: "pdf",
        },
      });
    });

    it("sets generic error when PdfExportService throws non-Error", async () => {
      vi.mocked(pdfService.generate).mockRejectedValue("string error");

      await store.exportPdf(mockContainer);

      expect(store.getSnapshot()).toEqual({
        loadingState: "error",
        error: {
          message: "Failed to generate PDF",
          type: "pdf",
        },
      });
    });
  });

  // -- exportHtml -----------------------------------------------------------

  describe("exportHtml()", () => {
    const mockInventory = {
      infra: { totalHosts: 1, datastores: [], networks: [] },
      vms: {
        total: 5,
        powerStates: {},
        cpuCores: { total: 10 },
        ramGB: { total: 32 },
        diskGB: { total: 500 },
        migrationWarnings: [],
      },
    };

    it("delegates to HtmlExportService and transitions idle -> generating-html -> idle", async () => {
      const listener = vi.fn();
      store.subscribe(listener);

      const options = { documentTitle: "HTML Report" };

      await store.exportHtml(mockInventory, options);

      expect(htmlService.generate).toHaveBeenCalledWith(mockInventory, options);
      expect(store.getSnapshot()).toEqual({
        loadingState: "idle",
        error: null,
      });
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("sets error state when HtmlExportService throws Error", async () => {
      vi.mocked(htmlService.generate).mockRejectedValue(
        new Error("HTML failed"),
      );

      await store.exportHtml(mockInventory);

      expect(store.getSnapshot()).toEqual({
        loadingState: "error",
        error: {
          message: "HTML failed",
          type: "html",
        },
      });
    });

    it("sets generic error when HtmlExportService throws non-Error", async () => {
      vi.mocked(htmlService.generate).mockRejectedValue(null);

      await store.exportHtml(mockInventory);

      expect(store.getSnapshot()).toEqual({
        loadingState: "error",
        error: {
          message: "Failed to generate HTML file",
          type: "html",
        },
      });
    });
  });

  // -- clearError -----------------------------------------------------------

  describe("clearError()", () => {
    it("resets state to idle and notifies subscribers", async () => {
      // First put store into error state
      vi.mocked(pdfService.generate).mockRejectedValue(new Error("PDF failed"));
      await store.exportPdf(document.createElement("div"));

      expect(store.getSnapshot().loadingState).toBe("error");

      const listener = vi.fn();
      store.subscribe(listener);

      store.clearError();

      expect(store.getSnapshot()).toEqual({
        loadingState: "idle",
        error: null,
      });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  // -- subscribe / unsubscribe ---------------------------------------------

  it("unsubscribe removes listener", () => {
    const listener = vi.fn();
    const unsub = store.subscribe(listener);

    unsub();
    store.clearError(); // triggers notify

    expect(listener).not.toHaveBeenCalled();
  });
});
