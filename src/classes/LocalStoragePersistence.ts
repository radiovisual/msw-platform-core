import { PersistenceProvider } from './interfaces/PersistanceProvider';

export class LocalStoragePersistence implements PersistenceProvider {
	private name: string;
	private flagsKey: string;
	private statusKey: string;
	private scenarioKey: string;
	private endpointScenariosKey: string;
	private delaysKey: string;
	private globalDisableKey: string;

	constructor(name: string) {
		this.name = name;
		this.flagsKey = `${name}.persistence.flags.v1`;
		this.statusKey = `${name}.persistence.statuses.v1`;
		this.scenarioKey = `${name}.persistence.scenario.v1`;
		this.endpointScenariosKey = `${name}.persistence.endpointScenarios.v1`;
		this.delaysKey = `${name}.persistence.delays.v1`;
		this.globalDisableKey = `${name}.persistence.globalDisable.v1`;
	}

	private getStoredObject<T>(key: string): T | undefined {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : undefined;
		} catch {
			return undefined;
		}
	}

	private setStoredObject<T>(key: string, value: T): void {
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			// Silently fail if localStorage is not available
		}
	}

	getFlag(flag: string): boolean | undefined {
		const flags = this.getStoredObject<{ [key: string]: boolean }>(this.flagsKey);
		return flags?.[flag];
	}

	setFlag(flag: string, value: boolean): void {
		const flags = this.getStoredObject<{ [key: string]: boolean }>(this.flagsKey) || {};
		flags[flag] = value;
		this.setStoredObject(this.flagsKey, flags);
	}

	getStatus(pluginId: string): number | undefined {
		const statuses = this.getStoredObject<{ [key: string]: number }>(this.statusKey);
		return statuses?.[pluginId];
	}

	setStatus(pluginId: string, status: number): void {
		const statuses = this.getStoredObject<{ [key: string]: number }>(this.statusKey) || {};
		statuses[pluginId] = status;
		this.setStoredObject(this.statusKey, statuses);
	}

	getActiveScenario(): string | undefined {
		return this.getStoredObject<string>(this.scenarioKey);
	}

	setActiveScenario(scenarioId: string): void {
		this.setStoredObject(this.scenarioKey, scenarioId);
	}

	getEndpointScenario(pluginId: string): string | undefined {
		const scenarios = this.getStoredObject<{ [key: string]: string }>(this.endpointScenariosKey);
		return scenarios?.[pluginId];
	}

	setEndpointScenario(pluginId: string, scenarioId: string): void {
		const scenarios = this.getStoredObject<{ [key: string]: string }>(this.endpointScenariosKey) || {};
		scenarios[pluginId] = scenarioId;
		this.setStoredObject(this.endpointScenariosKey, scenarios);
	}

	getDelay(pluginId: string): number | undefined {
		const delays = this.getStoredObject<{ [key: string]: number }>(this.delaysKey);
		return delays?.[pluginId];
	}

	setDelay(pluginId: string, delay: number): void {
		const delays = this.getStoredObject<{ [key: string]: number }>(this.delaysKey) || {};
		delays[pluginId] = delay;
		this.setStoredObject(this.delaysKey, delays);
	}

	getGlobalDisable(): boolean | undefined {
		return this.getStoredObject<boolean>(this.globalDisableKey);
	}

	setGlobalDisable(value: boolean): void {
		this.setStoredObject(this.globalDisableKey, value);
	}
}