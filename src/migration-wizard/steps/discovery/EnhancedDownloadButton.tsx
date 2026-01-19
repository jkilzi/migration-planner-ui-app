import React, { useEffect, useState } from 'react';

import type { Source } from '@migration-planner-ui/api-client/models';
import { useInjection } from '@migration-planner-ui/ioc';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Spinner,
} from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons';

import { Symbols } from '../../../main/Symbols';
import {
  ReportExportService,
  type ExportError,
  type InventoryData,
  type LoadingState,
  type SnapshotLike,
} from '../../../services/report-export';

import './DownloadPDFStyles.css';

interface ExportOption {
  key: string;
  label: string;
  description: string;
  action: () => Promise<void>;
  disabled?: boolean;
}

interface EnhancedDownloadButtonProps {
  elementId: string;
  componentToRender: React.ReactNode;
  sourceData?: Source;
  snapshot?: SnapshotLike;
  documentTitle?: string;
  onError?: (error: ExportError) => void;
  isDisabled?: boolean;
}

export const EnhancedDownloadButton: React.FC<EnhancedDownloadButtonProps> = ({
  elementId: _elementId,
  componentToRender,
  sourceData,
  snapshot,
  documentTitle,
  onError,
  isDisabled = false,
}): JSX.Element => {
  const reportExportService = useInjection<ReportExportService>(
    Symbols.ReportExportService,
  );

  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<ExportError | null>(null);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const isLoading =
    loadingState === 'generating-pdf' || loadingState === 'generating-html';

  const handleDownloadPDF = async (): Promise<void> => {
    setLoadingState('generating-pdf');
    setError(null);

    const result = await reportExportService.exportPdf(componentToRender, {
      documentTitle,
    });

    if (result.success) {
      setLoadingState('idle');
    } else {
      setError(result.error!);
      setLoadingState('error');
    }
  };

  const handleHTMLExport = async (): Promise<void> => {
    setLoadingState('generating-html');
    setError(null);

    const inventory = (sourceData?.inventory || snapshot?.inventory) as
      | InventoryData
      | SnapshotLike;

    if (!inventory) {
      setError({
        message: 'No inventory data available for export',
        type: 'html',
      });
      setLoadingState('error');
      return;
    }

    const result = await reportExportService.exportHtml(inventory, {
      documentTitle,
    });

    if (result.success) {
      setLoadingState('idle');
    } else {
      setError(result.error!);
      setLoadingState('error');
    }
  };

  const exportOptions: ExportOption[] = [
    {
      key: 'pdf',
      label: 'PDF',
      description: 'Export the report as static charts',
      action: handleDownloadPDF,
    },
    {
      key: 'html-interactive',
      label: 'HTML',
      description: 'Export the report as interactive charts',
      action: handleHTMLExport,
    },
  ];

  const onToggleClick = (): void => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const onSelect = (): void => {
    setIsDropdownOpen(false);
    setError(null);
  };

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
              {loadingState === 'generating-pdf'
                ? 'Generating PDF...'
                : 'Generating HTML...'}
            </>
          ) : (
            <>
              <DownloadIcon aria-hidden="true" /> Export Report
            </>
          )}
        </MenuToggle>
      )}
    >
      <DropdownList className="dropdown-list-reset">
        {exportOptions.map((option) => (
          <DropdownItem
            key={option.key}
            onClick={option.action}
            description={option.description}
            isDisabled={option.disabled}
          >
            {option.label}
          </DropdownItem>
        ))}
      </DropdownList>
    </Dropdown>
  );
};
EnhancedDownloadButton.displayName = 'EnhancedDownloadButton';
