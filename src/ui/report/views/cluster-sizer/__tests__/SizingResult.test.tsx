import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DEFAULT_FORM_VALUES } from "../constants";
import { SizingResult } from "../SizingResult";

describe("SizingResult", () => {
  const baseProps = {
    clusterName: "test-cluster",
    formValues: DEFAULT_FORM_VALUES,
    sizerOutput: null,
    isLoading: false,
  };

  it("shows backend message parsed from error cause JSON", () => {
    // Backend now returns just the message without the "failed to calculate cluster requirements: " prefix
    const backendMessage =
      "worker node size (16 CPU / 32 GB) is too small for this inventory (2680 CPU / 10452 GB). Please use larger worker nodes (recommended: at least 20 CPU / 76 GB)";
    const error = new Error("Response returned an error code", {
      cause: JSON.stringify({ message: backendMessage }),
    });

    render(<SizingResult {...baseProps} error={error} />);

    // The component capitalizes the first letter of the parsed message
    expect(
      screen.getByText(
        "Worker node size (16 CPU / 32 GB) is too small for this inventory (2680 CPU / 10452 GB). Please use larger worker nodes (recommended: at least 20 CPU / 76 GB)",
      ),
    ).toBeDefined();
  });

  it("falls back to error.message when cause is not JSON", () => {
    const error = new Error("Something went wrong", { cause: "not-json" });

    render(<SizingResult {...baseProps} error={error} />);

    expect(screen.getByText("Something went wrong")).toBeDefined();
  });
});
