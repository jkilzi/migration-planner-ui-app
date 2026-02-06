import type {
  Assessment,
  Snapshot,
} from "@migration-planner-ui/api-client/models";

import {
  hasUsefulData,
  parseLatestSnapshot,
  type SnapshotData,
  sortSnapshotsDesc,
} from "./SnapshotParser";

// ---------------------------------------------------------------------------
// Public type
// ---------------------------------------------------------------------------

/**
 * Domain model wrapping the API `Assessment` type with pre-computed derived
 * properties. Created via {@link createAssessmentModel}.
 *
 * Because it is an intersection with `Assessment`, all raw API properties are
 * still available (e.g. `model.id`, `model.name`).
 */
export type AssessmentModel = Assessment & {
  /** Formatted "FirstName LastName" — each word capitalised. */
  readonly ownerFullName: string;
  /** Summary stats from the latest snapshot (hosts, VMs, networks, …). */
  readonly latestSnapshot: SnapshotData;
  /** Whether the assessment has useful inventory data to display. */
  readonly hasUsefulData: boolean;
  /** All snapshots sorted by `createdAt` descending (latest first). */
  readonly snapshotsSorted: Snapshot[];
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

const formatWord = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

const formatName = (name?: string): string | undefined =>
  name?.split(" ").map(formatWord).join(" ");

const computeOwnerFullName = (raw: Assessment): string => {
  const first = formatName(raw.ownerFirstName);
  const last = formatName(raw.ownerLastName);
  if (first && last) return `${first} ${last}`;
  return first || last || "";
};

/**
 * Create a domain model from a raw API Assessment.
 *
 * Computed properties are evaluated once at construction time.
 * Stores call this in every `list()` / `create()` / `update()` path so
 * derived data stays fresh.
 */
export const createAssessmentModel = (raw: Assessment): AssessmentModel => ({
  ...raw,
  ownerFullName: computeOwnerFullName(raw),
  latestSnapshot: parseLatestSnapshot(raw.snapshots as Snapshot[] | undefined),
  hasUsefulData: hasUsefulData(raw.snapshots as Snapshot[] | undefined),
  snapshotsSorted: sortSnapshotsDesc(raw.snapshots as Snapshot[] | undefined),
});
