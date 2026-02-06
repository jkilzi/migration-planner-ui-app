export interface ExternalStore<TSnapshot> {
  subscribe(listener: () => void): () => void;
  getSnapshot(): TSnapshot;
}

// Repositories that support useSyncExternalStore MUST extend this class.
export abstract class ExternalStoreBase<
  TSnapshot,
> implements ExternalStore<TSnapshot> {
  protected readonly listeners = new Set<() => void>();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  abstract getSnapshot(): TSnapshot;

  protected notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}
