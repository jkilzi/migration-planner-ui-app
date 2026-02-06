/**
 * Generates HTML reports from inventory data
 */

import { ChartDataTransformer } from "./ChartDataTransformer";
import {
  DEFAULT_DOCUMENT_TITLE,
  HtmlTemplateBuilder,
} from "./HtmlTemplateBuilder";
import type { InventoryData, SnapshotLike } from "./types";

export interface HtmlExportOptions {
  documentTitle?: string;
  filename?: string;
}

export class HtmlExportService {
  private chartTransformer = new ChartDataTransformer();
  private templateBuilder = new HtmlTemplateBuilder();

  /**
   * Generate and download an HTML report
   */
  async generate(
    inventory: InventoryData | SnapshotLike,
    options: HtmlExportOptions = {},
  ): Promise<void> {
    if (!inventory) {
      throw new Error("No inventory data available for export");
    }

    const chartData = this.chartTransformer.transform(inventory);
    const title = options.documentTitle || DEFAULT_DOCUMENT_TITLE;
    const htmlContent = this.templateBuilder.build(
      chartData,
      inventory,
      new Date(),
      title,
    );
    const filename =
      options.filename || "VMware_Infrastructure_Assessment_Comprehensive.html";

    await this.downloadHtml(htmlContent, filename);
  }

  /**
   * Download HTML content as a file
   */
  private downloadHtml(content: string, filename: string): Promise<void> {
    const blob = new Blob([content], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    return new Promise<void>((resolve) =>
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
        resolve();
      }, 250),
    );
  }
}
