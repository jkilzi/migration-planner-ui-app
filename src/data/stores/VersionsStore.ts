import type { InfoApiInterface } from "@migration-planner-ui/api-client/apis";

import { ExternalStoreBase } from "../../lib/mvvm/ExternalStore";
import type { VersionInfo } from "../../models/VersionInfo";
import type { IVersionsStore } from "./interfaces/IVersionsStore";

const UI_NAME = "migration-planner-ui-app";
const API_NAME = "migration-planner";

export class VersionsStore
  extends ExternalStoreBase<VersionInfo>
  implements IVersionsStore
{
  private infoApi: InfoApiInterface;
  private state: VersionInfo = {
    ui: {
      name: UI_NAME,
      versionName: process.env.MIGRATION_PLANNER_UI_VERSION || "unknown",
      gitCommit: process.env.MIGRATION_PLANNER_UI_GIT_COMMIT || "unknown",
    },
    api: {
      name: API_NAME,
      versionName: "unknown",
      gitCommit: "unknown",
    },
  };

  constructor(infoApi: InfoApiInterface) {
    super();
    this.infoApi = infoApi;
  }

  async getApiVersionInfo(signal?: AbortSignal): Promise<VersionInfo> {
    const info = await this.infoApi.getInfo({ signal });
    this.state.api.versionName = info.versionName ?? "unknown";
    this.state.api.gitCommit = info.gitCommit ?? "unknown";
    this.notify();
    return this.getSnapshot();
  }

  override getSnapshot(): VersionInfo {
    return this.state;
  }
}
