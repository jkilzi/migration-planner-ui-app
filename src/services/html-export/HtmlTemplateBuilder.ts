/**
 * Builds HTML templates for report export
 */

import { ChartDataTransformer } from "./ChartDataTransformer";
import type {
  ChartData,
  Datastore,
  InfraData,
  InventoryData,
  MigrationWarning,
  SnapshotLike,
  VMsData,
} from "./types";

export const DEFAULT_DOCUMENT_TITLE = "VMware Infrastructure Assessment Report";

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
};

const escapeHtml = (str: string): string => {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

const CHART_COLORS = {
  PRIMARY: "#3498db",
  SUCCESS: "#27ae60",
  DANGER: "#e74c3c",
  WARNING: "#f39c12",
  INFO: "#9b59b6",
  SECONDARY: "#1abc9c",
  DARK: "#34495e",
  ORANGE: "#e67e22",
} as const;

export class HtmlTemplateBuilder {
  private chartTransformer = new ChartDataTransformer();

  /**
   * Build the complete HTML report
   * @param chartData - Chart data to render
   * @param inventory - Inventory data (either InventoryData or SnapshotLike)
   * @param generatedAt - Optional date for the report timestamp (defaults to current date/time)
   * @param title - Optional custom title for the report (defaults to DEFAULT_DOCUMENT_TITLE)
   */
  build(
    chartData: ChartData,
    inventory: InventoryData | SnapshotLike,
    generatedAt: Date = new Date(),
    title: string = DEFAULT_DOCUMENT_TITLE,
  ): string {
    const { infra, vms } = this.chartTransformer.normalizeInventory(inventory);
    const {
      powerStateData,
      resourceData,
      osData,
      warningsData,
      storageLabels,
      storageUsedData,
      storageTotalData,
    } = chartData;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js" integrity="sha512-ElRFoEQdI5Ht6kZvyzXhYG9NqjtkmlkfYk0wr6wHxU9JEHakS7UJZNeml5ALk+8IKlU6jDgMabC3vkumRokgJA==" crossorigin="anonymous"></script>
    <style>
        ${this.generateStyles()}
    </style>
</head>
<body>
    <div class="container">
        ${this.buildHeader(generatedAt, title)}
        ${this.buildSummaryGrid(infra, vms)}
        ${this.buildChartGrid(vms, infra, powerStateData, resourceData, osData, warningsData, storageLabels, storageUsedData, storageTotalData)}
        ${this.buildDetailedTables(infra, vms)}
        ${this.buildFooter()}
    </div>
    <script>
        ${this.buildChartScripts(powerStateData, resourceData, osData, warningsData, storageLabels, storageUsedData, storageTotalData, vms, infra)}
    </script>
</body>
</html>`;
  }

  private generateStyles(): string {
    return `
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #2c3e50; margin-bottom: 10px; font-size: 2.5em; }
    .header p { color: #7f8c8d; font-size: 1.1em; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
    .summary-card { background: #3498db; color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card h4 { margin: 0 0 10px 0; font-size: 14px; font-weight: 600; }
    .summary-card .number { font-size: 32px; font-weight: bold; }
    .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(500px, 1fr)); gap: 30px; margin: 30px 0; }
    .chart-container { background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .chart-container h3 { text-align: center; color: #2c3e50; margin-bottom: 20px; font-size: 1.3em; }
    .chart-wrapper { position: relative; height: 300px; }
    .section { margin: 40px 0; }
    .section h2 { color: #2c3e50; border-left: 4px solid #3498db; padding-left: 15px; margin-bottom: 25px; }
    .table-section { margin: 30px 0; }
    .table-section h3 { color: #2c3e50; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: 600; }
    tr:nth-child(even) { background-color: #f8f9fa; }
    tr:hover { background-color: #e8f4ff; }
    .warning-high { background-color: #e74c3c !important; color: white; }
    .warning-medium { background-color: #f39c12 !important; color: white; }
    .warning-low { background-color: #27ae60 !important; color: white; }
    .summary-box { background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary-box h2 { margin-top: 0; }
    .footer { text-align: center; margin-top: 40px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 20px; }
    .footer p { margin: 5px 0; }
    @media print { body { background: white; } .container { box-shadow: none; } .chart-container { break-inside: avoid; } }
    @media (max-width: 768px) {
        .chart-grid { grid-template-columns: 1fr; }
        .summary-grid { grid-template-columns: repeat(2, 1fr); }
        .container { padding: 20px; margin: 10px; }
    }`;
  }

  private buildHeader(generatedAt: Date, title: string): string {
    return `
        <div class="header">
            <h1>${escapeHtml(title)}</h1>
            <p>Generated: ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}</p>
        </div>`;
  }

  private buildSummaryGrid(infra: InfraData, vms: VMsData): string {
    return `
        <div class="summary-grid">
            <div class="summary-card">
                <h4>Total VMs</h4>
                <div class="number">${vms.total}</div>
            </div>
            <div class="summary-card" style="background: #e74c3c;">
                <h4>ESXi Hosts</h4>
                <div class="number">${infra.totalHosts}</div>
            </div>
            <div class="summary-card" style="background: #27ae60;">
                <h4>Datastores</h4>
                <div class="number">${infra.datastores.length}</div>
            </div>
            <div class="summary-card" style="background: #f39c12;">
                <h4>Networks</h4>
                <div class="number">${infra.networks.length}</div>
            </div>
        </div>`;
  }

  private buildChartGrid(
    vms: VMsData,
    infra: InfraData,
    _powerStateData: Array<[string, number]>,
    _resourceData: Array<[string, number, number]>,
    _osData: Array<[string, number]>,
    _warningsData: Array<[string, number]>,
    _storageLabels: string[],
    _storageUsedData: number[],
    _storageTotalData: number[],
  ): string {
    return `
        <div class="chart-grid">
            <div class="chart-container">
                <h3>VM Power States Distribution</h3>
                <div class="chart-wrapper">
                    <canvas id="powerChart"></canvas>
                </div>
            </div>

            <div class="chart-container">
                <h3>Resource Utilization</h3>
                <div class="chart-wrapper">
                    <canvas id="resourceChart"></canvas>
                </div>
            </div>

            <div class="chart-container">
                <h3>Top Operating Systems</h3>
                <div class="chart-wrapper">
                    <canvas id="osChart"></canvas>
                </div>
            </div>

            ${
              vms.migrationWarnings.length > 0
                ? `
            <div class="chart-container">
                <h3>Migration Warnings</h3>
                <div class="chart-wrapper">
                    <canvas id="warningsChart"></canvas>
                </div>
            </div>`
                : ""
            }

            ${
              infra.datastores.length > 0
                ? `
            <div class="chart-container">
                <h3>Storage Utilization by Datastore</h3>
                <div class="chart-wrapper">
                    <canvas id="storageChart"></canvas>
                </div>
            </div>`
                : ""
            }
        </div>`;
  }

  private buildDetailedTables(infra: InfraData, vms: VMsData): string {
    return `
        <div class="section">
            <h2>Detailed Analysis Tables</h2>
            
            <div class="table-section">
                <h3>Operating System Distribution</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Operating System</th>
                            <th>VM Count</th>
                            <th>Percentage</th>
                            <th>Migration Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.generateOSTable(vms)}
                    </tbody>
                </table>
            </div>

            <div class="table-section">
                <h3>Resource Allocation Analysis</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Resource Type</th>
                            <th>Current Total</th>
                            <th>Average per VM</th>
                            <th>Recommended Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>CPU Cores (vCPUs)</strong></td>
                            <td>${vms.cpuCores.total}</td>
                            <td>${vms.total > 0 ? (vms.cpuCores.total / vms.total).toFixed(1) : "0.0"}</td>
                            <td>${Math.round(vms.cpuCores.total * 1.2)} (with 20% overhead)</td>
                        </tr>
                        <tr>
                            <td><strong>Memory (GB)</strong></td>
                            <td>${vms.ramGB.total}</td>
                            <td>${vms.total > 0 ? (vms.ramGB.total / vms.total).toFixed(1) : "0.0"}</td>
                            <td>${Math.round(vms.ramGB.total * 1.25)} (with 25% overhead)</td>
                        </tr>
                        <tr>
                            <td><strong>Storage (GB)</strong></td>
                            <td>${vms.diskGB.total}</td>
                            <td>${vms.total > 0 ? (vms.diskGB.total / vms.total).toFixed(1) : "0.0"}</td>
                            <td>${Math.round(vms.diskGB.total * 1.15)} (with 15% overhead)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            ${this.generateWarningsTable(vms)}

            <div class="table-section">
                <h3>Storage Infrastructure</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Vendor</th>
                            <th>Type</th>
                            <th>Protocol</th>
                            <th>Total Capacity (GB)</th>
                            <th>Free Capacity (GB)</th>
                            <th>Utilization %</th>
                            <th>Hardware Acceleration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.generateStorageTable(infra)}
                    </tbody>
                </table>
            </div>
        </div>`;
  }

  private buildFooter(): string {
    return `
        <div class="footer">
            <p>VMware Infrastructure Assessment Report - Generated from live inventory data</p>
            <p>Charts are interactive - hover for details, click legend items to show/hide data series.</p>
        </div>`;
  }

  private generateOSTable(vms: VMsData): string {
    const osEntries = this.chartTransformer
      .extractOSData(vms)
      .sort(([, a], [, b]) => b - a);

    if (osEntries.length === 0) {
      return '<tr><td colspan="4">No operating system data available</td></tr>';
    }

    return osEntries
      .map(([osName, count]) => {
        const percentage =
          vms.total === 0 ? "0.0" : ((count / vms.total) * 100).toFixed(1);
        const priority = osName.includes("Windows")
          ? "High"
          : osName.includes("Linux") || osName.includes("Red Hat")
            ? "Medium"
            : "Review Required";
        return `
      <tr>
        <td><strong>${escapeHtml(osName)}</strong></td>
        <td>${count}</td>
        <td>${percentage}%</td>
        <td>${escapeHtml(priority)}</td>
      </tr>`;
      })
      .join("");
  }

  private generateWarningsTable(vms: VMsData): string {
    if (vms.migrationWarnings.length === 0) {
      return `<div class="table-section">
      <h3>Migration Warnings Analysis</h3>
      <p>No migration warnings to display.</p>
    </div>`;
    }

    const warningsRows = vms.migrationWarnings
      .map((warning: MigrationWarning) => {
        const impact =
          warning.count > 50
            ? "Critical"
            : warning.count > 20
              ? "High"
              : warning.count > 5
                ? "Medium"
                : "Low";
        const percentage =
          vms.total > 0
            ? ((warning.count / vms.total) * 100).toFixed(1)
            : "0.0";
        const priority =
          impact === "Critical"
            ? "Immediate"
            : impact === "High"
              ? "Before Migration"
              : impact === "Medium"
                ? "During Migration"
                : "Post Migration";
        const rowClass =
          impact === "Critical"
            ? "warning-high"
            : impact === "High"
              ? "warning-medium"
              : impact === "Medium"
                ? "warning-low"
                : "";

        return `
      <tr class="${rowClass}">
        <td><strong>${escapeHtml(warning.label)}</strong></td>
        <td>${warning.count}</td>
        <td>${escapeHtml(impact)}</td>
        <td>${percentage}%</td>
        <td>${escapeHtml(priority)}</td>
      </tr>`;
      })
      .join("");

    return `<div class="table-section">
    <h3>Migration Warnings Analysis</h3>
    <table>
      <thead>
        <tr>
          <th>Warning Category</th>
          <th>Affected VMs</th>
          <th>Impact Level</th>
          <th>% of Total VMs</th>
          <th>Priority</th>
        </tr>
      </thead>
      <tbody>
        ${warningsRows}
      </tbody>
    </table>
  </div>`;
  }

  private generateStorageTable(infra: InfraData): string {
    if (infra.datastores.length === 0) {
      return '<tr><td colspan="7">No datastore information available</td></tr>';
    }

    return infra.datastores
      .map((ds: Datastore) => {
        const utilization =
          ds.totalCapacityGB > 0
            ? (
                ((ds.totalCapacityGB - ds.freeCapacityGB) /
                  ds.totalCapacityGB) *
                100
              ).toFixed(1)
            : "0.0";
        const hwAccel = ds.hardwareAcceleratedMove ? "✅ Yes" : "❌ No";

        return `
      <tr>
        <td><strong>${escapeHtml(ds.vendor)}</strong></td>
        <td>${escapeHtml(ds.type)}</td>
        <td>${escapeHtml(ds.protocolType)}</td>
        <td>${formatNumber(ds.totalCapacityGB)}</td>
        <td>${formatNumber(ds.freeCapacityGB)}</td>
        <td>${utilization}%</td>
        <td>${hwAccel}</td>
      </tr>`;
      })
      .join("");
  }

  private buildChartScripts(
    powerStateData: Array<[string, number]>,
    resourceData: Array<[string, number, number]>,
    osData: Array<[string, number]>,
    warningsData: Array<[string, number]>,
    storageLabels: string[],
    storageUsedData: number[],
    storageTotalData: number[],
    vms: VMsData,
    infra: InfraData,
  ): string {
    return `
        document.addEventListener('DOMContentLoaded', function() {
            // Power States Doughnut Chart
            const powerCtx = document.getElementById('powerChart');
            if (powerCtx) {
                new Chart(powerCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ${JSON.stringify(powerStateData.map((d) => d[0])).replace(/<\//g, "<\\/")},
                        datasets: [{
                            data: ${JSON.stringify(powerStateData.map((d) => d[1]))},
                            backgroundColor: ['${CHART_COLORS.SUCCESS}', '${CHART_COLORS.DANGER}', '${CHART_COLORS.WARNING}']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }

            // Resource Utilization Bar Chart
            const resourceCtx = document.getElementById('resourceChart');
            if (resourceCtx) {
                new Chart(resourceCtx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(resourceData.map((d) => d[0])).replace(/<\//g, "<\\/")},
                        datasets: [{
                            label: 'Current',
                            data: ${JSON.stringify(resourceData.map((d) => d[1]))},
                            backgroundColor: '${CHART_COLORS.PRIMARY}'
                        }, {
                            label: 'Recommended',
                            data: ${JSON.stringify(resourceData.map((d) => d[2]))},
                            backgroundColor: '${CHART_COLORS.SUCCESS}'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }

            // Operating Systems Horizontal Bar Chart
            const osCtx = document.getElementById('osChart');
            if (osCtx) {
                new Chart(osCtx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(osData.map((d) => d[0])).replace(/<\//g, "<\\/")},
                        datasets: [{
                            data: ${JSON.stringify(osData.map((d) => d[1]))},
                            backgroundColor: ${JSON.stringify([
                              CHART_COLORS.PRIMARY,
                              CHART_COLORS.DANGER,
                              CHART_COLORS.SUCCESS,
                              CHART_COLORS.WARNING,
                              CHART_COLORS.INFO,
                              CHART_COLORS.SECONDARY,
                              CHART_COLORS.DARK,
                              CHART_COLORS.ORANGE,
                            ])}
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { x: { beginAtZero: true } }
                    }
                });
            }

            ${
              vms.migrationWarnings.length > 0
                ? `
            // Migration Warnings Chart
            const warningsCtx = document.getElementById('warningsChart');
            if (warningsCtx) {
                new Chart(warningsCtx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(warningsData.map((d) => d[0])).replace(/<\//g, "<\\/")},
                        datasets: [{
                            data: ${JSON.stringify(warningsData.map((d) => d[1]))},
                            backgroundColor: ${JSON.stringify(
                              warningsData.map((d) => {
                                const count = Number(d[1]);
                                return count > 50
                                  ? CHART_COLORS.DANGER
                                  : count > 20
                                    ? CHART_COLORS.WARNING
                                    : count > 5
                                      ? CHART_COLORS.SUCCESS
                                      : CHART_COLORS.PRIMARY;
                              }),
                            )}
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }`
                : ""
            }

            ${
              infra.datastores.length > 0
                ? `
            // Storage Utilization Chart
            const storageCtx = document.getElementById('storageChart');
            if (storageCtx) {
                new Chart(storageCtx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(storageLabels).replace(/<\//g, "<\\/")},
                        datasets: [{
                            label: 'Used (GB)',
                            data: ${JSON.stringify(storageUsedData)},
                            backgroundColor: '${CHART_COLORS.DANGER}'
                        }, {
                            label: 'Total (GB)',
                            data: ${JSON.stringify(storageTotalData)},
                            backgroundColor: '${CHART_COLORS.PRIMARY}'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }`
                : ""
            }
        });`;
  }
}
