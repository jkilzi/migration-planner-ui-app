import {
  Button,
  type DropEvent,
  FileUpload,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "@patternfly/react-core";
import React, { useEffect, useState } from "react";

interface UpdateAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, file?: File) => void;
  name: string;
}

export const UpdateAssessment: React.FC<UpdateAssessmentProps> = ({
  isOpen,
  onClose,
  onSubmit,
  name,
}) => {
  const [assessmentName, setAssessmentName] = useState(name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Reset form when name prop changes or modal opens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAssessmentName(name);
    setSelectedFile(null);
  }, [name, isOpen]);

  const handleSubmit = (): void => {
    if (assessmentName.trim()) {
      onSubmit(assessmentName.trim(), selectedFile || undefined);
    }
  };

  const handleFileChange = (_event: DropEvent, file: File): void => {
    setSelectedFile(file);
  };

  const handleFileClear = (): void => {
    setSelectedFile(null);
  };

  const isUpdateEnabled = assessmentName.trim();

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="Update Assessment" />
      <ModalBody>
        <Form>
          <FormGroup label="Name" isRequired fieldId="assessment-name">
            <TextInput
              isRequired
              type="text"
              id="assessment-name"
              name="assessment-name"
              value={assessmentName}
              onChange={(_event, value) => setAssessmentName(value)}
            />
          </FormGroup>

          <FormGroup label="Upload" fieldId="assessment-file">
            <FileUpload
              id="assessment-file"
              type="text"
              value=""
              filename={selectedFile?.name || ""}
              filenamePlaceholder="Drag and drop a file or select one"
              onFileInputChange={handleFileChange}
              onClearClick={handleFileClear}
              isLoading={false}
              allowEditingUploadedText={false}
              browseButtonText="Select file"
              hideDefaultPreview
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="update"
          variant="primary"
          onClick={handleSubmit}
          isDisabled={!isUpdateEnabled}
        >
          Update
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

UpdateAssessment.displayName = "UpdateAssessment";

export default UpdateAssessment;
