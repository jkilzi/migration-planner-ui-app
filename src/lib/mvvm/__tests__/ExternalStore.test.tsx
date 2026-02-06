import { act, render, screen } from "@testing-library/react";
import { useState, useSyncExternalStore } from "react";
import { describe, expect, it, vi } from "vitest";

import { ExternalStoreBase } from "../ExternalStore";

// Minimal derived store for testing: mutable count, notify() on increment.
class CounterStore extends ExternalStoreBase<number> {
  private count = 0;

  getSnapshot(): number {
    return this.value;
  }

  incrementBy(amount: number): void {
    this.value += amount;
  }

  get value(): number {
    return this.count;
  }

  private set value(value: number) {
    this.count = value;
    this.notify();
  }
}

describe("ExternalStore", () => {
  describe("ExternalStoreBase", () => {
    it("subscribe adds listener and unsubscribe removes it", () => {
      const store = new CounterStore();
      const listener = vi.fn();

      const unsubscribe = store.subscribe(listener);
      expect(listener).not.toHaveBeenCalled();

      store.incrementBy(1);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.incrementBy(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("getSnapshot returns current state", () => {
      const store = new CounterStore();
      expect(store.getSnapshot()).toBe(0);
      store.incrementBy(1);
      expect(store.getSnapshot()).toBe(1);
      store.incrementBy(1);
      expect(store.getSnapshot()).toBe(2);
    });

    it("notify calls all subscribed listeners once", () => {
      const store = new CounterStore();
      const a = vi.fn();
      const b = vi.fn();
      store.subscribe(a);
      store.subscribe(b);

      store.incrementBy(1);

      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });
  });

  describe("useSyncExternalStore with derived ExternalStoreBase", () => {
    it("component receives store updates when store notifies", () => {
      const store = new CounterStore();

      function Reader() {
        useSyncExternalStore(
          store.subscribe.bind(store),
          store.getSnapshot.bind(store),
          store.getSnapshot.bind(store),
        );
        return <span data-testid="count">{store.value}</span>;
      }

      render(<Reader />);
      expect(screen.getByTestId("count")).toHaveTextContent("0");

      act(() => {
        store.incrementBy(1);
      });
      expect(screen.getByTestId("count")).toHaveTextContent("1");

      act(() => {
        store.incrementBy(1);
        store.incrementBy(1);
      });
      expect(screen.getByTestId("count")).toHaveTextContent("3");
    });

    it("keeps state in sync when component rerenders from parent state", () => {
      const store = new CounterStore();
      store.incrementBy(10);

      function Reader() {
        useSyncExternalStore(
          store.subscribe.bind(store),
          store.getSnapshot.bind(store),
        );
        return <span data-testid="count">{store.value}</span>;
      }

      function Parent() {
        const [tick, setTick] = useState(0);
        return (
          <>
            <button
              type="button"
              onClick={() => setTick((t) => t + 1)}
              data-testid="rerender"
            >
              Rerender ({tick})
            </button>
            <Reader />
          </>
        );
      }

      render(<Parent />);
      expect(screen.getByTestId("count")).toHaveTextContent("10");

      // Change store after first render
      act(() => {
        store.incrementBy(20);
      });
      expect(screen.getByTestId("count")).toHaveTextContent("30");

      // Force rerender by clicking (parent state update) — reader must still show 30
      act(() => {
        screen.getByTestId("rerender").click();
      });
      expect(screen.getByTestId("count")).toHaveTextContent("30");
    });
  });
});
