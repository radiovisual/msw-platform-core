import { updateMultiplePaths } from './utils';
import { PlatformMiddleware } from '../platform';

/**
 * Creates a PlatformMiddleware that updates paths in responses
 * @param config - Configuration for the middleware
 * @returns PlatformMiddleware instance
 */
export function createPathMiddleware(config: {
  key: string;
  label: string;
  description?: string;
  type: 'select' | 'text' | 'number' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  paths: Array<{ path: string; settingKey: string }>;
  badge?: (context: any) => string | null;
}): PlatformMiddleware {
  return new PlatformMiddleware({
    key: config.key,
    label: config.label,
    description: config.description,
    type: config.type,
    options: config.options,
    defaultValue: config.defaultValue,
    responseTransform: (response, context) => {
      const pathUpdates = config.paths
        .map(({ path, settingKey }) => {
          const value = context.settings[settingKey];
          return value !== undefined ? { path, value } : null;
        })
        .filter(Boolean);

      if (pathUpdates.length > 0) {
        return updateMultiplePaths(response, pathUpdates as Array<{ path: string; value: any }>);
      }
      return response;
    },
    badge: config.badge,
  });
}

/**
 * Creates a PlatformMiddleware with custom response transformation
 * @param config - Configuration for the middleware
 * @returns PlatformMiddleware instance
 */
export function createCustomMiddleware(config: {
  key: string;
  label: string;
  description?: string;
  type: 'select' | 'text' | 'number' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  defaultValue?: any;
  transform: (response: any, context: any) => any;
  badge?: (context: any) => string | null;
}): PlatformMiddleware {
  return new PlatformMiddleware({
    key: config.key,
    label: config.label,
    description: config.description,
    type: config.type,
    options: config.options,
    defaultValue: config.defaultValue,
    responseTransform: config.transform,
    badge: config.badge,
  });
} 