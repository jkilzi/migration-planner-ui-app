import React, {
  createContext,
  type PropsWithChildren,
  useContext,
} from "react";

import {
  type EnvironmentPageViewModel,
  useEnvironmentPageViewModel,
} from "./useEnvironmentPageViewModel";

const Ctx = createContext<EnvironmentPageViewModel | null>(null);

/**
 * Provides the {@link EnvironmentPageViewModel} to the component tree.
 * Wrap the `<Environment />` page content in this provider so that every
 * child component can call {@link useEnvironmentPage}.
 */
export const EnvironmentPageProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const vm = useEnvironmentPageViewModel();
  return <Ctx.Provider value={vm}>{children}</Ctx.Provider>;
};

/**
 * Consume the {@link EnvironmentPageViewModel} from the nearest
 * `<EnvironmentPageProvider>`.
 */
export const useEnvironmentPage = (): EnvironmentPageViewModel => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error(
      "useEnvironmentPage() must be used within <EnvironmentPageProvider>",
    );
  }
  return ctx;
};
