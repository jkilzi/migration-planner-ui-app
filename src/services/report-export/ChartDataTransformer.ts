/**
 * Transforms inventory data into chart-ready data structures
 */

/**
 * Capacity planning margin for CPU cores.
 * Adds 20% headroom to account for workload growth and bursting.
 */
const CPU_CAPACITY_MARGIN = 1.2;

/**
 * Memory overhead factor.
 * Adds 25% to account for hypervisor overhead, page tables, and memory fragmentation.
 */
const MEMORY_OVERHEAD_FACTOR = 1.25;

/**
 * Storage safety multiplier.
 * Adds 15% buffer for snapshots, temporary files, and unexpected growth.
 */
const STORAGE_SAFETY_MULTIPLIER = 1.15;

import type {
  ChartData,
  Datastore,
  InfraData,
  InventoryData,
  OSInfo,
  SnapshotLike,
  VMsData,
} from "./types";

export class ChartDataTransformer {
  /**
   * Extract OS data from either vms.os or vms.osInfo format
   */
  extractOSData(vms: VMsData): Array<[string, number]> {
    // Check if osInfo exists (new format)
    if (vms.osInfo && Object.keys(vms.osInfo).length > 0) {
      return Object.entries(vms.osInfo).map(
        ([osName, osInfo]: [string, OSInfo]) => [osName, osInfo.count],
      );
    }
    // Fallback to os (old format)
    if (vms.os && Object.keys(vms.os).length > 0) {
      return Object.entries(vms.os);
    }
    return [];
  }

  /**
   * Normalize inventory data from various formats to a standard structure
   */
  normalizeInventory(inventory: InventoryData | SnapshotLike): {
    infra: InfraData;
    vms: VMsData;
  } {
    const snapshotLike = inventory as SnapshotLike;

    const infra =
      snapshotLike.infra ||
      snapshotLike.inventory?.infra ||
      snapshotLike.inventory?.vcenter?.infra ||
      (snapshotLike as { vcenter: { infra: InfraData } }).vcenter?.infra;

    const vms = (snapshotLike.vms ||
      snapshotLike.inventory?.vms ||
      snapshotLike.inventory?.vcenter?.vms ||
      (snapshotLike as { vcenter: { vms: VMsData } }).vcenter?.vms) as VMsData;

    if (!infra || !vms) {
      throw new Error("Invalid inventory data structure");
    }

    return { infra, vms };
  }

  /**
   * Transform inventory data into chart-ready structures
   */
  transform(inventory: InventoryData | SnapshotLike): ChartData {
    const { infra, vms } = this.normalizeInventory(inventory);

    const powerStateData = this.buildPowerStateData(vms);
    const resourceData = this.buildResourceData(vms);
    const osData = this.buildOSData(vms);
    const warningsData = this.buildWarningsData(vms);
    const { storageLabels, storageUsedData, storageTotalData } =
      this.buildStorageData(infra);

    return {
      powerStateData,
      resourceData,
      osData,
      warningsData,
      storageLabels,
      storageUsedData,
      storageTotalData,
    };
  }

  private buildPowerStateData(vms: VMsData): Array<[string, number]> {
    const ps = vms.powerStates ?? {};
    return [
      ["Powered On", ps.poweredOn ?? 0],
      ["Powered Off", ps.poweredOff ?? 0],
      ["Suspended", ps.suspended ?? 0],
    ];
  }

  private buildResourceData(vms: VMsData): Array<[string, number, number]> {
    return [
      [
        "CPU Cores",
        vms.cpuCores.total,
        Math.round(vms.cpuCores.total * CPU_CAPACITY_MARGIN),
      ],
      [
        "Memory GB",
        vms.ramGB.total,
        Math.round(vms.ramGB.total * MEMORY_OVERHEAD_FACTOR),
      ],
      [
        "Storage GB",
        vms.diskGB.total,
        Math.round(vms.diskGB.total * STORAGE_SAFETY_MULTIPLIER),
      ],
    ];
  }

  private buildOSData(vms: VMsData): Array<[string, number]> {
    const osEntries = this.extractOSData(vms).sort(([, a], [, b]) => b - a);

    return osEntries.slice(0, 8);
  }

  private buildWarningsData(vms: VMsData): Array<[string, number]> {
    return vms.migrationWarnings.map((w) => [w.label, w.count]);
  }

  private buildStorageData(infra: InfraData): {
    storageLabels: string[];
    storageUsedData: number[];
    storageTotalData: number[];
  } {
    const storageLabels = infra.datastores.map(
      (ds: Datastore) => `${ds.vendor} ${ds.type}`,
    );
    const storageUsedData = infra.datastores.map(
      (ds: Datastore) => ds.totalCapacityGB - ds.freeCapacityGB,
    );
    const storageTotalData = infra.datastores.map(
      (ds: Datastore) => ds.totalCapacityGB,
    );

    return { storageLabels, storageUsedData, storageTotalData };
  }
}
