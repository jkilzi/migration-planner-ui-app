/**
 * Generates PDF reports from an already-rendered HTML element.
 *
 * The caller (View layer) is responsible for rendering the React component
 * off-screen (e.g. via {@link OffScreenRenderer}). This service receives the
 * resulting `HTMLElement`, captures it as a canvas, and assembles a multi-page
 * PDF document.
 */

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const PDF_CONFIG = {
  FILENAME: "Dashboard_Report.pdf",
  MARGIN: 10,
} as const;

const TOC_ITEMS = [
  "- VM migration status",
  "- Operating system distribution",
  "- CPU & memory (VM distribution by CPU & memory size tier)",
  "- CPU & memory (VM distribution by vCPU count tier)",
  "- Disks (VM count by disk size tier)",
  "- Disks (Total disk size by tier)",
  "- Disks (VM count by disk type)",
  "- Clusters (VM distribution by cluster)",
  "- Clusters (Cluster distribution by data center)",
  "- Clusters (Cluster CPU over commitment)",
  "- Host distribution by model",
  "- Networks (VM distribution by network)",
  "- Networks (VM distribution by NIC count)",
  "- Migration warnings",
  "- Errors",
] as const;

/**
 * Expected number of custom segments for the PDF report layout.
 * The report is divided into 3 segments (one per page after the cover):
 *  - Segment 1: Blocks 1 & 2 combined (summary charts)
 *  - Segment 2: Block 3 (migration recommendations)
 *  - Segment 3: Block 4 (detailed analysis)
 */
const EXPECTED_CUSTOM_SEGMENTS = 3;

export interface PdfExportOptions {
  documentTitle?: string;
}

interface BlockBoundary {
  top: number;
  bottom: number;
  height: number;
}

interface Segment {
  top: number;
  height: number;
}

export class PdfExportService {
  /**
   * Generate a PDF from an already-rendered HTML element.
   *
   * @param container - The DOM element whose contents will be captured.
   *                    Must already be attached to the document (e.g. via a
   *                    React Portal) and fully rendered.
   */
  async generate(
    container: HTMLElement,
    options: PdfExportOptions = {},
  ): Promise<void> {
    await this.waitForImages(container);

    const blockBoundaries = this.collectBlockBoundaries(container);
    const canvas = await html2canvas(container, { useCORS: true });

    const pdf = this.buildPdf(
      canvas,
      blockBoundaries,
      container.clientWidth,
      options.documentTitle,
    );
    this.downloadPdf(pdf, options.documentTitle);
  }

  // ---------------------------------------------------------------------------
  // Image loading
  // ---------------------------------------------------------------------------

  /**
   * Wait for all images inside the container to finish loading.
   */
  private async waitForImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll("img"));
    if (images.length === 0) return;

    const imagePromises = images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const handleLoad = (): void => {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleError);
          resolve();
        };
        const handleError = (): void => {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleError);
          // Resolve even on error to not block PDF generation
          resolve();
        };

        img.addEventListener("load", handleLoad);
        img.addEventListener("error", handleError);
      });
    });

    await Promise.all(imagePromises);
  }

  // ---------------------------------------------------------------------------
  // Block boundary collection
  // ---------------------------------------------------------------------------

  private collectBlockBoundaries(container: HTMLElement): BlockBoundary[] {
    const containerRect = container.getBoundingClientRect();

    return Array.from(
      container.querySelectorAll<HTMLElement>(
        ".dashboard-card-print, .pf-v6-c-card",
      ),
    )
      .map((el) => {
        const r = el.getBoundingClientRect();
        const top = Math.max(0, r.top - containerRect.top);
        const bottom = Math.max(top, r.bottom - containerRect.top);
        const height = bottom - top;
        return { top, bottom, height };
      })
      .filter((b) => b.height > 4) // Ignore trivial blocks
      .sort((a, b) => a.top - b.top);
  }

  // ---------------------------------------------------------------------------
  // PDF assembly
  // ---------------------------------------------------------------------------

  private buildPdf(
    canvas: HTMLCanvasElement,
    domBlocks: BlockBoundary[],
    containerClientWidth: number,
    documentTitle?: string,
  ): jsPDF {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = PDF_CONFIG.MARGIN;

    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Build cover page with TOC
    this.buildCoverPage(pdf, pageWidth, pageHeight, margin, documentTitle);
    pdf.addPage();

    // Calculate scaling
    const scaleFactor = contentWidth / imgWidth;
    const pageHeightPx = contentHeight / scaleFactor;
    const domToCanvasScale = imgWidth / Math.max(1, containerClientWidth);

    const blocksPx = domBlocks.map((b) => ({
      top: b.top * domToCanvasScale,
      bottom: b.bottom * domToCanvasScale,
      height: b.height * domToCanvasScale,
    }));

    const BLEED_GUARD_PX = Math.max(0, Math.round(6 * domToCanvasScale));

    // Try custom segmentation based on data-export-block attributes
    const customSegments = this.buildCustomSegments(
      canvas,
      imgHeight,
      domToCanvasScale,
    );

    if (customSegments && customSegments.length === EXPECTED_CUSTOM_SEGMENTS) {
      this.renderCustomSegments(
        pdf,
        canvas,
        customSegments,
        imgWidth,
        imgHeight,
        contentWidth,
        contentHeight,
        margin,
      );
    } else {
      const sliceHeights = this.calculateSliceHeights(
        blocksPx,
        imgHeight,
        pageHeightPx,
        BLEED_GUARD_PX,
      );
      this.renderSlices(
        pdf,
        canvas,
        sliceHeights,
        imgWidth,
        imgHeight,
        contentWidth,
        contentHeight,
        margin,
      );
    }

    // Add page numbers
    this.addPageNumbers(pdf, pageWidth, pageHeight);

    return pdf;
  }

  private buildCoverPage(
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    documentTitle?: string,
  ): void {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    pdf.setFontSize(18);
    const headerTitle =
      documentTitle && documentTitle.trim().length > 0
        ? documentTitle
        : "VMware Infrastructure Assessment Report";
    pdf.text(headerTitle, pageWidth / 2, margin + 8, { align: "center" });

    pdf.setFontSize(11);
    const d = new Date();
    pdf.text(
      `Generated: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`,
      pageWidth / 2,
      margin + 18,
      { align: "center" },
    );

    pdf.setFontSize(14);
    pdf.text("Table of contents", margin, margin + 32);

    pdf.setFontSize(11);
    let tocY = margin + 42;
    TOC_ITEMS.forEach((line) => {
      if (tocY > pageHeight - margin - 10) {
        pdf.addPage();
        tocY = margin;
      }
      pdf.text(line, margin, tocY);
      tocY += 7;
    });
  }

  private buildCustomSegments(
    canvas: HTMLCanvasElement,
    imgHeight: number,
    domToCanvasScale: number,
  ): Segment[] | null {
    // The container that was captured is the parent of the canvas source.
    // We need to find it from the canvas's source element. Since html2canvas
    // doesn't expose the source, we look up the container via the well-known ID.
    const container = document.getElementById("hidden-container");
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    const SEGMENT_PADDING_PX = 12 * domToCanvasScale;

    const getBlockByIndex = (
      idx: number,
    ): { top: number; bottom: number } | null => {
      const el = container.querySelector<HTMLElement>(
        `[data-export-block="${idx}"]`,
      );
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const top = Math.max(0, r.top - containerRect.top) * domToCanvasScale;
      const bottom =
        Math.max(top, r.bottom - containerRect.top) * domToCanvasScale;
      return { top, bottom };
    };

    const b1 = getBlockByIndex(1);
    const b2 = getBlockByIndex(2);
    const b3 = getBlockByIndex(3);
    const b4 = getBlockByIndex(4);

    if (!b1 || !b2 || !b3 || !b4) return null;

    const firstTop = Math.max(0, Math.min(b1.top, b2.top) - SEGMENT_PADDING_PX);
    const firstBottom = Math.min(
      imgHeight,
      Math.max(b1.bottom, b2.bottom) + SEGMENT_PADDING_PX,
    );

    return [
      {
        top: firstTop,
        height: Math.max(1, firstBottom - firstTop),
      },
      {
        top: Math.max(0, b3.top - SEGMENT_PADDING_PX),
        height: Math.max(
          1,
          Math.min(imgHeight, b3.bottom + SEGMENT_PADDING_PX) -
            Math.max(0, b3.top - SEGMENT_PADDING_PX),
        ),
      },
      {
        top: Math.max(0, b4.top - SEGMENT_PADDING_PX),
        height: Math.max(
          1,
          Math.min(imgHeight, b4.bottom + SEGMENT_PADDING_PX) -
            Math.max(0, b4.top - SEGMENT_PADDING_PX),
        ),
      },
    ];
  }

  private calculateSliceHeights(
    blocksPx: BlockBoundary[],
    imgHeight: number,
    pageHeightPx: number,
    bleedGuardPx: number,
  ): number[] {
    const sliceHeights: number[] = [];

    if (blocksPx.length === 0) {
      let remaining = imgHeight;
      while (remaining > 0) {
        const h = Math.min(pageHeightPx, remaining);
        sliceHeights.push(h);
        remaining -= h;
      }
      return sliceHeights;
    }

    let y = 0;
    const MIN_ADVANCE = 32;
    const MAX_LOOP_GUARD = 2000;
    let guard = 0;

    while (y < imgHeight && guard++ < MAX_LOOP_GUARD) {
      const target = y + pageHeightPx;

      const eligibleBottoms = blocksPx
        .filter(
          (b) => b.top <= target - MIN_ADVANCE && b.bottom >= y + MIN_ADVANCE,
        )
        .map((b) => Math.round(b.bottom))
        .sort((a, b) => a - b);

      let cut: number;
      if (eligibleBottoms.length > 0) {
        const lastBottom = eligibleBottoms[eligibleBottoms.length - 1];
        const guarded = Math.max(y + MIN_ADVANCE, lastBottom - bleedGuardPx);
        cut = Math.min(imgHeight, guarded);
      } else {
        cut = Math.min(
          imgHeight,
          Math.max(y + MIN_ADVANCE, Math.round(target)),
        );
      }

      const height = Math.max(1, cut - y);
      sliceHeights.push(height);
      y += height;
    }

    return sliceHeights;
  }

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------

  private renderCustomSegments(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    segments: Segment[],
    imgWidth: number,
    imgHeight: number,
    contentWidth: number,
    contentHeight: number,
    margin: number,
  ): void {
    for (let i = 0; i < segments.length; i++) {
      const { top, height } = segments[i];
      const sliceHeightPx = Math.max(1, Math.min(height, imgHeight - top));

      const pageCanvas = this.createSliceCanvas(
        canvas,
        imgWidth,
        sliceHeightPx,
        top,
      );

      this.addCanvasToPdf(
        pdf,
        pageCanvas,
        imgWidth,
        sliceHeightPx,
        contentWidth,
        contentHeight,
        margin,
      );

      if (i < segments.length - 1) {
        pdf.addPage();
      }
    }
  }

  private renderSlices(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    sliceHeights: number[],
    imgWidth: number,
    imgHeight: number,
    contentWidth: number,
    contentHeight: number,
    margin: number,
  ): void {
    let consumedPx = 0;

    for (let pageIndex = 0; pageIndex < sliceHeights.length; pageIndex++) {
      const sliceHeightPx = sliceHeights[pageIndex];

      const pageCanvas = this.createSliceCanvas(
        canvas,
        imgWidth,
        sliceHeightPx,
        consumedPx,
      );

      this.addCanvasToPdf(
        pdf,
        pageCanvas,
        imgWidth,
        sliceHeightPx,
        contentWidth,
        contentHeight,
        margin,
      );

      consumedPx += sliceHeightPx;

      if (consumedPx < imgHeight) {
        pdf.addPage();
      }
    }
  }

  private createSliceCanvas(
    sourceCanvas: HTMLCanvasElement,
    width: number,
    height: number,
    offsetY: number,
  ): HTMLCanvasElement {
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = width;
    pageCanvas.height = height;

    const ctx = pageCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(sourceCanvas, 0, offsetY, width, height, 0, 0, width, height);

    return pageCanvas;
  }

  private addCanvasToPdf(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    imgWidth: number,
    sliceHeightPx: number,
    contentWidth: number,
    contentHeight: number,
    margin: number,
  ): void {
    const imgData = canvas.toDataURL("image/png");
    const pageScale = Math.min(
      contentWidth / imgWidth,
      contentHeight / sliceHeightPx,
    );
    const renderWidthMm = imgWidth * pageScale;
    const renderHeightMm = sliceHeightPx * pageScale;

    pdf.addImage(
      imgData,
      "PNG",
      margin + (contentWidth - renderWidthMm) / 2,
      margin,
      renderWidthMm,
      renderHeightMm,
    );
  }

  private addPageNumbers(
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number,
  ): void {
    const pdfWithPages = pdf as jsPDF & {
      getNumberOfPages?: () => number;
      internal?: { pages?: unknown[] };
    };
    const totalPagesFromMethod = pdfWithPages.getNumberOfPages?.();
    const totalPages =
      typeof totalPagesFromMethod === "number"
        ? totalPagesFromMethod
        : Array.isArray(pdfWithPages.internal?.pages)
          ? pdfWithPages.internal.pages.length
          : 1;

    pdf.setFontSize(9);
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 6, {
        align: "center",
      });
    }
  }

  private downloadPdf(pdf: jsPDF, documentTitle?: string): void {
    const filename = documentTitle
      ? `${documentTitle.replace(/\.pdf$/i, "")}.pdf`
      : PDF_CONFIG.FILENAME;
    pdf.save(filename);
  }
}
