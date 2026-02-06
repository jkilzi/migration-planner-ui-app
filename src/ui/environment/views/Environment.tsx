import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  Button,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  InputGroup,
  InputGroupItem,
  MenuToggle,
  type MenuToggleElement,
  SearchInput,
  StackItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { FilterIcon, PlusCircleIcon, TimesIcon } from "@patternfly/react-icons";
import React, { useCallback, useEffect, useState } from "react";

import FilterPill from "../../core/components/FilterPill";
import {
  EnvironmentPageProvider,
  useEnvironmentPage,
} from "../view-models/EnvironmentPageContext";
import { DiscoverySourceSetupModal } from "./DiscoverySourceSetupModal";
import { SourcesTable } from "./SourcesTable";
import { TroubleshootingModal } from "./TroubleshootingModal";

const EnvironmentContent: React.FC = () => {
  const vm = useEnvironmentPage();

  const [
    shouldShowDiscoverySourceSetupModal,
    setShouldShowDiscoverySetupModal,
  ] = useState(false);

  const [editSourceId, setEditSourceId] = useState<string | null>(null);

  const toggleDiscoverySourceSetupModal = useCallback((): void => {
    setShouldShowDiscoverySetupModal((lastState) => !lastState);
  }, []);
  const hasSources = vm.sources && vm.sources.length > 0;
  const [firstSource, ..._otherSources] = vm.sources ?? [];
  const sourceSelected =
    (vm.sourceSelected &&
      vm.sources?.find((source) => source.id === vm.sourceSelected?.id)) ||
    firstSource;
  const [isOvaDownloading, setIsOvaDownloading] = useState(false);
  const uploadResult = vm.inventoryUploadResult;
  const uploadMessage = uploadResult?.message ?? null;
  const isUploadError = uploadResult?.isError ?? false;
  const [isTroubleshootingOpen, setIsTroubleshootingOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Multi-select status filters
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const toggleStatus = (statusKey: string): void => {
    setSelectedStatuses((prev) =>
      prev.includes(statusKey)
        ? prev.filter((s) => s !== statusKey)
        : [...prev, statusKey],
    );
  };

  const clearStatuses = (): void => setSelectedStatuses([]);

  const statusOptions: { key: string; label: string }[] = [
    { key: "not-connected-uploaded", label: "Uploaded manually" },
    { key: "not-connected", label: "Not connected" },
    { key: "waiting-for-credentials", label: "Waiting for credentials" },
    { key: "gathering-initial-inventory", label: "Gathering inventory" },
    { key: "error", label: "Error" },
    { key: "up-to-date", label: "Ready" },
  ];

  useEffect(() => {
    if (uploadMessage && !isUploadError) {
      // Only auto-dismiss success messages, keep error messages persistent
      const timeout = setTimeout(() => {
        vm.clearInventoryUploadResult();
      }, 5000); // dissapears after 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [uploadMessage, isUploadError, vm]);

  useEffect(() => {
    if (isOvaDownloading) {
      const timeout = setTimeout(() => {
        setIsOvaDownloading(false);
      }, 5000); // dissapears after 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [isOvaDownloading]);

  // Close filter dropdown whenever any modal in this page opens
  useEffect(() => {
    if (shouldShowDiscoverySourceSetupModal || isTroubleshootingOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFilterDropdownOpen(false);
    }
  }, [shouldShowDiscoverySourceSetupModal, isTroubleshootingOpen]);

  return (
    <>
      <div
        style={{
          background: "white",
          padding: "0 20px 20px 20px",
          marginTop: "10px",
          marginBottom: "10px",
        }}
      >
        {/* Critical error alerts at the top for visibility */}
        {uploadMessage && isUploadError && (
          <div style={{ marginBottom: "16px" }}>
            <Alert
              isInline
              variant="danger"
              title="Upload error"
              actionClose={
                <AlertActionCloseButton
                  onClose={() => vm.clearInventoryUploadResult()}
                />
              }
            >
              {uploadMessage}
            </Alert>
          </div>
        )}

        {vm.errorDownloadingSource && (
          <div style={{ marginBottom: "16px" }}>
            <Alert
              isInline
              variant="danger"
              title="Download Environment error"
              actionClose={
                <AlertActionCloseButton
                  onClose={() => {
                    vm.clearErrors({ downloading: true });
                  }}
                />
              }
            >
              {vm.errorDownloadingSource.message}
            </Alert>
          </div>
        )}

        <Toolbar inset={{ default: "insetNone" }}>
          <ToolbarContent>
            <ToolbarItem>
              <InputGroup>
                <InputGroupItem>
                  <Dropdown
                    isOpen={isFilterDropdownOpen}
                    onOpenChange={(open) => setIsFilterDropdownOpen(open)}
                    onSelect={() => setIsFilterDropdownOpen(false)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        onClick={() =>
                          setIsFilterDropdownOpen(!isFilterDropdownOpen)
                        }
                        isExpanded={isFilterDropdownOpen}
                        style={{ minWidth: "220px", width: "220px" }}
                        icon={<FilterIcon style={{ marginRight: "8px" }} />}
                      >
                        Filters
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem isDisabled key="heading-status">
                        Discovery VM Status
                      </DropdownItem>
                      <DropdownItem
                        key="status-all"
                        onClick={(
                          event: React.MouseEvent | React.KeyboardEvent,
                        ) => {
                          event.preventDefault();
                          event.stopPropagation();
                          clearStatuses();
                        }}
                      >
                        All statuses
                      </DropdownItem>
                      {statusOptions.map((opt) => (
                        <DropdownItem
                          key={`status-${opt.key}`}
                          onClick={(
                            event: React.MouseEvent | React.KeyboardEvent,
                          ) => {
                            event.preventDefault();
                            event.stopPropagation();
                            toggleStatus(opt.key);
                          }}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={selectedStatuses.includes(opt.key)}
                            style={{ marginRight: "8px" }}
                          />
                          {opt.label}
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  </Dropdown>
                </InputGroupItem>
                <InputGroupItem isFill>
                  <SearchInput
                    id="environment-search"
                    aria-label="Search by name"
                    placeholder="Search by name"
                    value={search}
                    onChange={(_event, value) => setSearch(value)}
                    onClear={() => setSearch("")}
                    style={{ minWidth: "300px", width: "300px" }}
                  />
                </InputGroupItem>
              </InputGroup>
            </ToolbarItem>
            <ToolbarItem>
              {hasSources ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    setEditSourceId(null);
                    toggleDiscoverySourceSetupModal();
                  }}
                  icon={<PlusCircleIcon />}
                >
                  Add environment
                </Button>
              ) : null}
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {selectedStatuses.length > 0 && (
          <div style={{ marginTop: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
                background: "#f5f5f5",
                padding: "6px 8px",
                borderRadius: "6px",
              }}
            >
              <span
                style={{
                  background: "#e7e7e7",
                  borderRadius: "12px",
                  padding: "2px 8px",
                  fontSize: "12px",
                }}
              >
                Filters
              </span>

              {((): JSX.Element => {
                const MAX_STATUS_CHIPS = 6;
                const visible = selectedStatuses.slice(0, MAX_STATUS_CHIPS);
                const overflow = selectedStatuses.length - visible.length;
                const hidden = selectedStatuses.slice(MAX_STATUS_CHIPS);
                const labelMap = new Map(
                  statusOptions.map((s) => [s.key, s.label]),
                );
                return (
                  <>
                    {visible.map((key) => (
                      <FilterPill
                        key={`chip-status-${key}`}
                        label={`status=${labelMap.get(key) ?? key}`}
                        ariaLabel={`Remove status ${labelMap.get(key) ?? key}`}
                        onClear={() => toggleStatus(key)}
                      />
                    ))}
                    {overflow > 0 && (
                      <FilterPill
                        key="status-overflow"
                        label={`${overflow} more`}
                        ariaLabel="Remove hidden statuses"
                        onClear={() => {
                          hidden.forEach((k) => toggleStatus(k));
                        }}
                      />
                    )}
                  </>
                );
              })()}

              <Button
                icon={<TimesIcon />}
                variant="plain"
                aria-label="Clear all filters"
                onClick={() => clearStatuses()}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <SourcesTable
            search={search}
            selectedStatuses={selectedStatuses}
            onEditEnvironment={(sourceId) => {
              setEditSourceId(sourceId);
              vm.selectSourceById?.(sourceId);
              setShouldShowDiscoverySetupModal(true);
            }}
          />
        </div>
      </div>

      {isOvaDownloading && (
        <StackItem>
          <Alert isInline variant="info" title="Download OVA image">
            The OVA image is downloading
          </Alert>
        </StackItem>
      )}

      {sourceSelected?.agent &&
        sourceSelected?.agent.status === "waiting-for-credentials" && (
          <StackItem>
            <Alert
              isInline
              variant="custom"
              title="Discovery VM"
              actionLinks={
                <AlertActionLink
                  component="a"
                  href={sourceSelected?.agent.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {sourceSelected?.agent.credentialUrl}
                </AlertActionLink>
              }
            >
              <Content>
                <Content component="p">
                  Click the link below to connect the Discovery Source to your
                  VMware environment.
                </Content>
              </Content>
            </Alert>
          </StackItem>
        )}

      {uploadMessage && !isUploadError && (
        <StackItem>
          <Alert isInline variant="success" title="Upload success">
            {uploadMessage}
          </Alert>
        </StackItem>
      )}

      {shouldShowDiscoverySourceSetupModal && (
        <DiscoverySourceSetupModal
          isOpen={shouldShowDiscoverySourceSetupModal}
          onClose={() => {
            setEditSourceId(null);
            toggleDiscoverySourceSetupModal();
            void vm.listSources();
          }}
          isDisabled={vm.isDownloadingSource}
          onStartDownload={() => setIsOvaDownloading(true)}
          onAfterDownload={async () => {
            await vm.listSources();
          }}
          editSourceId={editSourceId || undefined}
        />
      )}
      <TroubleshootingModal
        isOpen={isTroubleshootingOpen}
        onClose={() => setIsTroubleshootingOpen(false)}
      />
    </>
  );
};

export const Environment: React.FC = () => (
  <EnvironmentPageProvider>
    <EnvironmentContent />
  </EnvironmentPageProvider>
);

Environment.displayName = "Environment";
