import type { Middleware } from "@migration-planner-ui/api-client/runtime";
import type { ChromeAPI } from "@redhat-cloud-services/types";

export const createAuthMiddleware = (auth: ChromeAPI["auth"]): Middleware => ({
  pre: async ({ url, init }) => {
    const token = await auth.getToken();
    const headers = new Headers(init.headers ?? {});
    headers.set("X-Authorization", `Bearer ${token}`);
    return {
      url,
      init: { ...init, headers },
    };
  },
});
