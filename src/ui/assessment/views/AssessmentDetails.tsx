import {
  Bullseye,
  Button,
  Content,
  Icon,
  Spinner,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { MonitoringIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import React from "react";
import { Link } from "react-router-dom";

import { routes } from "../../../routing/Routes";
import { AppPage } from "../../core/components/AppPage";
import { AgentStatusView } from "../../environment/views/AgentStatusView";
import { useAssessmentDetailsViewModel } from "../view-models/useAssessmentDetailsViewModel";

const AssessmentDetails: React.FC = () => {
  const vm = useAssessmentDetailsViewModel();

  if (vm.isLoading && !vm.assessment) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (!vm.assessment) {
    return (
      <AppPage
        breadcrumbs={[
          {
            key: 1,
            children: "Migration assessment",
          },
          {
            key: 2,
            to: routes.assessments,
            children: "assessments",
          },
          { key: 3, children: "Assessment not found", isActive: true },
        ]}
        title="Assessment details"
      >
        <Stack hasGutter>
          <StackItem>
            <Content>
              <Content component="p">
                The requested assessment was not found.
              </Content>
            </Content>
          </StackItem>
          <StackItem>
            <Link to={routes.assessments}>
              <Button variant="primary">Back to assessments</Button>
            </Link>
          </StackItem>
        </Stack>
      </AppPage>
    );
  }

  const ownerFullName = vm.assessment.ownerFullName || "-";

  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          to: routes.root,
          children: "Migration assessment",
        },
        {
          key: 2,
          to: routes.assessments,
          children: "assessments",
        },
        {
          key: 3,
          children: vm.assessment.name || `Assessment ${vm.id}`,
          isActive: true,
        },
      ]}
      title={vm.assessment.name || `Assessment ${vm.id}`}
    >
      <div
        style={{ background: "white", padding: "16px", borderRadius: "4px" }}
      >
        <div
          style={{
            borderBottom: "1px solid #eee",
            paddingBottom: "8px",
            marginBottom: "16px",
          }}
        >
          <Content>
            <Content component="h2">Details</Content>
          </Content>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "16px",
          }}
        >
          <div>
            <Content>
              <Content component="small">Discovery VM status</Content>
              <AgentStatusView
                status={vm.source?.displayStatus ?? "not-connected"}
                statusInfo={
                  vm.source?.isReady
                    ? undefined
                    : vm.agent
                      ? vm.agent.statusInfo
                      : "Not connected"
                }
                credentialUrl={vm.agent ? vm.agent.credentialUrl : ""}
                uploadedManually={
                  Boolean(vm.source?.onPremises) &&
                  vm.source?.inventory !== undefined
                }
                updatedAt={vm.source?.updatedAt as unknown as string}
                disableInteractions
              />
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Last updated</Content>
              <Content component="p">{vm.latest.lastUpdated}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Owner</Content>
              <Content component="p">{ownerFullName}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Hosts</Content>
              <Content component="p">{vm.latest.hosts}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">VMs</Content>
              <Content component="p">{vm.latest.vms}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Networks</Content>
              <Content component="p">{vm.latest.networks}</Content>
            </Content>
          </div>
          <div>
            <Content>
              <Content component="small">Datastores</Content>
              <Content component="p">{vm.latest.datastores}</Content>
            </Content>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "16px",
          borderRadius: "4px",
          marginTop: "16px",
        }}
      >
        <div
          style={{
            borderBottom: "1px solid #eee",
            paddingBottom: "8px",
            marginBottom: "16px",
          }}
        >
          <Content>
            <Content component="h2">Snapshots</Content>
          </Content>
        </div>
        <Table
          aria-label="Assessment snapshots"
          variant="compact"
          borders={false}
        >
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Hosts</Th>
              <Th>VMs</Th>
              <Th>Networks</Th>
              <Th>Datastores</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {vm.snapshotsSorted.map((s, idx) => {
              const date = s.createdAt
                ? new Date(s.createdAt).toLocaleString()
                : "-";
              const hosts = s.inventory?.vcenter?.infra?.totalHosts ?? "-";
              const vms = s.inventory?.vcenter?.vms?.total ?? "-";
              const networks = Array.isArray(
                s.inventory?.vcenter?.infra?.networks,
              )
                ? s.inventory?.vcenter?.infra?.networks?.length
                : "-";
              const datastores = Array.isArray(
                s.inventory?.vcenter?.infra?.datastores,
              )
                ? s.inventory?.vcenter?.infra?.datastores?.length
                : "-";
              return (
                <Tr key={s.createdAt ? String(s.createdAt) : String(idx)}>
                  <Td>{date}</Td>
                  <Td>{hosts}</Td>
                  <Td>{vms}</Td>
                  <Td>{networks}</Td>
                  <Td>{datastores}</Td>
                  <Td>
                    <Link to={routes.assessmentReport(vm.assessment!.id)}>
                      <Button
                        icon={
                          <Icon isInline>
                            <MonitoringIcon style={{ color: "#0066cc" }} />
                          </Icon>
                        }
                        variant="plain"
                        aria-label="Open report"
                      />
                    </Link>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>
    </AppPage>
  );
};

AssessmentDetails.displayName = "AssessmentDetails";

export default AssessmentDetails;
