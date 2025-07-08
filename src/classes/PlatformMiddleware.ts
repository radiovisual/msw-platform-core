import { EndpointBadge, Middleware, MiddlewareConfig, MiddlewareContext, MiddlewareSetting } from '../types';
import { MockPlatformCore } from './MockPlatformCore';

export class PlatformMiddleware {
	private config: MiddlewareConfig;
	private attachedPlugins: string[] = [];
	private platform?: MockPlatformCore;

	constructor(config: MiddlewareConfig) {
		this.config = config;
	}

	// Attach to specific plugins and optionally register with platform
	attachTo(pluginIds: string | string[], platform?: MockPlatformCore) {
		const ids = Array.isArray(pluginIds) ? pluginIds : [pluginIds];
		this.attachedPlugins.push(...ids);

		// If platform is provided, register the middleware immediately
		if (platform) {
			this.platform = platform;
			platform.registerMiddleware(this);
		}

		return this;
	}

	// Attach to plugins by component
	attachToComponent(_componentId: string) {
		// This will be resolved when the middleware is registered with the platform
		return this;
	}

	// Get the middleware function
	getMiddleware(): Middleware {
		return (payload, context, next) => {
			const transformed = this.config.responseTransform(payload, context);
			return next(transformed);
		};
	}

	// Get the setting configuration
	getSetting(): MiddlewareSetting {
		return {
			key: this.config.key,
			label: this.config.label,
			type: this.config.type,
			options: this.config?.options ?? [],
			defaultValue: this.config.defaultValue,
			description: this.config?.description ?? '',
		};
	}

	// Get the badge configuration
	getBadge(): EndpointBadge {
		return {
			id: this.config.key,
			label: this.config.label,
			pluginMatcher: plugin => this.attachedPlugins.includes(plugin.id),
			render: (plugin, settings) => {
				// Use the badge function if provided, otherwise show default badge
				if (this.config.badge) {
					const context: MiddlewareContext = {
						key: this.config.key,
						label: this.config.label,
						type: this.config.type,
						options: this.config?.options ?? [],
						request: undefined,
						plugin,
						response: {},
						defaultValue: this.config.defaultValue,
						description: this.config?.description ?? '',
						settings,
						featureFlags: {},
						currentStatus: 200,
						endpointScenario: undefined,
						activeScenario: undefined,
					};
					const result = this.config.badge(context);
					// Only show badge if the function returns a non-null value
					return result;
				}

				// Default badge behavior - only show if setting has a value
				const value = settings[this.config.key];
				if (!value) return null;
				return `${this.config.label}: ${value}`;
			},
		};
	}

	// Get attached plugin IDs
	getAttachedPlugins(): string[] {
		return [...this.attachedPlugins];
	}
}