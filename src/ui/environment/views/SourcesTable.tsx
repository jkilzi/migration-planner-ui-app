import {
  Bullseye,
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  type MenuToggleElement,
  Spinner,
  Tooltip,
} from "@patternfly/react-core";
import { ArrowLeftIcon, EllipsisVIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { SourceModel } from "../../../models/SourceModel";
import { routes } from "../../../routing/Routes";
import { ConfirmationModal } from "../../core/components/ConfirmationModal";
import { useEnvironmentPage } from "../view-models/EnvironmentPageContext";
import { AgentStatusView } from "./AgentStatusView";
import { Columns } from "./Columns";
import { EmptyState } from "./EmptyState";

const VALUE_NOT_AVAILABLE = "-";
import { UploadInventoryAction } from "./UploadInventoryAction";

type SourceTableProps = {
  search?: string;
  selectedStatuses?: string[];
  onlySourceId?: string;
  uploadOnly?: boolean;
  onEditEnvironment?: (sourceId: string) => void;
};

export const SourcesTable: React.FC<SourceTableProps> = ({
  search: _search = "",
  selectedStatuses = [],
  onlySourceId,
  uploadOnly = false,
  onEditEnvironment,
}) => {
  const formatRelativeTime = (updatedAt?: string | number | Date): string => {
    if (!updatedAt) return "-";
    const date = new Date(updatedAt);
    if (isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const absMs = Math.abs(diffMs);

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    const month = 30 * day;
    const year = 365 * day;

    let unit: Intl.RelativeTimeFormatUnit = "second";
    let value = 0;

    if (absMs < minute) {
      unit = "second";
      value = Math.round(diffMs / 1000);
    } else if (absMs < hour) {
      unit = "minute";
      value = Math.round(diffMs / minute);
    } else if (absMs < day) {
      unit = "hour";
      value = Math.round(diffMs / hour);
    } else if (absMs < week) {
      unit = "day";
      value = Math.round(diffMs / day);
    } else if (absMs < month) {
      unit = "week";
      value = Math.round(diffMs / week);
    } else if (absMs < year) {
      unit = "month";
      value = Math.round(diffMs / month);
    } else {
      unit = "year";
      value = Math.round(diffMs / year);
    }

    return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
      value,
      unit,
    );
  };
  const vm = useEnvironmentPage();
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {},
  );
  const [deleteTarget, setDeleteTarget] = useState<SourceModel | null>(null);

  // Memorize ordered sources without mutating context sources
  const memoizedSources = useMemo(() => {
    const sourcesToUse: SourceModel[] = vm.sources
      ? [...vm.sources].sort((a: SourceModel, b: SourceModel) =>
          a.id.localeCompare(b.id),
        )
      : [];

    return sourcesToUse;
  }, [vm.sources]);

  const [firstSource, ..._otherSources] = memoizedSources ?? [];
  const hasSources = memoizedSources && memoizedSources.length > 0;

  const filteredSources = useMemo(() => {
    if (!memoizedSources) return [];
    let filtered = memoizedSources;

    // Filter by specific source id if provided
    if (onlySourceId) {
      filtered = filtered.filter((s) => s.id === onlySourceId);
    }

    // Name-only search
    if (_search && _search.trim() !== "") {
      const query = _search.toLowerCase();
      filtered = filtered.filter((source) =>
        (source.name || "").toLowerCase().includes(query),
      );
    }

    // Multi-select statuses with label mapping
    if (selectedStatuses && selectedStatuses.length > 0) {
      filtered = filtered.filter((source) => {
        const status = source.displayStatus;
        const uploadedManually =
          Boolean(source.onPremises) && source.inventory !== undefined;

        // Map keys to conditions
        const matches = selectedStatuses.some((key) => {
          switch (key) {
            case "not-connected-uploaded":
              return status === "not-connected" && uploadedManually;
            case "not-connected":
              return status === "not-connected" && !uploadedManually;
            case "waiting-for-credentials":
              return status === "waiting-for-credentials";
            case "gathering-initial-inventory":
              return status === "gathering-initial-inventory";
            case "error":
              return status === "error";
            case "up-to-date":
              return status === "up-to-date";
            default:
              return false;
          }
        });

        return matches;
      });
    }

    return filtered;
  }, [memoizedSources, _search, selectedStatuses, onlySourceId]);

  // Polling lifecycle is handled by the EnvironmentPageViewModel.
  // We only need to refresh on tab/window focus.

  // Refresh immediately when returning to the tab/window (no manual reload needed)
  useEffect(() => {
    const onFocus = (): void => {
      void vm.refreshOnFocus();
    };

    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        void vm.refreshOnFocus();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vm.refreshOnFocus]);

  useEffect(
    () => {
      if (!vm.sourceSelected && firstSource) {
        vm.selectSource(firstSource);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firstSource, vm.sources],
  );

  useEffect(() => {
    // Use timeout to verify memoizedSources variable
    timeoutRef.current = setTimeout(() => {
      if (memoizedSources && memoizedSources.length === 0) {
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    }, 3000); // Timeout in milisecons (3 seconds here)

    return () => {
      // Clean the timeout in case unmount the component
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [memoizedSources]);

  // Build map of sourceId -> assessmentId to enable report action
  const sourceToAssessmentId = useMemo(() => {
    const map: Record<string, string> = {};
    try {
      const list = (vm.assessments || []) as unknown[];
      list.forEach((a: unknown) => {
        const obj = (a || {}) as Record<string, unknown>;
        const id = obj.id as string | number | undefined;
        const sourceId = obj.sourceId as string | number | undefined;
        if (id !== undefined && sourceId !== undefined) {
          map[String(sourceId)] = String(id);
        }
      });
    } catch {
      // ignore
    }
    return map;
  }, [vm.assessments]);

  const handleUploadFile = (sourceId: string): void => {
    vm.uploadInventoryFromFile(sourceId);
  };

  const handleDelete = (source: SourceModel): void => {
    setDeleteTarget(null);
    void vm.deleteAndRefresh(source.id).then((sources) => {
      if (sources?.length) {
        vm.selectSource(sources[0]);
      }
    });
  };

  const handleShowReport = (sourceId: string): void => {
    const assessmentId = sourceToAssessmentId[sourceId];
    if (assessmentId) {
      navigate(routes.assessmentReport(assessmentId));
    }
  };

  const handleCreateAssessment = (sourceId: string): void => {
    vm.setAssessmentFromAgent?.(true);
    vm.selectSourceById?.(sourceId);
    navigate(routes.assessmentCreate, {
      state: { reset: true },
    });
  };

  // Show spinner until all data is loaded
  if (isLoading && !hasSources) {
    return (
      <Table aria-label="Loading table" variant="compact" borders={false}>
        <Tbody>
          <Tr>
            <Td colSpan={7}>
              <Bullseye>
                <Spinner size="xl" />
              </Bullseye>
            </Td>
          </Tr>
        </Tbody>
      </Table>
    );
  } else {
    return (
      <div>
        {vm.assessmentFromAgentState && (
          <div style={{ marginBottom: "16px" }}>
            <Button
              variant="link"
              icon={<ArrowLeftIcon />}
              onClick={() => {
                vm.setAssessmentFromAgent?.(false);
                navigate(routes.assessments);
              }}
            >
              Back to Assessments
            </Button>
          </div>
        )}
        <div
          style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}
        >
          <Table aria-label="Sources table" variant="compact" borders={false}>
            {filteredSources && filteredSources.length > 0 && (
              <Thead>
                <Tr>
                  <Th style={{ whiteSpace: "normal" }}>{Columns.Name}</Th>
                  <Th style={{ whiteSpace: "normal" }}>{Columns.Status}</Th>
                  <Th style={{ whiteSpace: "normal" }}>{Columns.Hosts}</Th>
                  <Th style={{ whiteSpace: "normal" }}>{Columns.VMs}</Th>
                  <Th
                    style={{
                      whiteSpace: "normal",
                      minWidth: "120px",
                      maxWidth: "200px",
                    }}
                  >
                    {Columns.Networks}
                  </Th>
                  <Th
                    style={{
                      whiteSpace: "normal",
                      minWidth: "120px",
                      maxWidth: "200px",
                    }}
                  >
                    {Columns.Datastores}
                  </Th>
                  <Th style={{ whiteSpace: "normal" }}>{Columns.LastSeen}</Th>
                  <Th
                    style={{
                      whiteSpace: "normal",
                      minWidth: "120px",
                      maxWidth: "200px",
                    }}
                    screenReaderText="Actions"
                  >
                    {Columns.Actions}
                  </Th>
                </Tr>
              </Thead>
            )}
            <Tbody>
              {filteredSources && filteredSources.length > 0 ? (
                filteredSources.map((source) => {
                  // Get the agent related to this source
                  const agent = source.agent;
                  const isReportAvailable = Boolean(
                    sourceToAssessmentId[source.id],
                  );
                  const isUploadAllowed = !source.agent || source.onPremises;
                  return (
                    <Tr key={source.id}>
                      <Td
                        dataLabel={Columns.Name}
                        style={{ verticalAlign: "top" }}
                      >
                        {source.name}
                      </Td>
                      <Td
                        dataLabel={Columns.Status}
                        style={{ verticalAlign: "top" }}
                      >
                        <AgentStatusView
                          status={source.displayStatus}
                          statusInfo={
                            source.isReady
                              ? undefined
                              : agent
                                ? agent.statusInfo
                                : "Not connected"
                          }
                          credentialUrl={agent ? agent.credentialUrl : ""}
                          uploadedManually={
                            Boolean(source.onPremises) &&
                            source.inventory !== undefined
                          }
                          updatedAt={source?.updatedAt}
                        />
                      </Td>
                      <Td
                        dataLabel={Columns.Hosts}
                        style={{ verticalAlign: "top" }}
                      >
                        {source?.inventory?.vcenter?.infra.totalHosts ??
                          VALUE_NOT_AVAILABLE}
                      </Td>
                      <Td
                        dataLabel={Columns.VMs}
                        style={{ verticalAlign: "top" }}
                      >
                        {source?.inventory?.vcenter?.vms.total ??
                          VALUE_NOT_AVAILABLE}
                      </Td>
                      <Td
                        dataLabel={Columns.Networks}
                        style={{ verticalAlign: "top" }}
                      >
                        {source?.inventory?.vcenter?.infra.networks?.length ??
                          VALUE_NOT_AVAILABLE}
                      </Td>
                      <Td
                        dataLabel={Columns.Datastores}
                        style={{ verticalAlign: "top" }}
                      >
                        {source?.inventory?.vcenter?.infra.datastores?.length ??
                          VALUE_NOT_AVAILABLE}
                      </Td>
                      <Td
                        dataLabel={Columns.LastSeen}
                        style={{ verticalAlign: "top" }}
                      >
                        {source?.updatedAt ? (
                          <Tooltip
                            content={new Date(
                              source.updatedAt,
                            ).toLocaleString()}
                          >
                            <span>{formatRelativeTime(source.updatedAt)}</span>
                          </Tooltip>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td
                        dataLabel={Columns.Actions}
                        style={{ verticalAlign: "top" }}
                      >
                        {uploadOnly ? (
                          <>
                            {isUploadAllowed && source.name !== "Example" && (
                              <UploadInventoryAction sourceId={source.id} />
                            )}
                          </>
                        ) : (
                          <Dropdown
                            isOpen={openDropdowns[source.id] || false}
                            popperProps={{
                              appendTo: () => document.body,
                              position: "end",
                            }}
                            onOpenChange={(isOpen) =>
                              setOpenDropdowns((prev) => ({
                                ...prev,
                                [source.id]: isOpen,
                              }))
                            }
                            toggle={(
                              toggleRef: React.Ref<MenuToggleElement>,
                            ) => (
                              <MenuToggle
                                ref={toggleRef}
                                aria-label="Actions"
                                variant="plain"
                                onClick={() =>
                                  setOpenDropdowns((prev) => ({
                                    ...prev,
                                    [source.id]: !prev[source.id],
                                  }))
                                }
                              >
                                <EllipsisVIcon />
                              </MenuToggle>
                            )}
                          >
                            <DropdownList>
                              <DropdownItem
                                isDisabled={!isReportAvailable}
                                onClick={() => handleShowReport(source.id)}
                              >
                                Show assessment report
                              </DropdownItem>
                              <DropdownItem
                                description="Based on this environment"
                                onClick={() =>
                                  handleCreateAssessment(source.id)
                                }
                              >
                                Create new migration assessment
                              </DropdownItem>
                              <DropdownItem
                                isDisabled={
                                  !isUploadAllowed || source.name === "Example"
                                }
                                onClick={() => handleUploadFile(source.id)}
                              >
                                Upload file
                              </DropdownItem>
                              <DropdownItem
                                onClick={() => {
                                  setOpenDropdowns((prev) => ({
                                    ...prev,
                                    [source.id]: false,
                                  }));
                                  onEditEnvironment?.(source.id);
                                }}
                              >
                                Edit environment
                              </DropdownItem>
                              <DropdownItem
                                isDisabled={
                                  vm.isDeletingSource ||
                                  source.name === "Example"
                                }
                                onClick={() => setDeleteTarget(source)}
                              >
                                Delete environment
                              </DropdownItem>
                            </DropdownList>
                          </Dropdown>
                        )}
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={12}>
                    <EmptyState />
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </div>

        {deleteTarget && (
          <ConfirmationModal
            title="Delete Environment"
            titleIconVariant="warning"
            isOpen={Boolean(deleteTarget)}
            isDisabled={vm.isDeletingAndRefreshing}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => {
              if (deleteTarget) {
                handleDelete(deleteTarget);
              }
            }}
            onClose={() => setDeleteTarget(null)}
          >
            Are you sure you want to delete{" "}
            <b>{deleteTarget.name || "this environment"}</b>?
            <br />
            To use it again, create a new discovery image and redeploy it.
          </ConfirmationModal>
        )}
      </div>
    );
  }
};
