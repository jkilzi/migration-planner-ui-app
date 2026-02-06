import type { AssessmentApiInterface } from "@migration-planner-ui/api-client/apis";
import type { Assessment } from "@migration-planner-ui/api-client/models";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AssessmentsStore } from "../AssessmentsStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeAssessment = (overrides: Partial<Assessment> = {}): Assessment =>
  ({
    id: "a-1",
    name: "Test Assessment",
    snapshots: [],
    ...overrides,
  }) as Assessment;

const createMockApi = (): AssessmentApiInterface =>
  ({
    listAssessments: vi.fn(),
    createAssessment: vi.fn(),
    updateAssessment: vi.fn(),
    deleteAssessment: vi.fn(),
    calculateAssessmentClusterRequirements: vi.fn(),
  }) as unknown as AssessmentApiInterface;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AssessmentsStore", () => {
  let api: AssessmentApiInterface;
  let store: AssessmentsStore;

  beforeEach(() => {
    vi.useFakeTimers();
    api = createMockApi();
    store = new AssessmentsStore(api);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initial snapshot is empty array", () => {
    expect(store.getSnapshot()).toEqual([]);
  });

  it("list() normalizes array response", async () => {
    const items = [
      makeAssessment({ id: "a-1", name: "A" }),
      makeAssessment({ id: "a-2", name: "B" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(items as never);

    const result = await store.list();

    expect(api.listAssessments).toHaveBeenCalledWith(
      { sourceId: undefined },
      undefined,
    );
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("a-1");
    expect(result[0].name).toBe("A");
    expect(result[0]).toHaveProperty("ownerFullName");
    expect(result[0]).toHaveProperty("hasUsefulData");
  });

  it("list() normalizes {items} response", async () => {
    const items = [makeAssessment({ id: "a-1", name: "Item" })];
    vi.mocked(api.listAssessments).mockResolvedValue({
      items,
    } as never);

    const result = await store.list();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a-1");
    expect(result[0].name).toBe("Item");
  });

  it("list() normalizes {assessments} response", async () => {
    const assessments = [makeAssessment({ id: "a-1", name: "Assessment" })];
    vi.mocked(api.listAssessments).mockResolvedValue({
      assessments,
    } as never);

    const result = await store.list();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a-1");
    expect(result[0].name).toBe("Assessment");
  });

  it("list() maps results to AssessmentModel (has ownerFullName, hasUsefulData etc.)", async () => {
    const raw = makeAssessment({
      id: "a-1",
      name: "Test",
      ownerFirstName: "john",
      ownerLastName: "doe",
    });
    vi.mocked(api.listAssessments).mockResolvedValue([raw] as never);

    const result = await store.list();

    expect(result[0].ownerFullName).toBe("John Doe");
    expect(typeof result[0].hasUsefulData).toBe("boolean");
    expect(result[0]).toHaveProperty("latestSnapshot");
    expect(result[0]).toHaveProperty("snapshotsSorted");
  });

  it("getById() returns found item or undefined", async () => {
    const items = [
      makeAssessment({ id: "a-1" }),
      makeAssessment({ id: "a-2" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(items as never);
    await store.list();

    expect(store.getById("a-1")).toBeDefined();
    expect(store.getById("a-1")?.id).toBe("a-1");
    expect(store.getById("a-2")?.id).toBe("a-2");
    expect(store.getById("a-3")).toBeUndefined();
  });

  it("create() adds new item", async () => {
    const created = makeAssessment({ id: "a-1", name: "New" });
    vi.mocked(api.createAssessment).mockResolvedValue(created as never);

    const form = { name: "New" } as Parameters<
      AssessmentApiInterface["createAssessment"]
    >[0]["assessmentForm"];
    const result = await store.create(form);

    expect(api.createAssessment).toHaveBeenCalledWith(
      { assessmentForm: form },
      undefined,
    );
    expect(result.id).toBe("a-1");
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].name).toBe("New");
  });

  it("update() replaces existing item", async () => {
    const initial = makeAssessment({ id: "a-1", name: "Old" });
    vi.mocked(api.listAssessments).mockResolvedValue([initial] as never);
    await store.list();

    const updated = makeAssessment({ id: "a-1", name: "Updated" });
    vi.mocked(api.updateAssessment).mockResolvedValue(updated as never);

    const form = {} as Parameters<
      AssessmentApiInterface["updateAssessment"]
    >[0]["assessmentUpdate"];
    const result = await store.update("a-1", form);

    expect(api.updateAssessment).toHaveBeenCalledWith(
      { id: "a-1", assessmentUpdate: form },
      undefined,
    );
    expect(result.name).toBe("Updated");
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].name).toBe("Updated");
  });

  it("remove() filters out item", async () => {
    const items = [
      makeAssessment({ id: "a-1" }),
      makeAssessment({ id: "a-2" }),
    ];
    vi.mocked(api.listAssessments).mockResolvedValue(items as never);
    await store.list();

    vi.mocked(api.deleteAssessment).mockResolvedValue(
      makeAssessment({ id: "a-1" }) as never,
    );

    const result = await store.remove("a-1");

    expect(api.deleteAssessment).toHaveBeenCalledWith({ id: "a-1" }, undefined);
    expect(result.id).toBe("a-1");
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("a-2");
  });

  it("subscribe — listener called on mutation", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    const created = makeAssessment({ id: "a-1" });
    vi.mocked(api.createAssessment).mockResolvedValue(created as never);
    const form = { name: "New" } as Parameters<
      AssessmentApiInterface["createAssessment"]
    >[0]["assessmentForm"];
    await store.create(form);

    expect(listener).toHaveBeenCalled();
  });

  it("polling — startPolling triggers periodic list()", async () => {
    vi.mocked(api.listAssessments)
      .mockResolvedValueOnce([makeAssessment({ id: "a-1" })] as never)
      .mockResolvedValueOnce([
        makeAssessment({ id: "a-1" }),
        makeAssessment({ id: "a-2" }),
      ] as never);

    store.startPolling(1000);
    expect(store.getSnapshot()).toEqual([]);

    await vi.advanceTimersByTimeAsync(1000);
    expect(api.listAssessments).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(api.listAssessments).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toHaveLength(2);

    store.stopPolling();
  });
});
