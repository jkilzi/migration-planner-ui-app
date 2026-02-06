import type { Snapshot as SnapshotApi } from "@migration-planner-ui/api-client/models";
import { useInjection } from "@migration-planner-ui/ioc";
import { useMemo, useSyncExternalStore } from "react";
import { useParams } from "react-router-dom";
import { useMount } from "react-use";

import { Symbols } from "../../../config/Dependencies";
import type { IAssessmentsStore } from "../../../data/stores/interfaces/IAssessmentsStore";
import type { ISourcesStore } from "../../../data/stores/interfaces/ISourcesStore";
import type { AssessmentModel } from "../../../models/AssessmentModel";
import type { SnapshotData } from "../../../models/SnapshotParser";
import type { SourceModel } from "../../../models/SourceModel";

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface AssessmentDetailsViewModel {
  id: string | undefined;
  assessment: AssessmentModel | undefined;
  source: SourceModel | undefined;
  agent: SourceModel["agent"] | undefined;
  isLoading: boolean;
  snapshotsSorted: SnapshotApi[];
  latest: SnapshotData;
}

// ---------------------------------------------------------------------------
// Stable empty references
// ---------------------------------------------------------------------------

const EMPTY_ASSESSMENTS: AssessmentModel[] = [];
const EMPTY_SOURCES: SourceModel[] = [];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useAssessmentDetailsViewModel = (): AssessmentDetailsViewModel => {
  const { id } = useParams<{ id: string }>();

  const assessmentsStore = useInjection<IAssessmentsStore>(
    Symbols.AssessmentsStore,
  );
  const sourcesStore = useInjection<ISourcesStore>(Symbols.SourcesStore);

  const assessments =
    useSyncExternalStore(
      assessmentsStore.subscribe.bind(assessmentsStore),
      assessmentsStore.getSnapshot.bind(assessmentsStore),
    ) ?? EMPTY_ASSESSMENTS;

  const sources =
    useSyncExternalStore(
      sourcesStore.subscribe.bind(sourcesStore),
      sourcesStore.getSnapshot.bind(sourcesStore),
    ) ?? EMPTY_SOURCES;

  // Initial fetch
  useMount(() => {
    if (assessments.length === 0) {
      void assessmentsStore.list();
    }
    if (sources.length === 0) {
      void sourcesStore.list();
    }
  });

  const assessment = useMemo(
    () => assessments.find((a) => String(a.id) === String(id)),
    [assessments, id],
  );

  const source = useMemo(() => {
    if (!assessment?.sourceId) return undefined;
    return sources.find((s) => s.id === assessment.sourceId);
  }, [assessment, sources]);

  const agent = useMemo(() => source?.agent, [source]);

  const isLoading = assessments.length === 0;

  return {
    id,
    assessment,
    source,
    agent,
    isLoading,
    // Delegate to model's pre-computed properties
    snapshotsSorted: assessment?.snapshotsSorted ?? [],
    latest: assessment?.latestSnapshot ?? {
      hosts: "-",
      vms: "-",
      networks: "-",
      datastores: "-",
      lastUpdated: "-",
    },
  };
};
