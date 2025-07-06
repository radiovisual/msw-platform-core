/**
 * @jest-environment node
 */
import { createMockPlatform, Plugin, InMemoryPersistence, Scenario } from './index';
import { mswHandlersFromPlatform } from './adapters/msw';
import { setupServer } from 'msw/node';
import { createPathMiddleware, createCustomMiddleware } from './middleware/helpers';

let server: any;

beforeAll(() => {
	server = setupServer();
	server.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => {
	server.close();
});

describe('MockPlatformCore', () => {
	const plugin: Plugin = {
		componentId: 'example',
		id: 'example',
		endpoint: '/api/example',
		method: 'GET',
		responses: {
			200: { message: 'Hello from 200' },
			400: { message: 'Bad request' },
		},
		defaultStatus: 200,
		featureFlags: ['EXAMPLE_USE_ALT'],
		transform: (response, context) => {
			if (context.featureFlags.EXAMPLE_USE_ALT) {
				response.message = '[ALT MODE] ' + response.message;
			}
			return response;
		},
	};

	it('registers plugins and feature flags', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		expect(platform.getPlugins().length).toBe(1);
		expect(Object.prototype.hasOwnProperty.call(platform.getFeatureFlags(), 'EXAMPLE_USE_ALT')).toBe(true);
		expect(platform.getFeatureFlags().EXAMPLE_USE_ALT).toBe(false);
	});

	it('can toggle feature flags', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		platform.setFeatureFlag('EXAMPLE_USE_ALT', true);
		expect(platform.getFeatureFlags().EXAMPLE_USE_ALT).toBe(true);
	});

	it('supports feature flag objects with descriptions and defaults', () => {
		const featureFlags = [
			{ name: 'FLAG_WITH_DESC', description: 'A flag with description', default: true },
			{ name: 'FLAG_WITH_DEFAULT', default: false },
			'LEGACY_FLAG',
		];
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags });

		// Check that flags are registered
		expect(platform.getFeatureFlags().FLAG_WITH_DESC).toBe(true);
		expect(platform.getFeatureFlags().FLAG_WITH_DEFAULT).toBe(false);
		expect(platform.getFeatureFlags().LEGACY_FLAG).toBe(false); // String flags default to false

		// Check metadata
		const metadata = platform.getFeatureFlagMetadata();
		expect(metadata.FLAG_WITH_DESC).toEqual({ description: 'A flag with description', default: true });
		expect(metadata.FLAG_WITH_DEFAULT).toEqual({ default: false });
		expect(metadata.LEGACY_FLAG).toBeUndefined(); // String flags have no metadata
	});

	it('applies transform when feature flag is active', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		// Default: flag is false
		expect(platform.getResponse('example', 200)).toEqual({ message: 'Hello from 200' });
		// Enable flag
		platform.setFeatureFlag('EXAMPLE_USE_ALT', true);
		expect(platform.getResponse('example', 200)).toEqual({ message: '[ALT MODE] Hello from 200' });
	});

	it('supports status code overrides', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		expect(platform.getResponse('example')).toEqual({ message: 'Hello from 200' });
		platform.setStatusOverride('example', 400);
		expect(platform.getResponse('example')).toEqual({ message: 'Bad request' });
	});

	it('registers and activates scenarios', () => {
		const scenario: Scenario = {
			id: 'alt-mode-bad-request',
			name: 'Alt mode + 400',
			pluginIds: ['example'],
			flagOverrides: { EXAMPLE_USE_ALT: true },
			statusOverrides: { example: 400 },
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		platform.registerScenario(scenario);
		expect(platform.getScenarios().length).toBe(1);
		platform.activateScenario('alt-mode-bad-request');
		expect(platform.getActiveScenario()).toBe('alt-mode-bad-request');
		expect(platform.getFeatureFlags().EXAMPLE_USE_ALT).toBe(true);
		expect(platform.getResponse('example')).toEqual({ message: '[ALT MODE] Bad request' });
	});

	it('persists feature flags and status overrides', () => {
		const persistence = new InMemoryPersistence('test');
		const platform = createMockPlatform({ name: 'test-platform', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] }, persistence);
		platform.setFeatureFlag('EXAMPLE_USE_ALT', true);
		platform.setStatusOverride('example', 400);
		// New instance should load persisted state
		const platform2 = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] }, persistence);
		expect(platform2.getFeatureFlags().EXAMPLE_USE_ALT).toBe(true);
		expect(platform2.getStatusOverride('example')).toBe(400);
	});

	// Edge cases
	it('returns undefined for missing plugin or status', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		expect(platform.getResponse('notfound')).toBeUndefined();
		expect(platform.getResponse('example', 999)).toBeUndefined();
	});

	it('does nothing if activating a scenario that does not exist', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		expect(() => platform.activateScenario('nope')).not.toThrow();
		expect(platform.getActiveScenario()).toBeUndefined();
	});
});

describe('mswHandlersFromPlatform', () => {
	const plugin: Plugin = {
		componentId: 'example',
		id: 'example',
		endpoint: '/api/example',
		method: 'GET',
		responses: {
			200: { message: 'Hello from 200' },
			400: { message: 'Bad request' },
		},
		defaultStatus: 200,
		featureFlags: ['EXAMPLE_USE_ALT'],
		transform: (response, context) => {
			if (context.featureFlags.EXAMPLE_USE_ALT) {
				response.message = '[ALT MODE] ' + response.message;
			}
			return response;
		},
	};

	it('returns correct response for default status', async () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));
		const res = await fetch('http://localhost/api/example');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: 'Hello from 200' });
	});

	it('returns correct response for overridden status', async () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		platform.setStatusOverride('example', 400);
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));
		const res = await fetch('http://localhost/api/example');
		const json = await res.json();
		expect(res.status).toBe(400);
		expect(json).toEqual({ message: 'Bad request' });
	});

	it('applies feature flag transform in handler', async () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		platform.setFeatureFlag('EXAMPLE_USE_ALT', true);
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));
		const res = await fetch('http://localhost/api/example');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: '[ALT MODE] Hello from 200' });
	});

	it('returns 404 for missing status', async () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		platform.setStatusOverride('example', 999);
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));
		const res = await fetch('http://localhost/api/example');
		const json = await res.json();
		expect(res.status).toBe(404);
		expect(json).toEqual({ error: 'Not found' });
	});

	it('supports MSW wildcard patterns for dynamic routes', async () => {
		const dynamicPlugin: Plugin = {
			componentId: 'user',
			id: 'user-dynamic',
			endpoint: '/api/v1/user/:id',
			method: 'GET',
			responses: {
				200: { id: '123', name: 'John Doe', email: 'john@example.com' },
				404: { error: 'User not found' },
			},
			defaultStatus: 200,
		};

		const platform = createMockPlatform({ name: 'test', plugins: [dynamicPlugin] });
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		// Test with different user IDs - all should match the wildcard pattern
		const testIds = ['123', '456', '789', 'abc123'];
		
		for (const id of testIds) {
			const res = await fetch(`http://localhost/api/v1/user/${id}`);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json).toEqual({ id: '123', name: 'John Doe', email: 'john@example.com' });
		}
	});

	it('supports MSW wildcard patterns with multiple parameters', async () => {
		const multiParamPlugin: Plugin = {
			componentId: 'order',
			id: 'order-dynamic',
			endpoint: '/api/v1/orders/:orderId/items/:itemId',
			method: 'GET',
			responses: {
				200: { orderId: '123', itemId: '456', quantity: 1, price: 29.99 },
				404: { error: 'Order item not found' },
			},
			defaultStatus: 200,
		};

		const platform = createMockPlatform({ name: 'test', plugins: [multiParamPlugin] });
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		// Test with different order and item IDs
		const testCases = [
			{ orderId: '123', itemId: '456' },
			{ orderId: '789', itemId: 'abc' },
			{ orderId: 'xyz', itemId: 'def' },
		];
		
		for (const { orderId, itemId } of testCases) {
			const res = await fetch(`http://localhost/api/v1/orders/${orderId}/items/${itemId}`);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json).toEqual({ orderId: '123', itemId: '456', quantity: 1, price: 29.99 });
		}
	});
});

describe('Query Parameter Matching', () => {
	const pluginWithQueryParams: Plugin = {
		componentId: 'test',
		id: 'query-test',
		endpoint: '/api/test',
		method: 'GET',
		responses: {
			200: { message: 'Default response' },
		},
		defaultStatus: 200,
		queryResponses: {
			'type=admin': { 200: { message: 'Admin response' } },
			'type=guest': { 200: { message: 'Guest response' } },
			'type=*': { 200: { message: 'Any type response' } },
			'status=active&role=*': { 200: { message: 'Active user with any role' } },
		},
	};

	it('matches exact query parameters', async () => {
		const platform = createMockPlatform({ name: 'test', plugins: [pluginWithQueryParams] });
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		const res = await fetch('http://localhost/api/test?type=admin');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: 'Admin response' });
	});

	it('matches wildcard query parameters', async () => {
		const platform = createMockPlatform({ name: 'test', plugins: [pluginWithQueryParams] });
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		// Test with different values for the wildcard parameter
		const testValues = ['member', 'user', '123', 'abc'];
		
		for (const value of testValues) {
			const res = await fetch(`http://localhost/api/test?type=${value}`);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json).toEqual({ message: 'Any type response' });
		}
	});

	it('matches multiple parameters with wildcards', async () => {
		const platform = createMockPlatform({ name: 'test', plugins: [pluginWithQueryParams] });
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		// Test with different role values
		const testRoles = ['admin', 'user', 'guest', 'moderator'];
		
		for (const role of testRoles) {
			const res = await fetch(`http://localhost/api/test?status=active&role=${role}`);
			const json = await res.json();
			expect(res.status).toBe(200);
			expect(json).toEqual({ message: 'Active user with any role' });
		}
	});

	it('falls back to default response when no query parameters match', async () => {
		const platform = createMockPlatform({ name: 'test', plugins: [pluginWithQueryParams] });
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		const res = await fetch('http://localhost/api/test');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: 'Default response' });
	});

	it('does not match when required parameter is missing', async () => {
		const platform = createMockPlatform({ name: 'test', plugins: [pluginWithQueryParams] });
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		// This should not match 'status=active&role=*' because status is missing
		const res = await fetch('http://localhost/api/test?role=admin');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: 'Default response' });
	});
});

describe('Middleware system', () => {
	const plugin: Plugin = {
		componentId: 'user',
		id: 'user1',
		endpoint: '/api/user',
		method: 'GET',
		responses: {
			200: {
				user: { id: 1, type: 'original' },
				contract: { user: { id: 2, type: 'original' } },
				other: { foo: 'bar' },
			},
		},
		defaultStatus: 200,
	};
	const plugin2: Plugin = {
		componentId: 'other',
		id: 'other1',
		endpoint: '/api/other',
		method: 'GET',
		responses: {
			200: { user: { id: 3, type: 'original' } },
		},
		defaultStatus: 200,
	};

	it('applies per-plugin middleware and settings', () => {
		const platform = createMockPlatform({ name: 'mwtest', plugins: [plugin, plugin2] });
		const userTypeMiddleware = createPathMiddleware({
			key: 'userType',
			label: 'User Type',
			type: 'text',
			paths: [
				{ path: 'user.type', settingKey: 'userType' },
				{ path: 'contract.user.type', settingKey: 'userType' },
			],
		});
		userTypeMiddleware.attachTo(['user1', 'other1'], platform);
		platform.setMiddlewareSetting('userType', '005');
		const resp = platform.getResponse('user1');
		expect(resp.user.type).toBe('005');
		expect(resp.contract.user.type).toBe('005');
		// plugin2 also affected
		const resp2 = platform.getResponse('other1');
		expect(resp2.user.type).toBe('005');
	});

	it('applies per-plugin middleware only to that plugin', () => {
		const platform = createMockPlatform({ name: 'mwtest2', plugins: [plugin, plugin2] });
		const userTypeMiddleware = createPathMiddleware({
			key: 'userType',
			label: 'User Type',
			type: 'text',
			paths: [
				{ path: 'user.type', settingKey: 'userType' },
				{ path: 'contract.user.type', settingKey: 'userType' },
			],
		});
		userTypeMiddleware.attachTo(['user1'], platform);
		platform.setMiddlewareSetting('userType', '001');
		const resp = platform.getResponse('user1');
		expect(resp.user.type).toBe('001');
		expect(resp.contract.user.type).toBe('001');
		// plugin2 not affected
		const resp2 = platform.getResponse('other1');
		expect(resp2.user.type).toBe('original');
	});

	it('middleware can chain and call next()', () => {
		const platform = createMockPlatform({ name: 'mwtest3', plugins: [plugin] });
		// Add a middleware that appends a field
		platform.useOnPlugin('user1', (payload, _, next) => {
			const out = next(payload);
			out._mw = 'yes';
			return out;
		});
		const userTypeMiddleware = createPathMiddleware({
			key: 'userType',
			label: 'User Type',
			type: 'text',
			paths: [
				{ path: 'user.type', settingKey: 'userType' },
				{ path: 'contract.user.type', settingKey: 'userType' },
			],
		});
		userTypeMiddleware.attachTo(['user1'], platform);
		platform.setMiddlewareSetting('userType', '007');
		const resp = platform.getResponse('user1');
		expect(resp.user.type).toBe('007');
		expect(resp._mw).toBe('yes');
	});
});

describe('Middleware Registration', () => {
	it('should prevent duplicate middleware registration', () => {
		const platform = createMockPlatform({
			name: 'test',
			plugins: [],
		});

		const middleware = createPathMiddleware({
			key: 'testKey',
			label: 'Test Middleware',
			type: 'text',
			paths: [{ path: 'test.path', settingKey: 'testKey' }],
		});

		// First registration should work
		middleware.attachTo(['plugin1'], platform);
		expect(platform.getRegisteredSettings()).toHaveLength(1);
		expect(platform.getRegisteredSettings()[0].key).toBe('testKey');

		// Second registration should be ignored silently (no warning since we prevent it at middleware level)
		middleware.attachTo(['plugin2'], platform);

		// Should still only have one registration
		expect(platform.getRegisteredSettings()).toHaveLength(1);
		expect(platform.getRegisteredSettings()[0].key).toBe('testKey');
	});

	it('should only show badges when middleware has a badge function that returns a value', () => {
		const platform = createMockPlatform({
			name: 'test',
			plugins: [
				{
					id: 'test-plugin',
					componentId: 'Test',
					endpoint: '/api/test',
					method: 'GET',
					responses: { 200: { data: 'test' } },
					defaultStatus: 200,
				},
			],
		});

		// Middleware with badge function that returns null
		const middlewareWithNullBadge = createCustomMiddleware({
			key: 'nullBadge',
			label: 'Null Badge',
			type: 'text',
			transform: response => response,
			badge: () => null,
		});

		// Middleware with badge function that returns a value
		const middlewareWithValueBadge = createCustomMiddleware({
			key: 'valueBadge',
			label: 'Value Badge',
			type: 'text',
			transform: response => response,
			badge: () => 'Badge Text',
		});

		// Middleware without badge function
		const middlewareWithoutBadge = createCustomMiddleware({
			key: 'noBadge',
			label: 'No Badge',
			type: 'text',
			transform: response => response,
		});

		middlewareWithNullBadge.attachTo(['test-plugin'], platform);
		middlewareWithValueBadge.attachTo(['test-plugin'], platform);
		middlewareWithoutBadge.attachTo(['test-plugin'], platform);

		const plugin = platform.getPlugins()[0];
		const badges = platform.getEndpointBadges(plugin);

		// Should only show badges that return values
		expect(badges).toHaveLength(1);
		expect(badges[0].id).toBe('valueBadge');
		expect(badges[0].text).toBe('Badge Text');
	});

	it('should handle middleware registration through useMiddleware in plugin config', () => {
		const middleware = createPathMiddleware({
			key: 'pluginConfig',
			label: 'Plugin Config Middleware',
			type: 'text',
			paths: [{ path: 'test.path', settingKey: 'pluginConfig' }],
		});

		const platform = createMockPlatform({
			name: 'test',
			plugins: [
				{
					id: 'test-plugin',
					componentId: 'Test',
					endpoint: '/api/test',
					method: 'GET',
					responses: { 200: { data: 'test' } },
					defaultStatus: 200,
					useMiddleware: [middleware],
				},
			],
		});

		// Middleware should be automatically registered
		expect(platform.getRegisteredSettings()).toHaveLength(1);
		expect(platform.getRegisteredSettings()[0].key).toBe('pluginConfig');
	});

	it('should not create duplicate settings when middleware is attached to multiple plugins', () => {
		const platform = createMockPlatform({
			name: 'test',
			plugins: [
				{
					id: 'plugin1',
					componentId: 'Test',
					endpoint: '/api/plugin1',
					method: 'GET',
					responses: { 200: { data: 'test1' } },
					defaultStatus: 200,
				},
				{
					id: 'plugin2',
					componentId: 'Test',
					endpoint: '/api/plugin2',
					method: 'GET',
					responses: { 200: { data: 'test2' } },
					defaultStatus: 200,
				},
				{
					id: 'plugin3',
					componentId: 'Test',
					endpoint: '/api/plugin3',
					method: 'GET',
					responses: { 200: { data: 'test3' } },
					defaultStatus: 200,
				},
			],
		});

		const middleware = createPathMiddleware({
			key: 'sharedSetting',
			label: 'Shared Setting',
			type: 'text',
			paths: [{ path: 'data.value', settingKey: 'sharedSetting' }],
		});

		// Attach to first plugin
		middleware.attachTo(['plugin1'], platform);
		expect(platform.getRegisteredSettings()).toHaveLength(1);
		expect(platform.getRegisteredSettings()[0].key).toBe('sharedSetting');

		// Attach to second plugin - should not create duplicate setting
		middleware.attachTo(['plugin2'], platform);
		expect(platform.getRegisteredSettings()).toHaveLength(1);
		expect(platform.getRegisteredSettings()[0].key).toBe('sharedSetting');

		// Attach to third plugin - should not create duplicate setting
		middleware.attachTo(['plugin3'], platform);
		expect(platform.getRegisteredSettings()).toHaveLength(1);
		expect(platform.getRegisteredSettings()[0].key).toBe('sharedSetting');
	});

	it('should not create duplicate badges when middleware is attached to multiple plugins', () => {
		const platform = createMockPlatform({
			name: 'test',
			plugins: [
				{
					id: 'plugin1',
					componentId: 'Test',
					endpoint: '/api/plugin1',
					method: 'GET',
					responses: { 200: { data: 'test1' } },
					defaultStatus: 200,
				},
				{
					id: 'plugin2',
					componentId: 'Test',
					endpoint: '/api/plugin2',
					method: 'GET',
					responses: { 200: { data: 'test2' } },
					defaultStatus: 200,
				},
			],
		});

		const middlewareWithBadge = createCustomMiddleware({
			key: 'badgeTest',
			label: 'Badge Test',
			type: 'text',
			transform: response => response,
			badge: () => 'Test Badge',
		});

		// Attach to first plugin
		middlewareWithBadge.attachTo(['plugin1'], platform);

		// Check badges for plugin1
		const plugin1 = platform.getPlugins()[0];
		const badges1 = platform.getEndpointBadges(plugin1);
		expect(badges1).toHaveLength(1);
		expect(badges1[0].id).toBe('badgeTest');

		// Attach to second plugin - should not create duplicate badge
		middlewareWithBadge.attachTo(['plugin2'], platform);

		// Check badges for plugin2
		const plugin2 = platform.getPlugins()[1];
		const badges2 = platform.getEndpointBadges(plugin2);
		expect(badges2).toHaveLength(1);
		expect(badges2[0].id).toBe('badgeTest');

		// Verify no duplicate badges in the system
		const allBadges = platform.getEndpointBadges(plugin1).concat(platform.getEndpointBadges(plugin2));
		const uniqueBadgeIds = Array.from(new Set(allBadges.map(b => b.id)));
		expect(uniqueBadgeIds).toHaveLength(1);
		expect(uniqueBadgeIds[0]).toBe('badgeTest');
	});

	it('should handle multiple middleware instances with different keys correctly', () => {
		const platform = createMockPlatform({
			name: 'test',
			plugins: [
				{
					id: 'plugin1',
					componentId: 'Test',
					endpoint: '/api/plugin1',
					method: 'GET',
					responses: { 200: { data: 'test1' } },
					defaultStatus: 200,
				},
				{
					id: 'plugin2',
					componentId: 'Test',
					endpoint: '/api/plugin2',
					method: 'GET',
					responses: { 200: { data: 'test2' } },
					defaultStatus: 200,
				},
			],
		});

		const middleware1 = createPathMiddleware({
			key: 'setting1',
			label: 'Setting 1',
			type: 'text',
			paths: [{ path: 'data.value1', settingKey: 'setting1' }],
		});

		const middleware2 = createPathMiddleware({
			key: 'setting2',
			label: 'Setting 2',
			type: 'text',
			paths: [{ path: 'data.value2', settingKey: 'setting2' }],
		});

		// Attach both middleware to both plugins
		middleware1.attachTo(['plugin1', 'plugin2'], platform);
		middleware2.attachTo(['plugin1', 'plugin2'], platform);

		// Should have exactly 2 settings
		expect(platform.getRegisteredSettings()).toHaveLength(2);
		const settingKeys = platform
			.getRegisteredSettings()
			.map(s => s.key)
			.sort();
		expect(settingKeys).toEqual(['setting1', 'setting2']);
	});

	it('should handle duplicate registrations gracefully without warnings', () => {
		const platform = createMockPlatform({
			name: 'test',
			plugins: [],
		});

		const middleware = createPathMiddleware({
			key: 'duplicateTest',
			label: 'Duplicate Test',
			type: 'text',
			paths: [{ path: 'test.path', settingKey: 'duplicateTest' }],
		});

		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

		// First registration
		middleware.attachTo(['plugin1'], platform);
		expect(consoleSpy).not.toHaveBeenCalled();

		// Second registration should not log warning (prevented at middleware level)
		middleware.attachTo(['plugin2'], platform);
		expect(consoleSpy).not.toHaveBeenCalled();

		// Should still only have one registration
		expect(platform.getRegisteredSettings()).toHaveLength(1);
		expect(platform.getRegisteredSettings()[0].key).toBe('duplicateTest');

		consoleSpy.mockRestore();
	});
});

describe('Multiple Plugins with Same Endpoint', () => {
	const specificPlugin: Plugin = {
		componentId: 'test',
		id: 'specific',
		endpoint: '/foo/bar',
		method: 'GET',
		responses: {
			200: { message: 'Specific response' },
		},
		defaultStatus: 200,
		queryResponses: {
			'baz=specific': { 200: { message: 'Exact match response' } },
		},
	};

	const wildcardPlugin: Plugin = {
		componentId: 'test',
		id: 'wildcard',
		endpoint: '/foo/bar',
		method: 'GET',
		responses: {
			200: { message: 'Wildcard response' },
		},
		defaultStatus: 200,
		queryResponses: {
			'baz=*': { 200: { message: 'Wildcard match response' } },
		},
	};

	const defaultPlugin: Plugin = {
		componentId: 'test',
		id: 'default',
		endpoint: '/foo/bar',
		method: 'GET',
		responses: {
			200: { message: 'Default response' },
		},
		defaultStatus: 200,
	};

	it('correctly matches exact query parameters with highest specificity', async () => {
		const platform = createMockPlatform({ 
			name: 'test', 
			plugins: [specificPlugin, wildcardPlugin, defaultPlugin] 
		});
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		const res = await fetch('http://localhost/foo/bar?baz=specific');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: 'Exact match response' });
	});

	it('correctly matches wildcard query parameters when exact match fails', async () => {
		const platform = createMockPlatform({ 
			name: 'test', 
			plugins: [specificPlugin, wildcardPlugin, defaultPlugin] 
		});
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		const res = await fetch('http://localhost/foo/bar?baz=something');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: 'Wildcard match response' });
	});

	it('correctly falls back to default plugin when no query parameters match', async () => {
		const platform = createMockPlatform({ 
			name: 'test', 
			plugins: [specificPlugin, wildcardPlugin, defaultPlugin] 
		});
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		const res = await fetch('http://localhost/foo/bar');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: 'Default response' });
	});

	it('handles multiple query parameters with mixed specificity', async () => {
		const mixedPlugin: Plugin = {
			componentId: 'test',
			id: 'mixed',
			endpoint: '/foo/bar',
			method: 'GET',
			responses: {
				200: { message: 'Mixed response' },
			},
			defaultStatus: 200,
			queryResponses: {
				'status=active&role=*': { 200: { message: 'Active with any role' } },
				'status=*&role=admin': { 200: { message: 'Any status with admin role' } },
			},
		};

		const platform = createMockPlatform({ 
			name: 'test', 
			plugins: [mixedPlugin, wildcardPlugin, defaultPlugin] 
		});
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		// This should match the mixed plugin with higher specificity
		const res = await fetch('http://localhost/foo/bar?status=active&role=user');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: 'Active with any role' });
	});

	it('respects plugin order when specificity is equal', async () => {
		const equalSpecificityPlugin1: Plugin = {
			componentId: 'test',
			id: 'equal1',
			endpoint: '/foo/bar',
			method: 'GET',
			responses: {
				200: { message: 'Equal specificity 1' },
			},
			defaultStatus: 200,
			queryResponses: {
				'param1=*&param2=*': { 200: { message: 'First equal match' } },
			},
		};

		const equalSpecificityPlugin2: Plugin = {
			componentId: 'test',
			id: 'equal2',
			endpoint: '/foo/bar',
			method: 'GET',
			responses: {
				200: { message: 'Equal specificity 2' },
			},
			defaultStatus: 200,
			queryResponses: {
				'param1=*&param2=*': { 200: { message: 'Second equal match' } },
			},
		};

		const platform = createMockPlatform({ 
			name: 'test', 
			plugins: [equalSpecificityPlugin1, equalSpecificityPlugin2] 
		});
		server.resetHandlers();
		server.use(...mswHandlersFromPlatform(platform));

		// Both have equal specificity, first one should win
		const res = await fetch('http://localhost/foo/bar?param1=value1&param2=value2');
		const json = await res.json();
		expect(res.status).toBe(200);
		expect(json).toEqual({ message: 'First equal match' });
	});
});

describe('Delay functionality', () => {
	it('should handle delay overrides correctly', () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
			delay: 500,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// Test default delay
		expect(platform.getEffectiveDelay('test-plugin')).toBe(500);

		// Test override
		platform.setDelayOverride('test-plugin', 1000);
		expect(platform.getEffectiveDelay('test-plugin')).toBe(1000);

		// Test getting override
		expect(platform.getDelayOverride('test-plugin')).toBe(1000);
	});

	it('should use default delay of 150ms when no delay is specified', () => {
		const platform = createMockPlatform({
			name: 'test',
			plugins: [
				{
					id: 'test-plugin',
					componentId: 'test',
					endpoint: '/api/test',
					method: 'GET',
					defaultStatus: 200,
					responses: { 200: { message: 'test' } },
				},
			],
		});

		expect(platform.getEffectiveDelay('test-plugin')).toBe(150);
	});

	it('should persist delay overrides', () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
			delay: 500,
		};

		const mockPersistence = {
			getFlag: jest.fn(),
			setFlag: jest.fn(),
			getStatus: jest.fn(),
			setStatus: jest.fn(),
			getActiveScenario: jest.fn(),
			setActiveScenario: jest.fn(),
			getEndpointScenario: jest.fn(),
			setEndpointScenario: jest.fn(),
			getDelay: jest.fn(() => 1000),
			setDelay: jest.fn(),
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		}, mockPersistence);

		// Should use persisted delay
		expect(platform.getEffectiveDelay('test-plugin')).toBe(1000);

		// Should call persistence when setting delay
		platform.setDelayOverride('test-plugin', 2000);
		expect(mockPersistence.setDelay).toHaveBeenCalledWith('test-plugin', 2000);
	});
});
