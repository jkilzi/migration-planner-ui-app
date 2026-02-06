import { describe, expect, it } from "vitest";

import { ChartDataTransformer } from "../ChartDataTransformer";
import type { InfraData, InventoryData, SnapshotLike, VMsData } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeVms = (overrides: Partial<VMsData> = {}): VMsData => ({
  total: 10,
  powerStates: { poweredOn: 7, poweredOff: 2, suspended: 1 },
  cpuCores: { total: 100 },
  ramGB: { total: 256 },
  diskGB: { total: 2048 },
  migrationWarnings: [
    { label: "No tools", count: 3 },
    { label: "Old OS", count: 5 },
  ],
  ...overrides,
});

const makeInfra = (overrides: Partial<InfraData> = {}): InfraData => ({
  totalHosts: 4,
  datastores: [
    {
      vendor: "NetApp",
      type: "NFS",
      protocolType: "nfs",
      totalCapacityGB: 1000,
      freeCapacityGB: 400,
      hardwareAcceleratedMove: false,
    },
    {
      vendor: "Dell",
      type: "VMFS",
      protocolType: "iscsi",
      totalCapacityGB: 500,
      freeCapacityGB: 100,
      hardwareAcceleratedMove: true,
    },
  ],
  networks: [{ name: "VM Network", type: "standard" }],
  ...overrides,
});

const makeInventory = (): InventoryData => ({
  infra: makeInfra(),
  vms: makeVms(),
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ChartDataTransformer", () => {
  const transformer = new ChartDataTransformer();

  // ---- extractOSData -------------------------------------------------------

  describe("extractOSData", () => {
    it("extracts from osInfo format (new)", () => {
      const vms = makeVms({
        osInfo: {
          "Windows Server 2019": { count: 5, supported: true },
          "RHEL 9": { count: 3, supported: true },
        },
      });

      const result = transformer.extractOSData(vms);
      expect(result).toEqual([
        ["Windows Server 2019", 5],
        ["RHEL 9", 3],
      ]);
    });

    it("falls back to os format (old) when osInfo is empty", () => {
      const vms = makeVms({
        osInfo: {},
        os: { "CentOS 7": 4, "Ubuntu 22.04": 6 },
      });

      const result = transformer.extractOSData(vms);
      expect(result).toEqual([
        ["CentOS 7", 4],
        ["Ubuntu 22.04", 6],
      ]);
    });

    it("falls back to os format (old) when osInfo is undefined", () => {
      const vms = makeVms({
        osInfo: undefined,
        os: { "Debian 12": 2 },
      });

      const result = transformer.extractOSData(vms);
      expect(result).toEqual([["Debian 12", 2]]);
    });

    it("returns empty array when both osInfo and os are empty", () => {
      const vms = makeVms({ osInfo: {}, os: {} });
      expect(transformer.extractOSData(vms)).toEqual([]);
    });

    it("returns empty array when both osInfo and os are undefined", () => {
      const vms = makeVms({ osInfo: undefined, os: undefined });
      expect(transformer.extractOSData(vms)).toEqual([]);
    });
  });

  // ---- normalizeInventory ---------------------------------------------------

  describe("normalizeInventory", () => {
    it("normalizes flat InventoryData", () => {
      const inventory = makeInventory();
      const result = transformer.normalizeInventory(inventory);

      expect(result.infra).toBe(inventory.infra);
      expect(result.vms).toBe(inventory.vms);
    });

    it("normalizes SnapshotLike with top-level infra/vms", () => {
      const snapshot: SnapshotLike = {
        infra: makeInfra(),
        vms: makeVms(),
      };

      const result = transformer.normalizeInventory(snapshot);
      expect(result.infra).toBe(snapshot.infra);
      expect(result.vms).toBe(snapshot.vms);
    });

    it("normalizes SnapshotLike with inventory.infra/vms", () => {
      const infra = makeInfra();
      const vms = makeVms();
      const snapshot: SnapshotLike = {
        inventory: { infra, vms },
      };

      const result = transformer.normalizeInventory(snapshot);
      expect(result.infra).toBe(infra);
      expect(result.vms).toBe(vms);
    });

    it("normalizes SnapshotLike with inventory.vcenter.infra/vms", () => {
      const infra = makeInfra();
      const vms = makeVms();
      const snapshot: SnapshotLike = {
        inventory: { vcenter: { infra, vms } },
      };

      const result = transformer.normalizeInventory(snapshot);
      expect(result.infra).toBe(infra);
      expect(result.vms).toBe(vms);
    });

    it("throws when inventory structure is invalid", () => {
      expect(() => transformer.normalizeInventory({} as SnapshotLike)).toThrow(
        "Invalid inventory data structure",
      );
    });
  });

  // ---- transform ------------------------------------------------------------

  describe("transform", () => {
    it("returns all chart data sections", () => {
      const result = transformer.transform(makeInventory());

      expect(result).toHaveProperty("powerStateData");
      expect(result).toHaveProperty("resourceData");
      expect(result).toHaveProperty("osData");
      expect(result).toHaveProperty("warningsData");
      expect(result).toHaveProperty("storageLabels");
      expect(result).toHaveProperty("storageUsedData");
      expect(result).toHaveProperty("storageTotalData");
    });

    it("builds correct power state data", () => {
      const result = transformer.transform(makeInventory());

      expect(result.powerStateData).toEqual([
        ["Powered On", 7],
        ["Powered Off", 2],
        ["Suspended", 1],
      ]);
    });

    it("handles missing power state values with defaults", () => {
      const inventory = makeInventory();
      inventory.vms.powerStates = {};

      const result = transformer.transform(inventory);
      expect(result.powerStateData).toEqual([
        ["Powered On", 0],
        ["Powered Off", 0],
        ["Suspended", 0],
      ]);
    });

    it("builds resource data with capacity margins", () => {
      const result = transformer.transform(makeInventory());

      // CPU: 100 actual, 100 * 1.2 = 120 recommended
      expect(result.resourceData[0]).toEqual(["CPU Cores", 100, 120]);
      // Memory: 256 actual, 256 * 1.25 = 320 recommended
      expect(result.resourceData[1]).toEqual(["Memory GB", 256, 320]);
      // Storage: 2048 actual, 2048 * 1.15 = 2355 recommended
      expect(result.resourceData[2]).toEqual(["Storage GB", 2048, 2355]);
    });

    it("builds warnings data from migration warnings", () => {
      const result = transformer.transform(makeInventory());

      expect(result.warningsData).toEqual([
        ["No tools", 3],
        ["Old OS", 5],
      ]);
    });

    it("builds storage data from infra datastores", () => {
      const result = transformer.transform(makeInventory());

      expect(result.storageLabels).toEqual(["NetApp NFS", "Dell VMFS"]);
      // used = total - free
      expect(result.storageUsedData).toEqual([600, 400]);
      expect(result.storageTotalData).toEqual([1000, 500]);
    });

    it("sorts OS data by count descending and limits to 8", () => {
      const osInfo: Record<string, { count: number; supported: boolean }> = {};
      for (let i = 0; i < 12; i++) {
        osInfo[`OS-${i}`] = { count: i * 10, supported: true };
      }
      const inventory = makeInventory();
      inventory.vms.osInfo = osInfo;

      const result = transformer.transform(inventory);

      expect(result.osData.length).toBe(8);
      // First entry should be highest count
      expect(result.osData[0][1]).toBe(110);
    });
  });
});
