/**
 * The app slug used by the Insights Chrome to mount this microfrontend.
 * Matches `appUrl` in `fec.config.js`.
 */
const APP_SLUG = "/openshift/migration-assessment";

/**
 * Resolve the app's base path at runtime.
 *
 * - **Standalone (dev) mode** — `BrowserRouter` has `basename="/"` and the
 *   app is mounted at the root. Returns `""` so every route is root-relative.
 *
 * - **Microfrontend (stage) mode** — The Chrome's `BrowserRouter` has
 *   `basename="/"` and mounts the app inside a nested `<Route>` at
 *   `APP_SLUG`. Absolute `navigate()` / `<Link to>` calls must therefore
 *   include the full mount path, otherwise React Router resolves them from
 *   the router root and the URL ends up outside the app.
 *
 * Detection: if the current URL contains the app slug, we're in stage mode.
 * This runs once at module-load time (the URL is already correct when the
 * Chrome loads the federated module).
 */
function resolveAppBasename(): string {
  try {
    // Strip known Chrome preview/beta prefixes before matching
    const pathname = window.location.pathname.replace(/^\/(preview|beta)/, "");
    return pathname.startsWith(APP_SLUG) ? APP_SLUG : "";
  } catch {
    return ""; // SSR / test environment without DOM
  }
}

/**
 * The app's mount-path prefix.
 * - `""` in standalone (dev) mode
 * - `"/openshift/migration-assessment"` in stage mode
 */
export const APP_BASENAME = resolveAppBasename();

export const routes = {
  root: APP_BASENAME || "/",
  assessments: `${APP_BASENAME}/assessments`,
  assessmentById: (id: string) => `${APP_BASENAME}/assessments/${id}`,
  assessmentReport: (id: string) => `${APP_BASENAME}/assessments/${id}/report`,
  assessmentCreate: `${APP_BASENAME}/assessments/create`,
  exampleReport: `${APP_BASENAME}/assessments/example-report`,
  environments: `${APP_BASENAME}/environments`,
} as const;
