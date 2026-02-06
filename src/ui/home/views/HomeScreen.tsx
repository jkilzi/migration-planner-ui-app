import {
  Button,
  Tab,
  TabContent,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";
import React from "react";
import { Outlet } from "react-router-dom";

import { AppPage } from "../../core/components/AppPage";
import { useHomeScreenViewModel } from "../view-models/useHomeScreenViewModel";
import StartingPageModal from "./StartingPageModal";

export const HomeScreen: React.FC = () => {
  const vm = useHomeScreenViewModel();

  return (
    <AppPage
      breadcrumbs={vm.breadcrumbs}
      title="Welcome, let's start your migration journey from VMware to OpenShift."
      caption={
        <Button
          variant="link"
          isInline
          onClick={vm.handleOpenStartingPageModal}
        >
          How does this work?
        </Button>
      }
    >
      <Tabs
        activeKey={vm.activeTabKey}
        onSelect={vm.handleTabClick}
        aria-label="Migration tabs"
        role="region"
      >
        <Tab
          eventKey={0}
          title={<TabTitleText>Assessments</TabTitleText>}
          aria-label="Assessments tab"
        />
        <Tab
          eventKey={1}
          title={<TabTitleText>Environments</TabTitleText>}
          aria-label="Environments tab"
        />
      </Tabs>

      <TabContent id="home-screen-content">
        <Outlet context={{ rvtoolsOpenToken: vm.rvtoolsOpenToken }} />
      </TabContent>

      <StartingPageModal
        isOpen={vm.isStartingPageModalOpen}
        onClose={vm.handleCloseStartingPageModal}
        onOpenRVToolsModal={vm.handleOpenRVToolsModal}
      />
    </AppPage>
  );
};

HomeScreen.displayName = "HomeScreen";

export default HomeScreen;
