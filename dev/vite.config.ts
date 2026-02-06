import assert from "node:assert";
import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv, type UserConfig } from "vite";

const DEFAULT_TARGET_HOST = "http://localhost:3443";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(process.cwd(), ".."), [
    "VITE_",
    "MIGRATION_PLANNER_",
  ]);

  assert(
    env.MIGRATION_PLANNER_API_BASE_URL,
    "MIGRATION_PLANNER_API_BASE_URL is required",
  );

  /**
   * Stage cluster: https://migration-planner-assisted-migration-stage.apps.crcs02ue1.urby.p1.openshiftapps.com
   *
   * Keeping this around for reference only. Theoretically we could use this to redirect to the stage cluster
   * for local development as well. However to hit this endpoint API calls need to be authenticated.
   */
  const target = env.MIGRATION_PLANNER_TARGET_HOST ?? DEFAULT_TARGET_HOST;

  const config: UserConfig = {
    plugins: [react()],
    define: {
      "process.env.MIGRATION_PLANNER_API_BASE_URL": JSON.stringify(
        env.MIGRATION_PLANNER_API_BASE_URL,
      ),
      "process.env.MIGRATION_PLANNER_UI_GIT_COMMIT": JSON.stringify(
        env.MIGRATION_PLANNER_UI_GIT_COMMIT,
      ),
      "process.env.MIGRATION_PLANNER_UI_VERSION": JSON.stringify(
        env.MIGRATION_PLANNER_UI_VERSION,
      ),
    },
    resolve: {
      alias: {
        "@redhat-cloud-services/frontend-components/useChrome": path.resolve(
          __dirname,
          "src/mocks/useChrome.ts",
        ),
        "@redhat-cloud-services/frontend-components-notifications":
          path.resolve(__dirname, "src/mocks/notifications.tsx"),
        "@redhat-cloud-services/frontend-components-utilities": path.resolve(
          __dirname,
          "src/mocks/utilities.ts",
        ),
      },
    },
    server: {
      port: 3000,
      proxy: {
        [env.MIGRATION_PLANNER_API_BASE_URL]: {
          target,
          secure: false,
          changeOrigin: true,
          rewrite: (path: string) =>
            target === DEFAULT_TARGET_HOST
              ? path.replace(
                  new RegExp(`^${process.env.MIGRATION_PLANNER_API_BASE_URL}`),
                  "",
                )
              : path,
        },
      },
    },
  };

  return config;
});
