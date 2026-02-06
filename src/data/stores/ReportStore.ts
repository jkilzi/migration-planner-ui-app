import { ExternalStoreBase } from "../../lib/mvvm/ExternalStore";
import type { HtmlExportService } from "../../services/html-export/HtmlExportService";
import type {
  InventoryData,
  SnapshotLike,
} from "../../services/html-export/types";
import type { PdfExportService } from "../../services/pdf-export/PdfExportService";
import type { IReportStore, ReportStoreState } from "./interfaces/IReportStore";

const IDLE_STATE: ReportStoreState = Object.freeze({
  loadingState: "idle" as const,
  error: null,
});

export class ReportStore
  extends ExternalStoreBase<ReportStoreState>
  implements IReportStore
{
  private state: ReportStoreState = IDLE_STATE;
  private pdfExportService: PdfExportService;
  private htmlExportService: HtmlExportService;

  constructor(
    pdfExportService: PdfExportService,
    htmlExportService: HtmlExportService,
  ) {
    super();
    this.pdfExportService = pdfExportService;
    this.htmlExportService = htmlExportService;
  }

  override getSnapshot(): ReportStoreState {
    return this.state;
  }

  async exportPdf(
    container: HTMLElement,
    options?: { documentTitle?: string },
  ): Promise<void> {
    this.setState({ loadingState: "generating-pdf", error: null });

    try {
      await this.pdfExportService.generate(container, options);
      this.setState(IDLE_STATE);
    } catch (error) {
      this.setState({
        loadingState: "error",
        error: {
          message:
            error instanceof Error ? error.message : "Failed to generate PDF",
          type: "pdf",
        },
      });
    }
  }

  async exportHtml(
    inventory: unknown,
    options?: { documentTitle?: string },
  ): Promise<void> {
    this.setState({ loadingState: "generating-html", error: null });

    try {
      await this.htmlExportService.generate(
        inventory as InventoryData | SnapshotLike,
        options,
      );
      this.setState(IDLE_STATE);
    } catch (error) {
      this.setState({
        loadingState: "error",
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate HTML file",
          type: "html",
        },
      });
    }
  }

  clearError(): void {
    this.setState(IDLE_STATE);
  }

  private setState(newState: ReportStoreState): void {
    this.state = newState;
    this.notify();
  }
}
