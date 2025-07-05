export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export interface FeatureFlag {
	name: string;
	description?: string;
	default?: boolean;
}
export interface EndpointScenario<T = any> {
	id: string;
	label: string;
	responses: Record<number, T>;
}
export type QueryResponses = {
	[query: string]:
		| any
		| {
				[status: number]: any;
		  };
};
export interface Plugin<T = any> {
	id: string;
	componentId: string;
	endpoint: string;
	method: HttpMethod;
	nickname?: string;
	responses: Record<number, any>;
	defaultStatus: number;
	featureFlags?: string[];
	scenarios?: EndpointScenario<T>[];
	queryResponses?: QueryResponses;
	transform?: (response: any, flags: Record<string, boolean>) => any;
	swaggerUrl?: string;
}
export interface MockPlatformConfig {
	name: string;
	plugins: Plugin[];
	featureFlags?: string[];
}
export interface Scenario {
	id: string;
	name: string;
	description?: string;
	pluginIds: string[];
	flagOverrides?: Record<string, boolean>;
	statusOverrides?: Record<string, number>;
}
