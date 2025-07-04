"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storybookHandlersFromPlatform = storybookHandlersFromPlatform;
const msw_1 = require("./msw");
/**
 * Generates MSW handlers for Storybook integration.
 * Accepts a platform instance or a function returning a platform.
 * Usage: parameters: { msw: { handlers: storybookHandlersFromPlatform(platform, options) } }
 */
function storybookHandlersFromPlatform(platformOrGetter, options) {
    return (0, msw_1.mswHandlersFromPlatform)(platformOrGetter, options);
}
