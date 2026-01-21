import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  ActionGroup,
  Alert,
  AlertActionLink,
  Button,
  Checkbox,
  Content,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  InputGroup,
  InputGroupItem,
  Spinner,
  TextInput,
} from '@patternfly/react-core';

import { AppPage } from '../../components/AppPage';
import { useDiscoverySources } from '../../migration-wizard/contexts/discovery-sources/Context';
import { DiscoverySourceSetupModal } from '../environment/sources-table/empty-state/DiscoverySourceSetupModal';
import { SourcesTable } from '../environment/sources-table/SourcesTable';

const CreateFromOva: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const discoverySourcesContext = useDiscoverySources();
  const DRAFT_KEY = 'migration-assessment:create-from-ova-draft';
  const hasInitializedRef = React.useRef<boolean>(false);

  const [name, setName] = React.useState<string>('');
  const [useExisting, setUseExisting] = React.useState<boolean>(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] =
    React.useState<string>('');
  const [isSetupModalOpen, setIsSetupModalOpen] =
    React.useState<boolean>(false);
  const [isCreatingAssessment, setIsCreatingAssessment] =
    React.useState<boolean>(false);
  const [isCreatingSource, setIsCreatingSource] =
    React.useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = React.useState<string | null>(null);
  const [isUploadError, setIsUploadError] = React.useState<boolean>(false);
  const [apiError, setApiError] = React.useState<Error | null>(null);

  const isDuplicateNameError = (error: Error | null): boolean =>
    !!error &&
    (/assessment with name '.*' already exists/i.test(error.message || '') ||
      /already exists/i.test(error.message || ''));

  const createdSourceId = discoverySourcesContext.sourceCreatedId || '';
  const createdSource = createdSourceId
    ? discoverySourcesContext.getSourceById?.(createdSourceId)
    : undefined;

  // Initialize form: reset when navigated with reset flag, otherwise restore from session
  React.useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    const shouldReset = Boolean(
      (location as typeof location & { state?: { reset?: boolean } })?.state
        ?.reset,
    );
    if (shouldReset) {
      setName('');
      setUseExisting(false);
      setSelectedEnvironmentId('');
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch (e) {
        // ignore
      }
      // Clear the reset flag from history so future visits don't re-reset
      try {
        navigate(
          `${location.pathname}${location.search}${location.hash || ''}`,
          {
            replace: true,
          },
        );
      } catch (e) {
        // ignore navigation issues
      }
      return;
    }
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        name?: string;
        useExisting?: boolean;
        selectedEnvironmentId?: string;
      };
      if (typeof draft.name === 'string') setName(draft.name);
      if (typeof draft.useExisting === 'boolean')
        setUseExisting(draft.useExisting);
      if (typeof draft.selectedEnvironmentId === 'string')
        setSelectedEnvironmentId(draft.selectedEnvironmentId);
    } catch (e) {
      // ignore invalid storage contents
    }
  }, [location, navigate]);

  // Persist draft to session on change
  React.useEffect(() => {
    try {
      const draft = { name, useExisting, selectedEnvironmentId };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore storage failures
    }
  }, [name, useExisting, selectedEnvironmentId]);

  // Clear any upload status messages when switching environments
  React.useEffect(() => {
    setUploadMessage(null);
    setIsUploadError(false);
  }, [selectedEnvironmentId]);

  React.useEffect(() => {
    if (discoverySourcesContext.assessmentFromAgentState) {
      const preselected = discoverySourcesContext.sourceSelected;
      // Only apply preselection if user has not already chosen/restored a value
      if (preselected?.id && !useExisting && !selectedEnvironmentId) {
        setUseExisting(true);
        setSelectedEnvironmentId(preselected.id);
      }
    }
  }, [
    discoverySourcesContext.assessmentFromAgentState,
    discoverySourcesContext.sourceSelected,
    discoverySourcesContext.sources,
    useExisting,
    selectedEnvironmentId,
  ]);

  const availableEnvironments = React.useMemo(
    () =>
      (discoverySourcesContext.sources || [])
        .filter((source) => source.name !== 'Example')
        .slice()
        .sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    [discoverySourcesContext.sources],
  );

  const selectedEnv = React.useMemo(
    () =>
      (discoverySourcesContext.sources || []).find(
        (s) => s.id === selectedEnvironmentId,
      ),
    [discoverySourcesContext.sources, selectedEnvironmentId],
  );

  const isSelectedNotReady = Boolean(
    useExisting &&
    selectedEnv &&
    !(
      selectedEnv.agent?.status === 'up-to-date' ||
      (selectedEnv?.onPremises && selectedEnv.inventory !== undefined)
    ),
  );

  const handleSubmit = async (): Promise<void> => {
    setIsCreatingAssessment(true);
    try {
      setApiError(null);
      const sourceIdToUse = useExisting
        ? selectedEnvironmentId
        : createdSourceId;

      if (!sourceIdToUse) return;

      const assessment = await discoverySourcesContext.createAssessment(
        name,
        'agent',
        undefined,
        sourceIdToUse,
      );
      // Guard: if provider returns an error-like value instead of throwing, surface it
      if (
        !assessment ||
        typeof assessment !== 'object' ||
        !(assessment as { id?: unknown }).id
      ) {
        const message =
          assessment instanceof Error
            ? assessment.message
            : (assessment as { message?: string })?.message ||
              'Unexpected response while creating assessment.';
        throw new Error(message);
      }
      await discoverySourcesContext.listAssessments();
      navigate(
        `/openshift/migration-assessment/assessments/${assessment.id}/report`,
      );
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch (e) {
        // ignore
      }
    } catch (e) {
      setApiError(
        e instanceof Error
          ? e
          : new Error((e as { message?: string })?.message || String(e)),
      );
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  const handleCancel = React.useCallback(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      // ignore
    }
    navigate(-1);
  }, [navigate]);

  const isSubmitDisabled =
    !name || (useExisting ? !selectedEnvironmentId : !createdSourceId);
  const hasDuplicateNameError = isDuplicateNameError(apiError);
  const hasGeneralApiError = !!apiError && !isDuplicateNameError(apiError);

  return (
    <AppPage
      breadcrumbs={[
        {
          key: 1,
          to: '/openshift/migration-assessment/',
          children: 'Migration assessment',
        },
        {
          key: 2,
          to: '/openshift/migration-assessment/',
          children: 'assessments',
        },
        { key: 3, isActive: true, children: 'create new assessment' },
      ]}
      title="Create new migration assessment"
    >
      <div style={{ maxWidth: '900px' }}>
        <Form isWidthLimited>
          <FormGroup
            label="Assessment Name"
            isRequired
            fieldId="assessment-name"
          >
            <InputGroup>
              <InputGroupItem isFill>
                <TextInput
                  id="assessment-name"
                  aria-label="Assessment name"
                  placeholder="Assessment 1"
                  value={name}
                  onChange={(_, v) => {
                    setName(v);
                    if (apiError) setApiError(null);
                  }}
                  validated={hasDuplicateNameError ? 'error' : 'default'}
                />
              </InputGroupItem>
            </InputGroup>
            <HelperText>
              <HelperTextItem
                variant={hasDuplicateNameError ? 'error' : 'default'}
              >
                {hasDuplicateNameError
                  ? apiError?.message
                  : 'Name your migration assessment'}
              </HelperTextItem>
            </HelperText>
          </FormGroup>

          <Content style={{ marginTop: '16px' }}>
            <Content component="p" style={{ fontWeight: 600 }}>
              follow these steps to connect your environment and create the
              assessment report
            </Content>
            <ol style={{ paddingLeft: '1.2rem', lineHeight: 1.6 }}>
              <li>
                To create a migration assessment for an existing environment,
                select the already created environment from the list and click
                the “Create assessment report” button
              </li>
              <li>
                To connect to a new environment, click the “Add environment”
                button then download and import the Discovery OVA Image to your
                VMware environment
              </li>
              <li>
                When the VM is running, a link will appear below. Use this link
                to input credentials and connect to your environment
              </li>
              <li>
                After the connection is established, you’ll be able to proceed
                and view the discovery report
              </li>
            </ol>
          </Content>

          <div className="pf-v6-u-mt-md">
            <Checkbox
              id="use-existing-env"
              label="Select existing environment"
              isChecked={useExisting}
              onChange={(_, checked) => setUseExisting(checked)}
            />
          </div>

          {useExisting && (
            <FormGroup
              label="Existing environments"
              isRequired
              fieldId="existing-environments"
            >
              <FormSelect
                id="existing-environments"
                value={selectedEnvironmentId}
                onChange={(_e, value) => setSelectedEnvironmentId(value)}
              >
                <FormSelectOption
                  value=""
                  label="Select an existing environment"
                />
                {availableEnvironments.map((env) => (
                  <FormSelectOption
                    key={env.id}
                    value={env.id}
                    label={env.name}
                  />
                ))}
              </FormSelect>
            </FormGroup>
          )}
          {isCreatingSource && (
            <div className="pf-v6-u-mt-md">
              <Spinner />
            </div>
          )}
          {useExisting && selectedEnvironmentId && !isCreatingSource && (
            <div className="pf-v6-u-mt-md">
              <SourcesTable
                onlySourceId={selectedEnvironmentId}
                uploadOnly={true}
                onUploadResult={(message, isError) => {
                  setUploadMessage(message ?? null);
                  setIsUploadError(Boolean(isError));
                }}
                onUploadSuccess={async () => {
                  await discoverySourcesContext.listSources();
                }}
              />
            </div>
          )}
          {uploadMessage && (
            <div className="pf-v6-u-mt-md">
              <Alert
                isInline
                variant={isUploadError ? 'danger' : 'success'}
                title={isUploadError ? 'Upload error' : 'Upload success'}
              >
                {uploadMessage}
              </Alert>
            </div>
          )}
          {!uploadMessage && discoverySourcesContext.errorUpdatingInventory && (
            <div className="pf-v6-u-mt-md">
              <Alert isInline variant="danger" title="Upload error">
                {discoverySourcesContext.errorUpdatingInventory.message}
              </Alert>
            </div>
          )}
          {hasGeneralApiError && (
            <div className="pf-v6-u-mt-md">
              <Alert
                isInline
                variant="danger"
                title="Failed to create assessment"
              >
                {apiError?.message ||
                  'An error occurred while creating the assessment'}
              </Alert>
            </div>
          )}
          {!isCreatingSource && (
            <div className="pf-v6-u-mt-sm">
              <Button
                variant="secondary"
                onClick={() => setIsSetupModalOpen(true)}
                isDisabled={useExisting}
              >
                Add environment
              </Button>
            </div>
          )}
          {createdSource?.agent?.status === 'waiting-for-credentials' && (
            <div className="pf-v6-u-mt-md">
              <Alert
                isInline
                variant="custom"
                title="Discovery VM"
                actionLinks={
                  createdSource?.agent?.credentialUrl ? (
                    <AlertActionLink
                      component="a"
                      href={createdSource.agent.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {createdSource.agent.credentialUrl}
                    </AlertActionLink>
                  ) : undefined
                }
              >
                <Content>
                  <Content component="p">
                    Click the link below to connect the Discovery Source to your
                    VMware environment.
                  </Content>
                </Content>
              </Alert>
            </div>
          )}

          <ActionGroup className="pf-v6-u-mt-lg">
            <Button
              variant="primary"
              isDisabled={
                isSubmitDisabled || isCreatingAssessment || isSelectedNotReady
              }
              isLoading={isCreatingAssessment}
              onClick={handleSubmit}
            >
              Create assessment report
            </Button>
            <Button variant="link" onClick={handleCancel}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>

        {isSetupModalOpen && (
          <DiscoverySourceSetupModal
            isOpen={isSetupModalOpen}
            onClose={async () => {
              // Close immediately to avoid flashing the empty form while async work runs
              setIsSetupModalOpen(false);
              setIsCreatingSource(true);
              const newId = discoverySourcesContext.sourceCreatedId;
              await discoverySourcesContext.listSources();
              if (newId) {
                setUseExisting(true);
                setSelectedEnvironmentId(newId);
              }
              setIsCreatingSource(false);
            }}
            isDisabled={discoverySourcesContext.isDownloadingSource}
            onStartDownload={() => discoverySourcesContext.setDownloadUrl?.('')}
            onAfterDownload={async () => {
              const newId = discoverySourcesContext.sourceCreatedId;
              await discoverySourcesContext.listSources();
              if (newId) {
                setUseExisting(true);
                setSelectedEnvironmentId(newId);
              }
            }}
          />
        )}
      </div>
    </AppPage>
  );
};

CreateFromOva.displayName = 'CreateFromOva';

export default CreateFromOva;
