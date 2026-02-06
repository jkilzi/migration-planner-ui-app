import type { FetchParams } from "@migration-planner-ui/api-client/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAuthMiddleware } from "../Auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeChromeStub = (token = "mock-jwt-token") =>
  ({
    getToken: vi.fn().mockResolvedValue(token),
  }) as unknown as Parameters<typeof createAuthMiddleware>[0];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createAuthMiddleware", () => {
  let chromeAuth: ReturnType<typeof makeChromeStub>;

  beforeEach(() => {
    chromeAuth = makeChromeStub();
  });

  it("returns a middleware object with a pre function", () => {
    const middleware = createAuthMiddleware(chromeAuth);

    expect(middleware).toHaveProperty("pre");
    expect(typeof middleware.pre).toBe("function");
  });

  it("injects X-Authorization header with Bearer token", async () => {
    const middleware = createAuthMiddleware(chromeAuth);

    const result = (await middleware.pre!({
      url: "https://api.example.com/sources",
      init: { method: "GET" },
      fetch: globalThis.fetch,
    })) as FetchParams;

    const headers = new Headers(result.init.headers as HeadersInit);
    expect(headers.get("X-Authorization")).toBe("Bearer mock-jwt-token");
  });

  it("preserves the original URL", async () => {
    const middleware = createAuthMiddleware(chromeAuth);
    const originalUrl = "https://api.example.com/assessments?limit=10";

    const result = (await middleware.pre!({
      url: originalUrl,
      init: {},
      fetch: globalThis.fetch,
    })) as FetchParams;

    expect(result.url).toBe(originalUrl);
  });

  it("preserves existing init properties", async () => {
    const middleware = createAuthMiddleware(chromeAuth);

    const result = (await middleware.pre!({
      url: "https://api.example.com/sources",
      init: { method: "POST", body: '{"name":"env-1"}' },
      fetch: globalThis.fetch,
    })) as FetchParams;

    expect(result.init.method).toBe("POST");
    expect(result.init.body).toBe('{"name":"env-1"}');
  });

  it("preserves existing headers and adds X-Authorization", async () => {
    const middleware = createAuthMiddleware(chromeAuth);

    const result = (await middleware.pre!({
      url: "https://api.example.com/sources",
      init: {
        headers: { "Content-Type": "application/json" },
      },
      fetch: globalThis.fetch,
    })) as FetchParams;

    const headers = new Headers(result.init.headers as HeadersInit);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("X-Authorization")).toBe("Bearer mock-jwt-token");
  });

  it("calls chrome.auth.getToken() exactly once per request", async () => {
    const middleware = createAuthMiddleware(chromeAuth);

    await middleware.pre!({
      url: "https://api.example.com/sources",
      init: {},
      fetch: globalThis.fetch,
    });

    expect(chromeAuth.getToken).toHaveBeenCalledTimes(1);
  });

  it("uses the token returned by chrome.auth.getToken()", async () => {
    const customChrome = makeChromeStub("custom-token-xyz");
    const middleware = createAuthMiddleware(customChrome);

    const result = (await middleware.pre!({
      url: "https://api.example.com/sources",
      init: {},
      fetch: globalThis.fetch,
    })) as FetchParams;

    const headers = new Headers(result.init.headers as HeadersInit);
    expect(headers.get("X-Authorization")).toBe("Bearer custom-token-xyz");
  });

  it("handles undefined init.headers gracefully", async () => {
    const middleware = createAuthMiddleware(chromeAuth);

    const result = (await middleware.pre!({
      url: "https://api.example.com/sources",
      init: { headers: undefined },
      fetch: globalThis.fetch,
    })) as FetchParams;

    const headers = new Headers(result.init.headers as HeadersInit);
    expect(headers.get("X-Authorization")).toBe("Bearer mock-jwt-token");
  });
});
