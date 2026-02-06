import { beforeEach, describe, expect, it, vi } from "vitest";

import { sleep, Time } from "../Time";

// ---------------------------------------------------------------------------
// Tests — Time constants
// ---------------------------------------------------------------------------

describe("Time constants", () => {
  it("Millisecond equals 1", () => {
    expect(Time.Millisecond).toBe(1);
  });

  it("Second equals 1000", () => {
    expect(Time.Second).toBe(1000);
  });

  it("Minute equals 60 × 1000", () => {
    expect(Time.Minute).toBe(60_000);
  });

  it("Hour equals 60 × 60 × 1000", () => {
    expect(Time.Hour).toBe(3_600_000);
  });

  it("Day equals 24 × 60 × 60 × 1000", () => {
    expect(Time.Day).toBe(86_400_000);
  });

  it("Week equals 7 × 24 × 60 × 60 × 1000", () => {
    expect(Time.Week).toBe(604_800_000);
  });

  it("constants are consistent with each other", () => {
    expect(Time.Second).toBe(1000 * Time.Millisecond);
    expect(Time.Minute).toBe(60 * Time.Second);
    expect(Time.Hour).toBe(60 * Time.Minute);
    expect(Time.Day).toBe(24 * Time.Hour);
    expect(Time.Week).toBe(7 * Time.Day);
  });
});

// ---------------------------------------------------------------------------
// Tests — sleep
// ---------------------------------------------------------------------------

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("returns a promise", () => {
    const result = sleep(100);
    expect(result).toBeInstanceOf(Promise);
    vi.advanceTimersByTime(100);
  });

  it("resolves after the specified delay", async () => {
    let resolved = false;
    const p = sleep(500).then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);
    vi.advanceTimersByTime(499);
    await Promise.resolve(); // flush microtasks
    expect(resolved).toBe(false);

    vi.advanceTimersByTime(1);
    await p;
    expect(resolved).toBe(true);
  });

  it("resolves with undefined", async () => {
    const p = sleep(10);
    vi.advanceTimersByTime(10);
    await expect(p).resolves.toBeUndefined();
  });
});
