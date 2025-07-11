/**
 * @jest-environment node
 */
import { mswHandlersFromPlatform } from './msw';
import { createMockPlatform } from '../platform';
import type { Plugin } from '../types';
import { setupServer } from 'msw/node';
import { HTTP_METHOD } from '../constants';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => {
	server.resetHandlers();
});
afterAll(() => server.close());

describe('MSW Adapter', () => {
	it('should create handlers for plugins', () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		const handlers = mswHandlersFromPlatform(platform);
		expect(handlers).toHaveLength(2); // Relative and absolute URLs
	});

	it('should handle basic GET requests', async () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		const handlers = mswHandlersFromPlatform(platform);
		const response = await handlers[0].resolver({
			url: 'http://localhost/api/test',
			method: 'GET',
		} as any);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: 'test' });
	});

	it('should apply delay when configured', async () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
			delay: 100,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		const handlers = mswHandlersFromPlatform(platform);
		const startTime = Date.now();
		const response = await handlers[0].resolver({
			url: 'http://localhost/api/test',
			method: 'GET',
		} as any);
		const endTime = Date.now();

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: 'test' });
		expect(endTime - startTime).toBeGreaterThanOrEqual(100);
	});

	it('should handle query parameter matching', async () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'default' } },
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: { message: 'admin response' } },
				'type=*': { 200: { message: 'wildcard response' } },
			},
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		const handlers = mswHandlersFromPlatform(platform);

		// Test exact match
		const exactResponse = await handlers[0].resolver({
			url: 'http://localhost/api/test?type=admin',
			method: 'GET',
		} as any);
		expect(await exactResponse.json()).toEqual({ message: 'admin response' });

		// Test wildcard match
		const wildcardResponse = await handlers[0].resolver({
			url: 'http://localhost/api/test?type=user',
			method: 'GET',
		} as any);
		expect(await wildcardResponse.json()).toEqual({ message: 'wildcard response' });
	});

	it('should handle multiple plugins for the same endpoint', async () => {
		const plugin1: Plugin = {
			id: 'plugin-1',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'plugin 1' } },
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: { message: 'admin from plugin 1' } },
			},
		};

		const plugin2: Plugin = {
			id: 'plugin-2',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'plugin 2' } },
			defaultStatus: 200,
			queryResponses: {
				'type=user': { 200: { message: 'user from plugin 2' } },
			},
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin1, plugin2],
		});

		const handlers = mswHandlersFromPlatform(platform);

		// Test admin query (should match plugin 1)
		const adminResponse = await handlers[0].resolver({
			url: 'http://localhost/api/test?type=admin',
			method: 'GET',
		} as any);
		expect(await adminResponse.json()).toEqual({ message: 'admin from plugin 1' });

		// Test user query (should match plugin 2)
		const userResponse = await handlers[0].resolver({
			url: 'http://localhost/api/test?type=user',
			method: 'GET',
		} as any);
		expect(await userResponse.json()).toEqual({ message: 'user from plugin 2' });
	});
});

describe('MSW Adapter Passthrough', () => {
	it('should return passthrough when all plugins for an endpoint are disabled', async () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// Disable the plugin
		platform.setDisabledPluginIds(['test-plugin']);

		const handlers = mswHandlersFromPlatform(platform);
		const handler = handlers.find((h: any) => h.info?.path === '/api/test');
		expect(handler).toBeDefined();

		// Simulate a request
		const req = new Request('http://localhost/api/test', { method: 'GET' });
		const result = await handler?.resolver({ request: req, params: {}, cookies: {} } as any);

		// The result should indicate passthrough
		expect(result.status).toBe(302);
		expect(result.headers.get('x-msw-intention')).toBe('passthrough');
		expect(result.statusText).toBe('Passthrough');
	});

	it('should return passthrough when some plugins for an endpoint are disabled and no enabled plugins match', async () => {
		const plugin1: Plugin = {
			id: 'plugin-1',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'plugin 1' } },
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: { message: 'admin response' } },
			},
		};

		const plugin2: Plugin = {
			id: 'plugin-2',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'plugin 2' } },
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin1, plugin2],
		});

		// Disable plugin 2
		platform.setDisabledPluginIds(['plugin-2']);

		const handlers = mswHandlersFromPlatform(platform);
		const handler = handlers.find((h: any) => h.info?.path === '/api/test');
		expect(handler).toBeDefined();

		// Request that doesn't match any enabled plugin (no query params)
		const req = new Request('http://localhost/api/test', { method: 'GET' });
		const result = await handler?.resolver({ request: req, params: {}, cookies: {} } as any);

		// Should return passthrough because plugin 2 is disabled and plugin 1 doesn't match
		expect(result.status).toBe(302);
		expect(result.headers.get('x-msw-intention')).toBe('passthrough');
		expect(result.statusText).toBe('Passthrough');
	});

	it('should NOT return passthrough when enabled plugins match the request', async () => {
		const plugin1: Plugin = {
			id: 'plugin-1',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'plugin 1' } },
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: { message: 'admin response' } },
			},
		};

		const plugin2: Plugin = {
			id: 'plugin-2',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'plugin 2' } },
			defaultStatus: 200,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin1, plugin2],
		});

		// Disable plugin 2
		platform.setDisabledPluginIds(['plugin-2']);

		const handlers = mswHandlersFromPlatform(platform);
		const handler = handlers.find((h: any) => h.info?.path === '/api/test');
		expect(handler).toBeDefined();

		// Request that matches an enabled plugin (admin query)
		const req = new Request('http://localhost/api/test?type=admin', { method: 'GET' });
		const result = await handler?.resolver({ request: req, params: {}, cookies: {} } as any);

		// Should return the mock response, not passthrough
		expect(result.status).toBe(200);
		expect(await result.json()).toEqual({ message: 'admin response' });
	});

	it('should return default response when no plugins are disabled and no query params match', async () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: { message: 'admin response' } },
			},
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// No plugins disabled
		platform.setDisabledPluginIds([]);

		const handlers = mswHandlersFromPlatform(platform);
		const handler = handlers.find((h: any) => h.info?.path === '/api/test');
		expect(handler).toBeDefined();

		// Request that doesn't match any query response (no query params)
		const req = new Request('http://localhost/api/test', { method: 'GET' });
		const result = await handler?.resolver({ request: req, params: {}, cookies: {} } as any);

		// Should return default response, not 404
		expect(result.status).toBe(200);
		expect(await result.json()).toEqual({ message: 'test' });
	});

	it("should return default response when no plugins are disabled and query params don't match", async () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: { message: 'admin response' } },
			},
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// No plugins disabled
		platform.setDisabledPluginIds([]);

		const handlers = mswHandlersFromPlatform(platform);
		const handler = handlers.find((h: any) => h.info?.path === '/api/test');
		expect(handler).toBeDefined();

		// Request with query params that don't match
		const req = new Request('http://localhost/api/test?type=user', { method: 'GET' });
		const result = await handler?.resolver({ request: req, params: {}, cookies: {} } as any);

		// Should return default response, not 404
		expect(result.status).toBe(200);
		expect(await result.json()).toEqual({ message: 'test' });
	});
});

describe('mswHandlersFromPlatform passthrough', () => {
	it('returns undefined (passthrough) when plugin is disabled, and mock when enabled', async () => {
		const platform = createMockPlatform({
			name: 'test',
			plugins: [
				{
					id: 'foo',
					componentId: 'A',
					endpoint: '/api/foo',
					method: 'GET',
					responses: { 200: { ok: true } },
					defaultStatus: 200,
				},
			],
		});
		// Initially enabled (mocked)
		platform.setDisabledPluginIds([]);
		const handlers = mswHandlersFromPlatform(platform);
		const handler = handlers.find((h: any) => h.info?.path === '/api/foo');
		expect(handler).toBeDefined();
		// Simulate a request
		const req = new Request('http://localhost/api/foo', { method: 'GET' });
		// @ts-ignore
		const res = await handler?.resolver({ request: req, params: {}, cookies: {} });
		// Check if response is a Response object with status
		if (res && 'status' in res) {
			expect(res.status).toBe(200);
		}

		// Now disable the plugin (should return passthrough)
		platform.setDisabledPluginIds(['foo']);
		// @ts-ignore
		const passthrough = await handler?.resolver({ request: req, params: {}, cookies: {} });
		expect(passthrough.status).toBe(302);
		expect(passthrough.headers.get('x-msw-intention')).toBe('passthrough');
		expect(passthrough.statusText).toBe('Passthrough');
	});
});

describe('mswHandlersFromPlatform passthrough (absolute URL)', () => {
	it('returns undefined (passthrough) when absolute URL plugin is disabled, and mock when enabled', async () => {
		const platform = createMockPlatform({
			name: 'test',
			plugins: [
				{
					id: 'bar',
					componentId: 'B',
					endpoint: 'https://jsonplaceholder.typicode.com/users/1',
					method: 'GET',
					responses: { 200: { name: 'Mocked User', email: 'mock@example.com' } },
					defaultStatus: 200,
				},
			],
		});
		// Initially enabled (mocked)
		platform.setDisabledPluginIds([]);
		const handlers = mswHandlersFromPlatform(platform);
		const handler = handlers.find((h: any) => h.info?.path === 'https://jsonplaceholder.typicode.com/users/1');
		expect(handler).toBeDefined();
		// Simulate a request
		const req = new Request('https://jsonplaceholder.typicode.com/users/1', { method: 'GET' });
		// @ts-ignore
		const res = await handler?.resolver({ request: req, params: {}, cookies: {} });
		// Check if response is a Response object with status
		if (res && 'status' in res) {
			expect(res.status).toBe(200);
		}

		// Now disable the plugin (should return passthrough)
		platform.setDisabledPluginIds(['bar']);
		// @ts-ignore
		const passthrough = await handler?.resolver({ request: req, params: {}, cookies: {} });
		expect(passthrough.status).toBe(302);
		expect(passthrough.headers.get('x-msw-intention')).toBe('passthrough');
		expect(passthrough.statusText).toBe('Passthrough');
	});
});

describe('Custom response types', () => {
	it('returns JSON response with correct content-type', async () => {
		const plugin: Plugin = {
			id: 'json',
			componentId: 'test',
			endpoint: '/api/json',
			method: HTTP_METHOD.GET,
			responses: {
				200: {
					body: { message: 'Hello, JSON!' },
					headers: { 'Content-Type': 'application/json' },
				},
			},
			defaultStatus: 200,
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		server.use(...mswHandlersFromPlatform(platform));
		const res = await fetch('http://localhost/api/json');
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toContain('application/json');
		const json = await res.json();
		expect(json).toEqual({ message: 'Hello, JSON!' });
	});

	it('returns HTML response with correct content-type', async () => {
		const plugin: Plugin = {
			id: 'html',
			componentId: 'test',
			endpoint: '/api/html',
			method: HTTP_METHOD.GET,
			responses: {
				200: {
					body: '<h1>Hello, HTML!</h1>',
					headers: { 'Content-Type': 'text/html' },
				},
			},
			defaultStatus: 200,
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		server.use(...mswHandlersFromPlatform(platform));
		const res = await fetch('http://localhost/api/html');
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toContain('text/html');
		const text = await res.text();
		expect(text).toBe('<h1>Hello, HTML!</h1>');
	});

	it('returns plain text response with correct content-type', async () => {
		const plugin: Plugin = {
			id: 'text',
			componentId: 'test',
			endpoint: '/api/text',
			method: HTTP_METHOD.GET,
			responses: {
				200: {
					body: 'Hello, plain text!',
					headers: { 'Content-Type': 'text/plain' },
				},
			},
			defaultStatus: 200,
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		server.use(...mswHandlersFromPlatform(platform));
		const res = await fetch('http://localhost/api/text');
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toContain('text/plain');
		const text = await res.text();
		expect(text).toBe('Hello, plain text!');
	});

	it('returns XML response with correct content-type', async () => {
		const plugin: Plugin = {
			id: 'xml',
			componentId: 'test',
			endpoint: '/api/xml',
			method: HTTP_METHOD.GET,
			responses: {
				200: {
					body: '<note><to>User</to><message>Hello XML</message></note>',
					headers: { 'Content-Type': 'application/xml' },
				},
			},
			defaultStatus: 200,
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		server.use(...mswHandlersFromPlatform(platform));
		const res = await fetch('http://localhost/api/xml');
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toContain('application/xml');
		const text = await res.text();
		expect(text).toBe('<note><to>User</to><message>Hello XML</message></note>');
	});

	it('returns binary response with correct content-type', async () => {
		const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
		const plugin: Plugin = {
			id: 'bin',
			componentId: 'test',
			endpoint: '/api/bin',
			method: HTTP_METHOD.GET,
			responses: {
				200: {
					body: buffer,
					headers: { 'Content-Type': 'application/octet-stream' },
				},
			},
			defaultStatus: 200,
		};
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		server.use(...mswHandlersFromPlatform(platform));
		const res = await fetch('http://localhost/api/bin');
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toContain('application/octet-stream');
		const arrBuf = await res.arrayBuffer();
		expect(new Uint8Array(arrBuf)).toEqual(new Uint8Array([1, 2, 3, 4]));
	});
});
