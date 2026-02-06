import type { Network } from "@migration-planner-ui/api-client/models";
import { Card, CardBody, CardTitle } from "@patternfly/react-core";
import NetworkIcon from "@patternfly/react-icons/dist/esm/icons/network-icon";
import React from "react";

import { ReportTable } from "../ReportTable";
import { dashboardCard } from "./styles";

interface NetworkTopologyProps {
  networks: Network[];
  isExportMode?: boolean;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  networks,
  isExportMode = false,
}) => {
  const tableHeight = isExportMode ? "100%" : "250px";
  return (
    <Card className={dashboardCard}>
      <CardTitle>
        <NetworkIcon /> Network Topology
      </CardTitle>
      <CardBody style={{ padding: 0 }}>
        <div
          style={{
            maxHeight: tableHeight,
            overflowY: "auto",
            overflowX: "auto",
            padding: 2,
          }}
        >
          <ReportTable<Network>
            data={networks}
            columns={["Type", "VlanId"]}
            fields={["type", "vlanId"]}
            withoutBorder
          />
        </div>
      </CardBody>
    </Card>
  );
};
