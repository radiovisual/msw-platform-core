import type { PlatformMiddleware, MiddlewareContext } from './platform';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface FeatureFlag {
	name: string;
	description?: string;
	default?: boolean;
}

export interface EndpointScenario<T = any> {
	id: string; // e.g. "user-not-registered"
	label: string; // e.g. "User not registered"
	responses: { [key: number]: T }; // status code -> payload (overrides plugin responses)
}

// Allow queryResponses to be an object where each key is a query string, and the value is either a response object or a map of status codes to responses
export type QueryResponses = {
	[query: string]: any | { [status: number]: any };
};

export interface Plugin<T = any> {
	id: string;
	componentId: string;
	endpoint: string;
	method: HttpMethod;
	nickname?: string;
	responses: { [key: number]: any }; // status code -> payload
	defaultStatus: number;
	featureFlags?: string[];
	scenarios?: EndpointScenario<T>[];
	queryResponses?: QueryResponses;
	transform?: (response: any, context: MiddlewareContext) => any;
	swaggerUrl?: string;
	useMiddleware?: PlatformMiddleware[]; // Array of middleware to use for this plugin
	delay?: number; // Response delay in milliseconds (default: 150)
}

export interface MockPlatformConfig {
	name: string;
	plugins: Plugin[];
	featureFlags?: (string | FeatureFlag)[];
}

export interface Scenario {
	id: string;
	name: string;
	description?: string;
	pluginIds: string[];
	flagOverrides?: { [key: string]: boolean };
	statusOverrides?: { [key: string]: number };
}
