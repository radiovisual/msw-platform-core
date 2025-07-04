// Types for mock-platform-core

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface FeatureFlag {
  name: string;
  description?: string;
  default?: boolean;
}

export interface Plugin {
  id: string;
  componentId: string;
  endpoint: string;
  method: HttpMethod;
  nickname?: string;
  responses: Record<number, any>; // status code -> payload
  defaultStatus: number;
  featureFlags?: string[];
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