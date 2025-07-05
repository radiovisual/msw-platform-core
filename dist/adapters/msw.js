'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.mswHandlersFromPlatform = mswHandlersFromPlatform;
const msw_1 = require('msw');
// Accepts either a platform instance or a function returning a platform
function mswHandlersFromPlatform(platformOrGetter, options) {
	const getPlatform = typeof platformOrGetter === 'function' ? platformOrGetter : () => platformOrGetter;
	return getPlatform()
		.getPlugins()
		.map(plugin => {
			const method = plugin.method.toLowerCase();
			// @ts-ignore: dynamic method access is valid
			const handler = endpoint =>
				msw_1.http[method](endpoint, req => {
					var _a, _b, _c, _d;
					if (getPlatform().getDisabledPluginIds().includes(plugin.id)) {
						// Return undefined to let MSW passthrough to the real backend/proxy
						return undefined;
					}
					try {
						const platform = getPlatform();
						const status = (_a = platform.getStatusOverride(plugin.id)) !== null && _a !== void 0 ? _a : plugin.defaultStatus;
						// Query param support
						let response;
						if (plugin.queryResponses) {
							const urlString = req.url || ((_b = req.request) === null || _b === void 0 ? void 0 : _b.url);
							if (typeof urlString === 'string') {
								const url = urlString.startsWith('http') ? new URL(urlString) : new URL(urlString, window.location.origin);
								// Find a matching query string (exact match for now)
								const match = Object.keys(plugin.queryResponses).find(q => {
									// q is like 'type=foo', so check if all params in q are present in url.searchParams
									return q.split('&').every(pair => {
										const [key, value] = pair.split('=');
										return url.searchParams.get(key) === value;
									});
								});
								if (match) {
									const qr = plugin.queryResponses[match];
									if (qr && typeof qr === 'object' && Object.keys(qr).some(k => !isNaN(Number(k)))) {
										// Map of status codes
										response =
											(_d = (_c = qr[status]) !== null && _c !== void 0 ? _c : qr[plugin.defaultStatus]) !== null && _d !== void 0
												? _d
												: Object.values(qr)[0];
									} else {
										response = qr;
									}
								}
							}
						}
						if (response === undefined) {
							response = platform.getResponse(plugin.id, status);
						}
						if (response === undefined) {
							return msw_1.HttpResponse.json({ error: 'Not found' }, { status: 404 });
						}
						return msw_1.HttpResponse.json(response, { status });
					} catch (err) {
						console.error('MSW handler error:', err);
						return msw_1.HttpResponse.json({ error: String(err) }, { status: 500 });
					}
				});
			if (plugin.endpoint.startsWith('http://') || plugin.endpoint.startsWith('https://')) {
				return [handler(plugin.endpoint)];
			} else {
				return [handler(plugin.endpoint), handler(`http://localhost${plugin.endpoint}`)];
			}
		})
		.reduce((acc, val) => acc.concat(val), []);
}
