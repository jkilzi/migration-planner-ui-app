import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { routes } from "../../../../routing/Routes";
import { useHomeScreenViewModel } from "../useHomeScreenViewModel";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockPathname = "/assessments";
const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => mockNavigate,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useHomeScreenViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = "/assessments";
  });

  it("activeTabKey is 0 when location.pathname does NOT start with /environments", () => {
    mockPathname = "/assessments";
    const { result } = renderHook(() => useHomeScreenViewModel());
    expect(result.current.activeTabKey).toBe(0);
  });

  it("activeTabKey is 1 when location.pathname starts with /environments", () => {
    mockPathname = "/environments";
    const { result } = renderHook(() => useHomeScreenViewModel());
    expect(result.current.activeTabKey).toBe(1);
  });

  it("breadcrumbs shows assessments when activeTabKey is 0", () => {
    mockPathname = "/assessments";
    const { result } = renderHook(() => useHomeScreenViewModel());
    const activeCrumb = result.current.breadcrumbs.find((b) => b.isActive);
    expect(activeCrumb?.children).toBe("assessments");
  });

  it("breadcrumbs shows environments when activeTabKey is 1", () => {
    mockPathname = "/environments";
    const { result } = renderHook(() => useHomeScreenViewModel());
    const activeCrumb = result.current.breadcrumbs.find((b) => b.isActive);
    expect(activeCrumb?.children).toBe("environments");
  });

  it("handleTabClick navigates to environments route when tabIndex is 1", () => {
    const { result } = renderHook(() => useHomeScreenViewModel());
    act(() => {
      result.current.handleTabClick({} as React.MouseEvent<HTMLElement>, 1);
    });
    expect(mockNavigate).toHaveBeenCalledWith(routes.environments);
  });

  it("handleTabClick navigates to assessments route when tabIndex is 0", () => {
    const { result } = renderHook(() => useHomeScreenViewModel());
    act(() => {
      result.current.handleTabClick({} as React.MouseEvent<HTMLElement>, 0);
    });
    expect(mockNavigate).toHaveBeenCalledWith(routes.assessments);
  });

  it("handleTabClick handles string tabIndex", () => {
    const { result } = renderHook(() => useHomeScreenViewModel());
    act(() => {
      result.current.handleTabClick({} as React.MouseEvent<HTMLElement>, "1");
    });
    expect(mockNavigate).toHaveBeenCalledWith(routes.environments);
  });

  it("handleOpenStartingPageModal sets isStartingPageModalOpen to true", () => {
    const { result } = renderHook(() => useHomeScreenViewModel());
    expect(result.current.isStartingPageModalOpen).toBe(false);

    act(() => {
      result.current.handleOpenStartingPageModal();
    });
    expect(result.current.isStartingPageModalOpen).toBe(true);
  });

  it("handleCloseStartingPageModal sets isStartingPageModalOpen to false", () => {
    const { result } = renderHook(() => useHomeScreenViewModel());
    act(() => {
      result.current.handleOpenStartingPageModal();
    });
    expect(result.current.isStartingPageModalOpen).toBe(true);

    act(() => {
      result.current.handleCloseStartingPageModal();
    });
    expect(result.current.isStartingPageModalOpen).toBe(false);
  });

  it("handleOpenRVToolsModal sets rvtoolsOpenToken to true and navigates to assessments", () => {
    const { result } = renderHook(() => useHomeScreenViewModel());
    expect(result.current.rvtoolsOpenToken).toBe(false);

    act(() => {
      result.current.handleOpenRVToolsModal();
    });
    expect(result.current.rvtoolsOpenToken).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith(routes.assessments);
  });
});
