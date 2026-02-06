import type { SourceApiInterface } from "@migration-planner-ui/api-client/apis";
import type { Source } from "@migration-planner-ui/api-client/models";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SourcesStore } from "../SourcesStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSource = (overrides: Partial<Source> = {}): Source =>
  ({
    id: "s-1",
    name: "Test Source",
    ...overrides,
  }) as Source;

const createMockApi = (): SourceApiInterface =>
  ({
    listSources: vi.fn(),
    createSource: vi.fn(),
    updateSource: vi.fn(),
    deleteSource: vi.fn(),
    updateInventory: vi.fn(),
  }) as unknown as SourceApiInterface;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SourcesStore", () => {
  let api: SourceApiInterface;
  let store: SourcesStore;

  beforeEach(() => {
    vi.useFakeTimers();
    api = createMockApi();
    store = new SourcesStore(api);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initial snapshot is empty array", () => {
    expect(store.getSnapshot()).toEqual([]);
  });

  it("list() maps to SourceModel (has isReady, isConnected, displayStatus)", async () => {
    const raw = makeSource({
      id: "s-1",
      name: "VMware",
      agent: { status: "up-to-date" } as Source["agent"],
    });
    vi.mocked(api.listSources).mockResolvedValue([raw] as never);

    const result = await store.list();

    expect(result[0].id).toBe("s-1");
    expect(result[0]).toHaveProperty("isReady");
    expect(result[0]).toHaveProperty("isConnected");
    expect(result[0]).toHaveProperty("displayStatus");
    expect(result[0].displayStatus).toBe("up-to-date");
    expect(result[0].isConnected).toBe(true);
  });

  it("getById() returns item or undefined", async () => {
    const items = [makeSource({ id: "s-1" }), makeSource({ id: "s-2" })];
    vi.mocked(api.listSources).mockResolvedValue(items as never);
    await store.list();

    expect(store.getById("s-1")).toBeDefined();
    expect(store.getById("s-1")?.id).toBe("s-1");
    expect(store.getById("s-3")).toBeUndefined();
  });

  it("create() adds new source", async () => {
    const created = makeSource({
      id: "s-1",
      name: "New Source",
    });
    vi.mocked(api.createSource).mockResolvedValue(created as never);

    const input = {
      name: "New Source",
      sshPublicKey: "ssh-key",
      httpProxy: "",
      httpsProxy: "",
      noProxy: "",
    };
    const result = await store.create(input);

    expect(api.createSource).toHaveBeenCalledWith(
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Vitest matcher
        sourceCreate: expect.objectContaining({
          name: "New Source",
          sshPublicKey: "ssh-key",
        }),
      },
      { signal: undefined },
    );
    expect(result.id).toBe("s-1");
    expect(store.getSnapshot()).toHaveLength(1);
  });

  it("update() replaces source", async () => {
    const initial = makeSource({ id: "s-1", name: "Old" });
    vi.mocked(api.listSources).mockResolvedValue([initial] as never);
    await store.list();

    const updated = makeSource({ id: "s-1", name: "Updated" });
    vi.mocked(api.updateSource).mockResolvedValue(updated as never);

    const input = {
      sourceId: "s-1",
      sshPublicKey: "new-key",
      httpProxy: "",
      httpsProxy: "",
      noProxy: "",
    };
    const result = await store.update(input);

    expect(api.updateSource).toHaveBeenCalledWith(
      {
        id: "s-1",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Vitest matcher
        sourceUpdate: expect.objectContaining({ sshPublicKey: "new-key" }),
      },
      { signal: undefined },
    );
    expect(result.name).toBe("Updated");
    expect(store.getSnapshot()[0].name).toBe("Updated");
  });

  it("delete() removes source", async () => {
    const items = [makeSource({ id: "s-1" }), makeSource({ id: "s-2" })];
    vi.mocked(api.listSources).mockResolvedValue(items as never);
    await store.list();

    vi.mocked(api.deleteSource).mockResolvedValue(
      makeSource({ id: "s-1" }) as never,
    );

    const result = await store.delete("s-1");

    expect(api.deleteSource).toHaveBeenCalledWith(
      { id: "s-1" },
      {
        signal: undefined,
      },
    );
    expect(result.id).toBe("s-1");
    expect(store.getSnapshot()).toHaveLength(1);
    expect(store.getSnapshot()[0].id).toBe("s-2");
  });

  it("updateInventory() updates source in list", async () => {
    const initial = makeSource({ id: "s-1", name: "Source" });
    vi.mocked(api.listSources).mockResolvedValue([initial] as never);
    await store.list();

    const mockInventory = {
      vcenterId: "vc-1",
      clusters: {},
    } as Source["inventory"];
    const updated = makeSource({
      id: "s-1",
      name: "Source",
      inventory: mockInventory,
    });
    vi.mocked(api.updateInventory).mockResolvedValue(updated as never);

    const result = await store.updateInventory("s-1", mockInventory);

    expect(api.updateInventory).toHaveBeenCalled();
    expect(result.inventory).toEqual(mockInventory);
    expect(store.getSnapshot()[0].inventory).toEqual(mockInventory);
  });

  it("subscriber notification on mutations", async () => {
    const listener = vi.fn();
    store.subscribe(listener);

    const created = makeSource({ id: "s-1" });
    vi.mocked(api.createSource).mockResolvedValue(created as never);
    await store.create({
      name: "New",
      sshPublicKey: "",
      httpProxy: "",
      httpsProxy: "",
      noProxy: "",
    });

    expect(listener).toHaveBeenCalled();
  });

  it("polling lifecycle", async () => {
    vi.mocked(api.listSources)
      .mockResolvedValueOnce([makeSource({ id: "s-1" })] as never)
      .mockResolvedValueOnce([
        makeSource({ id: "s-1" }),
        makeSource({ id: "s-2" }),
      ] as never);

    store.startPolling(1000);
    expect(store.getSnapshot()).toEqual([]);

    await vi.advanceTimersByTimeAsync(1000);
    expect(api.listSources).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(api.listSources).toHaveBeenCalledTimes(2);
    expect(store.getSnapshot()).toHaveLength(2);

    store.stopPolling();
  });
});
