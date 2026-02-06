import { Provider } from "@migration-planner-ui/ioc";
import { Bullseye, Spinner } from "@patternfly/react-core";
import { useChrome } from "@redhat-cloud-services/frontend-components/useChrome";
import { Suspense, useMemo } from "react";

import { createContainer } from "./config/Dependencies";
import { AppRoutes } from "./routing/AppRoutes";
import { VersionInfoView } from "./ui/version-info/views/VersionInfoView";

const MainApp: React.FC = () => {
  const { auth } = useChrome();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const container = useMemo(() => createContainer(auth), []);

  return (
    <Suspense
      fallback={
        <Bullseye>
          <Spinner />
        </Bullseye>
      }
    >
      <Provider container={container}>
        <VersionInfoView />
        <AppRoutes />
      </Provider>
    </Suspense>
  );
};
MainApp.displayName = "MainApp";

export default MainApp;
