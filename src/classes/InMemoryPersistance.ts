import { PersistenceProvider } from './interfaces/PersistanceProvider';

export class InMemoryPersistence implements PersistenceProvider {
	private name: string;
	private flags: { [key: string]: boolean } = {};
	private statuses: { [key: string]: number } = {};
	private activeScenario: string | undefined;
	private endpointScenarios: { [key: string]: string } = {};
	private delays: { [key: string]: number } = {};
	private globalDisable: boolean = false;

	constructor(name: string) {
		this.name = name;
	}
	getFlag(flag: string) {
		return this.flags[flag];
	}
	setFlag(flag: string, value: boolean) {
		this.flags[flag] = value;
	}
	getStatus(pluginId: string) {
		return this.statuses[pluginId];
	}
	setStatus(pluginId: string, status: number) {
		this.statuses[pluginId] = status;
	}
	getActiveScenario() {
		return this.activeScenario;
	}
	setActiveScenario(scenarioId: string) {
		this.activeScenario = scenarioId;
	}
	getEndpointScenario(pluginId: string) {
		return this.endpointScenarios[pluginId];
	}
	setEndpointScenario(pluginId: string, scenarioId: string) {
		this.endpointScenarios[pluginId] = scenarioId;
	}
	getDelay(pluginId: string) {
		return this.delays[pluginId];
	}
	setDelay(pluginId: string, delay: number) {
		this.delays[pluginId] = delay;
	}
	getGlobalDisable() {
		return this.globalDisable;
	}
	setGlobalDisable(value: boolean) {
		this.globalDisable = value;
	}
}