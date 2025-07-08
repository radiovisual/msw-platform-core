import type { PlatformMiddleware } from './classes/PlatformMiddleware';
import { HTTP_METHOD, MIDDLEWARE_TYPE } from './constants';

export interface FeatureFlag {
	name: string;
	description?: string;
	default?: boolean;
}

export interface MiddlewareWithBadge {
	middleware: Middleware;
	badge?: {
		id: string;
		label: string;
		pluginMatcher: (plugin: Plugin) => boolean;
		render: (plugin: Plugin, settings: Record<string, any>) => string | null;
	};
}

// Middleware types
export type MiddlewareContext = {
	key: string,
	label: string,
	type: keyof typeof MIDDLEWARE_TYPE;
	options: Array<{ value: string; label: string }>;
	request?: any;
	plugin?: Plugin,
	response: any;
	defaultValue?: any;
	description?: string;
	settings: Record<string, any>;
	// Enhanced context information
	featureFlags: Record<string, boolean>;
	currentStatus: number;
	endpointScenario?: string;
	activeScenario?: string;
};

export type CreatePathMiddlewareConfig = {
	key: string;
	label: string;
	description?: string;
	type: keyof typeof MIDDLEWARE_TYPE,
	options?: Array<{ value: string; label: string }>;
	defaultValue?: any;
	paths: Array<{ path: string; settingKey: string }>;
	badge?: (context: any) => string | null;
	transform?: (response: any, context: any) => any;
}

export type CreateCustomMiddlewareConfig = {
	key: string;
	label: string;
	description?: string;
	type: keyof typeof MIDDLEWARE_TYPE,
	options?: Array<{ value: string; label: string }>;
	defaultValue?: any;
	transform: (response: any, context: any) => any;
	badge?: (context: any) => string | null;
}

export type Middleware = (payload: any, context: MiddlewareContext, next: (payload: any) => any) => any;

export interface MiddlewareSetting {
	key: string;
	label: string;
	type: keyof typeof MIDDLEWARE_TYPE;
	options?: Array<{ value: string; label: string }>;
	defaultValue?: any;
	description?: string;
}

export interface EndpointBadge {
	id: string;
	label: string;
	pluginMatcher: (plugin: Plugin) => boolean;
	render: (plugin: Plugin, settings: Record<string, any>) => string | null;
}


export interface MiddlewareConfig {
	key: string;
	label: string;
	description?: string;
	type: keyof typeof MIDDLEWARE_TYPE;
	options?: Array<{ value: string; label: string }>;
	defaultValue?: any;
	responseTransform: (originalResponse: any, context: MiddlewareContext) => any;
	badge?: (context: MiddlewareContext) => string | null;
}

// New interface for response data with optional headers and status
export interface ResponseData<T = any> {
	body: T;
	headers?: Record<string, string>;
	status?: number; // Optional: allows transform to override status
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
	method: keyof typeof HTTP_METHOD;
	nickname?: string;
	responses: { [key: number]: ResponseValue<any> }; // status code -> payload
	defaultStatus: number;
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
