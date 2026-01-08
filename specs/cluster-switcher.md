# Cluster Switcher – UX notes

## Mockups (textual wireframes)
- All clusters (default): header has `Cluster` dropdown showing `All clusters`; dashboard shows existing aggregate cards (VM status, OS, CPU/Memory, Storage, Clusters, Hosts, Network, Warnings/Errors).
- Single cluster selected: header shows chosen cluster name; aggregate-only cards hidden (Clusters distribution); cards use the selected cluster’s metrics only; caption/exports include cluster name.
- No clusters available: dropdown disabled, hint text “No clusters detected”, dashboard shows the existing “no data” empty state.
- Loading: dropdown shows “Loading clusters…” and is disabled; dashboard skeletons remain as-is.

## Behavior notes
- Default selection: `All clusters` (aggregate data). If the user previously picked a cluster during the session, preserve it while data remains available.
- Options: `All clusters` + one entry per cluster key from `inventory.clusters`.
- Missing data: when a cluster is selected but `infra`/`vms` is missing, show a non-blocking empty state message instead of falling back to aggregates.
- Hiding aggregates: when a cluster is selected, omit aggregate-only tiles (cluster distribution) and render other tiles with cluster-scoped data.
- Reset: switching back to `All clusters` restores the aggregate view and exports.
- Export: exported report uses the same selection and appends the cluster name to the document title when not showing all clusters.

