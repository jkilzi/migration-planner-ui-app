import React from 'react';

import {
  Infra,
  Inventory,
  InventoryFromJSON,
  VMResourceBreakdown,
  VMs,
} from '@migration-planner-ui/api-client/models';
import { Icon } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { t_global_color_status_success_default as globalSuccessColor100 } from '@patternfly/react-tokens/dist/js/t_global_color_status_success_default';

import { AppPage } from '../../components/AppPage';

import { Dashboard } from './assessment-report/Dashboard';

const inventoryData = {
  vcenterId: '502d878c-af91-4a6f-93e9-61c4a1986172',
  clusters: {
    'Cluster 1': {
      infra: { cpuOverCommitment: 1.87, host: Array(7).fill({}) },
      vms: { total: 100 },
    },
    'Cluster 2': {
      infra: { host: Array(3).fill({}) },
      vms: { total: 88 },
    },
  },
  vcenter: {
    vcenter: {
      id: '502d878c-af91-4a6f-93e9-61c4a1986172',
    },
    infra: {
      clustersPerDatacenter: [2],
      cpuOverCommitment: 1.87,
      datastores: [
        {
          diskId: 'mpx.vmhba0:C0:T1:L0',
          freeCapacityGB: 150,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'HPE E208i-a SR Gen10',
          protocolType: 'SAS',
          totalCapacityGB: 766,
          type: 'VMFS',
          vendor: 'ATA',
        },
        {
          diskId: 'mpx.vmhba0:C0:T1:L0',
          freeCapacityGB: 641,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'HPE E208i-a SR Gen10',
          protocolType: 'SAS',
          totalCapacityGB: 766,
          type: 'VMFS',
          vendor: 'ATA',
        },
        {
          diskId: 'mpx.vmhba0:C0:T1:L0',
          freeCapacityGB: 247,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'HPE E208i-a SR Gen10',
          protocolType: 'SAS',
          totalCapacityGB: 766,
          type: 'VMFS',
          vendor: 'ATA',
        },
        {
          diskId: 'naa.600a098038314648593f517773636465',
          freeCapacityGB: 1102,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'iSCSI Software Adapter',
          protocolType: 'iSCSI',
          totalCapacityGB: 3321,
          type: 'VMFS',
          vendor: 'NETAPP',
        },
        {
          diskId: 'naa.600a0980383139544924583130314c41',
          freeCapacityGB: 2645,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'iSCSI Software Adapter',
          protocolType: 'iSCSI',
          totalCapacityGB: 9215,
          type: 'VMFS',
          vendor: 'NETAPP',
        },
        {
          diskId: 'mpx.vmhba0:C0:T1:L0',
          freeCapacityGB: 308,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'HPE E208i-a SR Gen10',
          protocolType: 'SAS',
          totalCapacityGB: 766,
          type: 'VMFS',
          vendor: 'ATA',
        },
        {
          diskId: 'mpx.vmhba0:C0:T1:L0',
          freeCapacityGB: 226,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'HPE E208i-a SR Gen10',
          protocolType: 'SAS',
          totalCapacityGB: 766,
          type: 'VMFS',
          vendor: 'ATA',
        },
        {
          diskId: 'naa.60002ac0000000000000182d00021f6b',
          freeCapacityGB: 1447,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'iSCSI Software Adapter',
          protocolType: 'iSCSI',
          totalCapacityGB: 3071,
          type: 'VMFS',
          vendor: '3PARdata',
        },
        {
          diskId: 'mpx.vmhba0:C0:T1:L0',
          freeCapacityGB: 205,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'HPE E208i-a SR Gen10',
          protocolType: 'SAS',
          totalCapacityGB: 766,
          type: 'VMFS',
          vendor: 'ATA',
        },
        {
          diskId: 'N/A',
          freeCapacityGB: 153,
          hardwareAcceleratedMove: false,
          hostId: null,
          model: 'N/A',
          protocolType: 'N/A',
          totalCapacityGB: 196,
          type: 'NFS',
          vendor: 'N/A',
        },
        {
          diskId: 'mpx.vmhba0:C0:T1:L0',
          freeCapacityGB: 208,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'HPE E208i-a SR Gen10',
          protocolType: 'SAS',
          totalCapacityGB: 766,
          type: 'VMFS',
          vendor: 'ATA',
        },
        {
          diskId: 'naa.600a0980383139544924583130316a78',
          freeCapacityGB: 498,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'N/A',
          protocolType: 'N/A',
          totalCapacityGB: 499,
          type: 'VMFS',
          vendor: 'NETAPP',
        },
        {
          diskId: 'naa.624a9370a7b9f7ecc01e40f70001181f',
          freeCapacityGB: 394,
          hardwareAcceleratedMove: true,
          hostId: null,
          model: 'N/A',
          protocolType: 'N/A',
          totalCapacityGB: 499,
          type: 'VMFS',
          vendor: 'PURE',
        },
        {
          diskId: 'N/A',
          freeCapacityGB: 97,
          hardwareAcceleratedMove: false,
          hostId: null,
          model: 'N/A',
          protocolType: 'N/A',
          totalCapacityGB: 97,
          type: 'NFS',
          vendor: 'N/A',
        },
        {
          diskId: 'N/A',
          freeCapacityGB: 97,
          hardwareAcceleratedMove: false,
          hostId: null,
          model: 'N/A',
          protocolType: 'N/A',
          totalCapacityGB: 97,
          type: 'NFS',
          vendor: 'N/A',
        },
        {
          diskId: 'N/A',
          freeCapacityGB: 96,
          hardwareAcceleratedMove: false,
          hostId: null,
          model: 'N/A',
          protocolType: 'N/A',
          totalCapacityGB: 97,
          type: 'NFS',
          vendor: 'N/A',
        },
      ],
      hostPowerStates: {
        red: 7,
        yellow: 3,
      },
      hostsPerCluster: [7, 3],
      hosts: [
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: 'host-64',
          memoryMB: 261797,
          model: 'ProLiant DL380 Gen10',
          vendor: 'HPE',
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: 'host-36',
          memoryMB: 261797,
          model: 'ProLiant DL380 Gen10',
          vendor: 'HPE',
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: 'host-40',
          memoryMB: 261797,
          model: 'ProLiant DL380 Gen10',
          vendor: 'HPE',
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: 'host-3152',
          memoryMB: 261797,
          model: 'ProLiant DL380 Gen10',
          vendor: 'HPE',
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: 'host-12657',
          memoryMB: 261797,
          model: 'ProLiant DL380 Gen10',
          vendor: 'HPE',
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: 'host-12642',
          memoryMB: 261797,
          model: 'ProLiant DL380 Gen10',
          vendor: 'HPE',
        },
        {
          cpuCores: 32,
          cpuSockets: 2,
          id: 'host-3078',
          memoryMB: 261797,
          model: 'ProLiant DL380 Gen10',
          vendor: 'HPE',
        },
      ],
      networks: [
        {
          dvswitch: '',
          name: 'vDSwitch0',
          type: 'dvswitch',
          vlanId: '',
          vmsCount: 0,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'v371_10.46.49.x',
          type: 'distributed',
          vlanId: '371',
          vmsCount: 121,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'VM Network',
          type: 'distributed',
          vlanId: '341',
          vmsCount: 7,
        },
        {
          dvswitch: 'vDSwitch0',
          name: '3par_net1',
          type: 'distributed',
          vlanId: '',
          vmsCount: 32,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'v375_10.46.52.x',
          type: 'distributed',
          vlanId: '375',
          vmsCount: 0,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'Management Network',
          type: 'distributed',
          vlanId: '341',
          vmsCount: 2,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'vDSwitch0-DVUplinks',
          type: 'distributed',
          vlanId: '0-4094',
          vmsCount: 0,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'v376_10.46.52.128/25',
          type: 'distributed',
          vlanId: '376',
          vmsCount: 0,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'vMotion',
          type: 'distributed',
          vlanId: '375',
          vmsCount: 0,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'v374_10.46.53.125/25',
          type: 'distributed',
          vlanId: '374',
          vmsCount: 0,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'v370_10.46.48.x',
          type: 'distributed',
          vlanId: '370',
          vmsCount: 0,
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'TestNetwork',
          type: 'distributed',
          vlanId: '341',
        },
        {
          dvswitch: 'vDSwitch0',
          name: 'eco-gpfs-net01',
          type: 'distributed',
          vlanId: '',
          vmsCount: 0,
        },
        {
          dvswitch: '',
          name: 'test-dummy-dswitch',
          type: 'dvswitch',
          vlanId: '',
          vmsCount: 0,
        },
        {
          dvswitch: 'test-dummy-dswitch',
          name: 'test-dummy-dswit-DVUplinks-52745',
          type: 'distributed',
          vlanId: '0-4094',
          vmsCount: 0,
        },
        {
          dvswitch: 'test-dummy-dswitch',
          name: 'DPortGroup',
          type: 'distributed',
          vlanId: '',
          vmsCount: 0,
        },
      ],
      totalClusters: 2,
      totalDatacenters: 1,
      totalHosts: 10,
      vmsPerCluster: [100, 88],
    },
    vms: {
      cpuCores: {
        histogram: {
          data: [105, 0, 46, 0, 4, 0, 16, 1, 0, 0, 0, 3, 17],
          minValue: 1,
          step: 1,
        },
        total: 829,
        totalForMigratable: 6,
        totalForMigratableWithWarnings: 802,
        totalForNotMigratable: 21,
      },
      diskCount: {
        histogram: {
          data: [8, 166, 0, 13, 3, 0, 1, 0, 0, 0, 0, 0, 1],
          minValue: 0,
          step: 1,
        },
        total: 213,
        totalForMigratable: 3,
        totalForMigratableWithWarnings: 195,
        totalForNotMigratable: 15,
      },
      diskGB: {
        histogram: {
          data: [111, 58, 10, 2, 2, 0, 3, 4, 0, 0, 0, 0, 2],
          minValue: 0,
          step: 79,
        },
        total: 17678,
        totalForMigratable: 100,
        totalForMigratableWithWarnings: 17237,
        totalForNotMigratable: 341,
      },
      diskSizeTier: {
        'Easy (0-10TB)': {
          totalSizeTB: 16.36,
          vmCount: 200,
        },
        'Hard (20-50TB)': {
          totalSizeTB: 2554.96,
          vmCount: 88,
        },
        'Medium (10-20TB)': {
          totalSizeTB: 5189.45,
          vmCount: 364,
        },
        'White Glove (>50TB)': {
          totalSizeTB: 2900.98,
          vmCount: 36,
        },
      },
      diskTypes: {
        NFS: {
          totalSizeTB: 0.16,
          vmCount: 2,
        },
        VMFS: {
          totalSizeTB: 16.33,
          vmCount: 186,
        },
      },
      distributionByCpuTier: {
        '0-4': 76,
        '17-32': 8,
        '5-8': 80,
        '9-16': 32,
      },
      distributionByMemoryTier: {
        '0-4': 8,
        '17-32': 64,
        '33-64': 48,
        '5-16': 64,
        '65-128': 12,
      },
      migrationWarnings: [
        {
          assessment:
            'Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.',
          count: 178,
          label: 'Disk - scsi0:0 does not have CBT enabled',
        },
        {
          assessment:
            'For VM warm migration, Changed Block Tracking (CBT) must be enabled in VMware.',
          count: 187,
          label: 'Changed Block Tracking (CBT) not enabled',
        },
        {
          assessment:
            "The 'hostname' is set to 'localhost.localdomain', which is a default value. The hostname might be renamed during migration.",
          count: 39,
          label: 'Default Host Name',
        },
        {
          assessment:
            "The 'hostname' field is missing or empty. The hostname might be renamed during migration.",
          count: 60,
          label: 'Empty Host Name',
        },
        {
          assessment:
            'The guest operating system is not currently supported by the Migration Toolkit for Virtualization',
          count: 3,
          label: 'Unsupported operating system detected',
        },
        {
          assessment:
            'The VM is configured with a TPM device. TPM data will not be transferred during the migration.',
          count: 3,
          label: 'TPM detected',
        },
        {
          assessment:
            'The VM name does not comply with the DNS subdomain name format. Edit the name or it will be renamed automatically during the migration to meet RFC 1123. The VM name must be a maximum of 63 characters containing lowercase letters (a-z), numbers (0-9), periods (.), and hyphens (-). The first and last character must be a letter or number. The name cannot contain uppercase letters, spaces or special characters.',
          count: 22,
          label: 'Invalid VM Name',
        },
        {
          assessment:
            'Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.',
          count: 16,
          label: 'Disk - scsi0:1 does not have CBT enabled',
        },
        {
          assessment:
            'Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.',
          count: 2,
          label: 'Disk - scsi0:2 does not have CBT enabled',
        },
        {
          assessment:
            'Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.',
          count: 2,
          label: 'Disk - ide0:0 does not have CBT enabled',
        },
        {
          assessment:
            'Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.',
          count: 2,
          label: 'Disk - ide0:1 does not have CBT enabled',
        },
        {
          assessment:
            'Hot pluggable CPU or memory is not currently supported by Migration Toolkit for Virtualization. You can reconfigure CPU or memory after migration.',
          count: 4,
          label: 'CPU/Memory hotplug detected',
        },
        {
          assessment:
            'Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.',
          count: 1,
          label: 'Disk - scsi0:3 does not have CBT enabled',
        },
        {
          assessment:
            'Changed Block Tracking (CBT) has not been enabled for this device. This feature is a prerequisite for VM warm migration.',
          count: 1,
          label: 'Disk - scsi0:4 does not have CBT enabled',
        },
      ],
      nicCount: {
        histogram: {
          data: [3, 185, 8, 0, 1, 0, 3],
          minValue: 0,
          step: 1,
        },
        total: 223,
        totalForMigratable: 0,
        totalForMigratableWithWarnings: 214,
        totalForNotMigratable: 9,
      },
      notMigratableReasons: [
        {
          assessment:
            "Independent disks cannot be transferred using recent versions of VDDK. The VM cannot be migrated unless disks are changed to 'Dependent' mode in VMware.",
          count: 6,
          label: 'Independent disk detected',
        },
      ],
      osInfo: {
        '': {
          count: 2,
          supported: false,
        },
        'AlmaLinux (64-bit)': {
          count: 1,
          supported: false,
        },
        'Amazon Linux 2 (64-bit)': {
          count: 2,
          supported: false,
          upgradeRecommendation:
            'The guest operating system: Amazon Linux 2 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 8',
        },
        'CentOS 7 (64-bit)': {
          count: 1,
          supported: false,
          upgradeRecommendation:
            'The guest operating system: CentOS 7 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 7',
        },
        'CentOS 8 (64-bit)': {
          count: 1,
          supported: false,
          upgradeRecommendation:
            'The guest operating system: CentOS 8 (64-bit) is not currently supported. The operating system can be upgraded to Red Hat Enterprise Linux 8',
        },
        'Data ONTAP9.15.1': {
          count: 1,
          supported: false,
        },
        'Debian GNU/Linux 12 (64-bit)': {
          count: 1,
          supported: false,
        },
        'Debian GNU/Linux 9 (64-bit)': {
          count: 1,
          supported: false,
        },
        'FreeBSD Pre-11 versions (64-bit)': {
          count: 1,
          supported: false,
        },
        'Microsoft Windows 10 (64-bit)': {
          count: 4,
          supported: true,
        },
        'Microsoft Windows 11 (64-bit)': {
          count: 3,
          supported: true,
        },
        'Microsoft Windows Server 2019 (64-bit)': {
          count: 4,
          supported: true,
        },
        'Microsoft Windows Server 2022 (64-bit)': {
          count: 3,
          supported: true,
        },
        'Microsoft Windows Server 2025 (64-bit)': {
          count: 2,
          supported: true,
        },
        'Other (32-bit)': {
          count: 7,
          supported: false,
        },
        'Other 2.6.x Linux (64-bit)': {
          count: 19,
          supported: false,
        },
        'Other 3.x or later Linux (64-bit)': {
          count: 1,
          supported: false,
        },
        'Other 5.x Linux (64-bit)': {
          count: 1,
          supported: false,
        },
        'Other Linux (64-bit)': {
          count: 2,
          supported: false,
        },
        'Red Hat Enterprise Linux 7 (64-bit)': {
          count: 1,
          supported: true,
        },
        'Red Hat Enterprise Linux 8 (64-bit)': {
          count: 45,
          supported: true,
        },
        'Red Hat Enterprise Linux 9 (64-bit)': {
          count: 76,
          supported: true,
        },
        'Red Hat Fedora (32-bit)': {
          count: 1,
          supported: false,
        },
        'Red Hat Fedora (64-bit)': {
          count: 6,
          supported: false,
        },
        'Ubuntu Linux (64-bit)': {
          count: 5,
          supported: false,
        },
        'VMware ESXi 8.0 or later': {
          count: 5,
          supported: false,
        },
        'VMware Photon OS (64-bit)': {
          count: 4,
          supported: false,
        },
      },
      powerStates: {
        poweredOff: 116,
        poweredOn: 76,
      },
      ramGB: {
        histogram: {
          data: [43, 69, 31, 0, 22, 0, 1, 0, 21, 0, 3, 0, 2],
          minValue: 0,
          step: 4,
        },
        total: 1876,
        totalForMigratable: 6,
        totalForMigratableWithWarnings: 1760,
        totalForNotMigratable: 110,
      },
      total: 192,
      totalMigratable: 186,
      totalMigratableWithWarnings: 190,
    },
  },
};

function getExampleInventory(): Inventory {
  return InventoryFromJSON(inventoryData);
}

const ExampleReport: React.FC = () => {
  const inventory = getExampleInventory();
  const infra = inventory.vcenter?.infra as Infra;
  const vms = inventory.vcenter?.vms as VMs;
  const cpuCores = vms.cpuCores as VMResourceBreakdown;
  const ramGB = vms.ramGB as VMResourceBreakdown;
  const clusters = inventory.clusters;

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
          children: 'Example - vCenter report',
          isActive: true,
        },
      ]}
      title="Example - vCenter report"
      caption={
        <>
          Discovery VM status :{' '}
          <Icon size="md" isInline>
            <CheckCircleIcon color={globalSuccessColor100.value} />
          </Icon>{' '}
          Ready
          <br />
          This is an example report showcasing the migration assessment
          dashboard
        </>
      }
    >
      <Dashboard
        infra={infra}
        cpuCores={cpuCores}
        ramGB={ramGB}
        vms={vms}
        clusters={clusters}
      />
    </AppPage>
  );
};

ExampleReport.displayName = 'ExampleReport';

export default ExampleReport;
