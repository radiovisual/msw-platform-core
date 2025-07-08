export interface PersistenceProvider {
	getFlag(flag: string): boolean | undefined;
	setFlag(flag: string, value: boolean): void;
	getStatus(pluginId: string): number | undefined;
	setStatus(pluginId: string, status: number): void;
	getActiveScenario(): string | undefined;
	setActiveScenario(scenarioId: string): void;
	getEndpointScenario(pluginId: string): string | undefined;
	setEndpointScenario(pluginId: string, scenarioId: string): void;
	getDelay(pluginId: string): number | undefined;
	setDelay(pluginId: string, delay: number): void;
	getGlobalDisable(): boolean | undefined;
	setGlobalDisable(value: boolean): void;
}