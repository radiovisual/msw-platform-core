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
const platform_1 = require("../platform");
const msw_1 = require("./msw");
const storybook_1 = require("./storybook");
describe('storybookHandlersFromPlatform', () => {
    const plugin = {
        componentId: 'test',
        id: 'test',
        endpoint: '/api/test',
        method: 'GET',
        responses: {
            200: { ok: true },
        },
        defaultStatus: 200,
    };
    function getHandlerInfo(handler) {
        return handler.info ? { method: handler.info.method, path: handler.info.path } : null;
    }
    it('returns handlers with the same method and path as mswHandlersFromPlatform (platform instance)', () => {
        const platform = (0, platform_1.createMockPlatform)({ name: "test", plugins: [plugin] });
        const mswHandlers = (0, msw_1.mswHandlersFromPlatform)(platform);
        const storybookHandlers = (0, storybook_1.storybookHandlersFromPlatform)(platform);
        expect(storybookHandlers.length).toBe(mswHandlers.length);
        for (let i = 0; i < mswHandlers.length; i++) {
            expect(getHandlerInfo(storybookHandlers[i])).toEqual(getHandlerInfo(mswHandlers[i]));
            expect(typeof storybookHandlers[i].resolver).toBe('function');
        }
    });
    it('returns handlers with the same method and path as mswHandlersFromPlatform (platform getter)', () => {
        const platform = (0, platform_1.createMockPlatform)({ name: "test", plugins: [plugin] });
        const getter = () => platform;
        const mswHandlers = (0, msw_1.mswHandlersFromPlatform)(getter);
        const storybookHandlers = (0, storybook_1.storybookHandlersFromPlatform)(getter);
        expect(storybookHandlers.length).toBe(mswHandlers.length);
        for (let i = 0; i < mswHandlers.length; i++) {
            expect(getHandlerInfo(storybookHandlers[i])).toEqual(getHandlerInfo(mswHandlers[i]));
            expect(typeof storybookHandlers[i].resolver).toBe('function');
        }
    });
    it('handlers are compatible with MSW (have a .predicate and .resolver)', () => {
        const platform = (0, platform_1.createMockPlatform)({ name: "test", plugins: [plugin] });
        const handlers = (0, storybook_1.storybookHandlersFromPlatform)(platform);
        expect(handlers[0]).toHaveProperty('predicate');
        expect(handlers[0]).toHaveProperty('resolver');
    });
});
describe('mswHandlersFromPlatform passthrough', () => {
    it('returns undefined (passthrough) when plugin is disabled, and mock when enabled', () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = (0, platform_1.createMockPlatform)({
            name: 'test',
            plugins: [
                {
                    id: 'foo',
                    componentId: 'A',
                    endpoint: '/api/foo',
                    method: 'GET',
                    responses: { 200: { ok: true } },
                    defaultStatus: 200,
                },
            ],
            featureFlags: [],
        });
        // Initially enabled (mocked)
        platform.setDisabledPluginIds([]);
        const handlers = (0, msw_1.mswHandlersFromPlatform)(platform);
        const handler = handlers.find((h) => { var _a; return ((_a = h.info) === null || _a === void 0 ? void 0 : _a.path) === '/api/foo'; });
        expect(handler).toBeDefined();
        // Simulate a request
        const req = new Request('http://localhost/api/foo', { method: 'GET' });
        // @ts-ignore
        const res = yield (handler === null || handler === void 0 ? void 0 : handler.resolver({ request: req, params: {}, cookies: {} }));
        expect(res === null || res === void 0 ? void 0 : res.status).toBe(200);
        // Now disable the plugin (passthrough)
        platform.setDisabledPluginIds(['foo']);
        // @ts-ignore
        const passthrough = yield (handler === null || handler === void 0 ? void 0 : handler.resolver({ request: req, params: {}, cookies: {} }));
        expect(passthrough).toBeUndefined();
    }));
});
describe('mswHandlersFromPlatform passthrough (absolute URL)', () => {
    it('returns undefined (passthrough) when absolute URL plugin is disabled, and mock when enabled', () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = (0, platform_1.createMockPlatform)({
            name: 'test',
            plugins: [
                {
                    id: 'bar',
                    componentId: 'B',
                    endpoint: 'https://jsonplaceholder.typicode.com/users/1',
                    method: 'GET',
                    responses: { 200: { name: 'Mocked User', email: 'mock@example.com' } },
                    defaultStatus: 200,
                },
            ],
            featureFlags: [],
        });
        // Initially enabled (mocked)
        platform.setDisabledPluginIds([]);
        const handlers = (0, msw_1.mswHandlersFromPlatform)(platform);
        const handler = handlers.find((h) => { var _a; return ((_a = h.info) === null || _a === void 0 ? void 0 : _a.path) === 'https://jsonplaceholder.typicode.com/users/1'; });
        expect(handler).toBeDefined();
        // Simulate a request
        const req = new Request('https://jsonplaceholder.typicode.com/users/1', { method: 'GET' });
        // @ts-ignore
        const res = yield (handler === null || handler === void 0 ? void 0 : handler.resolver({ request: req, params: {}, cookies: {} }));
        expect(res === null || res === void 0 ? void 0 : res.status).toBe(200);
        // Now disable the plugin (passthrough)
        platform.setDisabledPluginIds(['bar']);
        // @ts-ignore
        const passthrough = yield (handler === null || handler === void 0 ? void 0 : handler.resolver({ request: req, params: {}, cookies: {} }));
        expect(passthrough).toBeUndefined();
    }));
});
