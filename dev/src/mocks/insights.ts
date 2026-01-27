// Only declare global types in standalone mode to avoid conflicts with the main app
// We'll use direct assignment instead of interface declaration to avoid conflicts

// --- GLOBAL MOCKS for window.insights.chrome ---
// IMPORTANT: This must be set BEFORE importing App, so useChrome() can access it

// Use direct assignment to avoid TypeScript conflicts

import type { ChromeAPI } from "@redhat-cloud-services/types";

const chromeApiMock: Partial<ChromeAPI> = {
  auth: {
    getUser: () =>
      Promise.resolve({
        identity: {
          account_number: "000000",
          type: "User",
          org_id: "standalone-org-id",
          user: {
            email: "standalone@example.com",
            first_name: "Standalone",
            last_name: "User",
            is_active: true,
            is_org_admin: true,
            username: "standalone-dev",
            is_internal: false,
            locale: "en-US",
          },
        },
        entitlements: {
          "migration-assessment": { is_entitled: true, is_trial: false },
        },
        entitled: {
          "migration-assessment": true,
        },
      }),
    getToken: (): Promise<string> => Promise.resolve("mock-standalone-token"),
    getOfflineToken: (): Promise<string> =>
      Promise.resolve("mock-offline-token"),
    getRefreshToken: (): Promise<string> =>
      Promise.resolve("mock-refresh-token"),
    login: (): Promise<void> => Promise.resolve(),
    logout: (): void => {},
    qe: {},
    reAuthWithScopes: (): Promise<void> => Promise.resolve(),
    doOffline: (): void => {},
    token: "",
    refreshToken: "",
  },
  // is: {
  //     serviceAvailable: (): Promise<boolean> => Promise.resolve(true),
  //     entitled: (): Promise<boolean> => Promise.resolve(true),
  //     appNavAvailable: (): boolean => true,
  //     edge: (): boolean => false,
  // },
  // appNav: {
  //     get: (): unknown[] => [],
  // },
  identifyApp: (appName: string): Promise<boolean> => {
    console.log(`[Standalone Mock] identifyApp called with: ${appName}`);
    return Promise.resolve(true);
  },
  // on: (event: string, _callback: (...args: unknown[]) => void): void => {
  //     console.log(
  //         `[Standalone Mock] Event listener for "${event}" registered.`,
  //     );
  //     return () => {
  //         console.log(
  //             `[Standalone Mock] Event listener for "${event}" unregistered.`,
  //         );
  //     };
  // },
  init: (): void => {
    console.log("[Standalone Mock] insights.chrome.init() called.");
  },
  getUserPermissions: () =>
    Promise.resolve([
      {
        permission: "app:read",
        resource: "*",
        resourceDefinitions: [],
      },
    ]),
};

console.warn("Running in STANDALONE_MODE. Global insights.chrome is mocked.");
window.insights = window.insights ?? { chrome: chromeApiMock };
