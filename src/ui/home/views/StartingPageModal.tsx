import { css } from "@emotion/css";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  type MenuToggleElement,
  Title,
} from "@patternfly/react-core";
import { Modal, ModalVariant } from "@patternfly/react-core/deprecated";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "../../../routing/Routes";
import StartingPage from "./StartingPage";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const startingPageModal = css`
  &.pf-v6-c-modal-box {
    width: 70%;
    max-width: var(--pf-v6-c-modal-box--MaxWidth);
    max-height: min(500px, 80vh);
  }

  .pf-v6-c-modal-box__header {
    background-color: white;
    display: flex;
    justify-content: space-between;
    align-items: normal;
    gap: 16px;
  }

  .pf-v6-c-modal-box__footer {
    background-color: white;
    display: flex;
    justify-content: flex-start;
    gap: 16px;
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOpenRVToolsModal: () => void;
};

const StartingPageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenRVToolsModal,
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCreateFromRVTools = (): void => {
    setIsDropdownOpen(false);
    onClose();
    onOpenRVToolsModal();
  };

  const handleCreateFromOVA = (): void => {
    setIsDropdownOpen(false);
    onClose();
    navigate(routes.assessmentCreate, {
      state: { reset: true },
    });
  };

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
      aria-label="Getting started with Migration Assessment"
      className={startingPageModal}
      header={
        <Title headingLevel="h1" size="xl">
          Getting started with Migration Assessment
        </Title>
      }
      actions={[
        <Dropdown
          key="create-dropdown"
          isOpen={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              variant="primary"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              isExpanded={isDropdownOpen}
              style={{ minWidth: "290px" }}
            >
              Create new migration assessment
            </MenuToggle>
          )}
        >
          <DropdownList>
            <DropdownItem key="ova" onClick={handleCreateFromOVA}>
              With discovery OVA
            </DropdownItem>
            <DropdownItem key="rvtools" onClick={handleCreateFromRVTools}>
              From RVTools (XLS/X)
            </DropdownItem>
          </DropdownList>
        </Dropdown>,
        <Button key="close" variant="link" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <StartingPage />
    </Modal>
  );
};

StartingPageModal.displayName = "StartingPageModal";

export default StartingPageModal;
