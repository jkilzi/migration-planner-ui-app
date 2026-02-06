/**
 * Renders children into a hidden off-screen container via a React Portal.
 *
 * Used by the PDF export flow so that the {@link PdfExportService} receives an
 * already-rendered `HTMLElement` instead of a `React.ReactNode`, keeping React
 * rendering in the View layer where it belongs.
 */

import { css } from "@emotion/css";
import { forwardRef, type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const offScreenContainer = css`
  position: absolute;
  left: -9999px;
  top: 0;
  width: 1600px;
  min-height: 1200px;
  padding: 2rem;
  background-color: white;
  z-index: -1;

  .pf-v6-c-card {
    background-color: white !important;
    box-shadow: none !important;
    color: black !important;
    border: 1px solid rgba(3, 3, 3, 0.25);
  }

  .dashboard-card-print,
  .dashboard-card,
  .pf-v6-c-card,
  [data-export-block] {
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    margin-top: 80px !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OffScreenRendererProps {
  children: ReactNode;
  enabled: boolean;
}

export const OffScreenRenderer = forwardRef<
  HTMLDivElement,
  OffScreenRendererProps
>(({ children, enabled }, ref) => {
  const [host] = useState(() => {
    const el = document.createElement("div");
    el.id = "pdf-hidden-container";
    return el;
  });

  useEffect(() => {
    if (!enabled) return;

    document.body.appendChild(host);
    return () => {
      host.remove();
    };
  }, [host, enabled]);

  if (!enabled) return null;

  return createPortal(
    <div ref={ref} id="hidden-container" className={offScreenContainer}>
      {children}
    </div>,
    host,
  );
});

OffScreenRenderer.displayName = "OffScreenRenderer";
