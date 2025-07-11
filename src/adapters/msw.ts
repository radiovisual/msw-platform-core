import { http, HttpResponse, passthrough } from 'msw';
import { MockPlatformCore } from '../classes/MockPlatformCore';
import { Plugin } from '../types';
import { extractResponseBody, extractResponseHeaders } from '../middleware/utils';

export interface MSWHandlersOptions {
	/**
	 * List of plugin IDs to disable (passthrough to real backend/proxy)
	 */
	disabledPluginIds?: string[];
}

// Helper function to calculate query parameter match specificity
function calculateQueryMatchSpecificity(queryString: string): number {
	if (!queryString) return 0;

	const pairs = queryString.split('&');
	let specificity = 0;

	for (const pair of pairs) {
		const [_, value] = pair.split('=');
		if (value === '*') {
			specificity += 1; // Wildcard gets 1 point
		} else {
			specificity += 10; // Exact match gets 10 points
		}
	}

	return specificity;
}

// Helper function to check if a query string matches the URL
function queryStringMatches(queryString: string, url: URL): boolean {
	if (!queryString) return true; // No query params means match any

	const pairs = queryString.split('&');
	return pairs.every(pair => {
		const [key, value] = pair.split('=');
		const urlValue = url.searchParams.get(key);

		// If the parameter is not present in the URL, it doesn't match
		if (urlValue === null) {
			return false;
		}

		// If the expected value is '*', it matches any value (including empty string)
		if (value === '*') {
			return true;
		}

		// Otherwise, do exact matching
		return urlValue === value;
	});
}

// Accepts either a platform instance or a function returning a platform
export function mswHandlersFromPlatform(platformOrGetter: MockPlatformCore | (() => MockPlatformCore) /*, options?: MSWHandlersOptions*/) {
	const getPlatform = typeof platformOrGetter === 'function' ? platformOrGetter : () => platformOrGetter;
	const platform = getPlatform();

	// Group plugins by endpoint and method
	const endpointGroups = new Map<string, Plugin[]>();

	for (const plugin of platform.getPlugins()) {
		const key = `${plugin.method.toLowerCase()}:${plugin.endpoint}`;
		if (!endpointGroups.has(key)) {
			endpointGroups.set(key, []);
		}
		endpointGroups.get(key)!.push(plugin);
	}

	// Create handlers for each endpoint group
	const handlers: any[] = [];

	for (const [key, plugins] of endpointGroups) {
		const [method, ...endpointParts] = key.split(':');
		const endpoint = endpointParts.join(':');
		const httpMethod = method as keyof typeof http;

		const handler = (endpointUrl: string) =>
			http[httpMethod](endpointUrl, async (req: any) => {
				try {
					const urlString = req.url || req.request?.url;
					if (typeof urlString !== 'string') {
						return HttpResponse.json({ error: 'Invalid URL' }, { status: 400 });
					}

					const url = urlString.startsWith('http') ? new URL(urlString) : new URL(urlString, window.location.origin);

					// Find the best matching plugin
					let bestPlugin: Plugin | null = null;
					let bestSpecificity = -1;
					let bestQueryMatch: string | null = null;
					let fallbackPluginWithDefault: Plugin | null = null;
					for (const plugin of plugins) {
						// Skip disabled plugins
						if (platform.getDisabledPluginIds().includes(plugin.id)) {
							continue;
						}
						// Check if this plugin has query responses
						if (plugin.queryResponses) {
							// Find the best matching query string for this plugin
							for (const queryString of Object.keys(plugin.queryResponses)) {
								if (queryStringMatches(queryString, url)) {
									const specificity = calculateQueryMatchSpecificity(queryString);
									if (specificity > bestSpecificity) {
										bestPlugin = plugin;
										bestSpecificity = specificity;
										bestQueryMatch = queryString;
									}
								}
							}
							// Track this plugin as a fallback option if it has a default response
							// Only consider enabled plugins as fallbacks
							if (
								!fallbackPluginWithDefault &&
								plugin.responses &&
								plugin.responses[plugin.defaultStatus] !== undefined &&
								!platform.getDisabledPluginIds().includes(plugin.id)
							) {
								fallbackPluginWithDefault = plugin;
							}
						} else {
							// Plugin has no query responses, so it's a fallback
							// Only use it if no other plugin matched (specificity = 0) and it's enabled
							if (bestSpecificity === -1 && !platform.getDisabledPluginIds().includes(plugin.id)) {
								bestPlugin = plugin;
								bestSpecificity = 0;
								bestQueryMatch = null;
							}
							// Also track it as a fallback option
							if (
								!fallbackPluginWithDefault &&
								plugin.responses &&
								plugin.responses[plugin.defaultStatus] !== undefined &&
								!platform.getDisabledPluginIds().includes(plugin.id)
							) {
								fallbackPluginWithDefault = plugin;
							}
						}
					}
					// If no plugin matched, check if we should use a fallback plugin
					if (!bestPlugin && fallbackPluginWithDefault) {
						// Check if there are disabled plugins for this endpoint
						const hasDisabledPlugins = plugins.some(plugin => platform.getDisabledPluginIds().includes(plugin.id));

						// Only use fallback if there are no disabled plugins
						// If there are disabled plugins, prefer passthrough over fallback
						if (
							!hasDisabledPlugins &&
							fallbackPluginWithDefault.responses &&
							fallbackPluginWithDefault.responses[fallbackPluginWithDefault.defaultStatus] !== undefined
						) {
							bestPlugin = fallbackPluginWithDefault;
							bestSpecificity = 0;
							bestQueryMatch = null;
						}
					}

					// If no plugin matched, implement passthrough
					if (!bestPlugin) {
						// Check if any plugin for this endpoint is disabled
						const hasDisabledPlugins = plugins.some(plugin => platform.getDisabledPluginIds().includes(plugin.id));

						// If there are disabled plugins, use passthrough to let real backend handle it
						if (hasDisabledPlugins) {
							return passthrough();
						}

						// If no plugins are disabled, return 404 as before
						return HttpResponse.json({ error: 'Not found' }, { status: 404 });
					}

					// Get the response from the best matching plugin
					const status = platform.getStatusOverride(bestPlugin.id) ?? bestPlugin.defaultStatus;
					let responseValue;

					if (bestQueryMatch && bestPlugin.queryResponses) {
						const qr = bestPlugin.queryResponses[bestQueryMatch];
						if (qr && typeof qr === 'object' && Object.keys(qr).some(k => !isNaN(Number(k)))) {
							// Map of status codes
							responseValue = qr[status];
							// If no response for this status but it's 503, let platform handle default 503
							if (responseValue === undefined && status === 503) {
								// Let platform handle default 503
								responseValue = undefined;
							} else if (responseValue === undefined) {
								responseValue = qr[bestPlugin.defaultStatus] ?? Object.values(qr)[0];
							}
						} else {
							responseValue = qr;
						}
					}

					if (responseValue === undefined) {
						const requestForPlatform = { url: urlString };
						responseValue = platform.getResponseWithHeaders(bestPlugin.id, status, requestForPlatform);
					}

					if (responseValue === undefined) {
						// Fall back to getResponse for simple responses
						const simpleResponse = platform.getResponse(bestPlugin.id, status);
						if (simpleResponse === undefined) {
							return HttpResponse.json({ error: 'Not found' }, { status: 404 });
						}
						responseValue = simpleResponse;
					}

					// Extract body, headers, and status from the response value
					const body = extractResponseBody(responseValue);
					const headers = extractResponseHeaders(responseValue);
					const transformedStatus =
						responseValue && typeof responseValue === 'object' && 'status' in responseValue && typeof responseValue.status === 'number'
							? responseValue.status
							: status;
					// Apply delay if configured
					const delay = platform.getEffectiveDelay(bestPlugin.id);
					if (delay > 0) {
						await new Promise(resolve => setTimeout(resolve, delay));
					}
					// Determine response type based on Content-Type header
					const contentType = headers['Content-Type'] || headers['content-type'] || 'application/json';
					if (contentType.includes('application/json')) {
						return HttpResponse.json(body, { status: transformedStatus, headers });
					} else if (contentType.includes('text/html')) {
						return HttpResponse.html(typeof body === 'string' ? body : String(body), { status: transformedStatus, headers });
					} else if (contentType.includes('text/plain')) {
						return HttpResponse.text(typeof body === 'string' ? body : String(body), { status: transformedStatus, headers });
					} else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
						return HttpResponse.xml(typeof body === 'string' ? body : String(body), { status: transformedStatus, headers });
					} else if (contentType.includes('application/octet-stream') && body instanceof ArrayBuffer) {
						return HttpResponse.arrayBuffer(body, { status: transformedStatus, headers });
					} else {
						// Fallback: use the generic HttpResponse constructor
						return new HttpResponse(body, { status: transformedStatus, headers });
					}
				} catch (err) {
					// MSW handler error: err
					return HttpResponse.json({ error: String(err) }, { status: 500 });
				}
			});

		// Create handlers for both relative and absolute URLs
		if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
			handlers.push(handler(endpoint));
		} else {
			handlers.push(handler(endpoint), handler(`http://localhost${endpoint}`));
		}
	}

	return handlers;
}
