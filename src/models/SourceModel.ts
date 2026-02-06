import type { Agent, Source } from "@migration-planner-ui/api-client/models";

// ---------------------------------------------------------------------------
// Public type
// ---------------------------------------------------------------------------

/**
 * Domain model wrapping the API `Source` type with pre-computed derived
 * properties. Created via {@link createSourceModel}.
 *
 * Because it is an intersection with `Source`, all raw API properties are
 * still available (e.g. `model.id`, `model.name`).
 */
export type SourceModel = Source & {
  /** Whether the source has usable inventory data (agent up-to-date OR manual upload). */
  readonly isReady: boolean;
  /** Whether the agent is present and not in the "not-connected" state. */
  readonly isConnected: boolean;
  /** Agent status; defaults to "not-connected" when no agent is present. */
  readonly displayStatus: Agent["status"];
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a domain model from a raw API Source.
 *
 * Computed properties are evaluated once at construction time.
 * Stores call this in every `list()` / `create()` / `update()` path so
 * derived data stays fresh.
 */
export const createSourceModel = (raw: Source): SourceModel => {
  const agentStatus = raw.agent?.status;
  const displayStatus: Agent["status"] = agentStatus ?? "not-connected";
  const isConnected = raw.agent != null && agentStatus !== "not-connected";
  const isReady =
    agentStatus === "up-to-date" ||
    (Boolean(raw.onPremises) && raw.inventory !== undefined);

  return {
    ...raw,
    isReady,
    isConnected,
    displayStatus,
  };
};
