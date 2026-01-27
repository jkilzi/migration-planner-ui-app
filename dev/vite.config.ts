import assert from "node:assert";
import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig, type ProxyOptions, type UserConfig } from "vite";

export default defineConfig(() => {
  const config: UserConfig = {
    plugins: [react()],
    define: {
      "process.env.STANDALONE_MODE": "true",
      "process.env.PLANNER_API_BASE_URL": JSON.stringify(
        process.env.USE_MIGRATION_PLANNER_API
          ? process.env.PLANNER_API_BASE_URL || "/api/migration-assessment"
          : "/planner",
      ),
      "process.env.MIGRATION_PLANNER_UI_GIT_COMMIT": JSON.stringify(
        process.env.MIGRATION_PLANNER_UI_GIT_COMMIT,
      ),
      "process.env.MIGRATION_PLANNER_UI_VERSION": JSON.stringify(
        process.env.MIGRATION_PLANNER_UI_VERSION,
      ),
    },
    resolve: {
      alias: {
        "@redhat-cloud-services/frontend-components/useChrome": path.resolve(
          __dirname,
          "src/mocks/useChrome-mock.ts",
        ),
        "@redhat-cloud-services/frontend-components/InvalidObject":
          path.resolve(__dirname, "src/mocks/frontend-components-mock.tsx"),
        "@redhat-cloud-services/frontend-components/PageHeader": path.resolve(
          __dirname,
          "src/mocks/frontend-components-mock.tsx",
        ),
        "@redhat-cloud-services/frontend-components": path.resolve(
          __dirname,
          "src/mocks/frontend-components-mock.tsx",
        ), // Keep as fallback
        "@redhat-cloud-services/frontend-components-notifications":
          path.resolve(__dirname, "src/mocks/notifications-mock.tsx"),
        // "@redhat-cloud-services/frontend-components-utilities": path.resolve(
        //   __dirname,
        //   "src/mocks/utilities-mock.ts",
        // ),
      },
    },
    server: {
      port: 3000,
      proxy: {
        "/planner": {
          target: "http://localhost:3443",
          secure: false,
          changeOrigin: true,
        },
      },
    },
  };

  const server = config.server;
  const proxy = server?.proxy;
  assert(server && proxy, "server and proxy must be defined");

  if (process.env.PLANNER_LOCAL_DEV) {
    assert("/planner" in proxy);
    const plannerProxyConfig = proxy["/planner"] as ProxyOptions;
    plannerProxyConfig.rewrite = (path: string) =>
      path.replace(/^\/planner/, "");
  } else {
    proxy["/api/migration-assessment"] = {
      target:
        "https://migration-planner-assisted-migration-stage.apps.crcs02ue1.urby.p1.openshiftapps.com",
      secure: false,
      changeOrigin: true,
    };
  }

  return config;
});
