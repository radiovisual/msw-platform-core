"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const msw_1 = require("./adapters/msw");
const node_1 = require("msw/node");
let server;
beforeAll(() => {
    server = (0, node_1.setupServer)();
    server.listen({ onUnhandledRequest: "error" });
});
afterAll(() => {
    server.close();
});
describe("MockPlatformCore", () => {
    const plugin = {
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
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        expect(platform.getPlugins().length).toBe(1);
        expect(Object.prototype.hasOwnProperty.call(platform.getFeatureFlags(), "EXAMPLE_USE_ALT")).toBe(true);
        expect(platform.getFeatureFlags().EXAMPLE_USE_ALT).toBe(false);
    });
    it("can toggle feature flags", () => {
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        platform.setFeatureFlag("EXAMPLE_USE_ALT", true);
        expect(platform.getFeatureFlags().EXAMPLE_USE_ALT).toBe(true);
    });
    it("applies transform when feature flag is active", () => {
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        // Default: flag is false
        expect(platform.getResponse("example", 200)).toEqual({ message: "Hello from 200" });
        // Enable flag
        platform.setFeatureFlag("EXAMPLE_USE_ALT", true);
        expect(platform.getResponse("example", 200)).toEqual({ message: "[ALT MODE] Hello from 200" });
    });
    it("supports status code overrides", () => {
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        expect(platform.getResponse("example")).toEqual({ message: "Hello from 200" });
        platform.setStatusOverride("example", 400);
        expect(platform.getResponse("example")).toEqual({ message: "Bad request" });
    });
    it("registers and activates scenarios", () => {
        const scenario = {
            id: "alt-mode-bad-request",
            name: "Alt mode + 400",
            pluginIds: ["example"],
            flagOverrides: { EXAMPLE_USE_ALT: true },
            statusOverrides: { example: 400 },
        };
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        platform.registerScenario(scenario);
        expect(platform.getScenarios().length).toBe(1);
        platform.activateScenario("alt-mode-bad-request");
        expect(platform.getActiveScenario()).toBe("alt-mode-bad-request");
        expect(platform.getFeatureFlags().EXAMPLE_USE_ALT).toBe(true);
        expect(platform.getResponse("example")).toEqual({ message: "[ALT MODE] Bad request" });
    });
    it("persists feature flags and status overrides", () => {
        const persistence = new index_1.InMemoryPersistence();
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] }, persistence);
        platform.setFeatureFlag("EXAMPLE_USE_ALT", true);
        platform.setStatusOverride("example", 400);
        // New instance should load persisted state
        const platform2 = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] }, persistence);
        expect(platform2.getFeatureFlags().EXAMPLE_USE_ALT).toBe(true);
        expect(platform2.getStatusOverride("example")).toBe(400);
    });
    // Edge cases
    it("returns undefined for missing plugin or status", () => {
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        expect(platform.getResponse("notfound")).toBeUndefined();
        expect(platform.getResponse("example", 999)).toBeUndefined();
    });
    it("does nothing if activating a scenario that does not exist", () => {
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        expect(() => platform.activateScenario("nope")).not.toThrow();
        expect(platform.getActiveScenario()).toBeUndefined();
    });
});
describe("mswHandlersFromPlatform", () => {
    const plugin = {
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
    it("returns correct response for default status", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        server.resetHandlers();
        server.use(...(0, msw_1.mswHandlersFromPlatform)(platform));
        const res = yield fetch("http://localhost/api/example");
        const json = yield res.json();
        expect(res.status).toBe(200);
        expect(json).toEqual({ message: "Hello from 200" });
    }));
    it("returns correct response for overridden status", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        platform.setStatusOverride("example", 400);
        server.resetHandlers();
        server.use(...(0, msw_1.mswHandlersFromPlatform)(platform));
        const res = yield fetch("http://localhost/api/example");
        const json = yield res.json();
        expect(res.status).toBe(400);
        expect(json).toEqual({ message: "Bad request" });
    }));
    it("applies feature flag transform in handler", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        platform.setFeatureFlag("EXAMPLE_USE_ALT", true);
        server.resetHandlers();
        server.use(...(0, msw_1.mswHandlersFromPlatform)(platform));
        const res = yield fetch("http://localhost/api/example");
        const json = yield res.json();
        expect(res.status).toBe(200);
        expect(json).toEqual({ message: "[ALT MODE] Hello from 200" });
    }));
    it("returns 404 for missing status", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = (0, index_1.createMockPlatform)({ plugins: [plugin], featureFlags: ["EXAMPLE_USE_ALT"] });
        platform.setStatusOverride("example", 999);
        server.resetHandlers();
        server.use(...(0, msw_1.mswHandlersFromPlatform)(platform));
        const res = yield fetch("http://localhost/api/example");
        const json = yield res.json();
        expect(res.status).toBe(404);
        expect(json).toEqual({ error: "Not found" });
    }));
});
