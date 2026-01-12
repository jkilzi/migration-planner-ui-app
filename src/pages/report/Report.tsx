import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMount } from 'react-use';

import {
  Infra,
  InventoryData,
  Source,
  VMResourceBreakdown,
  VMs,
} from '@migration-planner-ui/api-client/models';
import {
  Alert,
  AlertActionCloseButton,
  Bullseye,
  Button,
  Content,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Split,
  SplitItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { AppPage } from '../../components/AppPage';
import { useDiscoverySources } from '../../migration-wizard/contexts/discovery-sources/Context';
import { Provider as DiscoverySourcesProvider } from '../../migration-wizard/contexts/discovery-sources/Provider';
import { EnhancedDownloadButton } from '../../migration-wizard/steps/discovery/EnhancedDownloadButton';
import { ExportError, SnapshotLike } from '../../services/report-export/types';
import { openAssistedInstaller } from '../assessment/utils/functions';
import { parseLatestSnapshot } from '../assessment/utils/snapshotParser';
import { AgentStatusView } from '../environment/sources-table/AgentStatusView';

import {
  buildClusterViewModel,
  ClusterOption,
} from './assessment-report/clusterView';
import { Dashboard } from './assessment-report/Dashboard';

type AssessmentLike = {
  id: string | number;
  sourceId?: string;
  name?: string;
  sourceType?: string;
  snapshots?: SnapshotLike[];
};

const Inner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const discoverySourcesContext = useDiscoverySources();
  const [exportError, setExportError] = useState<ExportError | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('all');
  const [isClusterSelectOpen, setIsClusterSelectOpen] = useState(false);

  useMount(async () => {
    if (
      !discoverySourcesContext.assessments ||
      discoverySourcesContext.assessments.length === 0
    ) {
      await discoverySourcesContext.listAssessments();
    }
  });

  const assessment = discoverySourcesContext.assessments.find(
    (a) => String((a as AssessmentLike).id) === String(id),
  ) as AssessmentLike | undefined;

  if (discoverySourcesContext.isLoadingAssessments && !assessment) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (!assessment) {
    return (
      <AppPage
        breadcrumbs={[
          {
            key: 1,
            children: 'Migration assessment',
          },
          {
            key: 2,
            to: '/openshift/migration-assessment/assessments',
            children: 'assessments',
          },
          { key: 3, to: '#', children: 'Assessment not found', isActive: true },
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
            <Link to="/openshift/migration-assessment/assessments">
              <Button variant="primary">Back to assessments</Button>
            </Link>
          </StackItem>
        </Stack>
      </AppPage>
    );
  }

  const snapshots = assessment.snapshots || [];
  const last =
    snapshots.length > 0
      ? (snapshots[snapshots.length - 1] as SnapshotLike)
      : ({} as SnapshotLike);
  // At runtime, data from the API will always be the API model types (Infra, VMs).
  // The SnapshotLike union type allows flexibility for export processing,
  // but here we safely cast to the specific types expected by Dashboard.
  const infra = (last.infra ||
    last.inventory?.infra || // legacy
    last.inventory?.vcenter?.infra) as Infra | undefined;
  const vms = (last.vms ||
    last.inventory?.vms || // legacy
    last.inventory?.vcenter?.vms) as VMs | undefined;
  const clusters = last.inventory?.clusters as
    | { [key: string]: InventoryData }
    | undefined;

  const clusterView = buildClusterViewModel({
    infra,
    vms,
    clusters,
    selectedClusterId,
  });

  const hasClusterScopedData =
    Boolean(clusterView.viewInfra) &&
    Boolean(clusterView.viewVms) &&
    Boolean(clusterView.cpuCores) &&
    Boolean(clusterView.ramGB);

  const clusterSelectDisabled = clusterView.clusterOptions.length <= 1;

  const source = assessment.sourceId
    ? discoverySourcesContext.getSourceById(assessment.sourceId)
    : undefined;
  const agent = source?.agent;
  const clusterCount = clusters ? Object.keys(clusters).length : 0;

  const handleClusterSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | number | undefined,
  ): void => {
    if (typeof value === 'string') {
      setSelectedClusterId(value);
    }
    setIsClusterSelectOpen(false);
  };

  // Derive last updated text from latest snapshot
  const lastUpdatedText: string = ((): string => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = parseLatestSnapshot((assessment as any).snapshots);
      return result.lastUpdated || '-';
    } catch {
      return '-';
    }
  })();

  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          children: 'Migration assessment',
        },
        {
          key: 2,
          to: '/openshift/migration-assessment/assessments',
          children: 'assessments',
        },
        {
          key: 3,
          to: '#',
          children: `${assessment.name || `Assessment ${id}`} - vCenter report`,
          isActive: true,
        },
      ]}
      title={`${assessment.name || `Assessment ${id}`} - vCenter report`}
      caption={
        <Stack>
          <StackItem>
            {assessment.sourceType === 'rvtools' ? (
              'Source: RVTools file upload'
            ) : (
              <Split hasGutter>
                <SplitItem isFilled={false}>Discovery VM status:</SplitItem>
                <SplitItem isFilled={false}>
                  <AgentStatusView
                    status={agent ? agent.status : 'not-connected'}
                    statusInfo={
                      source?.onPremises && source?.inventory !== undefined
                        ? undefined
                        : agent
                          ? agent.statusInfo
                          : 'Not connected'
                    }
                    credentialUrl={agent ? agent.credentialUrl : ''}
                    uploadedManually={Boolean(
                      source?.onPremises && source?.inventory !== undefined,
                    )}
                    updatedAt={source?.updatedAt as unknown as string}
                    disableInteractions
                  />
                </SplitItem>
              </Split>
            )}
          </StackItem>
          <StackItem>
            <p>
              Presenting the information we were able to fetch from the
              discovery process
            </p>
          </StackItem>

          <StackItem>
            {lastUpdatedText !== '-'
              ? `Last updated: ${lastUpdatedText}`
              : '[Last updated time stamp]'}
          </StackItem>
          <StackItem>
            {clusterCount > 0 ? (
              typeof vms?.total === 'number' ? (
                <>
                  Detected <strong>{vms?.total} VMS</strong> in{' '}
                  <strong>
                    {clusterCount} {clusterCount === 1 ? 'cluster' : 'clusters'}
                  </strong>
                </>
              ) : (
                <>
                  Detected{' '}
                  <strong>
                    {clusterCount} {clusterCount === 1 ? 'cluster' : 'clusters'}
                  </strong>
                </>
              )
            ) : (
              'No clusters detected'
            )}
          </StackItem>
          <StackItem>
            <Select
              isScrollable
              isOpen={isClusterSelectOpen}
              selected={clusterView.selectionId}
              onSelect={handleClusterSelect}
              onOpenChange={(isOpen: boolean) => {
                if (!clusterSelectDisabled) setIsClusterSelectOpen(isOpen);
              }}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  isExpanded={isClusterSelectOpen}
                  onClick={() => {
                    if (!clusterSelectDisabled) {
                      setIsClusterSelectOpen((prev) => !prev);
                    }
                  }}
                  isDisabled={clusterSelectDisabled}
                  style={{ minWidth: '422px' }}
                >
                  {clusterView.selectionLabel}
                </MenuToggle>
              )}
            >
              <SelectList>
                {clusterView.clusterOptions.map((option: ClusterOption) => (
                  <SelectOption key={option.id} value={option.id}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </StackItem>
        </Stack>
      }
      alerts={
        exportError ? (
          <Alert
            variant="danger"
            isInline
            title="An error occurred"
            actionClose={
              <AlertActionCloseButton onClose={() => setExportError(null)} />
            }
          >
            <p>{exportError?.message}</p>
          </Alert>
        ) : null
      }
      headerActions={
        hasClusterScopedData ? (
          <Split hasGutter>
            <SplitItem>
              <EnhancedDownloadButton
                onError={setExportError}
                elementId="discovery-report"
                componentToRender={
                  <Dashboard
                    infra={clusterView.viewInfra as Infra}
                    vms={clusterView.viewVms as VMs}
                    cpuCores={clusterView.cpuCores as VMResourceBreakdown}
                    ramGB={clusterView.ramGB as VMResourceBreakdown}
                    isExportMode={true}
                    exportAllViews={true}
                    clusters={clusterView.viewClusters}
                    isAggregateView={clusterView.isAggregateView}
                    clusterFound={clusterView.clusterFound}
                  />
                }
                sourceData={discoverySourcesContext.sourceSelected as Source}
                snapshot={last}
                documentTitle={`${assessment.name || `Assessment ${id}`} - vCenter report${
                  clusterView.isAggregateView
                    ? ''
                    : ` - ${clusterView.selectionLabel}`
                }`}
              />
            </SplitItem>
            <SplitItem>
              <Button variant="primary" onClick={openAssistedInstaller}>
                Create a target cluster
              </Button>
            </SplitItem>
          </Split>
        ) : undefined
      }
    >
      {hasClusterScopedData ? (
        <Dashboard
          infra={clusterView.viewInfra as Infra}
          vms={clusterView.viewVms as VMs}
          cpuCores={clusterView.cpuCores as VMResourceBreakdown}
          ramGB={clusterView.ramGB as VMResourceBreakdown}
          clusters={clusterView.viewClusters}
          isAggregateView={clusterView.isAggregateView}
          clusterFound={clusterView.clusterFound}
        />
      ) : (
        <Bullseye>
          <Content>
            <Content component="p">
              {clusterView.isAggregateView
                ? 'This assessment does not have report data yet.'
                : 'No data is available for the selected cluster.'}
            </Content>
          </Content>
        </Bullseye>
      )}
    </AppPage>
  );
};

const Report: React.FC = () => (
  <DiscoverySourcesProvider>
    <Inner />
  </DiscoverySourcesProvider>
);

Report.displayName = 'Report';

export default Report;
