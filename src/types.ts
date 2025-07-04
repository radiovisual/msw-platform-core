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

export interface Plugin<T = any> {
  id: string;
  componentId: string;
  endpoint: string;
  method: HttpMethod;
  nickname?: string;
  responses: Record<number, any>; // status code -> payload
  defaultStatus: number;
  featureFlags?: string[];
  transform?: (response: any, flags: Record<string, boolean>) => any;
  scenarios?: EndpointScenario<T>[];
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