import { useInjection } from "@migration-planner-ui/ioc";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useAsyncFn, useMount, useUnmount } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import type { IImagesStore } from "../../../data/stores/interfaces/IImagesStore";
import type { ISourcesStore } from "../../../data/stores/interfaces/ISourcesStore";
import type {
  SourceCreateInput,
  SourceUpdateInput,
} from "../../../data/stores/SourcesStore";
import { DEFAULT_POLLING_DELAY } from "../../../lib/mvvm/PollableStore";
import type { AssessmentModel } from "../../../models/AssessmentModel";
import type { SourceModel } from "../../../models/SourceModel";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface EnvironmentPageViewModel {
  // Data (reactive from stores)
  sources: SourceModel[];
  assessments: AssessmentModel[];

  // Source selection
  sourceSelected: SourceModel | null;
  selectSource: (source: SourceModel | null) => void;
  selectSourceById: (id: string) => void;
  getSourceById: (id: string) => SourceModel | undefined;

  // Source listing
  listSources: () => Promise<SourceModel[]>;
  isLoadingSources: boolean;
  errorLoadingSources?: Error;

  // Source deletion
  deleteSource: (id: string) => Promise<SourceModel>;
  isDeletingSource: boolean;

  // Create download source flow (create source → head image → get URL)
  createDownloadSource: (input: SourceCreateInput) => Promise<void>;
  isDownloadingSource: boolean;
  errorDownloadingSource?: Error;
  downloadSourceUrl: string;
  setDownloadUrl: (url: string) => void;
  sourceCreatedId: string | null;
  deleteSourceCreated: () => void;

  // Update source flow (update source → head image → get URL)
  updateSource: (input: SourceUpdateInput) => Promise<void>;
  isUpdatingSource: boolean;
  errorUpdatingSource?: Error;

  // Inventory upload (file-picker flow)
  uploadInventoryFromFile: (sourceId: string) => void;
  isUpdatingInventory: boolean;
  errorUpdatingInventory?: Error;
  inventoryUploadResult: { message: string; isError: boolean } | null;
  clearInventoryUploadResult: () => void;

  // Download URLs (cached by ImagesStore)
  getDownloadUrlForSource: (sourceId: string) => string | undefined;

  // Assessments
  listAssessments: () => Promise<AssessmentModel[]>;
  isLoadingAssessments: boolean;

  // Misc
  assessmentFromAgentState: boolean;
  setAssessmentFromAgent: (value: boolean) => void;
  clearErrors: (options?: {
    downloading?: boolean;
    updating?: boolean;
    creating?: boolean;
  }) => void;

  // Composite actions
  deleteAndRefresh: (id: string) => Promise<SourceModel[]>;
  isDeletingAndRefreshing: boolean;
  refreshOnFocus: () => Promise<void>;

  // Polling lifecycle
  startPolling: (delay?: number) => void;
  stopPolling: () => void;
}

// ---------------------------------------------------------------------------
// Stable empty references to avoid re-renders
// ---------------------------------------------------------------------------

const EMPTY_SOURCES: SourceModel[] = [];
const EMPTY_ASSESSMENTS: AssessmentModel[] = [];

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------

export const useEnvironmentPageViewModel = (): EnvironmentPageViewModel => {
  // ---- Stores --------------------------------------------------------------
  const sourcesStore = useInjection<ISourcesStore>(Symbols.SourcesStore);
  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  const imagesStore = useInjection<IImagesStore>(Symbols.ImagesStore);

  // ---- Reactive store data -------------------------------------------------
  const sources =
    useSyncExternalStore(
      sourcesStore.subscribe.bind(sourcesStore),
      sourcesStore.getSnapshot.bind(sourcesStore),
    ) ?? EMPTY_SOURCES;

  const assessments =
    useSyncExternalStore(
      assessmentsStore.subscribe.bind(assessmentsStore),
      assessmentsStore.getSnapshot.bind(assessmentsStore),
    ) ?? EMPTY_ASSESSMENTS;

  // ---- Local UI state ------------------------------------------------------
  const [sourceSelected, setSourceSelected] = useState<SourceModel | null>(
    null,
  );
  const [downloadSourceUrl, setDownloadSourceUrlRaw] = useState("");
  const [sourceCreatedId, setSourceCreatedId] = useState<string | null>(null);
  const [assessmentFromAgentState, setAssessmentFromAgent] = useState(false);

  // Error-dismiss flags
  const [dismissDownloadError, setDismissDownloadError] = useState(false);
  const [dismissUpdateError, setDismissUpdateError] = useState(false);

  // ---- Polling lifecycle ---------------------------------------------------
  const startPolling = useCallback(
    (delay: number = DEFAULT_POLLING_DELAY) => {
      sourcesStore.startPolling(delay);
      assessmentsStore.startPolling(delay);
    },
    [sourcesStore, assessmentsStore],
  );

  const stopPolling = useCallback(() => {
    sourcesStore.stopPolling();
    assessmentsStore.stopPolling();
  }, [sourcesStore, assessmentsStore]);

  useMount(() => {
    startPolling();
    void Promise.all([sourcesStore.list(), assessmentsStore.list()]);
  });

  useUnmount(() => {
    stopPolling();
  });

  // ---- Source selection ----------------------------------------------------
  const selectSource = useCallback(
    (source: SourceModel | null) => setSourceSelected(source),
    [],
  );

  const selectSourceById = useCallback(
    (id: string) => {
      const found = sourcesStore.getById(id);
      if (found) {
        setSourceSelected(found);
      } else {
        // Source not loaded yet — fetch then select
        void sourcesStore.list().then(() => {
          setSourceSelected(sourcesStore.getById(id) ?? null);
        });
      }
    },
    [sourcesStore],
  );

  const getSourceById = useCallback(
    (id: string): SourceModel | undefined => sourcesStore.getById(id),
    [sourcesStore],
  );

  // ---- Source listing ------------------------------------------------------
  const [listSourcesState, doListSources] = useAsyncFn(
    async () => sourcesStore.list(),
    [sourcesStore],
  );

  // ---- Source deletion -----------------------------------------------------
  const [deleteSourceState, doDeleteSource] = useAsyncFn(
    async (id: string) => sourcesStore.delete(id),
    [sourcesStore],
  );

  // ---- Create download source flow ----------------------------------------
  const [createDownloadState, doCreateDownloadSource] = useAsyncFn(
    async (input: SourceCreateInput): Promise<void> => {
      setDismissDownloadError(false);
      const newSource = await sourcesStore.create(input);
      await imagesStore.headImage(newSource.id);
      const url = await imagesStore.getDownloadUrl(newSource.id);
      setDownloadSourceUrlRaw(url);
      setSourceCreatedId(newSource.id);
    },
    [sourcesStore, imagesStore],
  );

  // ---- Update source flow --------------------------------------------------
  const [updateSourceState, doUpdateSource] = useAsyncFn(
    async (input: SourceUpdateInput): Promise<void> => {
      setDismissUpdateError(false);
      const updated = await sourcesStore.update(input);
      await imagesStore.headImage(updated.id);
      const url = await imagesStore.getDownloadUrl(updated.id);
      setDownloadSourceUrlRaw(url);
    },
    [sourcesStore, imagesStore],
  );

  // ---- Inventory upload (file-picker flow) ---------------------------------
  const [inventoryUploadResult, setInventoryUploadResult] = useState<{
    message: string;
    isError: boolean;
  } | null>(null);

  const clearInventoryUploadResult = useCallback(() => {
    setInventoryUploadResult(null);
  }, []);

  const [updateInventoryState, doUpdateInventory] = useAsyncFn(
    async (sourceId: string, jsonContent: string): Promise<SourceModel> => {
      const payload = JSON.parse(jsonContent) as unknown;
      return sourcesStore.updateInventory(sourceId, payload);
    },
    [sourcesStore],
  );

  const uploadInventoryFromFile = useCallback(
    (sourceId: string): void => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.style.visibility = "hidden";

      input.onchange = async (event: Event): Promise<void> => {
        const file = (event.target as HTMLInputElement)?.files?.[0];
        if (!file) return;

        const maxSize = 12_582_912; // 12 MiB
        if (file.size > maxSize) {
          setInventoryUploadResult({
            message: "The file is too big. Upload a file up to 12 MiB.",
            isError: true,
          });
          return;
        }

        const fileExtension = file.name.toLowerCase().split(".").pop();

        try {
          if (fileExtension === "json") {
            const content = await file.text();
            try {
              const res = (await doUpdateInventory(
                sourceId,
                content,
              )) as unknown as { id?: string } | undefined;

              if (!res || !res.id) {
                setInventoryUploadResult({
                  message:
                    "The uploaded file is using an old schema version and cannot be parsed." +
                    "Generate a new OVA file, import to your vSphere environment and then try to upload it again.",
                  isError: true,
                });
                return;
              }

              setInventoryUploadResult({
                message: "Discovery file uploaded successfully",
                isError: false,
              });
            } catch (error: unknown) {
              const message =
                (error as { message?: string })?.message ||
                "Failed to upload the inventory file";
              setInventoryUploadResult({ message, isError: true });
              return;
            }
          } else {
            setInventoryUploadResult({
              message: "Unsupported file format. Please upload a JSON file.",
              isError: true,
            });
          }
        } catch {
          setInventoryUploadResult({
            message: "Failed to import file. Please check the file format.",
            isError: true,
          });
        } finally {
          input.remove();
          await doListSources();
        }
      };

      document.body.appendChild(input);
      input.click();
    },
    [doUpdateInventory, doListSources],
  );

  // ---- Download URLs -------------------------------------------------------
  const getDownloadUrlForSource = useCallback(
    (sourceId: string): string | undefined =>
      imagesStore.getDownloadUrlFromCache(sourceId),
    [imagesStore],
  );

  // ---- Assessments ---------------------------------------------------------
  const [listAssessmentsState, doListAssessments] = useAsyncFn(
    async () => assessmentsStore.list(),
    [assessmentsStore],
  );

  // ---- Composite actions ---------------------------------------------------
  const [deleteAndRefreshState, doDeleteAndRefresh] = useAsyncFn(
    async (id: string) => {
      await sourcesStore.delete(id);
      return sourcesStore.list();
    },
    [sourcesStore],
  );

  const [, doRefreshOnFocus] = useAsyncFn(async () => {
    await Promise.all([sourcesStore.list(), assessmentsStore.list()]);
  }, [sourcesStore, assessmentsStore]);

  // ---- Helpers -------------------------------------------------------------
  const setDownloadUrl = useCallback((url: string) => {
    setDownloadSourceUrlRaw(url);
  }, []);

  const deleteSourceCreated = useCallback(() => {
    setSourceCreatedId(null);
  }, []);

  const clearErrors = useCallback(
    (options?: {
      downloading?: boolean;
      updating?: boolean;
      creating?: boolean;
    }) => {
      const { downloading, updating, creating } = options ?? {};
      if (!options || downloading || creating) setDismissDownloadError(true);
      if (!options || updating) setDismissUpdateError(true);
    },
    [],
  );

  // ---- Return --------------------------------------------------------------
  return {
    sources,
    assessments,

    sourceSelected,
    selectSource,
    selectSourceById,
    getSourceById,

    listSources: doListSources,
    isLoadingSources: listSourcesState.loading,
    errorLoadingSources: listSourcesState.error,

    deleteSource: doDeleteSource,
    isDeletingSource: deleteSourceState.loading,

    createDownloadSource: doCreateDownloadSource,
    isDownloadingSource: createDownloadState.loading,
    errorDownloadingSource:
      createDownloadState.loading || dismissDownloadError
        ? undefined
        : createDownloadState.error,
    downloadSourceUrl,
    setDownloadUrl,
    sourceCreatedId,
    deleteSourceCreated,

    updateSource: doUpdateSource,
    isUpdatingSource: updateSourceState.loading,
    errorUpdatingSource:
      updateSourceState.loading || dismissUpdateError
        ? undefined
        : updateSourceState.error,

    uploadInventoryFromFile,
    isUpdatingInventory: updateInventoryState.loading,
    errorUpdatingInventory: updateInventoryState.error,
    inventoryUploadResult,
    clearInventoryUploadResult,

    getDownloadUrlForSource,

    listAssessments: doListAssessments,
    isLoadingAssessments: listAssessmentsState.loading,

    assessmentFromAgentState,
    setAssessmentFromAgent,
    clearErrors,

    deleteAndRefresh: doDeleteAndRefresh,
    isDeletingAndRefreshing: deleteAndRefreshState.loading,
    refreshOnFocus: doRefreshOnFocus,

    startPolling,
    stopPolling,
  };
};
