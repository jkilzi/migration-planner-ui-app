/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly MIGRATION_PLANNER_API_BASE_URL: string;
    readonly MIGRATION_PLANNER_UI_VERSION: string;
    readonly MIGRATION_PLANNER_UI_GIT_COMMIT: string;
  }
}
