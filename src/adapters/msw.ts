import { http, HttpResponse } from 'msw';
import { MockPlatformCore } from '../platform';
import { Plugin } from '../types';

export interface MSWHandlersOptions {
	/**
	 * List of plugin IDs to disable (passthrough to real backend/proxy)
	 */
	disabledPluginIds?: string[];
}

// Accepts either a platform instance or a function returning a platform
export function mswHandlersFromPlatform(platformOrGetter: MockPlatformCore | (() => MockPlatformCore)/*, options?: MSWHandlersOptions*/) {
	const getPlatform = typeof platformOrGetter === 'function' ? platformOrGetter : () => platformOrGetter;
	return getPlatform()
		.getPlugins()
		.map((plugin: Plugin) => {
			const method = plugin.method.toLowerCase();
			// @ts-ignore: dynamic method access is valid
			const handler = (endpoint: string) =>
				http[method](endpoint, req => {
					if (getPlatform().getDisabledPluginIds().includes(plugin.id)) {
						// Return undefined to let MSW passthrough to the real backend/proxy
						return undefined;
					}
					try {
						const platform = getPlatform();
						const status = platform.getStatusOverride(plugin.id) ?? plugin.defaultStatus;
						// Query param support
						let response;
						if (plugin.queryResponses) {
							const urlString = req.url || req.request?.url;
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
										response = qr[status] ?? qr[plugin.defaultStatus] ?? Object.values(qr)[0];
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
							return HttpResponse.json({ error: 'Not found' }, { status: 404 });
						}
						return HttpResponse.json(response, { status });
					} catch (err) {
						// MSW handler error: err
						return HttpResponse.json({ error: String(err) }, { status: 500 });
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
