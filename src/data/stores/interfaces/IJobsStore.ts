import type { Job } from "@migration-planner-ui/api-client/models";

import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";
import type { JobsStoreState } from "../JobsStore";

export interface IJobsStore extends ExternalStore<JobsStoreState> {
  createRVToolsJob(name: string, file: File): Promise<Job | undefined>;
  cancelRVToolsJob(): Promise<Job | null>;
  reset(): void;
  startPolling(intervalMs: number): void;
  stopPolling(): void;
}
