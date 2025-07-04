"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const platform_1 = require("../platform");
const msw_1 = require("./msw");
const storybook_1 = require("./storybook");
describe('storybookHandlersFromPlatform', () => {
    const plugin = {
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
        const platform = (0, platform_1.createMockPlatform)({ plugins: [plugin] });
        const mswHandlers = (0, msw_1.mswHandlersFromPlatform)(platform);
        const storybookHandlers = (0, storybook_1.storybookHandlersFromPlatform)(platform);
        expect(storybookHandlers.length).toBe(mswHandlers.length);
        for (let i = 0; i < mswHandlers.length; i++) {
            expect(getHandlerInfo(storybookHandlers[i])).toEqual(getHandlerInfo(mswHandlers[i]));
            expect(typeof storybookHandlers[i].resolver).toBe('function');
        }
    });
    it('returns handlers with the same method and path as mswHandlersFromPlatform (platform getter)', () => {
        const platform = (0, platform_1.createMockPlatform)({ plugins: [plugin] });
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
        const platform = (0, platform_1.createMockPlatform)({ plugins: [plugin] });
        const handlers = (0, storybook_1.storybookHandlersFromPlatform)(platform);
        expect(handlers[0]).toHaveProperty('predicate');
        expect(handlers[0]).toHaveProperty('resolver');
    });
});
