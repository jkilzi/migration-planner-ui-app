import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";

// Loading states for export operations
export type LoadingState =
  | "idle"
  | "generating-pdf"
  | "generating-html"
  | "error";

// Export error structure
export interface ExportError {
  message: string;
  type: "pdf" | "html" | "general";
}

export interface ReportStoreState {
  loadingState: LoadingState;
  error: ExportError | null;
}

export interface IReportStore extends ExternalStore<ReportStoreState> {
  exportPdf(
    container: HTMLElement,
    options?: { documentTitle?: string },
  ): Promise<void>;
  exportHtml(
    inventory: unknown,
    options?: { documentTitle?: string },
  ): Promise<void>;
  clearError(): void;
}
