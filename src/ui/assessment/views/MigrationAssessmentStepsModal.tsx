import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from "@patternfly/react-core";
import React from "react";

interface MigrationAssessmentStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MigrationAssessmentStepsModal: React.FC<
  MigrationAssessmentStepsModalProps
> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<"existing" | "new">(
    "existing",
  );

  return (
    <Modal variant={ModalVariant.medium} isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="Migration assessment steps" />
      <ModalBody>
        <div className="pf-v6-u-mb-lg" style={{ display: "flex", gap: "16px" }}>
          <button
            onClick={() => setActiveTab("existing")}
            style={{
              flex: 1,
              cursor: "pointer",
              border:
                activeTab === "existing"
                  ? "2px solid #0066CC"
                  : "1px solid #D2D2D2",
              backgroundColor: activeTab === "existing" ? "#E7F1FA" : "#FFFFFF",
              borderRadius: "12px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#151515",
              transition: "all 0.2s ease",
            }}
            type="button"
          >
            Existing environment
          </button>
          <button
            onClick={() => setActiveTab("new")}
            style={{
              flex: 1,
              cursor: "pointer",
              border:
                activeTab === "new" ? "2px solid #0066CC" : "1px solid #D2D2D2",
              backgroundColor: activeTab === "new" ? "#E7F1FA" : "#FFFFFF",
              borderRadius: "12px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#151515",
              transition: "all 0.2s ease",
            }}
            type="button"
          >
            New environment
          </button>
        </div>

        {activeTab === "existing" && (
          <ol className="pf-v6-u-pl-md">
            <li className="pf-v6-u-mb-md">
              <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-xs">
                Select
              </div>
              <div className="pf-v6-u-color-200">
                Select an environment from the list and click "Create assessment
                report."
              </div>
            </li>

            <li className="pf-v6-u-mb-md">
              <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-xs">
                Link vCenter
              </div>
              <div className="pf-v6-u-color-200">
                Use the generated URL in vSphere to connect your agent.
              </div>
            </li>

            <li className="pf-v6-u-mb-md">
              <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-xs">
                Choose Privacy
              </div>
              <div className="pf-v6-u-color-200">
                Share data with Red Hat for full features, or continue locally.
              </div>
            </li>

            <li>
              <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-xs">
                Generate
              </div>
              <div className="pf-v6-u-color-200">
                Once connected and data sharing is enabled, select your
                environment from the table to generate your report.
              </div>
            </li>
          </ol>
        )}

        {activeTab === "new" && (
          <ol className="pf-v6-u-pl-md">
            <li className="pf-v6-u-mb-md">
              <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-xs">Add</div>
              <div className="pf-v6-u-color-200">
                Click "Add environment" and import the Discovery OVA to your
                VMware environment.
              </div>
            </li>

            <li className="pf-v6-u-mb-md">
              <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-xs">
                Link vCenter
              </div>
              <div className="pf-v6-u-color-200">
                Use the generated URL in vSphere to connect your agent.
              </div>
            </li>

            <li className="pf-v6-u-mb-md">
              <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-xs">
                Choose Privacy
              </div>
              <div className="pf-v6-u-color-200">
                Share data with Red Hat for full features, or continue locally.
              </div>
            </li>

            <li>
              <div className="pf-v6-u-font-weight-bold pf-v6-u-mb-xs">
                Generate
              </div>
              <div className="pf-v6-u-color-200">
                Once connected and data sharing is enabled, select your
                environment from the table to generate your report.
              </div>
            </li>
          </ol>
        )}
      </ModalBody>
    </Modal>
  );
};
