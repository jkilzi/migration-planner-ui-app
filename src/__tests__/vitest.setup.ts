import "@testing-library/jest-dom/vitest";

import React from "react";
import { vi } from "vitest";

const renderChildren = (children?: React.ReactNode): React.ReactElement =>
  React.createElement(React.Fragment, null, children);

const popperStub = vi.hoisted(() => ({
  Popper: ({ children }: { children?: React.ReactNode }): React.ReactElement =>
    renderChildren(children),
  default: ({ children }: { children?: React.ReactNode }): React.ReactElement =>
    renderChildren(children),
}));

vi.mock(
  "@patternfly/react-core/dist/esm/helpers/Popper/Popper",
  () => popperStub,
);
vi.mock(
  "@patternfly/react-core/dist/esm/helpers/Popper/Popper.js",
  () => popperStub,
);
vi.mock(
  "@patternfly/react-core/dist/js/helpers/Popper/Popper",
  () => popperStub,
);
vi.mock(
  "@patternfly/react-core/dist/js/helpers/Popper/Popper.js",
  () => popperStub,
);
