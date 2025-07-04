/**
 * @jest-environment node
 */
import { createMockPlatform, Plugin, InMemoryPersistence, Scenario } from "./index";
import { mswHandlersFromPlatform } from "./adapters/msw";
import { setupServer } from "msw/node";
import type { RequestInfo, RequestInit, Response } from "node-fetch";
declare function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

let server: ReturnType<typeof setupServer>;

beforeAll(() => {
  server = setupServer();
  server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
  server.close();
});


describe("MockPlatformCore", () => {
  const plugin: Plugin = {
    componentId: "example",
    id: "example",
    endpoint: "/api/example",
    method: "GET",
    responses: {
      200: { message: "Hello from 200" },
      400: { message: "Bad request" },
    },
    defaultStatus: 200,
    featureFlags: ["EXAMPLE_USE_ALT"],
    transform: (response, flags) => {
      if (flags.EXAMPLE_USE_ALT) {
        response.message = "[ALT MODE] " + response.message;
      }
      return response;
    },
  };

  it("registers plugins and feature flags", () => {
    const platform = createMockPlatform({ name: "test", plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    expect(platform.getPlugins().length).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(platform.getFeatureFlags(), "EXAMPLE_USE_ALT")).toBe(true);
    expect(platform.getFeatureFlags().EXAMPLE_USE_ALT).toBe(false);
  });

  it("can toggle feature flags", () => {
    const platform = createMockPlatform({ name: "test", plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    platform.setFeatureFlag("EXAMPLE_USE_ALT", true);
    expect(platform.getFeatureFlags().EXAMPLE_USE_ALT).toBe(true);
  });

  it("applies transform when feature flag is active", () => {
    const platform = createMockPlatform({ name: "test",plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    // Default: flag is false
    expect(platform.getResponse("example", 200)).toEqual({ message: "Hello from 200" });
    // Enable flag
    platform.setFeatureFlag("EXAMPLE_USE_ALT", true);
    expect(platform.getResponse("example", 200)).toEqual({ message: "[ALT MODE] Hello from 200" });
  });

  it("supports status code overrides", () => {
    const platform = createMockPlatform({ name: "test",plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    expect(platform.getResponse("example")).toEqual({ message: "Hello from 200" });
    platform.setStatusOverride("example", 400);
    expect(platform.getResponse("example")).toEqual({ message: "Bad request" });
  });

  it("registers and activates scenarios", () => {
    const scenario: Scenario = {
      id: "alt-mode-bad-request",
      name: "Alt mode + 400",
      pluginIds: ["example"],
      flagOverrides: { EXAMPLE_USE_ALT: true },
      statusOverrides: { example: 400 },
    };
    const platform = createMockPlatform({ name: "test", plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    platform.registerScenario(scenario);
    expect(platform.getScenarios().length).toBe(1);
    platform.activateScenario("alt-mode-bad-request");
    expect(platform.getActiveScenario()).toBe("alt-mode-bad-request");
    expect(platform.getFeatureFlags().EXAMPLE_USE_ALT).toBe(true);
    expect(platform.getResponse("example")).toEqual({ message: "[ALT MODE] Bad request" });
  });

  it("persists feature flags and status overrides", () => {
    const persistence = new InMemoryPersistence("test");
    const platform = createMockPlatform({ name: "test-platform",plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] }, persistence);
    platform.setFeatureFlag("EXAMPLE_USE_ALT", true);
    platform.setStatusOverride("example", 400);
    // New instance should load persisted state
    const platform2 = createMockPlatform({ name: "test", plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] }, persistence);
    expect(platform2.getFeatureFlags().EXAMPLE_USE_ALT).toBe(true);
    expect(platform2.getStatusOverride("example")).toBe(400);
  });

  // Edge cases
  it("returns undefined for missing plugin or status", () => {
    const platform = createMockPlatform({ name: "test", plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    expect(platform.getResponse("notfound")).toBeUndefined();
    expect(platform.getResponse("example", 999)).toBeUndefined();
  });

  it("does nothing if activating a scenario that does not exist", () => {
    const platform = createMockPlatform({ name: "test", plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    expect(() => platform.activateScenario("nope")).not.toThrow();
    expect(platform.getActiveScenario()).toBeUndefined();
  });
});

describe("mswHandlersFromPlatform", () => {
  const plugin: Plugin = {
    componentId: "example",
    id: "example",
    endpoint: "/api/example",
    method: "GET",
    responses: {
      200: { message: "Hello from 200" },
      400: { message: "Bad request" },
    },
    defaultStatus: 200,
    featureFlags: ["EXAMPLE_USE_ALT"],
    transform: (response, flags) => {
      if (flags.EXAMPLE_USE_ALT) {
        response.message = "[ALT MODE] " + response.message;
      }
      return response;
    },
  };

  it("returns correct response for default status", async () => {
    const platform = createMockPlatform({ name: "test", plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    server.resetHandlers();
    server.use(...mswHandlersFromPlatform(platform));
    const res = await fetch("http://localhost/api/example");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ message: "Hello from 200" });
  });

  it("returns correct response for overridden status", async () => {
    const platform = createMockPlatform({ name: "test",plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    platform.setStatusOverride("example", 400);
    server.resetHandlers();
    server.use(...mswHandlersFromPlatform(platform));
    const res = await fetch("http://localhost/api/example");
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json).toEqual({ message: "Bad request" });
  });

  it("applies feature flag transform in handler", async () => {
    const platform = createMockPlatform({ name: "test",plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    platform.setFeatureFlag("EXAMPLE_USE_ALT", true);
    server.resetHandlers();
    server.use(...mswHandlersFromPlatform(platform));
    const res = await fetch("http://localhost/api/example");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ message: "[ALT MODE] Hello from 200" });
  });

  it("returns 404 for missing status", async () => {
    const platform = createMockPlatform({ name: "test", plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
    platform.setStatusOverride("example", 999);
    server.resetHandlers();
    server.use(...mswHandlersFromPlatform(platform));
    const res = await fetch("http://localhost/api/example");
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json).toEqual({ error: "Not found" });
  });
}); 