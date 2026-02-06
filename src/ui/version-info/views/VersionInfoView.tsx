import { forwardRef } from "react";

import { useVersionInfoViewModel } from "../view-models/useVersionInfoViewModel";

export const VersionInfoView: React.FC = forwardRef<
  HTMLDivElement,
  React.PropsWithChildren
>((_props, ref) => {
  const vm = useVersionInfoViewModel();
  return (
    <div
      ref={ref}
      id="migration-planner-version-info"
      data-ui-name={vm.ui.name}
      data-ui-version={vm.ui.versionName}
      data-ui-git-commit={vm.ui.gitCommit}
      data-api-name={vm.api.name}
      data-api-version={vm.api.versionName}
      data-api-git-commit={vm.api.gitCommit}
    />
  );
});
VersionInfoView.displayName = "VersionInfoView";
