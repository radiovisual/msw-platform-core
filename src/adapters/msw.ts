import { http, HttpResponse } from 'msw';
import { MockPlatformCore } from '../platform';
import { Plugin } from '../types';

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
		const [key, value] = pair.split('=');
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
		const [method, endpoint] = key.split(':');
		const httpMethod = method as keyof typeof http;
		
		const handler = (endpointUrl: string) =>
			http[httpMethod](endpointUrl, (req: any) => {
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
						} else {
							// Plugin has no query responses, so it's a fallback
							// Only use it if no other plugin matched (specificity = 0)
							if (bestSpecificity === -1) {
								bestPlugin = plugin;
								bestSpecificity = 0;
								bestQueryMatch = null;
							}
						}
					}
					
					// If no plugin matched, return 404
					if (!bestPlugin) {
						return HttpResponse.json({ error: 'Not found' }, { status: 404 });
					}
					
					// Get the response from the best matching plugin
					const status = platform.getStatusOverride(bestPlugin.id) ?? bestPlugin.defaultStatus;
					let response;
					
					if (bestQueryMatch && bestPlugin.queryResponses) {
						const qr = bestPlugin.queryResponses[bestQueryMatch];
						if (qr && typeof qr === 'object' && Object.keys(qr).some(k => !isNaN(Number(k)))) {
							// Map of status codes
							response = qr[status] ?? qr[bestPlugin.defaultStatus] ?? Object.values(qr)[0];
						} else {
							response = qr;
						}
					}
					
					if (response === undefined) {
						response = platform.getResponse(bestPlugin.id, status);
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
		
		// Create handlers for both relative and absolute URLs
		if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
			handlers.push(handler(endpoint));
		} else {
			handlers.push(handler(endpoint), handler(`http://localhost${endpoint}`));
		}
	}
	
	return handlers;
}
