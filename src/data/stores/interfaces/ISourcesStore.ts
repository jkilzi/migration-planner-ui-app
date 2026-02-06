import type { ExternalStore } from "../../../lib/mvvm/ExternalStore";
import type { SourceModel } from "../../../models/SourceModel";
import type { SourceCreateInput, SourceUpdateInput } from "../SourcesStore";

export interface ISourcesStore extends ExternalStore<SourceModel[]> {
  list(signal?: AbortSignal): Promise<SourceModel[]>;
  getById(id: string): SourceModel | undefined;
  create(input: SourceCreateInput, signal?: AbortSignal): Promise<SourceModel>;
  update(input: SourceUpdateInput, signal?: AbortSignal): Promise<SourceModel>;
  delete(id: string, signal?: AbortSignal): Promise<SourceModel>;
  updateInventory(
    sourceId: string,
    inventory: unknown,
    signal?: AbortSignal,
  ): Promise<SourceModel>;
  startPolling(intervalMs: number): void;
  stopPolling(): void;
}
