import { Plugin, MockPlatformConfig, Scenario } from "./types";
export interface PersistenceProvider {
    getFlag(flag: string): boolean | undefined;
    setFlag(flag: string, value: boolean): void;
    getStatus(pluginId: string): number | undefined;
    setStatus(pluginId: string, status: number): void;
    getActiveScenario(): string | undefined;
    setActiveScenario(scenarioId: string): void;
}
export declare class InMemoryPersistence implements PersistenceProvider {
    private flags;
    private statuses;
    private activeScenario;
    getFlag(flag: string): boolean;
    setFlag(flag: string, value: boolean): void;
    getStatus(pluginId: string): number;
    setStatus(pluginId: string, status: number): void;
    getActiveScenario(): string | undefined;
    setActiveScenario(scenarioId: string): void;
}
export declare class MockPlatformCore {
    private plugins;
    private featureFlags;
    private statusOverrides;
    private scenarios;
    private activeScenario;
    private persistence;
    constructor(config: MockPlatformConfig, persistence?: PersistenceProvider);
    getPlugins(): Plugin[];
    getFeatureFlags(): {
        [x: string]: boolean;
    };
    setFeatureFlag(flag: string, value: boolean): void;
    getStatusOverride(pluginId: string): number | undefined;
    setStatusOverride(pluginId: string, status: number): void;
    getResponse(pluginId: string, status?: number): any;
    registerScenario(scenario: Scenario): void;
    getScenarios(): Scenario[];
    activateScenario(scenarioId: string): void;
    getActiveScenario(): string | undefined;
    setPersistence(persistence: PersistenceProvider): void;
}
export declare function createMockPlatform(config: MockPlatformConfig, persistence?: PersistenceProvider): MockPlatformCore;
