import { Card, CardBody, CardTitle } from "@patternfly/react-core";
import VirtualMachineIcon from "@patternfly/react-icons/dist/esm/icons/virtual-machine-icon";
import React from "react";

import MigrationDonutChart from "../../../core/components/MigrationDonutChart";
import { dashboardCard } from "./styles";

interface VmMigrationStatusProps {
  data: {
    migratable: number;
    nonMigratable: number;
  };
  isExportMode?: boolean;
}

export const VMMigrationStatus: React.FC<VmMigrationStatusProps> = ({
  data,
  isExportMode: _isExportMode = false,
}) => {
  const donutData = [
    {
      name: "Migratable",
      count: data.migratable,
      countDisplay: `${data.migratable} VMs`,
      legendCategory: "Migratable",
    },
    {
      name: "Non-Migratable",
      count: data.nonMigratable,
      countDisplay: `${data.nonMigratable} VMs`,
      legendCategory: "Non-Migratable",
    },
  ];

  const legend = {
    Migratable: "#28a745",
    "Non-Migratable": "#dc3545",
  };

  return (
    <Card
      className={dashboardCard}
      id="vm-migration-status"
      style={{ height: "340px !important", overflow: "hidden" }}
    >
      <CardTitle>
        <VirtualMachineIcon /> VM Migration Status
      </CardTitle>
      <CardBody>
        <MigrationDonutChart
          data={donutData}
          legend={legend}
          height={300}
          width={420}
          donutThickness={9}
          padAngle={1}
          title={`${data.migratable + data.nonMigratable}`}
          subTitle="VMs"
          subTitleColor="#9a9da0"
          titleFontSize={34}
          labelFontSize={18}
          itemsPerRow={2}
          marginLeft="40%"
        />
      </CardBody>
    </Card>
  );
};
