import type { PlatformMiddleware, MiddlewareContext } from './platform';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface FeatureFlag {
	name: string;
	description?: string;
	default?: boolean;
}

// New interface for response data with optional headers
export interface ResponseData<T = any> {
	body: T;
	headers?: Record<string, string>;
}

// Helper type to support both simple responses (backward compatibility) and ResponseData objects
export type ResponseValue<T = any> = T | ResponseData<T>;

export interface EndpointScenario<T = any> {
	id: string; // e.g. "user-not-registered"
	label: string; // e.g. "User not registered"
	responses: { [key: number]: ResponseValue<T> }; // status code -> payload (overrides plugin responses)
}

// Allow queryResponses to be an object where each key is a query string, and the value is either a response object or a map of status codes to responses
export type QueryResponses = {
	[query: string]: ResponseValue<any> | { [status: number]: ResponseValue<any> };
};

export interface Plugin<T = any> {
	id: string;
	componentId: string;
	endpoint: string;
	method: HttpMethod;
	nickname?: string;
	responses: { [key: number]: ResponseValue<any> }; // status code -> payload
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
