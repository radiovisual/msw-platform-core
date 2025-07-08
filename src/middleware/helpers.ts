import { updateMultiplePaths } from './utils';
import { PlatformMiddleware } from '../classes/PlatformMiddleware';
import { CreatePathMiddlewareConfig, CreateCustomMiddlewareConfig } from '../types';

/**
 * Creates a PlatformMiddleware that updates paths in responses
 * @param config - Configuration for the middleware
 * @returns PlatformMiddleware instance
 */
export function createPathMiddleware(config: CreatePathMiddlewareConfig): PlatformMiddleware {
	return new PlatformMiddleware({
		key: config.key,
		label: config.label,
		description: config.description,
		type: config.type,
		options: config.options,
		defaultValue: config.defaultValue,
		responseTransform: (response, context) => {
			const pathUpdates = config.paths
				.map(({ path, settingKey }: { path: string; settingKey: string }) => {
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
export function createCustomMiddleware(config: CreateCustomMiddlewareConfig): PlatformMiddleware {
	return new PlatformMiddleware({
		key: config.key,
		label: config.label,
		description: config.description,
		type: config.type,
		options: config.options,
		defaultValue: config.defaultValue,
		responseTransform: config?.transform,
		badge: config.badge,
	});
}
