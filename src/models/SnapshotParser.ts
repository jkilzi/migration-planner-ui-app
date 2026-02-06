import type { Snapshot } from "@migration-planner-ui/api-client/models";

// ---------------------------------------------------------------------------
// Shared sorting helper
// ---------------------------------------------------------------------------

/**
 * Return a new array of snapshots sorted by `createdAt` descending
 * (latest first). Returns an empty array when input is empty or undefined.
 */
export const sortSnapshotsDesc = (
  snapshots: Snapshot[] | undefined,
): Snapshot[] => {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return [];
  return [...snapshots].sort((a, b) => {
    const aDate = new Date(a.createdAt || 0).getTime();
    const bDate = new Date(b.createdAt || 0).getTime();
    return bDate - aDate;
  });
};

// ---------------------------------------------------------------------------
// hasUsefulData
// ---------------------------------------------------------------------------

/**
 * Checks if an assessment has useful inventory data by examining
 * the latest snapshot's inventory fields across legacy shapes.
 *
 * An assessment is considered to have useful data when:
 * - It has at least one snapshot, AND
 * - The latest snapshot contains any supported inventory shape
 */
export const hasUsefulData = (snapshots: Snapshot[] | undefined): boolean => {
  const sorted = sortSnapshotsDesc(snapshots);
  if (sorted.length === 0) return false;

  const lastSnapshot = sorted[0];
  const inventory = lastSnapshot.inventory;
  const legacyInventory = inventory as
    | {
        infra?: unknown;
        vms?: unknown;
        vcenter?: { infra?: unknown; vms?: unknown };
      }
    | undefined;
  const legacySnapshot = lastSnapshot as { infra?: unknown; vms?: unknown };

  const hasClustersProp =
    inventory != null && Object.hasOwn(inventory, "clusters");

  if (hasClustersProp) {
    return inventory?.clusters != null;
  }

  return (
    legacyInventory?.vcenter?.infra != null ||
    legacyInventory?.vcenter?.vms != null ||
    legacyInventory?.infra != null ||
    legacyInventory?.vms != null ||
    legacySnapshot.infra != null ||
    legacySnapshot.vms != null
  );
};

// ---------------------------------------------------------------------------
// SnapshotData
// ---------------------------------------------------------------------------

export interface SnapshotData {
  hosts: string | number;
  vms: string | number;
  networks: string | number;
  datastores: string | number;
  lastUpdated: string;
}

export const parseLatestSnapshot = (
  snapshots: Snapshot[] | undefined,
): SnapshotData => {
  const sorted = sortSnapshotsDesc(snapshots);
  if (sorted.length === 0) {
    return {
      hosts: "-",
      vms: "-",
      networks: "-",
      datastores: "-",
      lastUpdated: "-",
    };
  }

  const lastSnapshot = sorted[0];

  const hosts = lastSnapshot.inventory?.vcenter?.infra?.totalHosts ?? "-";
  const vms = lastSnapshot.inventory?.vcenter?.vms?.total ?? "-";

  const networks = Array.isArray(
    lastSnapshot.inventory?.vcenter?.infra?.networks,
  )
    ? lastSnapshot.inventory.vcenter?.infra?.networks.length
    : "-";

  const datastores = Array.isArray(
    lastSnapshot.inventory?.vcenter?.infra?.datastores,
  )
    ? lastSnapshot.inventory.vcenter?.infra?.datastores.length
    : "-";

  const lastUpdated = lastSnapshot.createdAt
    ? ((): string => {
        const date = new Date(lastSnapshot.createdAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          return "Today";
        } else if (diffDays === 1) {
          return "1 day ago";
        } else if (diffDays < 7) {
          return `${diffDays} days ago`;
        } else {
          return (
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          );
        }
      })()
    : "-";

  return {
    hosts,
    vms,
    networks,
    datastores,
    lastUpdated,
  };
};
