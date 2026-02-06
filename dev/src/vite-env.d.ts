interface ViteTypeOptions {
  // By adding this line, you can make the type of ImportMetaEnv strict
  // to disallow unknown keys.
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly MIGRATION_PLANNER_API_BASE_URL: string;
  readonly MIGRATION_PLANNER_UI_VERSION: string;
  readonly MIGRATION_PLANNER_UI_GIT_COMMIT: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
