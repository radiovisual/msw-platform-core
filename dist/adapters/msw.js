"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mswHandlersFromPlatform = mswHandlersFromPlatform;
const msw_1 = require("msw");
// Accepts either a platform instance or a function returning a platform
function mswHandlersFromPlatform(platformOrGetter, options) {
    const getPlatform = typeof platformOrGetter === 'function' ? platformOrGetter : () => platformOrGetter;
    const disabled = (options === null || options === void 0 ? void 0 : options.disabledPluginIds) || [];
    return getPlatform().getPlugins().flatMap((plugin) => {
        const method = plugin.method.toLowerCase();
        // @ts-ignore: dynamic method access is valid
        const handler = (endpoint) => msw_1.http[method](endpoint, () => {
            var _a;
            if (disabled.includes(plugin.id)) {
                // Return undefined to let MSW passthrough to the real backend/proxy
                return undefined;
            }
            try {
                const platform = getPlatform();
                const status = (_a = platform.getStatusOverride(plugin.id)) !== null && _a !== void 0 ? _a : plugin.defaultStatus;
                const response = platform.getResponse(plugin.id, status);
                if (response === undefined) {
                    return msw_1.HttpResponse.json({ error: 'Not found' }, { status: 404 });
                }
                return msw_1.HttpResponse.json(response, { status });
            }
            catch (err) {
                console.error('MSW handler error:', err);
                return msw_1.HttpResponse.json({ error: String(err) }, { status: 500 });
            }
        });
        // Register for both relative and absolute URL
        return [
            handler(plugin.endpoint),
            handler(`http://localhost${plugin.endpoint}`)
        ];
    });
}
