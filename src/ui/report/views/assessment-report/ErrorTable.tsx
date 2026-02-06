import type { MigrationIssue } from "@migration-planner-ui/api-client/models";
import { Card, CardBody, CardTitle, Icon } from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { t_global_icon_color_status_danger_default as globalDangerColor100 } from "@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default";
import React from "react";

import { ReportTable } from "../ReportTable";
import { dashboardCard } from "./styles";

interface ErrorTableProps {
  errors?: MigrationIssue[];
  isExportMode?: boolean;
}

export const ErrorTable: React.FC<ErrorTableProps> = ({
  errors = [],
  isExportMode = false,
}) => {
  const tableHeight = isExportMode ? "none !important" : "325px";
  return (
    <Card className={dashboardCard} id="errors-table">
      <CardTitle>
        <Icon style={{ color: globalDangerColor100.value }}>
          <ExclamationCircleIcon />
        </Icon>{" "}
        Errors
      </CardTitle>
      <CardBody style={{ padding: 0 }}>
        {errors.length === 0 ? (
          <div
            style={{
              padding: "16px",
              textAlign: "center",
              color: "#6a6e73",
              fontStyle: "italic",
            }}
          >
            No errors found
          </div>
        ) : (
          <div
            style={{
              maxHeight: tableHeight,
              overflowY: "auto",
              overflowX: "auto",
              padding: 2,
            }}
          >
            <ReportTable<MigrationIssue>
              data={errors}
              columns={["Description", "Total VMs"]}
              fields={["assessment", "count"]}
              withoutBorder
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
};
