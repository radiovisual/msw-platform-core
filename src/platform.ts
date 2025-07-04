import { Plugin, MockPlatformConfig, Scenario } from "./types";

export interface PersistenceProvider {
  getFlag(flag: string): boolean | undefined;
  setFlag(flag: string, value: boolean): void;
  getStatus(pluginId: string): number | undefined;
  setStatus(pluginId: string, status: number): void;
  getActiveScenario(): string | undefined;
  setActiveScenario(scenarioId: string): void;
}

export class InMemoryPersistence implements PersistenceProvider {
  private name: string;
  private flags: Record<string, boolean> = {};
  private statuses: Record<string, number> = {};
  private activeScenario: string | undefined;
  constructor(name: string) { this.name = name; }
  getFlag(flag: string) { return this.flags[flag]; }
  setFlag(flag: string, value: boolean) { this.flags[flag] = value; }
  getStatus(pluginId: string) { return this.statuses[pluginId]; }
  setStatus(pluginId: string, status: number) { this.statuses[pluginId] = status; }
  getActiveScenario() { return this.activeScenario; }
  setActiveScenario(scenarioId: string) { this.activeScenario = scenarioId; }
}

export class MockPlatformCore {
  private name: string;
  private plugins: Plugin[];
  private featureFlags: Record<string, boolean>;
  private statusOverrides: Record<string, number>;
  private scenarios: Scenario[];
  private activeScenario: string | undefined;
  private persistence: PersistenceProvider;

  constructor(config: MockPlatformConfig, persistence?: PersistenceProvider) {
    this.name = config?.name ?? new Date().getTime().toString();
    if (!this.name) {
      throw new Error("Platform name is required");
    }
    this.plugins = config.plugins;
    this.featureFlags = {};
    this.statusOverrides = {};
    this.scenarios = [];
    this.activeScenario = undefined;
    this.persistence = persistence || new InMemoryPersistence(this.name);
    (config.featureFlags || []).forEach(flag => {
      this.featureFlags[flag] = this.persistence.getFlag(flag) ?? false;
    });
    // Initialize feature flags from plugins
    for (const plugin of this.plugins) {
      if (plugin.featureFlags) {
        for (const flag of plugin.featureFlags) {
          if (!(flag in this.featureFlags)) this.featureFlags[flag] = this.persistence.getFlag(flag) ?? false;
        }
      }
    }
    // Load status overrides from persistence
    for (const plugin of this.plugins) {
      const persisted = this.persistence.getStatus(plugin.id);
      if (persisted !== undefined) this.statusOverrides[plugin.id] = persisted;
    }
    // Load active scenario
    this.activeScenario = this.persistence.getActiveScenario();
  }

  getName() { return this.name; }

  getPlugins() {
    return this.plugins;
  }

  getFeatureFlags() {
    return { ...this.featureFlags };
  }

  setFeatureFlag(flag: string, value: boolean) {
    if (flag in this.featureFlags) {
      this.featureFlags[flag] = value;
      this.persistence.setFlag(flag, value);
    }
  }

  getStatusOverride(pluginId: string): number | undefined {
    return this.statusOverrides[pluginId];
  }

  setStatusOverride(pluginId: string, status: number) {
    this.statusOverrides[pluginId] = status;
    this.persistence.setStatus(pluginId, status);
  }

  getResponse(pluginId: string, status?: number) {
    const plugin = this.plugins.find(p => p.id === pluginId);
    if (!plugin) return undefined;
    // Use override if present
    const useStatus = status ?? this.statusOverrides[pluginId] ?? plugin.defaultStatus;
    let response = plugin.responses[useStatus];
    if (response === undefined) return undefined;
    if (plugin.transform) {
      // Use JSON deep clone for compatibility
      response = plugin.transform(JSON.parse(JSON.stringify(response)), this.featureFlags);
    }
    return response;
  }

  // Scenario support
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
}

export function createMockPlatform(config: MockPlatformConfig, persistence?: PersistenceProvider) {
  return new MockPlatformCore(config, persistence);
} 