import React, { useState } from 'react';

import { Job, JobStatus } from '@migration-planner-ui/api-client/models';
import {
  Alert,
  Button,
  FileUpload,
  Form,
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
  TextInput,
} from '@patternfly/react-core';
import { Modal, ModalVariant } from '@patternfly/react-core/deprecated';

import {
  getProgressLabel,
  getProgressValue,
  TERMINAL_JOB_STATUSES,
} from './utils/rvToolsJobUtils';

export type AssessmentMode = 'inventory' | 'rvtools' | 'agent';

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    file: File | null,
    mode: AssessmentMode,
  ) => Promise<void>;
  mode: AssessmentMode;
  isLoading?: boolean;
  error?: Error | null;
  selectedEnvironment?: { id: string; name: string } | null;
  onSelectEnvironment?: (assessmentName: string) => void;
  job?: Job | null;
}

const isDuplicateNameError = (error: Error | null): boolean =>
  !!error &&
  (/assessment with name '.*' already exists/i.test(error.message || '') ||
    /already exists/i.test(error.message || ''));

const isAbortError = (error: Error | null): boolean => {
  if (!error) return false;
  const message = error.message || '';
  return (
    (typeof (error as { name?: unknown }).name === 'string' &&
      (error as { name: string }).name === 'AbortError') ||
    (error instanceof DOMException &&
      typeof error.message === 'string' &&
      /aborted/i.test(error.message)) ||
    /aborted/i.test(message)
  );
};

const extractErrorMessage = (message: string): string => {
  const lastColonIndex = message.lastIndexOf(':');
  return lastColonIndex !== -1
    ? message.slice(lastColonIndex + 1).trim()
    : message;
};

export const CreateAssessmentModal: React.FC<CreateAssessmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  isLoading = false,
  error = null,
  selectedEnvironment = null,
  onSelectEnvironment: _onSelectEnvironment,
  job = null,
}) => {
  const [assessmentName, setAssessmentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filename, setFilename] = useState('');
  const [isFileLoading, _setIsFileLoading] = useState(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState('');

  const [nameValidationError, setNameValidationError] = useState('');
  const [fileValidationError, setFileValidationError] = useState('');

  // Track dismissed API errors (reset on new submission)
  const [nameErrorDismissed, setNameErrorDismissed] = useState(false);
  const [fileErrorDismissed, setFileErrorDismissed] = useState(false);

  // Helper to check if job is processing
  const isJobProcessing = job && !TERMINAL_JOB_STATUSES.includes(job.status);

  // Helper to check if file operations should be disabled (RVTools mode during job creation/processing)
  const isFileOperationsDisabled =
    mode === 'rvtools' && (isLoading || isJobProcessing);

  // Derive error from job failure
  const jobError = React.useMemo(() => {
    return job?.status === JobStatus.Failed
      ? new Error(extractErrorMessage(job.error || 'Processing failed'))
      : null;
  }, [job]);

  // Combine with existing error logic - job error takes priority
  const effectiveError = jobError || error;

  // Reset dismissed flags when a new error occurs
  React.useEffect(() => {
    if (error || jobError) {
      setNameErrorDismissed(false);
      setFileErrorDismissed(false);
    }
  }, [error, jobError]);

  const hasDuplicateNameError =
    !nameErrorDismissed && isDuplicateNameError(effectiveError);
  const hasGeneralApiError =
    !fileErrorDismissed &&
    !!effectiveError &&
    !isDuplicateNameError(effectiveError) &&
    !isAbortError(effectiveError);

  const nameErrorToDisplay =
    nameValidationError ||
    (hasDuplicateNameError ? effectiveError?.message : '');

  const availableEnvironments = selectedEnvironment
    ? [selectedEnvironment]
    : [];

  const getFileConfig = (): {
    title: string;
    fileLabel: string;
    fileDescription: string;
    allowedExtensions: string[];
    accept: string;
  } => {
    switch (mode) {
      case 'inventory':
        return {
          title: 'Create Assessment from Inventory',
          fileLabel: 'Inventory File (JSON)',
          fileDescription: 'Select a JSON inventory file (max 50 MiB)',
          accept: '.json',
          allowedExtensions: ['json'],
        };
      case 'rvtools':
        return {
          title: 'Create migration assessment from RVTools',
          fileLabel: 'RVTools File (Excel)',
          fileDescription: 'Select an Excel file from RVTools (max 50 MiB)',
          accept: '.xlsx,.xls',
          allowedExtensions: ['xlsx', 'xls'],
        };
      case 'agent':
        return {
          title: 'Create migration assessment from Environment',
          fileLabel: 'Environment',
          fileDescription: 'Select an environment to create assessment from',
          accept: '',
          allowedExtensions: [],
        };
      default:
        return {
          title: 'Create Assessment',
          fileLabel: 'File',
          fileDescription: 'Select a file (max 50 MiB)',
          accept: '*',
          allowedExtensions: [],
        };
    }
  };

  const config = getFileConfig();

  const handleFileChange = (
    _event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
    file: File,
  ): void => {
    // Prevent file changes during RVTools job creation/processing
    if (isFileOperationsDisabled) {
      return;
    }

    setFileErrorDismissed(true);

    const maxSize = 52428800; // 50 MiB
    const fileExtension = file.name.toLowerCase().split('.').pop();

    if (
      config.allowedExtensions.length > 0 &&
      !config.allowedExtensions.includes(fileExtension || '')
    ) {
      const extensionList = config.allowedExtensions.join(', ');
      setFileValidationError(
        `Unsupported file format. Please select a ${extensionList} file.`,
      );
      setSelectedFile(null);
      setFilename('');
      return;
    }

    if (file.size > maxSize) {
      setFileValidationError(
        'The file is too big. Select a file up to 50 MiB.',
      );
      setSelectedFile(null);
      setFilename('');
      return;
    }

    setFileValidationError('');
    setSelectedFile(file);
    setFilename(file.name);
  };

  const handleFileClear = (): void => {
    // Prevent file clearing during RVTools job creation/processing
    if (isFileOperationsDisabled) {
      return;
    }

    setSelectedFile(null);
    setFilename('');
    setFileValidationError('');
    setFileErrorDismissed(true);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!assessmentName.trim()) {
      setNameValidationError('Assessment name is required');
      isValid = false;
    } else {
      setNameValidationError('');
    }

    if (mode === 'agent' && !selectedEnvironment) {
      setFileValidationError('Environment selection is required');
      isValid = false;
    } else if (mode !== 'agent' && !selectedFile) {
      setFileValidationError('File upload is required');
      isValid = false;
    } else if (!fileValidationError) {
      setFileValidationError('');
    }

    return isValid;
  };

  const handleSubmit = async (): Promise<void> => {
    if (validateForm()) {
      try {
        await onSubmit(assessmentName.trim(), selectedFile, mode);
      } catch (err) {
        console.error('Error creating assessment:', err);
      }
    }
  };

  // Simple close handler - just reset form and call parent's onClose
  // Parent (Assessment.tsx) handles all cancel logic
  const handleClose = (): void => {
    setAssessmentName('');
    setSelectedFile(null);
    setFilename('');
    setNameValidationError('');
    setFileValidationError('');
    setSelectedEnvironmentId('');
    setNameErrorDismissed(true);
    setFileErrorDismissed(true);
    onClose();
  };

  const isFormValid =
    assessmentName.trim() &&
    (mode === 'agent' ? selectedEnvironment : selectedFile);

  const isButtonDisabled =
    !isFormValid ||
    isLoading ||
    !!nameErrorToDisplay ||
    !!fileValidationError ||
    hasGeneralApiError ||
    !!isJobProcessing;

  const actions = [
    <Button
      key="create"
      variant="primary"
      onClick={handleSubmit}
      isDisabled={isButtonDisabled}
      isLoading={isLoading || isJobProcessing}
    >
      Create Migration Assessment
    </Button>,
    <Button key="cancel" variant="link" onClick={handleClose}>
      Cancel
    </Button>,
    isJobProcessing && job && (
      <div key="progress" style={{ marginRight: 'auto' }}>
        {`${getProgressValue(job.status)}% done. ${getProgressLabel(job.status)}`}
      </div>
    ),
  ].filter(Boolean);

  return (
    <Modal
      variant={ModalVariant.medium}
      title={config.title}
      isOpen={isOpen}
      onClose={handleClose}
      actions={actions}
    >
      <Form>
        <FormGroup label="Assessment Name" isRequired fieldId="assessment-name">
          <TextInput
            isRequired
            type="text"
            id="assessment-name"
            name="assessment-name"
            value={assessmentName}
            onChange={(_event, value) => {
              setAssessmentName(value);
              if (nameValidationError && value.trim()) {
                setNameValidationError('');
              }
              setNameErrorDismissed(true);
            }}
            validated={nameErrorToDisplay ? 'error' : 'default'}
            placeholder="Enter assessment name"
          />
          {nameErrorToDisplay && (
            <HelperText>
              <HelperTextItem variant="error">
                {nameErrorToDisplay}
              </HelperTextItem>
            </HelperText>
          )}
        </FormGroup>

        {mode === 'agent' ? (
          <FormGroup
            label={config.fileLabel}
            isRequired
            fieldId="assessment-environment"
          >
            <div
              style={{
                fontSize: '14px',
                color: 'var(--pf-global--Color--200)',
                marginBottom: '8px',
              }}
            >
              {config.fileDescription}
            </div>
            <FormSelect
              value={selectedEnvironmentId}
              onChange={(_event, value) => {
                setSelectedEnvironmentId(value);
                if (fileValidationError && value) {
                  setFileValidationError('');
                }
              }}
              validated={fileValidationError ? 'error' : 'default'}
            >
              <FormSelectOption value="" label="Select an environment" />
              {availableEnvironments.map((env) => (
                <FormSelectOption
                  key={env.id}
                  value={env.id}
                  label={env.name}
                />
              ))}
            </FormSelect>
            {fileValidationError && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    variant="error"
                    data-testid="upload-field-helper-text"
                  >
                    {fileValidationError}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        ) : (
          <FormGroup
            label={config.fileLabel}
            isRequired
            fieldId="assessment-file"
          >
            <div
              style={{
                fontSize: '14px',
                color: 'var(--pf-global--Color--200)',
                marginBottom: '8px',
              }}
            >
              {config.fileDescription}
            </div>
            <FileUpload
              id="assessment-file"
              type="text"
              value=""
              filename={filename}
              filenamePlaceholder="Drag and drop a file or select one"
              onFileInputChange={handleFileChange}
              onClearClick={handleFileClear}
              isLoading={isFileLoading}
              allowEditingUploadedText={false}
              browseButtonText="Select"
              validated={fileValidationError ? 'error' : 'default'}
              accept={config.accept}
              hideDefaultPreview
              isDisabled={isFileOperationsDisabled}
            />
            {fileValidationError && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    variant="error"
                    data-testid="upload-field-helper-text"
                  >
                    {fileValidationError}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        )}
      </Form>

      {hasGeneralApiError && (
        <Alert
          variant="danger"
          title="Failed to create assessment"
          style={{ marginTop: '16px', marginBottom: '0' }}
          isInline
        >
          {effectiveError?.message ||
            'An error occurred while creating the assessment'}
        </Alert>
      )}
    </Modal>
  );
};

CreateAssessmentModal.displayName = 'CreateAssessmentModal';

export default CreateAssessmentModal;
