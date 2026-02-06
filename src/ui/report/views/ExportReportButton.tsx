import { css } from "@emotion/css";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  type MenuToggleElement,
  Spinner,
} from "@patternfly/react-core";
import { DownloadIcon } from "@patternfly/react-icons";
import React, { useState } from "react";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/** Dropdown list with reset margins and scoped PF menu-item overrides. */
const dropdownListReset = css`
  margin: 0 !important;
  padding: 0 !important;

  .pf-v6-c-menu__list-item {
    background-color: #ffffff !important;
  }
  .pf-v6-c-menu__list-item:hover {
    background-color: #f0f0f0 !important;
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportReportButtonProps {
  isLoading: boolean;
  loadingLabel: string | null;
  onExportPdf: () => void;
  onExportHtml: () => void;
  isDisabled?: boolean;
  isAggregateView?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ExportReportButton: React.FC<ExportReportButtonProps> = ({
  isLoading,
  loadingLabel,
  onExportPdf,
  onExportHtml,
  isDisabled = false,
  isAggregateView = true,
}): JSX.Element => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const exportOptions = [
    {
      key: "pdf",
      label: "PDF",
      description: "Export the report as static charts",
      action: onExportPdf,
    },
    {
      key: "html-interactive",
      label: "HTML",
      description: "Export the report as interactive charts",
      action: onExportHtml,
    },
  ];

  const onToggleClick = (): void => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const onSelect = (): void => {
    setIsDropdownOpen(false);
  };

  if (!isAggregateView) {
    return (
      <Button
        variant="secondary"
        onClick={onExportPdf}
        isDisabled={isLoading || isDisabled}
        aria-label="Export to PDF"
      >
        {isLoading ? (
          <>
            <Spinner size="sm" aria-hidden="true" />
            {loadingLabel ?? "Generating..."}
          </>
        ) : (
          <>
            <DownloadIcon aria-hidden="true" /> Export to PDF
          </>
        )}
      </Button>
    );
  }

  return (
    <Dropdown
      isOpen={isDropdownOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsDropdownOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggleClick}
          isExpanded={isDropdownOpen}
          variant="secondary"
          isDisabled={isLoading || isDisabled}
          aria-label="Export report options"
        >
          {isLoading ? (
            <>
              <Spinner size="sm" aria-hidden="true" />
              {loadingLabel ?? "Generating..."}
            </>
          ) : (
            <>
              <DownloadIcon aria-hidden="true" /> Export Report
            </>
          )}
        </MenuToggle>
      )}
    >
      <DropdownList className={dropdownListReset}>
        {exportOptions.map((option) => (
          <DropdownItem
            key={option.key}
            onClick={option.action}
            description={option.description}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};
ExportReportButton.displayName = "ExportReportButton";
