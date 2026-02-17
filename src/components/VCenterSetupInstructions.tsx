import React from "react";

import { InstructionsList } from "./InstructionsList";

export const VCenterSetupInstructions: React.FC = () => {
  return (
    <InstructionsList
      items={[
        {
          text: (
            <>
              Download the OVA file locally or copy its URL to your clipboard.
            </>
          ),
        },
        {
          text: (
            <>
              In your vCenter environment, right-click the target cluster and
              select "Deploy OVF Template..."
            </>
          ),
        },
        {
          text: (
            <>
              Paste the URL or upload the downloaded OVA file when prompted, and
              follow the remaining configuration steps to finalize the
              deployment.
            </>
          ),
        },
        {
          text: (
            <>
              Power on the virtual machine and wait for it to be assigned an IP
              address.
            </>
          ),
        },
        {
          text: (
            <>
              Navigate to the agent's web interface at{" "}
              <code>https://&lt;VM_IP&gt;:3333</code>
            </>
          ),
        },
        {
          text: (
            <>
              Enter your vCenter admin-read-only credentials.
              <br />
              <em>
                Note: For security, these credentials are never stored. They
                reside strictly within the agent VM's volatile memory.
              </em>
            </>
          ),
        },
        {
          text: (
            <>
              Select your preference for sharing aggregated data with
              console.redhat.com (read more{" "}
              <a
                href="https://kubev2v.github.io/assisted-migration-docs/docs/tutorial/#discovery-agent-flow"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </a>
              )
            </>
          ),
        },
        {
          text: (
            <>
              Once data sharing is enabled, you can monitor the VM status via
              the Assessment/Environment page on the Red Hat console.
            </>
          ),
        },
      ]}
    />
  );
};

VCenterSetupInstructions.displayName = "VCenterSetupInstructions";
