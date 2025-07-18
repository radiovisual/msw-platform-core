/**
 * @jest-environment node
 */
import { createMockPlatform, Plugin, Scenario } from './index';
import { mswHandlersFromPlatform } from './adapters/msw';
import { setupServer } from 'msw/node';
import { createPathMiddleware, createCustomMiddleware } from './middleware/helpers';
import { InMemoryPersistence } from './classes/InMemoryPersistance';

let server: any;

beforeAll(() => {
	server = setupServer();
	server.listen({ onUnhandledRequest: 'warn' });
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
		expect(platform.getResponse('example', 200)).toEqual({ body: { message: 'Hello from 200' }, headers: {} });
		// Enable flag
		platform.setFeatureFlag('EXAMPLE_USE_ALT', true);
		expect(platform.getResponse('example', 200)).toEqual({ body: { message: '[ALT MODE] Hello from 200' }, headers: {} });
	});

	it('supports status code overrides', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin], featureFlags: ['EXAMPLE_USE_ALT'] });
		expect(platform.getResponse('example')).toEqual({ body: { message: 'Hello from 200' }, headers: {} });
		platform.setStatusOverride('example', 400);
		expect(platform.getResponse('example')).toEqual({ body: { message: 'Bad request' }, headers: {} });
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
		expect(platform.getResponse('example')).toEqual({ body: { message: '[ALT MODE] Bad request' }, headers: {} });
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
			type: 'TEXT',
			paths: [
				{ path: 'user.type', settingKey: 'userType' },
				{ path: 'contract.user.type', settingKey: 'userType' },
			],
		});
		userTypeMiddleware.attachTo(['user1', 'other1'], platform);
		platform.setMiddlewareSetting('userType', '005');
		const resp = platform.getResponse('user1');
		expect(resp?.body.user.type).toBe('005');
		expect(resp?.body.contract.user.type).toBe('005');
		// plugin2 also affected
		const resp2 = platform.getResponse('other1');
		expect(resp2?.body.user.type).toBe('005');
	});

	it('applies per-plugin middleware only to that plugin', () => {
		const platform = createMockPlatform({ name: 'mwtest2', plugins: [plugin, plugin2] });
		const userTypeMiddleware = createPathMiddleware({
			key: 'userType',
			label: 'User Type',
			type: 'TEXT',
			paths: [
				{ path: 'user.type', settingKey: 'userType' },
				{ path: 'contract.user.type', settingKey: 'userType' },
			],
		});
		userTypeMiddleware.attachTo(['user1'], platform);
		platform.setMiddlewareSetting('userType', '001');
		const resp = platform.getResponse('user1');
		expect(resp?.body.user.type).toBe('001');
		expect(resp?.body.contract.user.type).toBe('001');
		// plugin2 not affected
		const resp2 = platform.getResponse('other1');
		expect(resp2?.body.user.type).toBe('original');
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
			type: 'TEXT',
			paths: [
				{ path: 'user.type', settingKey: 'userType' },
				{ path: 'contract.user.type', settingKey: 'userType' },
			],
		});
		userTypeMiddleware.attachTo(['user1'], platform);
		platform.setMiddlewareSetting('userType', '007');
		const resp = platform.getResponse('user1');
		expect(resp?.body.user.type).toBe('007');
		expect(resp?.body._mw).toBe('yes');
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
			type: 'TEXT',
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
			type: 'TEXT',
			transform: response => response,
			badge: () => null,
		});

		// Middleware with badge function that returns a value
		const middlewareWithValueBadge = createCustomMiddleware({
			key: 'valueBadge',
			label: 'Value Badge',
			type: 'TEXT',
			transform: response => response,
			badge: () => 'Badge Text',
		});

		// Middleware without badge function
		const middlewareWithoutBadge = createCustomMiddleware({
			key: 'noBadge',
			label: 'No Badge',
			type: 'TEXT',
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
			type: 'TEXT',
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
			type: 'TEXT',
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
			type: 'TEXT',
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
			type: 'TEXT',
			paths: [{ path: 'data.value1', settingKey: 'setting1' }],
		});

		const middleware2 = createPathMiddleware({
			key: 'setting2',
			label: 'Setting 2',
			type: 'TEXT',
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
			type: 'TEXT',
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
			plugins: [specificPlugin, wildcardPlugin, defaultPlugin],
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
			plugins: [specificPlugin, wildcardPlugin, defaultPlugin],
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
			plugins: [specificPlugin, wildcardPlugin, defaultPlugin],
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
			plugins: [mixedPlugin, wildcardPlugin, defaultPlugin],
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
			plugins: [equalSpecificityPlugin1, equalSpecificityPlugin2],
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
			getGlobalDisable: jest.fn(),
			setGlobalDisable: jest.fn(),
		};

		const platform = createMockPlatform(
			{
				name: 'test',
				plugins: [plugin],
			},
			mockPersistence
		);

		// Should use persisted delay
		expect(platform.getEffectiveDelay('test-plugin')).toBe(1000);

		// Should call persistence when setting delay
		platform.setDelayOverride('test-plugin', 2000);
		expect(mockPersistence.setDelay).toHaveBeenCalledWith('test-plugin', 2000);
	});
});

describe('Global Disable functionality', () => {
	it('should disable all plugins when global disable is enabled', () => {
		const plugin1: Plugin = {
			id: 'plugin1',
			componentId: 'test',
			endpoint: '/api/test1',
			method: 'GET',
			responses: { 200: { message: 'test1' } },
			defaultStatus: 200,
		};

		const plugin2: Plugin = {
			id: 'plugin2',
			componentId: 'test',
			endpoint: '/api/test2',
			method: 'GET',
			responses: { 200: { message: 'test2' } },
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin1, plugin2],
		});

		// Initially all plugins should be enabled
		expect(platform.getDisabledPluginIds()).toEqual([]);

		// Enable global disable
		platform.setGlobalDisable(true);
		expect(platform.isGloballyDisabled()).toBe(true);
		expect(platform.getDisabledPluginIds()).toEqual(['plugin1', 'plugin2']);

		// Disable global disable
		platform.setGlobalDisable(false);
		expect(platform.isGloballyDisabled()).toBe(false);
		expect(platform.getDisabledPluginIds()).toEqual([]);
	});

	it('should persist global disable setting', () => {
		const mockPersistence = {
			getFlag: jest.fn(),
			setFlag: jest.fn(),
			getStatus: jest.fn(),
			setStatus: jest.fn(),
			getActiveScenario: jest.fn(),
			setActiveScenario: jest.fn(),
			getEndpointScenario: jest.fn(),
			setEndpointScenario: jest.fn(),
			getDelay: jest.fn(),
			setDelay: jest.fn(),
			getGlobalDisable: jest.fn(() => true),
			setGlobalDisable: jest.fn(),
		};

		const platform = createMockPlatform(
			{
				name: 'test',
				plugins: [],
			},
			mockPersistence
		);

		// Should use persisted global disable setting
		expect(platform.isGloballyDisabled()).toBe(true);

		// Should call persistence when setting global disable
		platform.setGlobalDisable(false);
		expect(mockPersistence.setGlobalDisable).toHaveBeenCalledWith(false);
	});

	it('should override individual plugin disable settings when global disable is enabled', () => {
		const plugin: Plugin = {
			id: 'plugin1',
			componentId: 'test',
			endpoint: '/api/test1',
			method: 'GET',
			responses: { 200: { message: 'test1' } },
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// Initially enable individual plugin disable
		platform.setDisabledPluginIds(['plugin1']);
		expect(platform.getDisabledPluginIds()).toEqual(['plugin1']);

		// Enable global disable - should override individual settings
		platform.setGlobalDisable(true);
		expect(platform.getDisabledPluginIds()).toEqual(['plugin1']);

		// Disable global disable - should return to individual settings
		platform.setGlobalDisable(false);
		expect(platform.getDisabledPluginIds()).toEqual(['plugin1']);
	});

	it('should preserve individual endpoint mock states when toggling global disable', () => {
		const plugin1: Plugin = {
			id: 'plugin1',
			componentId: 'test',
			endpoint: '/api/test1',
			method: 'GET',
			responses: { 200: { message: 'test1' } },
			defaultStatus: 200,
		};

		const plugin2: Plugin = {
			id: 'plugin2',
			componentId: 'test',
			endpoint: '/api/test2',
			method: 'GET',
			responses: { 200: { message: 'test2' } },
			defaultStatus: 200,
		};

		const plugin3: Plugin = {
			id: 'plugin3',
			componentId: 'test',
			endpoint: '/api/test3',
			method: 'GET',
			responses: { 200: { message: 'test3' } },
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin1, plugin2, plugin3],
		});

		// Set up individual mock states: plugin1 disabled, plugin2 enabled, plugin3 disabled
		platform.setDisabledPluginIds(['plugin1', 'plugin3']);
		expect(platform.getDisabledPluginIds()).toEqual(['plugin1', 'plugin3']);

		// Enable global disable - all should be disabled
		platform.setGlobalDisable(true);
		expect(platform.isGloballyDisabled()).toBe(true);
		expect(platform.getDisabledPluginIds()).toEqual(['plugin1', 'plugin2', 'plugin3']);

		// Disable global disable - should return to original individual states
		platform.setGlobalDisable(false);
		expect(platform.isGloballyDisabled()).toBe(false);
		expect(platform.getDisabledPluginIds()).toEqual(['plugin1', 'plugin3']);

		// Verify that the internal disabledPluginIds array still contains the original settings
		// This ensures the individual settings weren't lost during global disable
		expect(platform.getDisabledPluginIds()).toEqual(['plugin1', 'plugin3']);
	});
});

describe('Custom Response Headers functionality', () => {
	it('should support custom response headers in plugin responses', () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: {
				200: { message: 'success' },
				400: {
					body: { error: 'Bad Request' },
					headers: {
						'Content-Type': 'application/problem+json',
						'X-Custom-Header': 'custom-value',
					},
				},
				404: {
					body: { error: 'Not Found' },
					headers: {
						'Content-Type': 'application/problem+json',
					},
				},
			},
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// Test default response (no headers)
		const defaultResponse = platform.getResponse('test-plugin', 200);
		expect(defaultResponse).toEqual({ body: { message: 'success' }, headers: {} });

		// Test response with headers
		const responseWithHeaders = platform.getResponseWithHeaders('test-plugin', 400);
		expect(responseWithHeaders).toEqual({
			body: { error: 'Bad Request' },
			headers: {
				'Content-Type': 'application/problem+json',
				'X-Custom-Header': 'custom-value',
			},
		});

		// Test that getResponse now returns the full structured response
		const bodyOnly = platform.getResponse('test-plugin', 400);
		expect(bodyOnly).toEqual({
			body: { error: 'Bad Request' },
			headers: { 'Content-Type': 'application/problem+json', 'X-Custom-Header': 'custom-value' },
		});
	});

	it('should support custom headers in query responses', () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'default' } },
			defaultStatus: 200,
			queryResponses: {
				'error=true': {
					400: {
						body: { error: 'Query Error' },
						headers: {
							'Content-Type': 'application/problem+json',
							'X-Error-Type': 'query-error',
						},
					},
				},
			},
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// Test query response with headers
		const mockRequest = { url: 'http://localhost/api/test?error=true' };
		const responseWithHeaders = platform.getResponseWithHeaders('test-plugin', 400, mockRequest);
		expect(responseWithHeaders).toEqual({
			body: { error: 'Query Error' },
			headers: {
				'Content-Type': 'application/problem+json',
				'X-Error-Type': 'query-error',
			},
		});
	});

	it('should support custom headers in endpoint scenarios', () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'default' } },
			defaultStatus: 200,
			scenarios: [
				{
					id: 'error-scenario',
					label: 'Error Scenario',
					responses: {
						500: {
							body: { error: 'Internal Server Error' },
							headers: {
								'Content-Type': 'application/problem+json',
								'X-Error-Scenario': 'internal-error',
							},
						},
					},
				},
			],
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// Set the endpoint scenario
		platform.setEndpointScenario('test-plugin', 'error-scenario');

		// Test scenario response with headers
		const responseWithHeaders = platform.getResponseWithHeaders('test-plugin', 500);
		expect(responseWithHeaders).toEqual({
			body: { error: 'Internal Server Error' },
			headers: {
				'Content-Type': 'application/problem+json',
				'X-Error-Scenario': 'internal-error',
			},
		});
	});

	it('should maintain backward compatibility with simple responses', () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: {
				200: { message: 'simple response' },
				201: { message: 'created' },
			},
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// Test that simple responses still work
		const response = platform.getResponse('test-plugin', 200);
		expect(response).toEqual({ body: { message: 'simple response' }, headers: {} });

		// Test that getResponseWithHeaders returns proper structure for simple responses
		const responseWithHeaders = platform.getResponseWithHeaders('test-plugin', 200);
		expect(responseWithHeaders).toEqual({ body: { message: 'simple response' }, headers: {} });
	});
});

describe('Transform-based status override', () => {
	it('should allow transform to override status at plugin level', () => {
		const plugin: Plugin = {
			id: 'plugin-transform',
			componentId: 'test',
			endpoint: '/api/transform',
			method: 'GET',
			responses: {
				200: { message: 'ok' },
			},
			defaultStatus: 200,
			transform: (response, context) => {
				if (context.featureFlags.FORCE_404) {
					return { body: { error: 'forced' }, status: 404 };
				}
				return response;
			},
		};
		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
			featureFlags: ['FORCE_404'],
		});
		// Default: 200
		let resp = platform.getResponse('plugin-transform', 200);
		expect(resp).toEqual({ body: { message: 'ok' }, headers: {} });
		// With flag: 404
		platform.setFeatureFlag('FORCE_404', true);
		resp = platform.getResponse('plugin-transform', 200);
		expect(resp).toEqual({ body: { error: 'forced' }, headers: {}, status: 404 });
	});

	it('should allow transform to override status in scenario', () => {
		const plugin: Plugin = {
			id: 'plugin-scenario',
			componentId: 'test',
			endpoint: '/api/scenario',
			method: 'GET',
			responses: { 200: { message: 'ok' } },
			defaultStatus: 200,
			scenarios: [
				{
					id: 'force-500',
					label: 'Force 500',
					responses: {
						200: { body: { error: 'fail' }, status: 500 },
					},
				},
			],
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		platform.setEndpointScenario('plugin-scenario', 'force-500');
		const resp = platform.getResponse('plugin-scenario', 200);
		expect(resp).toEqual({ body: { error: 'fail' }, headers: {}, status: 500 });
	});

	it('should allow transform to override status in query response', () => {
		const plugin: Plugin = {
			id: 'plugin-query',
			componentId: 'test',
			endpoint: '/api/query',
			method: 'GET',
			responses: { 200: { message: 'ok' } },
			defaultStatus: 200,
			queryResponses: {
				'force=401': {
					200: { body: { error: 'unauthorized' }, status: 401 },
				},
			},
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		const req = { url: 'http://localhost/api/query?force=401' };
		const resp = platform.getResponse('plugin-query', 200, req);
		expect(resp).toEqual({ body: { error: 'unauthorized' }, headers: {}, status: 401 });
	});

	it('should allow transform to set both headers and status', () => {
		const plugin: Plugin = {
			id: 'plugin-both',
			componentId: 'test',
			endpoint: '/api/both',
			method: 'GET',
			responses: { 200: { message: 'ok' } },
			defaultStatus: 200,
			transform: () => {
				return { body: { error: 'fail' }, headers: { 'X-Test': 'yes' }, status: 418 };
			},
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		const resp = platform.getResponse('plugin-both', 200);
		expect(resp).toEqual({ body: { error: 'fail' }, headers: { 'X-Test': 'yes' }, status: 418 });
	});

	it('should maintain backward compatibility for transform returning only body', () => {
		const plugin: Plugin = {
			id: 'plugin-backcompat',
			componentId: 'test',
			endpoint: '/api/backcompat',
			method: 'GET',
			responses: { 200: { message: 'ok' } },
			defaultStatus: 200,
			transform: () => {
				return { message: 'transformed' };
			},
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		const resp = platform.getResponse('plugin-backcompat', 200);
		expect(resp).toEqual({ body: { message: 'transformed' }, headers: {} });
	});
});

describe('Comprehensive Transform Method Tests', () => {
	describe('Transform Context Completeness', () => {
		it('should provide complete context to transform method', () => {
			let receivedContext: any = null;
			const plugin: Plugin = {
				id: 'context-test',
				componentId: 'test',
				endpoint: '/api/context',
				method: 'GET',
				responses: { 200: { original: true } },
				defaultStatus: 200,
				scenarios: [
					{
						id: 'test-scenario',
						label: 'Test Scenario',
						responses: { 200: { scenario: true }, 201: { scenario: true, created: true } },
					},
				],
				transform: (response, context) => {
					receivedContext = { ...context };
					return response;
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['TEST_FLAG', 'ANOTHER_FLAG'],
			});

			// Set up context
			platform.setFeatureFlag('TEST_FLAG', true);
			platform.setFeatureFlag('ANOTHER_FLAG', false);
			platform.setEndpointScenario('context-test', 'test-scenario');
			platform.setStatusOverride('context-test', 201);

			const request = { url: 'http://localhost/api/context' };
			platform.getResponse('context-test', undefined, request);

			// Verify all context properties are present
			expect(receivedContext).toBeTruthy();
			expect(receivedContext.plugin).toBe(plugin);
			expect(receivedContext.request).toBe(request);
			expect(receivedContext.response).toEqual({ scenario: true, created: true });
			expect(receivedContext.featureFlags).toEqual({ TEST_FLAG: true, ANOTHER_FLAG: false });
			expect(receivedContext.currentStatus).toBe(201); // Status override
			expect(receivedContext.endpointScenario).toBe('test-scenario');
			expect(receivedContext.settings).toBeDefined();
		});
	});

	describe('Status Code Override', () => {
		it('should allow transform to override status from 200 to 404', () => {
			const plugin: Plugin = {
				id: 'status-404',
				componentId: 'test',
				endpoint: '/api/status',
				method: 'GET',
				responses: { 200: { message: 'success' } },
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.featureFlags.FORCE_NOT_FOUND) {
						return { body: { error: 'Not Found' }, status: 404 };
					}
					return response;
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['FORCE_NOT_FOUND'],
			});

			platform.setFeatureFlag('FORCE_NOT_FOUND', true);
			const resp = platform.getResponse('status-404', 200);

			expect(resp).toEqual({
				body: { error: 'Not Found' },
				headers: {},
				status: 404,
			});
		});

		it('should allow transform to override status from 200 to 500', () => {
			const plugin: Plugin = {
				id: 'status-500',
				componentId: 'test',
				endpoint: '/api/error',
				method: 'POST',
				responses: { 200: { id: 123, created: true } },
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.currentStatus === 200 && context.featureFlags.SIMULATE_ERROR) {
						return {
							body: { error: 'Internal Server Error', code: 'DB_CONNECTION_FAILED' },
							status: 500,
						};
					}
					return response;
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['SIMULATE_ERROR'],
			});

			platform.setFeatureFlag('SIMULATE_ERROR', true);
			const resp = platform.getResponse('status-500', 200);

			expect(resp).toEqual({
				body: { error: 'Internal Server Error', code: 'DB_CONNECTION_FAILED' },
				headers: {},
				status: 500,
			});
		});

		it('should allow transform to conditionally override status based on scenario', () => {
			const plugin: Plugin = {
				id: 'scenario-status',
				componentId: 'test',
				endpoint: '/api/scenario',
				method: 'GET',
				responses: { 200: { data: 'normal' } },
				defaultStatus: 200,
				scenarios: [
					{
						id: 'auth-failure',
						label: 'Authentication Failure',
						responses: { 200: { data: 'scenario-data' } },
					},
				],
				transform: (response, context) => {
					if (context.endpointScenario === 'auth-failure') {
						return { body: { error: 'Unauthorized' }, status: 401 };
					}
					return response;
				},
			};
			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });

			// Normal case
			let resp = platform.getResponse('scenario-status', 200);
			expect(resp).toEqual({ body: { data: 'normal' }, headers: {} });

			// Scenario case
			platform.setEndpointScenario('scenario-status', 'auth-failure');
			resp = platform.getResponse('scenario-status', 200);
			expect(resp).toEqual({
				body: { error: 'Unauthorized' },
				headers: {},
				status: 401,
			});
		});
	});

	describe('Header Manipulation', () => {
		it('should allow transform to add custom headers', () => {
			const plugin: Plugin = {
				id: 'add-headers',
				componentId: 'test',
				endpoint: '/api/headers',
				method: 'GET',
				responses: { 200: { data: 'test' } },
				defaultStatus: 200,
				transform: (response, context) => {
					return {
						body: response,
						headers: {
							'X-Custom-Header': 'custom-value',
							'X-Request-ID': '12345',
							'X-Feature-Flag': context.featureFlags.DEBUG ? 'enabled' : 'disabled',
						},
					};
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['DEBUG'],
			});

			platform.setFeatureFlag('DEBUG', true);
			const resp = platform.getResponse('add-headers', 200);

			expect(resp).toEqual({
				body: { data: 'test' },
				headers: {
					'X-Custom-Header': 'custom-value',
					'X-Request-ID': '12345',
					'X-Feature-Flag': 'enabled',
				},
			});
		});

		it('should allow transform to modify existing headers', () => {
			const plugin: Plugin = {
				id: 'modify-headers',
				componentId: 'test',
				endpoint: '/api/modify',
				method: 'GET',
				responses: {
					200: {
						body: { data: 'test' },
						headers: { 'Content-Type': 'application/json', 'X-Original': 'value' },
					},
				},
				defaultStatus: 200,
				transform: (response, context) => {
					const existingHeaders = response.headers || {};
					return {
						body: response.body || response,
						headers: {
							...existingHeaders,
							'Content-Type': 'application/json; charset=utf-8', // Modify existing
							'X-Modified': new Date().toISOString(), // Add new
							'X-Context': `scenario=${context.endpointScenario || 'none'}`,
						},
					};
				},
			};
			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });

			const resp = platform.getResponse('modify-headers', 200);

			expect(resp?.body).toEqual({ data: 'test' });
			expect(resp?.headers['Content-Type']).toBe('application/json; charset=utf-8');
			expect(resp?.headers['X-Original']).toBe('value');
			expect(resp?.headers['X-Modified']).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO date format
			expect(resp?.headers['X-Context']).toBe('scenario=none');
		});

		it('should allow transform to remove headers by setting them to undefined', () => {
			const plugin: Plugin = {
				id: 'remove-headers',
				componentId: 'test',
				endpoint: '/api/remove',
				method: 'GET',
				responses: {
					200: {
						body: { data: 'test' },
						headers: {
							'Content-Type': 'application/json',
							'X-Remove-Me': 'should-be-removed',
							'X-Keep-Me': 'should-stay',
						},
					},
				},
				defaultStatus: 200,
				transform: (response, context) => {
					const headers = { ...response.headers };
					if (context.featureFlags.REMOVE_HEADERS) {
						delete headers['X-Remove-Me'];
					}
					return {
						body: response.body,
						headers,
					};
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['REMOVE_HEADERS'],
			});

			platform.setFeatureFlag('REMOVE_HEADERS', true);
			const resp = platform.getResponse('remove-headers', 200);

			expect(resp?.headers).toEqual({
				'Content-Type': 'application/json',
				'X-Keep-Me': 'should-stay',
			});
			expect(resp?.headers['X-Remove-Me']).toBeUndefined();
		});
	});

	describe('Response Body Override', () => {
		it('should allow transform to replace JSON response completely', () => {
			const plugin: Plugin = {
				id: 'replace-json',
				componentId: 'test',
				endpoint: '/api/json',
				method: 'GET',
				responses: { 200: { original: 'data', count: 5 } },
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.featureFlags.USE_NEW_FORMAT) {
						return {
							body: {
								data: {
									items: ['item1', 'item2', 'item3'],
									meta: { version: 2, timestamp: '2023-01-01' },
								},
								status: 'success',
							},
						};
					}
					return response;
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['USE_NEW_FORMAT'],
			});

			platform.setFeatureFlag('USE_NEW_FORMAT', true);
			const resp = platform.getResponse('replace-json', 200);

			expect(resp?.body).toEqual({
				data: {
					items: ['item1', 'item2', 'item3'],
					meta: { version: 2, timestamp: '2023-01-01' },
				},
				status: 'success',
			});
		});

		it('should allow transform to replace with HTML content', () => {
			const plugin: Plugin = {
				id: 'replace-html',
				componentId: 'test',
				endpoint: '/api/html',
				method: 'GET',
				responses: { 200: { message: 'json' } },
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.featureFlags.RETURN_HTML) {
						return {
							body: '<html><body><h1>Dynamic HTML</h1><p>Generated by transform</p></body></html>',
							headers: { 'Content-Type': 'text/html' },
						};
					}
					return response;
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['RETURN_HTML'],
			});

			platform.setFeatureFlag('RETURN_HTML', true);
			const resp = platform.getResponse('replace-html', 200);

			expect(resp?.body).toBe('<html><body><h1>Dynamic HTML</h1><p>Generated by transform</p></body></html>');
			expect(resp?.headers['Content-Type']).toBe('text/html');
		});

		it('should allow transform to replace with XML content', () => {
			const plugin: Plugin = {
				id: 'replace-xml',
				componentId: 'test',
				endpoint: '/api/xml',
				method: 'GET',
				responses: { 200: { type: 'json' } },
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.featureFlags.RETURN_XML) {
						return {
							body: '<?xml version="1.0"?><response><status>success</status><data>transformed</data></response>',
							headers: { 'Content-Type': 'application/xml' },
						};
					}
					return response;
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['RETURN_XML'],
			});

			platform.setFeatureFlag('RETURN_XML', true);
			const resp = platform.getResponse('replace-xml', 200);

			expect(resp?.body).toBe('<?xml version="1.0"?><response><status>success</status><data>transformed</data></response>');
			expect(resp?.headers['Content-Type']).toBe('application/xml');
		});

		it('should allow transform to replace with binary-like content', () => {
			const plugin: Plugin = {
				id: 'replace-binary',
				componentId: 'test',
				endpoint: '/api/binary',
				method: 'GET',
				responses: { 200: { file: 'none' } },
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.featureFlags.RETURN_BINARY) {
						// Simulate binary data as base64 string (using btoa for browser compatibility)
						const binaryData = btoa('This is simulated binary content');
						return {
							body: binaryData,
							headers: {
								'Content-Type': 'application/octet-stream',
								'Content-Encoding': 'base64',
							},
						};
					}
					return response;
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['RETURN_BINARY'],
			});

			platform.setFeatureFlag('RETURN_BINARY', true);
			const resp = platform.getResponse('replace-binary', 200);

			expect(resp?.body).toBe('VGhpcyBpcyBzaW11bGF0ZWQgYmluYXJ5IGNvbnRlbnQ=');
			expect(resp?.headers['Content-Type']).toBe('application/octet-stream');
			expect(resp?.headers['Content-Encoding']).toBe('base64');
		});
	});

	describe('Complex Transform Scenarios', () => {
		it('should allow transform to override status, headers, and body simultaneously', () => {
			const plugin: Plugin = {
				id: 'complex-transform',
				componentId: 'test',
				endpoint: '/api/complex',
				method: 'POST',
				responses: { 200: { created: true, id: 1 } },
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.featureFlags.VALIDATION_ERROR) {
						return {
							body: {
								error: 'Validation failed',
								details: ['Field "name" is required', 'Field "email" must be valid'],
								code: 'VALIDATION_ERROR',
							},
							headers: {
								'Content-Type': 'application/problem+json',
								'X-Error-Code': 'VALIDATION_ERROR',
								'X-Request-ID': '12345',
							},
							status: 422,
						};
					}
					return response;
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['VALIDATION_ERROR'],
			});

			platform.setFeatureFlag('VALIDATION_ERROR', true);
			const resp = platform.getResponse('complex-transform', 200);

			expect(resp).toEqual({
				body: {
					error: 'Validation failed',
					details: ['Field "name" is required', 'Field "email" must be valid'],
					code: 'VALIDATION_ERROR',
				},
				headers: {
					'Content-Type': 'application/problem+json',
					'X-Error-Code': 'VALIDATION_ERROR',
					'X-Request-ID': '12345',
				},
				status: 422,
			});
		});

		it('should allow conditional transformations based on multiple context factors', () => {
			const plugin: Plugin = {
				id: 'conditional-transform',
				componentId: 'test',
				endpoint: '/api/conditional',
				method: 'GET',
				responses: { 200: { data: 'default' }, 500: { error: 'server error' } },
				defaultStatus: 200,
				scenarios: [
					{
						id: 'premium-user',
						label: 'Premium User',
						responses: { 200: { data: 'premium' } },
					},
				],
				transform: (response, context) => {
					// Complex logic based on multiple factors
					const isPremiumScenario = context.endpointScenario === 'premium-user';
					const isDebugMode = context.featureFlags.DEBUG;
					const isErrorStatus = context.currentStatus >= 400;

					if (isPremiumScenario && isDebugMode) {
						return {
							body: {
								...response,
								debug: {
									scenario: context.endpointScenario,
									flags: context.featureFlags,
									status: context.currentStatus,
								},
							},
							headers: { 'X-Debug': 'enabled' },
						};
					}

					if (isErrorStatus && context.featureFlags.FRIENDLY_ERRORS) {
						return {
							body: { message: 'Something went wrong. Please try again.' },
							headers: { 'X-Friendly-Error': 'true' },
							status: context.currentStatus,
						};
					}

					return response;
				},
			};
			const platform = createMockPlatform({
				name: 'test',
				plugins: [plugin],
				featureFlags: ['DEBUG', 'FRIENDLY_ERRORS'],
			});

			// Test premium + debug scenario
			platform.setFeatureFlag('DEBUG', true);
			platform.setEndpointScenario('conditional-transform', 'premium-user');
			let resp = platform.getResponse('conditional-transform', 200);

			expect(resp?.body.data).toBe('premium');
			expect(resp?.body.debug).toBeDefined();
			expect(resp?.body.debug.scenario).toBe('premium-user');
			expect(resp?.headers['X-Debug']).toBe('enabled');

			// Test friendly error scenario
			platform.setEndpointScenario('conditional-transform', undefined as any);
			platform.setFeatureFlag('FRIENDLY_ERRORS', true);
			resp = platform.getResponse('conditional-transform', 500);

			expect(resp?.body.message).toBe('Something went wrong. Please try again.');
			expect(resp?.headers['X-Friendly-Error']).toBe('true');
			expect(resp?.status).toBe(500);
		});
	});
});
