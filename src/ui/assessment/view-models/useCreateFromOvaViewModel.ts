import { useInjection } from "@migration-planner-ui/ioc";
import React, { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAsyncFn } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import type { SourceModel } from "../../../models/SourceModel";
import { routes } from "../../../routing/Routes";
import { useEnvironmentPage } from "../../environment/view-models/EnvironmentPageContext";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRAFT_KEY = "migration-assessment:create-from-ova-draft";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface CreateFromOvaViewModel {
  // Sources (from EnvironmentPageViewModel)
  sources: SourceModel[];
  sourceCreatedId: string | null;
  createdSource: SourceModel | undefined;
  isDownloadingSource: boolean;
  errorUpdatingInventory?: Error;

  // Form state
  name: string;
  setName: (name: string) => void;
  useExisting: boolean;
  setUseExisting: (val: boolean) => void;
  selectedEnvironmentId: string;
  setSelectedEnvironmentId: (id: string) => void;

  // Modal state
  isSetupModalOpen: boolean;
  setIsSetupModalOpen: (val: boolean) => void;
  isStepsModalOpen: boolean;
  setIsStepsModalOpen: (val: boolean) => void;

  // Submission
  isCreatingAssessment: boolean;
  isCreatingSource: boolean;
  apiError: Error | null;
  setApiError: (err: Error | null) => void;
  uploadMessage: string | null;
  isUploadError: boolean;

  // Computed
  availableEnvironments: SourceModel[];
  selectedEnv: SourceModel | undefined;
  isSelectedNotReady: boolean;
  isSubmitDisabled: boolean;
  hasDuplicateNameError: boolean;
  hasGeneralApiError: boolean;

  // Actions
  handleSubmit: () => Promise<void>;
  handleCancel: () => void;
  handleSetupModalClose: () => void;
  handleSetupModalAfterDownload: () => Promise<void>;

  // Pass-through for child components
  envVm: ReturnType<typeof useEnvironmentPage>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useCreateFromOvaViewModel = (): CreateFromOvaViewModel => {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: { reset?: boolean };
    pathname: string;
    search: string;
    hash?: string;
  };

  // Stores
  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  const envVm = useEnvironmentPage();

  // Form state
  const [name, setName] = React.useState("");
  const [useExisting, setUseExisting] = React.useState(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = React.useState("");

  // Modal state
  const [isSetupModalOpen, setIsSetupModalOpen] = React.useState(false);
  const [isStepsModalOpen, setIsStepsModalOpen] = React.useState(false);

  // Error dismiss flag (cleared on next submission, set when user edits name)
  const [dismissSubmitError, setDismissSubmitError] = React.useState(false);

  // Derive upload feedback from the environment view model
  const uploadMessage = envVm.inventoryUploadResult?.message ?? null;
  const isUploadError = envVm.inventoryUploadResult?.isError ?? false;

  // Init ref
  const hasInitializedRef = React.useRef(false);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const createdSource = envVm.sourceCreatedId
    ? envVm.getSourceById(envVm.sourceCreatedId)
    : undefined;

  const availableEnvironments = useMemo(
    () =>
      envVm.sources
        .filter((source) => source.name !== "Example")
        .slice()
        .sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [envVm.sources],
  );

  const selectedEnv = useMemo(
    () => envVm.sources.find((s) => s.id === selectedEnvironmentId),
    [envVm.sources, selectedEnvironmentId],
  );

  const isSelectedNotReady = Boolean(
    useExisting && selectedEnv && !selectedEnv.isReady,
  );

  const isDuplicateNameError = useCallback(
    (error: Error | null): boolean =>
      !!error &&
      (/assessment with name '.*' already exists/i.test(error.message || "") ||
        /already exists/i.test(error.message || "")),
    [],
  );

  const isSubmitDisabled =
    !name || (useExisting ? !selectedEnvironmentId : !envVm.sourceCreatedId);

  // ---------------------------------------------------------------------------
  // Effects — draft persistence
  // ---------------------------------------------------------------------------

  React.useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    const shouldReset = Boolean(location.state?.reset);
    if (shouldReset) {
      setName("");
      setUseExisting(false);
      setSelectedEnvironmentId("");
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      try {
        navigate(
          `${location.pathname}${location.search}${location.hash || ""}`,
          { replace: true },
        );
      } catch {
        // ignore
      }
      return;
    }
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        name?: string;
        useExisting?: boolean;
        selectedEnvironmentId?: string;
      };
      if (typeof draft.name === "string") setName(draft.name);
      if (typeof draft.useExisting === "boolean")
        setUseExisting(draft.useExisting);
      if (typeof draft.selectedEnvironmentId === "string")
        setSelectedEnvironmentId(draft.selectedEnvironmentId);
    } catch {
      // ignore
    }
  }, [location, navigate]);

  React.useEffect(() => {
    try {
      const draft = { name, useExisting, selectedEnvironmentId };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [name, useExisting, selectedEnvironmentId]);

  React.useEffect(() => {
    envVm.clearInventoryUploadResult();
  }, [selectedEnvironmentId, envVm]);

  React.useEffect(() => {
    if (envVm.assessmentFromAgentState) {
      const preselected = envVm.sourceSelected;
      if (preselected?.id && !useExisting && !selectedEnvironmentId) {
        setUseExisting(true);
        setSelectedEnvironmentId(preselected.id);
      }
    }
  }, [
    envVm.assessmentFromAgentState,
    envVm.sourceSelected,
    envVm.sources,
    useExisting,
    selectedEnvironmentId,
  ]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const [submitState, doSubmit] = useAsyncFn(async () => {
    setDismissSubmitError(false);
    const sourceIdToUse = useExisting
      ? selectedEnvironmentId
      : (envVm.sourceCreatedId ?? "");
    if (!sourceIdToUse) return;

    const assessment = await assessmentsStore.create({
      name,
      sourceType: "agent",
      sourceId: sourceIdToUse,
    });

    if (!assessment?.id) {
      throw new Error("Unexpected response while creating assessment.");
    }

    await assessmentsStore.list();
    navigate(routes.assessmentReport(assessment.id));
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  }, [
    assessmentsStore,
    envVm.sourceCreatedId,
    name,
    navigate,
    selectedEnvironmentId,
    useExisting,
  ]);

  const handleCancel = useCallback(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    navigate(-1);
  }, [navigate]);

  const [refreshAfterCloseState, doRefreshAfterClose] = useAsyncFn(async () => {
    const newId = envVm.sourceCreatedId;
    await envVm.listSources();
    if (newId) {
      setUseExisting(true);
      setSelectedEnvironmentId(newId);
    }
  }, [envVm]);

  const handleSetupModalClose = useCallback(() => {
    setIsSetupModalOpen(false);
    void doRefreshAfterClose();
  }, [doRefreshAfterClose]);

  const [, doRefreshAfterDownload] = useAsyncFn(async () => {
    const newId = envVm.sourceCreatedId;
    await envVm.listSources();
    if (newId) {
      setUseExisting(true);
      setSelectedEnvironmentId(newId);
    }
  }, [envVm]);

  // ---- Derived error state -------------------------------------------------

  const apiError =
    submitState.loading || dismissSubmitError
      ? null
      : (submitState.error ?? null);

  const hasDuplicateNameError = isDuplicateNameError(apiError);
  const hasGeneralApiError = !!apiError && !isDuplicateNameError(apiError);

  return {
    sources: envVm.sources,
    sourceCreatedId: envVm.sourceCreatedId,
    createdSource,
    isDownloadingSource: envVm.isDownloadingSource,
    errorUpdatingInventory: envVm.errorUpdatingInventory,

    name,
    setName,
    useExisting,
    setUseExisting,
    selectedEnvironmentId,
    setSelectedEnvironmentId,

    isSetupModalOpen,
    setIsSetupModalOpen,
    isStepsModalOpen,
    setIsStepsModalOpen,

    isCreatingAssessment: submitState.loading,
    isCreatingSource: refreshAfterCloseState.loading,
    apiError,
    setApiError: (_err: Error | null) => setDismissSubmitError(true),
    uploadMessage,
    isUploadError,

    availableEnvironments,
    selectedEnv,
    isSelectedNotReady,
    isSubmitDisabled,
    hasDuplicateNameError,
    hasGeneralApiError,

    handleSubmit: doSubmit,
    handleCancel,
    handleSetupModalClose,
    handleSetupModalAfterDownload: doRefreshAfterDownload,

    envVm,
  };
};
