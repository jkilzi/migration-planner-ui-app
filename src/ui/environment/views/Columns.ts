export const Columns = {
  Name: "Name",
  CredentialsUrl: "Credentials URL",
  Status: "Discovery VM Status",
  Hosts: "Hosts",
  VMs: "VMs",
  Networks: "Networks",
  Datastores: "Datastores",
  Actions: "Actions",
  LastSeen: "Last updated",
} as const;

export type Columns = (typeof Columns)[keyof typeof Columns];
