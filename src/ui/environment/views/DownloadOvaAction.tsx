import { Button, Icon, Tooltip } from "@patternfly/react-core";
import { DownloadIcon } from "@patternfly/react-icons";
import React, { useCallback, useState } from "react";

import { useEnvironmentPage } from "../view-models/EnvironmentPageContext";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace DownloadOvaAction {
  export type Props = {
    sourceId: string;
    sourceName?: string;
    isDisabled?: boolean;
  };
}

export const DownloadOvaAction: React.FC<DownloadOvaAction.Props> = (props) => {
  const { sourceId, sourceName, isDisabled = false } = props;

  const vm = useEnvironmentPage();
  const [isDownloading, setIsDownloading] = useState(false);
  const url = vm.getDownloadUrlForSource(sourceId);

  const handleDownload = useCallback(() => {
    try {
      if (!url) {
        return;
      }
      setIsDownloading(true);

      const anchor = document.createElement("a");
      anchor.download = `${sourceName || sourceId}.ova`;
      anchor.href = url;
      anchor.click();
      anchor.remove();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [sourceId, sourceName, url]);

  return (
    <Tooltip content="Download OVA File">
      <Button
        icon={
          <Icon size="md" isInline>
            <DownloadIcon />
          </Icon>
        }
        data-source-id={sourceId}
        variant="plain"
        isDisabled={isDisabled || isDownloading || !url}
        onClick={handleDownload}
      />
    </Tooltip>
  );
};

DownloadOvaAction.displayName = "DownloadOvaAction";
