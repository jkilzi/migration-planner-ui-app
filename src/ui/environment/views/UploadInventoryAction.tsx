import { Button, Icon, Tooltip } from "@patternfly/react-core";
import { UploadIcon } from "@patternfly/react-icons";
import React, { useCallback } from "react";

import { useEnvironmentPage } from "../view-models/EnvironmentPageContext";

interface UploadInventoryProps {
  sourceId: string;
  asLink?: boolean;
}

export const UploadInventoryAction: React.FC<UploadInventoryProps> = ({
  sourceId,
  asLink,
}) => {
  const vm = useEnvironmentPage();

  const handleUploadSource = useCallback(() => {
    vm.uploadInventoryFromFile(sourceId);
  }, [vm, sourceId]);

  return asLink ? (
    <Button
      variant="link"
      onClick={handleUploadSource}
      style={{ padding: 0, marginTop: "5px" }}
    >
      Upload discovery file (JSON)
    </Button>
  ) : (
    <Tooltip content="Upload JSON file">
      <Button
        icon={
          <Icon size="md" isInline>
            <UploadIcon />
          </Icon>
        }
        variant="plain"
        onClick={handleUploadSource}
      />
    </Tooltip>
  );
};
