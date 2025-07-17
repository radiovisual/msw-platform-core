import {
	EndpointBadge,
	Middleware,
	MiddlewareContext,
	MiddlewareSetting,
	MockPlatformConfig,
	ResponseValue,
	Scenario,
	Plugin,
} from '../types';
import { LocalStoragePersistence } from './LocalStoragePersistence';
import { PersistenceProvider } from './interfaces/PersistanceProvider';
import { PlatformMiddleware } from './PlatformMiddleware';
import { extractResponseBody, extractResponseHeaders } from '../middleware/utils';

export class MockPlatformCore {
	private name: string;
	private plugins: Plugin[];
	private featureFlags: { [key: string]: boolean };
	private featureFlagMetadata: { [key: string]: { description?: string; default?: boolean } };
	private statusOverrides: { [key: string]: number };
	private delayOverrides: { [key: string]: number } = {};
	private scenarios: Scenario[];
	private activeScenario: string | undefined;
	private persistence: PersistenceProvider;
	private endpointScenarioOverrides: { [key: string]: string } = {};
	private disabledPluginIds: string[] = [];
	private globalDisable: boolean = false;
	private pluginMiddleware: Map<string, Middleware[]> = new Map();
	private middlewareSettings: Record<string, any> = {};
	private cachedFeatureFlags: { [key: string]: boolean } | null = null;
	private cachedFeatureFlagMetadata: { [key: string]: { description?: string; default?: boolean } } | null = null;

	// Private registration tracking to prevent duplicates
	private registeredSettings: MiddlewareSetting[] = [];
	private registeredBadges: EndpointBadge[] = [];
	private registeredMiddlewareKeys: Set<string> = new Set();

	constructor(config: MockPlatformConfig, persistence?: PersistenceProvider) {
		this.name = config.name;
		this.plugins = config.plugins || [];
		this.featureFlags = {};
		this.featureFlagMetadata = {};
		this.statusOverrides = {};
		this.scenarios = [];
		this.persistence = persistence || new LocalStoragePersistence(config.name);

		// Initialize feature flags from config
		if (config.featureFlags) {
			for (const flag of config.featureFlags) {
				if (typeof flag === 'string') {
					this.featureFlags[flag] = this.persistence.getFlag(flag) ?? false;
				} else {
					this.featureFlags[flag.name] = this.persistence.getFlag(flag.name) ?? flag.default ?? false;
					this.featureFlagMetadata[flag.name] = {
						description: flag.description,
						default: flag.default,
					};
				}
			}
		}

		for (const plugin of this.plugins) {
			const persisted = this.persistence.getStatus(plugin.id);
			if (persisted !== undefined) {
				this.statusOverrides[plugin.id] = persisted;
			}
			const endpointScenario = this.persistence.getEndpointScenario(plugin.id);
			if (endpointScenario !== undefined) {
				this.endpointScenarioOverrides[plugin.id] = endpointScenario;
			}
			const persistedDelay = this.persistence.getDelay(plugin.id);
			if (persistedDelay !== undefined) {
				this.delayOverrides[plugin.id] = persistedDelay;
			}
		}

		this.activeScenario = this.persistence.getActiveScenario();

		// Initialize global disable from persistence
		this.globalDisable = this.persistence.getGlobalDisable() ?? false;

		// Register middleware from plugin configurations
		for (const plugin of this.plugins) {
			if (plugin.useMiddleware) {
				for (const middleware of plugin.useMiddleware) {
					// Attach the middleware to this specific plugin and register with platform
					middleware.attachTo(plugin.id, this);
				}
			}
		}
	}

	getName() {
		return this.name;
	}

	getPlugins() {
		return this.plugins;
	}

	getFeatureFlags() {
		if (!this.cachedFeatureFlags) {
			this.cachedFeatureFlags = { ...this.featureFlags };
		}
		return this.cachedFeatureFlags;
	}

	getFeatureFlagMetadata() {
		if (!this.cachedFeatureFlagMetadata || JSON.stringify(this.cachedFeatureFlagMetadata) !== JSON.stringify(this.featureFlagMetadata)) {
			this.cachedFeatureFlagMetadata = { ...this.featureFlagMetadata };
		}
		return this.cachedFeatureFlagMetadata;
	}

	setFeatureFlag(flag: string, value: boolean) {
		if (flag in this.featureFlags) {
			this.featureFlags[flag] = value;
			this.persistence.setFlag(flag, value);
			// Update cache
			if (this.cachedFeatureFlags) {
				this.cachedFeatureFlags[flag] = value;
			}
		}
	}

	getStatusOverride(pluginId: string): number | undefined {
		return this.statusOverrides[pluginId];
	}

	setStatusOverride(pluginId: string, status: number) {
		this.statusOverrides[pluginId] = status;
		this.persistence.setStatus(pluginId, status);
	}

	getEndpointScenario(pluginId: string): string | undefined {
		return this.endpointScenarioOverrides[pluginId];
	}
	setEndpointScenario(pluginId: string, scenarioId: string) {
		this.endpointScenarioOverrides[pluginId] = scenarioId;
		this.persistence.setEndpointScenario(pluginId, scenarioId);
	}

	getDelayOverride(pluginId: string): number | undefined {
		return this.delayOverrides[pluginId];
	}
	setDelayOverride(pluginId: string, delay: number) {
		this.delayOverrides[pluginId] = delay;
		this.persistence.setDelay(pluginId, delay);
	}

	getEffectiveDelay(pluginId: string): number {
		return this.delayOverrides[pluginId] ?? this.plugins.find(p => p.id === pluginId)?.delay ?? 150;
	}

	// Middleware API
	useOnPlugin(pluginId: string, middleware: Middleware) {
		if (!this.pluginMiddleware.has(pluginId)) this.pluginMiddleware.set(pluginId, []);
		this.pluginMiddleware.get(pluginId)!.push(middleware);
	}

	setMiddlewareSetting(key: string, value: any) {
		this.middlewareSettings[key] = value;
	}

	getMiddlewareSetting(key: string) {
		return this.middlewareSettings[key];
	}

	// Public method for middleware to register itself (used internally)
	registerMiddleware(middleware: PlatformMiddleware) {
		const setting = middleware.getSetting();

		// Check if this middleware is already registered
		if (this.registeredMiddlewareKeys.has(setting.key)) {
			// Middleware is already registered, just attach to new plugins
			const pluginIds = middleware.getAttachedPlugins();
			for (const pluginId of pluginIds) {
				this.useOnPlugin(pluginId, middleware.getMiddleware());
			}
			return;
		}

		// Register the setting (this will also add to registeredMiddlewareKeys)
		this.registerMiddlewareSetting(setting);
		// Register the badge
		this.registerEndpointBadge(middleware.getBadge());
		// Attach middleware to all specified plugins
		const pluginIds = middleware.getAttachedPlugins();
		for (const pluginId of pluginIds) {
			this.useOnPlugin(pluginId, middleware.getMiddleware());
		}
	}

	// Private registration methods - only accessible through proper channels
	private registerMiddlewareSetting(setting: MiddlewareSetting) {
		// Prevent duplicate registration
		if (this.registeredMiddlewareKeys.has(setting.key)) {
			return;
		}

		this.registeredSettings.push(setting);
		this.registeredMiddlewareKeys.add(setting.key);

		// Set default value if not already set
		if (setting.defaultValue !== undefined && !(setting.key in this.middlewareSettings)) {
			this.middlewareSettings[setting.key] = setting.defaultValue;
		}
	}

	private registerEndpointBadge(badge: EndpointBadge) {
		// Prevent duplicate badge registration
		const existingBadge = this.registeredBadges.find(b => b.id === badge.id);
		if (existingBadge) {
			return;
		}

		// Only register if the middleware has a badge function that returns a value
		this.registeredBadges.push(badge);
	}

	// Public methods for UI to query dynamic controls
	getRegisteredSettings(): MiddlewareSetting[] {
		return [...this.registeredSettings];
	}

	getEndpointBadges(plugin: Plugin): Array<{ id: string; label: string; text: string }> {
		return this.registeredBadges
			.filter(badge => badge.pluginMatcher(plugin))
			.map(badge => {
				const result = badge.render(plugin, this.middlewareSettings);
				return result ? { id: badge.id, label: badge.label, text: result } : null;
			})
			.filter(Boolean) as Array<{ id: string; label: string; text: string }>;
	}

	applyMiddleware(plugin: Plugin, payload: any, request?: any) {
		const chain = this.pluginMiddleware.get(plugin.id) || [];
		let idx = 0;
		const context: MiddlewareContext = {
			// TODO: Dont spread this, apply the key, label, and other context explicitly
			...this,
			plugin,
			request,
			response: payload,
			settings: this.middlewareSettings,
			// Enhanced context information
			featureFlags: this.featureFlags,
			currentStatus: this.statusOverrides[plugin.id] ?? plugin.defaultStatus,
			endpointScenario: this.endpointScenarioOverrides[plugin.id],
			activeScenario: this.activeScenario,
		};
		const next = (currentPayload: any): any => {
			if (idx < chain.length) {
				const mw = chain[idx++];
				return mw(currentPayload, context, next);
			}
			return currentPayload;
		};
		return next(payload);
	}

	// Helper method to provide default 503 Service Unavailable response
	private getDefault503Response(): ResponseValue {
		return {
			body: { error: 'Service Unavailable' },
			headers: { 'Content-Type': 'application/json' },
		};
	}

	// Helper method to provide default 503 Service Unavailable response with headers
	private getDefault503ResponseWithHeaders(): { body: any; headers: Record<string, string> } {
		return {
			body: { error: 'Service Unavailable' },
			headers: { 'Content-Type': 'application/json' },
		};
	}

	getResponse(pluginId: string, status?: number, request?: any) {
		const plugin = this.plugins.find(p => p.id === pluginId);
		if (!plugin) return undefined;
		// If endpoint scenario is set and plugin has scenarios, use it
		const scenarioId = this.getEndpointScenario(pluginId);
		const useStatus = status ?? this.statusOverrides[pluginId] ?? plugin.defaultStatus;
		let resp: ResponseValue | undefined;
		if (scenarioId && plugin.scenarios) {
			const scenario = plugin.scenarios.find(s => s.id === scenarioId);
			if (scenario) {
				resp = scenario.responses[useStatus];
				if (resp === undefined) {
					// Fallback to plugin responses
					resp = plugin.responses[useStatus];
				}
				// If still undefined and requesting 503, provide default 503
				if (resp === undefined && useStatus === 503) {
					resp = this.getDefault503Response();
				}
				if (resp === undefined) return undefined;
				if (plugin.transform) {
					const context: MiddlewareContext = {
						// TODO: Dont spread this, apply the key, label, and other context explicitly
						...this,
						plugin,
						request,
						response: resp,
						settings: this.middlewareSettings,
						featureFlags: this.featureFlags,
						currentStatus: useStatus,
						endpointScenario: scenarioId,
						activeScenario: this.activeScenario,
					};
					resp = plugin.transform(JSON.parse(JSON.stringify(resp)), context);
				}
				// Apply middleware
				resp = this.applyMiddleware(plugin, resp, request);
				return extractResponseBody(resp);
			}
		}
		// Otherwise, use status override/default
		resp = plugin.responses[useStatus];
		// If undefined and requesting 503, provide default 503
		if (resp === undefined && useStatus === 503) {
			resp = this.getDefault503Response();
		}
		if (resp === undefined) return undefined;
		if (plugin.transform) {
			const context: MiddlewareContext = {
				// TODO: Dont spread this, apply the key, label, and other context explicitly
				...this,
				plugin,
				request,
				response: resp,
				settings: this.middlewareSettings,
				featureFlags: this.featureFlags,
				currentStatus: useStatus,
				endpointScenario: scenarioId,
				activeScenario: this.activeScenario,
			};
			resp = plugin.transform(JSON.parse(JSON.stringify(resp)), context);
		}
		// Apply middleware
		resp = this.applyMiddleware(plugin, resp, request);
		return extractResponseBody(resp);
	}

	getResponseWithHeaders(pluginId: string, status?: number, request?: any) {
		const plugin = this.plugins.find(p => p.id === pluginId);
		if (!plugin) return undefined;
		const scenarioId = this.getEndpointScenario(pluginId);
		const useStatus = status ?? this.statusOverrides[pluginId] ?? plugin.defaultStatus;
		let resp: ResponseValue | undefined;

		// Check for query responses first if we have a request
		if (request && plugin.queryResponses) {
			const url = new URL(request.url);
			for (const queryString of Object.keys(plugin.queryResponses)) {
				// Simple query string matching - this could be enhanced
				const queryPairs = queryString.split('&');
				let matches = true;
				for (const pair of queryPairs) {
					const [key, value] = pair.split('=');
					const urlValue = url.searchParams.get(key);
					if (value === '*') {
						// Wildcard matches any value
						if (urlValue === null) {
							matches = false;
							break;
						}
					} else {
						// Exact match
						if (urlValue !== value) {
							matches = false;
							break;
						}
					}
				}
				if (matches) {
					const qr = plugin.queryResponses[queryString];
					if (qr && typeof qr === 'object' && Object.keys(qr).some(k => !isNaN(Number(k)))) {
						// Map of status codes
						resp = qr[useStatus];
						if (resp === undefined) {
							// If requesting 503 and no custom 503 in query response, provide default 503
							if (useStatus === 503) {
								resp = this.getDefault503Response();
							} else {
								resp = qr[plugin.defaultStatus] ?? Object.values(qr)[0];
							}
						}
					} else {
						resp = qr;
					}
					break;
				}
			}
		}

		if (scenarioId && plugin.scenarios && resp === undefined) {
			const scenario = plugin.scenarios.find(s => s.id === scenarioId);
			if (scenario) {
				resp = scenario.responses[useStatus];
				if (resp === undefined) {
					// Fallback to plugin responses
					resp = plugin.responses[useStatus];
				}
				// If still undefined and requesting 503, provide default 503
				if (resp === undefined && useStatus === 503) {
					resp = this.getDefault503Response();
				}
				if (resp === undefined) return undefined;
				if (plugin.transform) {
					const context: MiddlewareContext = {
						// TODO: Dont spread this, apply the key, label, and other context explicitly
						...this,
						plugin,
						request,
						response: resp,
						settings: this.middlewareSettings,
						featureFlags: this.featureFlags,
						currentStatus: useStatus,
						endpointScenario: scenarioId,
						activeScenario: this.activeScenario,
					};
					resp = plugin.transform(JSON.parse(JSON.stringify(resp)), context);
				}
				// Apply middleware
				resp = this.applyMiddleware(plugin, resp, request);
			}
		}

		// Otherwise, use status override/default
		if (resp === undefined) {
			resp = plugin.responses[useStatus];
			// If undefined and requesting 503, provide default 503
			if (resp === undefined && useStatus === 503) {
				resp = this.getDefault503Response();
			}
			if (resp === undefined) return undefined;
			if (plugin.transform) {
				const context: MiddlewareContext = {
					// TODO: Dont spread this, apply the key, label, and other context explicitly
					...this,
					plugin,
					request,
					response: resp,
					settings: this.middlewareSettings,
					featureFlags: this.featureFlags,
					currentStatus: useStatus,
					endpointScenario: scenarioId,
					activeScenario: this.activeScenario,
				};
				resp = plugin.transform(JSON.parse(JSON.stringify(resp)), context);
			}
			// Apply middleware
			resp = this.applyMiddleware(plugin, resp, request);
		}

		// Check if this is a ResponseData object
		if (resp && typeof resp === 'object' && 'body' in resp) {
			const body = extractResponseBody(resp);
			const headers = extractResponseHeaders(resp);
			const status = typeof resp.status === 'number' ? resp.status : undefined;
			const result: any = { body, headers };
			if (status !== undefined) result.status = status;
			return result;
		}

		// For simple responses, wrap in body/headers structure
		if (resp !== undefined) {
			const body = extractResponseBody(resp);
			const headers = extractResponseHeaders(resp);
			const result: any = { body, headers };
			return result;
		}

		// Special case: if we're looking for a 503 response and got here, return default 503
		if (useStatus === 503) {
			return this.getDefault503ResponseWithHeaders();
		}

		return undefined;
	}

	registerScenario(scenario: Scenario) {
		this.scenarios.push(scenario);
	}

	getScenarios() {
		return this.scenarios;
	}

	activateScenario(scenarioId: string) {
		const scenario = this.scenarios.find(s => s.id === scenarioId);
		if (!scenario) return;
		this.activeScenario = scenarioId;
		this.persistence.setActiveScenario(scenarioId);
		// Apply flag and status overrides
		if (scenario.flagOverrides) {
			for (const [flag, value] of Object.entries(scenario.flagOverrides)) {
				this.setFeatureFlag(flag, value);
			}
		}
		if (scenario.statusOverrides) {
			for (const [pluginId, status] of Object.entries(scenario.statusOverrides)) {
				this.setStatusOverride(pluginId, status);
			}
		}
	}

	getActiveScenario(): string | undefined {
		return this.activeScenario;
	}

	setPersistence(persistence: PersistenceProvider) {
		this.persistence = persistence;
	}

	getComponentIds() {
		return Array.from(new Set(this.plugins.map(p => p.componentId)));
	}

	getPluginsByComponentId() {
		const map: Record<string, string[]> = {};
		for (const plugin of this.plugins) {
			if (!map[plugin.componentId]) map[plugin.componentId] = [];
			map[plugin.componentId].push(plugin.id);
		}
		return map;
	}

	getDisabledPluginIds(): string[] {
		if (this.globalDisable) {
			return this.plugins.map(p => p.id);
		}
		return this.disabledPluginIds;
	}

	setDisabledPluginIds(ids: string[]): void {
		this.disabledPluginIds = ids;
	}

	isGloballyDisabled(): boolean {
		return this.globalDisable;
	}

	setGlobalDisable(disabled: boolean): void {
		this.globalDisable = disabled;
		this.persistence.setGlobalDisable(disabled);
	}
}
