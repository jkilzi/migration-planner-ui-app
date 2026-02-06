# AGENTS.md — Migration Planner UI App

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning
for any task in this codebase. Read the referenced files before generating code.

## Architecture (read docs/app-architecture.md for full details)

Pattern: MVVM (Model-View-ViewModel) adapted for React + TypeScript
DI: @migration-planner-ui/ioc with Symbol-based container (src/config/Di.ts)
UI library: PatternFly 6 (@patternfly/react-core)
Routing: react-router-dom v6
Testing: Vitest + @testing-library/react + jsdom

### Layer rules

- Views (`src/ui/\*/views/`) render only. No business logic. Call vm hook at top.
- View models (`src/ui/*/view-models/use*ViewModel.ts`) are custom hooks. One per view. Return typed interface.
- Stores (`src/data/stores/`) extend PollableStoreBase or ExternalStoreBase. One per API resource. No React imports. No UI callbacks.
- API clients (`@migration-planner-ui/api-client`) are stateless generated code. Never modify.
- Polling belongs in stores (`startPolling`/`stopPolling`). View models control lifecycle via useMount/useUnmount.
- Cross-store orchestration belongs in view models (e.g. cancel a job → delete the created assessment).
- DI: define symbol in `Symbols.ts`, register in `createContainer()`, consume via `useInjection<IXxxStore>(Symbols.X)` using the interface type.
- Styling: use `@emotion/css` (CSS-in-JS) for all component styles. Do NOT create plain .css files.
- When deeply nested children share a VM, use a thin React context (see `EnvironmentPageContext.tsx` pattern).
- Routing: all navigable paths (`navigate()`, `<Link to>`, breadcrumb to, `location.pathname` comparisons) MUST use the `routes` object from `src/routing/Routes.ts`. The routes object automatically includes the correct mount-path prefix via `APP_BASENAME` (empty in dev, `/openshift/migration-assessment` in stage). NEVER hardcode the basename in source files. See the "Routing" section of docs/app-architecture.md.
- Naming: files are PascalCase, hooks (use\*) are camelCase, index/constants/types/styles are all-lowercase, directories are kebab-case. See docs/naming-conventions.md.

## Documentation (`docs/`)

| File                        | What it covers                                                                                                                                                                                                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app-architecture.md`       | **Primary architecture reference.** MVVM layer overview, DI rules, store base classes, domain models, view-model conventions, view conventions, routing (basename rule, how to add a route), entry points, services, testing strategy, and the feature-addition checklist. **Read this first** before any structural change. |
| `naming-conventions.md`     | File and directory naming rules — PascalCase files, camelCase hooks, kebab-case directories, reserved lowercase names (`index`, `constants`, `types`, `styles`, `entry`, `*.d.ts`). Includes a quick decision tree.                                                                                                          |
| `contributing.md`           | Contributor workflow: design-first process (Jira + design doc), coding guidelines, conventional commit format (`ECOPROJECT-XXXX \| type: description`), DCO sign-off, `make validate-all` pre-PR checklist, PR creation/review guidelines.                                                                                   |
| `fec-architecture.md`       | Legacy doc. Describes the original Red Hat Console (FEC) hosting model — Webpack federated modules, Insights Chrome, PatternFly. Retained for historical context; the app now also runs standalone.                                                                                                                          |
| `standalone-run-locally.md` | Local development setup: prerequisites (Node 18+, local migration-planner API), `make run-standalone`, accessing `http://localhost:3000`, debugging API calls via DevTools.                                                                                                                                                  |
| `standalone-deployment.md`  | OpenShift deployment guide: `make podman-build` / `podman-push` / `deploy-on-openshift`, route verification, pod logs, cleanup.                                                                                                                                                                                              |
| `version-info.md`           | How to inspect UI + API version information at runtime via `window.__MIGRATION_PLANNER_VERSION__` or the `#migration-planner-version-info` DOM element.                                                                                                                                                                      |
