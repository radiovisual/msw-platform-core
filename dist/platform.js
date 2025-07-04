"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPlatformCore = exports.InMemoryPersistence = void 0;
exports.createMockPlatform = createMockPlatform;
class InMemoryPersistence {
    constructor() {
        this.flags = {};
        this.statuses = {};
    }
    getFlag(flag) { return this.flags[flag]; }
    setFlag(flag, value) { this.flags[flag] = value; }
    getStatus(pluginId) { return this.statuses[pluginId]; }
    setStatus(pluginId, status) { this.statuses[pluginId] = status; }
    getActiveScenario() { return this.activeScenario; }
    setActiveScenario(scenarioId) { this.activeScenario = scenarioId; }
}
exports.InMemoryPersistence = InMemoryPersistence;
class MockPlatformCore {
    constructor(config, persistence) {
        var _a;
        this.plugins = config.plugins;
        this.featureFlags = {};
        this.statusOverrides = {};
        this.scenarios = [];
        this.activeScenario = undefined;
        this.persistence = persistence || new InMemoryPersistence();
        (config.featureFlags || []).forEach(flag => {
            var _a;
            this.featureFlags[flag] = (_a = this.persistence.getFlag(flag)) !== null && _a !== void 0 ? _a : false;
        });
        // Initialize feature flags from plugins
        for (const plugin of this.plugins) {
            if (plugin.featureFlags) {
                for (const flag of plugin.featureFlags) {
                    if (!(flag in this.featureFlags))
                        this.featureFlags[flag] = (_a = this.persistence.getFlag(flag)) !== null && _a !== void 0 ? _a : false;
                }
            }
        }
        // Load status overrides from persistence
        for (const plugin of this.plugins) {
            const persisted = this.persistence.getStatus(plugin.id);
            if (persisted !== undefined)
                this.statusOverrides[plugin.id] = persisted;
        }
        // Load active scenario
        this.activeScenario = this.persistence.getActiveScenario();
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
    getResponse(pluginId, status) {
        var _a;
        const plugin = this.plugins.find(p => p.id === pluginId);
        if (!plugin)
            return undefined;
        // Use override if present
        const useStatus = (_a = status !== null && status !== void 0 ? status : this.statusOverrides[pluginId]) !== null && _a !== void 0 ? _a : plugin.defaultStatus;
        let response = plugin.responses[useStatus];
        if (response === undefined)
            return undefined;
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
        if (!scenario)
            return;
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
}
exports.MockPlatformCore = MockPlatformCore;
function createMockPlatform(config, persistence) {
    return new MockPlatformCore(config, persistence);
}
