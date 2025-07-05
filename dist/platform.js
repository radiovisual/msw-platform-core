'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MockPlatformCore = exports.InMemoryPersistence = void 0;
exports.createMockPlatform = createMockPlatform;
class InMemoryPersistence {
	constructor(name) {
		this.flags = {};
		this.statuses = {};
		this.endpointScenarios = {};
		this.name = name;
	}
	getFlag(flag) {
		return this.flags[flag];
	}
	setFlag(flag, value) {
		this.flags[flag] = value;
	}
	getStatus(pluginId) {
		return this.statuses[pluginId];
	}
	setStatus(pluginId, status) {
		this.statuses[pluginId] = status;
	}
	getActiveScenario() {
		return this.activeScenario;
	}
	setActiveScenario(scenarioId) {
		this.activeScenario = scenarioId;
	}
	getEndpointScenario(pluginId) {
		return this.endpointScenarios[pluginId];
	}
	setEndpointScenario(pluginId, scenarioId) {
		this.endpointScenarios[pluginId] = scenarioId;
	}
}
exports.InMemoryPersistence = InMemoryPersistence;
class MockPlatformCore {
	constructor(config, persistence) {
		var _a, _b;
		this.endpointScenarioOverrides = {};
		this.disabledPluginIds = [];
		this.name =
			(_a = config === null || config === void 0 ? void 0 : config.name) !== null && _a !== void 0 ? _a : new Date().getTime().toString();
		if (!this.name) {
			throw new Error('Platform name is required');
		}
		this.plugins = config.plugins;
		this.featureFlags = {};
		this.statusOverrides = {};
		this.scenarios = [];
		this.activeScenario = undefined;
		this.persistence = persistence || new InMemoryPersistence(this.name);
		(config.featureFlags || []).forEach(flag => {
			var _a;
			this.featureFlags[flag] = (_a = this.persistence.getFlag(flag)) !== null && _a !== void 0 ? _a : false;
		});
		// Initialize feature flags from plugins
		for (const plugin of this.plugins) {
			if (plugin.featureFlags) {
				for (const flag of plugin.featureFlags) {
					if (!(flag in this.featureFlags))
						this.featureFlags[flag] = (_b = this.persistence.getFlag(flag)) !== null && _b !== void 0 ? _b : false;
				}
			}
		}
		// Load status overrides from persistence
		for (const plugin of this.plugins) {
			const persisted = this.persistence.getStatus(plugin.id);
			if (persisted !== undefined) this.statusOverrides[plugin.id] = persisted;
			// Load endpoint scenario override from persistence
			const scenarioId = this.persistence.getEndpointScenario(plugin.id);
			if (scenarioId) this.endpointScenarioOverrides[plugin.id] = scenarioId;
		}
		// Load active scenario
		this.activeScenario = this.persistence.getActiveScenario();
	}
	getName() {
		return this.name;
	}
	getPlugins() {
		return this.plugins;
	}
	getFeatureFlags() {
		return Object.assign({}, this.featureFlags);
	}
	setFeatureFlag(flag, value) {
		if (flag in this.featureFlags) {
			this.featureFlags[flag] = value;
			this.persistence.setFlag(flag, value);
		}
	}
	getStatusOverride(pluginId) {
		return this.statusOverrides[pluginId];
	}
	setStatusOverride(pluginId, status) {
		this.statusOverrides[pluginId] = status;
		this.persistence.setStatus(pluginId, status);
	}
	// Endpoint scenario support
	getEndpointScenario(pluginId) {
		return this.endpointScenarioOverrides[pluginId];
	}
	setEndpointScenario(pluginId, scenarioId) {
		this.endpointScenarioOverrides[pluginId] = scenarioId;
		this.persistence.setEndpointScenario(pluginId, scenarioId);
	}
	getResponse(pluginId, status) {
		var _a;
		const plugin = this.plugins.find(p => p.id === pluginId);
		if (!plugin) return undefined;
		// If endpoint scenario is set and plugin has scenarios, use it
		const scenarioId = this.getEndpointScenario(pluginId);
		const useStatus =
			(_a = status !== null && status !== void 0 ? status : this.statusOverrides[pluginId]) !== null && _a !== void 0
				? _a
				: plugin.defaultStatus;
		if (scenarioId && plugin.scenarios) {
			const scenario = plugin.scenarios.find(s => s.id === scenarioId);
			if (scenario) {
				let resp = scenario.responses[useStatus];
				if (resp === undefined) {
					// Fallback to plugin responses
					resp = plugin.responses[useStatus];
				}
				if (resp === undefined) return undefined;
				if (plugin.transform) {
					resp = plugin.transform(JSON.parse(JSON.stringify(resp)), this.featureFlags);
				}
				return resp;
			}
		}
		// Otherwise, use status override/default
		let response = plugin.responses[useStatus];
		if (response === undefined) return undefined;
		if (plugin.transform) {
			// Use JSON deep clone for compatibility
			response = plugin.transform(JSON.parse(JSON.stringify(response)), this.featureFlags);
		}
		return response;
	}
	// Scenario support
	registerScenario(scenario) {
		this.scenarios.push(scenario);
	}
	getScenarios() {
		return this.scenarios;
	}
	activateScenario(scenarioId) {
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
	getActiveScenario() {
		return this.activeScenario;
	}
	setPersistence(persistence) {
		this.persistence = persistence;
	}
	getComponentIds() {
		return Array.from(new Set(this.plugins.map(p => p.componentId)));
	}
	getPluginsByComponentId() {
		const map = {};
		for (const plugin of this.plugins) {
			if (!map[plugin.componentId]) map[plugin.componentId] = [];
			map[plugin.componentId].push(plugin.id);
		}
		return map;
	}
	getDisabledPluginIds() {
		return this.disabledPluginIds;
	}
	setDisabledPluginIds(ids) {
		this.disabledPluginIds = ids;
	}
}
exports.MockPlatformCore = MockPlatformCore;
function createMockPlatform(config, persistence) {
	return new MockPlatformCore(config, persistence);
}
