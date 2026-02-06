import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PollableStoreBase } from "../PollableStore";

// Concrete test implementation that tracks poll calls.
class TestPollableStore extends PollableStoreBase<number> {
  private count = 0;
  readonly pollCalls: AbortSignal[] = [];
  pollImplementation: (signal: AbortSignal) => Promise<void> = () =>
    Promise.resolve();

  getSnapshot(): number {
    return this.count;
  }

  increment(): void {
    this.count += 1;
    this.notify();
  }

  protected override async poll(signal: AbortSignal): Promise<void> {
    this.pollCalls.push(signal);
    return this.pollImplementation(signal);
  }
}

describe("PollableStoreBase", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("isPolling is false by default", () => {
    const store = new TestPollableStore();
    expect(store.isPolling).toBe(false);
  });

  it("isPolling becomes true after startPolling and false after stopPolling", () => {
    const store = new TestPollableStore();

    store.startPolling(1000);
    expect(store.isPolling).toBe(true);

    store.stopPolling();
    expect(store.isPolling).toBe(false);
  });

  it("calls poll at the specified interval", async () => {
    const store = new TestPollableStore();

    store.startPolling(500);
    expect(store.pollCalls).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(500);
    expect(store.pollCalls).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(500);
    expect(store.pollCalls).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(500);
    expect(store.pollCalls).toHaveLength(3);

    store.stopPolling();
  });

  it("does not call poll after stopPolling", async () => {
    const store = new TestPollableStore();

    store.startPolling(500);
    await vi.advanceTimersByTimeAsync(500);
    expect(store.pollCalls).toHaveLength(1);

    store.stopPolling();

    await vi.advanceTimersByTimeAsync(1500);
    expect(store.pollCalls).toHaveLength(1);
  });

  it("provides an AbortSignal to poll", async () => {
    const store = new TestPollableStore();

    store.startPolling(100);
    await vi.advanceTimersByTimeAsync(100);

    expect(store.pollCalls).toHaveLength(1);
    expect(store.pollCalls[0]).toBeInstanceOf(AbortSignal);
    expect(store.pollCalls[0].aborted).toBe(false);

    store.stopPolling();
  });

  it("aborts the previous signal when a new poll tick fires", async () => {
    const store = new TestPollableStore();

    // Make poll take longer than the interval so ticks overlap
    store.pollImplementation = () =>
      new Promise((resolve) => setTimeout(resolve, 200));

    store.startPolling(100);

    await vi.advanceTimersByTimeAsync(100);
    expect(store.pollCalls).toHaveLength(1);
    const firstSignal = store.pollCalls[0];
    expect(firstSignal.aborted).toBe(false);

    // Second tick fires — first signal should be aborted
    await vi.advanceTimersByTimeAsync(100);
    expect(store.pollCalls).toHaveLength(2);
    expect(firstSignal.aborted).toBe(true);
    expect(store.pollCalls[1].aborted).toBe(false);

    store.stopPolling();
  });

  it("aborts the in-flight signal when stopPolling is called", async () => {
    const store = new TestPollableStore();

    store.pollImplementation = () =>
      new Promise((resolve) => setTimeout(resolve, 5000));

    store.startPolling(100);
    await vi.advanceTimersByTimeAsync(100);

    const signal = store.pollCalls[0];
    expect(signal.aborted).toBe(false);

    store.stopPolling();
    expect(signal.aborted).toBe(true);
  });

  it("restarts polling when startPolling is called again", async () => {
    const store = new TestPollableStore();

    store.startPolling(1000);
    await vi.advanceTimersByTimeAsync(1000);
    expect(store.pollCalls).toHaveLength(1);

    // Restart with a shorter interval
    store.startPolling(200);
    await vi.advanceTimersByTimeAsync(200);
    expect(store.pollCalls).toHaveLength(2);

    // Old interval should not fire additional calls
    await vi.advanceTimersByTimeAsync(800);
    // 800ms / 200ms = 4 more ticks
    expect(store.pollCalls).toHaveLength(6);

    store.stopPolling();
  });

  it("logs errors from poll without stopping the timer", async () => {
    const store = new TestPollableStore();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const testError = new Error("network failure");
    store.pollImplementation = () => Promise.reject(testError);

    store.startPolling(100);
    await vi.advanceTimersByTimeAsync(100);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Polling failed"),
      testError,
    );

    // Polling should continue despite the error
    expect(store.isPolling).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
    expect(store.pollCalls).toHaveLength(2);

    store.stopPolling();
    consoleErrorSpy.mockRestore();
  });

  it("silently swallows AbortError without logging", async () => {
    const store = new TestPollableStore();
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    store.pollImplementation = () =>
      Promise.reject(new DOMException("Aborted", "AbortError"));

    store.startPolling(100);
    await vi.advanceTimersByTimeAsync(100);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(store.isPolling).toBe(true);

    store.stopPolling();
    consoleErrorSpy.mockRestore();
  });

  it("still works as an ExternalStoreBase (subscribe/getSnapshot/notify)", () => {
    const store = new TestPollableStore();
    const listener = vi.fn();

    expect(store.getSnapshot()).toBe(0);

    const unsubscribe = store.subscribe(listener);
    store.increment();

    expect(store.getSnapshot()).toBe(1);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.increment();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toBe(2);
  });
});
