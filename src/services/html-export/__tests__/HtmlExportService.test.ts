import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HtmlExportService } from "../HtmlExportService";
import type { InventoryData } from "../types";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockTransform = vi.fn().mockReturnValue({
  powerStateData: [],
  resourceData: [],
  osData: [],
  warningsData: [],
  storageLabels: [],
  storageUsedData: [],
  storageTotalData: [],
});

vi.mock("../ChartDataTransformer", () => ({
  ChartDataTransformer: class {
    transform = mockTransform;
  },
}));

const mockBuild = vi.fn().mockReturnValue("<html>mock report</html>");

vi.mock("../HtmlTemplateBuilder", () => ({
  DEFAULT_DOCUMENT_TITLE: "Default Title",
  HtmlTemplateBuilder: class {
    build = mockBuild;
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeInventory = (): InventoryData => ({
  infra: {
    totalHosts: 2,
    datastores: [],
    networks: [],
  },
  vms: {
    total: 5,
    powerStates: { poweredOn: 5 },
    cpuCores: { total: 20 },
    ramGB: { total: 64 },
    diskGB: { total: 500 },
    migrationWarnings: [],
  },
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HtmlExportService", () => {
  let service: HtmlExportService;
  let mockLink: {
    href: string;
    download: string;
    click: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    service = new HtmlExportService();

    mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
      remove: vi.fn(),
    };

    vi.spyOn(document, "createElement").mockReturnValue(
      mockLink as unknown as HTMLElement,
    );
    vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
    vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("throws when inventory is null", async () => {
    await expect(
      service.generate(null as unknown as InventoryData),
    ).rejects.toThrow("No inventory data available for export");
  });

  it("transforms inventory data via ChartDataTransformer", async () => {
    const inventory = makeInventory();
    const promise = service.generate(inventory);
    vi.advanceTimersByTime(250);
    await promise;

    expect(mockTransform).toHaveBeenCalledWith(inventory);
  });

  it("builds HTML via HtmlTemplateBuilder with default title", async () => {
    const inventory = makeInventory();
    const promise = service.generate(inventory);
    vi.advanceTimersByTime(250);
    await promise;

    expect(mockBuild).toHaveBeenCalledWith(
      expect.anything(), // chartData
      inventory,
      expect.any(Date),
      "Default Title",
    );
  });

  it("builds HTML with custom title when provided", async () => {
    const inventory = makeInventory();
    const promise = service.generate(inventory, {
      documentTitle: "My Custom Report",
    });
    vi.advanceTimersByTime(250);
    await promise;

    expect(mockBuild).toHaveBeenCalledWith(
      expect.anything(),
      inventory,
      expect.any(Date),
      "My Custom Report",
    );
  });

  it("creates a download link with correct filename", async () => {
    const inventory = makeInventory();
    const promise = service.generate(inventory);
    vi.advanceTimersByTime(250);
    await promise;

    expect(mockLink.download).toBe(
      "VMware_Infrastructure_Assessment_Comprehensive.html",
    );
  });

  it("uses custom filename when provided", async () => {
    const inventory = makeInventory();
    const promise = service.generate(inventory, {
      filename: "custom-report.html",
    });
    vi.advanceTimersByTime(250);
    await promise;

    expect(mockLink.download).toBe("custom-report.html");
  });

  it("creates blob URL and triggers click", async () => {
    const inventory = makeInventory();
    const promise = service.generate(inventory);
    vi.advanceTimersByTime(250);
    await promise;

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockLink.click).toHaveBeenCalledTimes(1);
    expect(document.body.appendChild).toHaveBeenCalled();
  });

  it("revokes object URL and removes link after timeout", async () => {
    const inventory = makeInventory();
    const promise = service.generate(inventory);

    // Before the 250ms timeout
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);
    await promise;

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    expect(document.body.removeChild).toHaveBeenCalled();
  });
});
