import { Plugin, MockPlatformConfig, Scenario } from './types';
export interface PersistenceProvider {
	getFlag(flag: string): boolean | undefined;
	setFlag(flag: string, value: boolean): void;
	getStatus(pluginId: string): number | undefined;
	setStatus(pluginId: string, status: number): void;
	getActiveScenario(): string | undefined;
	setActiveScenario(scenarioId: string): void;
	getEndpointScenario(pluginId: string): string | undefined;
	setEndpointScenario(pluginId: string, scenarioId: string): void;
}
export declare class InMemoryPersistence implements PersistenceProvider {
	private name;
	private flags;
	private statuses;
	private activeScenario;
	private endpointScenarios;
	constructor(name: string);
	getFlag(flag: string): boolean;
	setFlag(flag: string, value: boolean): void;
	getStatus(pluginId: string): number;
	setStatus(pluginId: string, status: number): void;
	getActiveScenario(): string | undefined;
	setActiveScenario(scenarioId: string): void;
	getEndpointScenario(pluginId: string): string;
	setEndpointScenario(pluginId: string, scenarioId: string): void;
}
export declare class MockPlatformCore {
	private name;
	private plugins;
	private featureFlags;
	private statusOverrides;
	private scenarios;
	private activeScenario;
	private persistence;
	private endpointScenarioOverrides;
	private disabledPluginIds;
	constructor(config: MockPlatformConfig, persistence?: PersistenceProvider);
	getName(): string;
	getPlugins(): Plugin<any>[];
	getFeatureFlags(): {
		[x: string]: boolean;
	};
	setFeatureFlag(flag: string, value: boolean): void;
	getStatusOverride(pluginId: string): number | undefined;
	setStatusOverride(pluginId: string, status: number): void;
	getEndpointScenario(pluginId: string): string | undefined;
	setEndpointScenario(pluginId: string, scenarioId: string): void;
	getResponse(pluginId: string, status?: number): any;
	registerScenario(scenario: Scenario): void;
	getScenarios(): Scenario[];
	activateScenario(scenarioId: string): void;
	getActiveScenario(): string | undefined;
	setPersistence(persistence: PersistenceProvider): void;
	getComponentIds(): string[];
	getPluginsByComponentId(): Record<string, string[]>;
	getDisabledPluginIds(): string[];
	setDisabledPluginIds(ids: string[]): void;
}
export declare function createMockPlatform(config: MockPlatformConfig, persistence?: PersistenceProvider): MockPlatformCore;
