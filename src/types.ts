// Types for mock-platform-core

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface FeatureFlag {
  name: string;
  description?: string;
  default?: boolean;
}

// Strongly-typed scenario for each endpoint
export interface EndpointScenario<T = any> {
  id: string; // e.g. "user-not-registered"
  label: string; // e.g. "User not registered"
  responses: Record<number, T>; // status code -> payload (overrides plugin responses)
  // No defaultStatus here; plugin.defaultStatus is used
}

// Allow queryResponses to be an object where each key is a query string, and the value is either a response object or a map of status codes to responses
export type QueryResponses = {
  [query: string]: any | { [status: number]: any }
};

export interface Plugin<T = any> {
  id: string;
  componentId: string;
  endpoint: string;
  method: HttpMethod;
  nickname?: string;
  responses: Record<number, any>; // status code -> payload
  defaultStatus: number;
  featureFlags?: string[];
  scenarios?: EndpointScenario<T>[];
  queryResponses?: QueryResponses;
  transform?: (response: any, flags: Record<string, boolean>) => any;
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