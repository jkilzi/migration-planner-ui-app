import {
  Bullseye,
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  Icon,
  Tooltip,
} from "@patternfly/react-core";
import {
  ClusterIcon,
  MigrationIcon,
  QuestionCircleIcon,
} from "@patternfly/react-icons";
import { t_global_text_color_link_default as globalActiveColor300 } from "@patternfly/react-tokens/dist/js/t_global_text_color_link_default";
import React from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "../../../routing/Routes";
import { CustomEnterpriseIcon } from "../../core/components/CustomEnterpriseIcon";

const createCards = (
  navigate: ReturnType<typeof useNavigate>,
): React.ReactElement[] => [
  <Card isFullHeight isPlain key="card-1">
    <CardHeader>
      <Content style={{ textAlign: "center" }}>
        <Icon size="xl">
          <CustomEnterpriseIcon color={globalActiveColor300.value} />
        </Icon>
        <Content component="h2">
          Assess your VMware environment{" "}
          <Tooltip content="As part of the discovery process, we're collecting aggregated data about your VMware environment. This includes information such as the number of clusters, hosts, and VMs; VM counts per operating system type; total CPU cores and memory; network types and VLANs; and a list of datastores.">
            <Icon size="sm">
              <QuestionCircleIcon color={globalActiveColor300.value} />
            </Icon>
          </Tooltip>
        </Content>
      </Content>
    </CardHeader>
    <CardBody>
      <Content style={{ textAlign: "center" }}>
        <Content style={{ minHeight: "60px" }}>
          Run the discovery process or upload an inventory file to create a full
          migration assessment report.
        </Content>
        <Button
          size="sm"
          variant="link"
          onClick={() => navigate(routes.exampleReport)}
          style={{ marginTop: "16px", display: "inline-block" }}
        >
          See an example report
        </Button>
      </Content>
    </CardBody>
  </Card>,

  <Card isFullHeight isPlain key="card-2">
    <CardHeader style={{ height: "210px" }}>
      <Content style={{ textAlign: "center" }}>
        <Icon size="xl">
          <ClusterIcon color={globalActiveColor300.value} />
        </Icon>
        <Content component="h2">
          Select a target cluster
          <br />
        </Content>
      </Content>
    </CardHeader>
    <CardBody>
      <Content style={{ textAlign: "center" }}>
        <Content style={{ minHeight: "60px" }}>
          Select your target OpenShift Cluster to fit your migration data
        </Content>
        <span
          className="pf-v6-c-label pf-m-purple pf-m-compact"
          style={{ marginTop: "6px", display: "inline-block" }}
        >
          <span className="pf-v6-c-label__content">Coming soon</span>
        </span>
      </Content>
    </CardBody>
  </Card>,

  <Card isFullHeight isPlain key="card-3">
    <CardHeader style={{ height: "210px" }}>
      <Content style={{ textAlign: "center" }}>
        <Icon size="xl">
          <MigrationIcon color={globalActiveColor300.value} />
        </Icon>
        <Content component="h2">
          Create a migration plan
          <br />
        </Content>
      </Content>
    </CardHeader>
    <CardBody>
      <Content style={{ textAlign: "center" }}>
        <Content style={{ minHeight: "60px" }}>
          Select your VMs, create a network and storage mapping and schedule
          your migration timeline
        </Content>
        <span
          className="pf-v6-c-label pf-m-purple pf-m-compact"
          style={{ marginTop: "6px", display: "inline-block" }}
        >
          <span className="pf-v6-c-label__content">Coming soon</span>
        </span>
      </Content>
    </CardBody>
  </Card>,
];

const StartingPage: React.FC = () => {
  const navigate = useNavigate();
  const cards = createCards(navigate);

  return (
    <Bullseye>
      <Flex>
        {cards.map((card) => (
          <FlexItem flex={{ default: "flex_1" }} key={card.key}>
            {card}
          </FlexItem>
        ))}
      </Flex>
    </Bullseye>
  );
};

StartingPage.displayName = "StartingPage";

export default StartingPage;
