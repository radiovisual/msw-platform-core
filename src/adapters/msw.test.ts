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
afterAll(() => server.close());
beforeEach(() => server.resetHandlers());

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

	it('should apply delay override when set', async () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
			delay: 50,
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		// Set delay override
		platform.setDelayOverride('test-plugin', 200);

		const handlers = mswHandlersFromPlatform(platform);
		const startTime = Date.now();
		const response = await handlers[0].resolver({
			url: 'http://localhost/api/test',
			method: 'GET',
		} as any);
		const endTime = Date.now();

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ message: 'test' });
		expect(endTime - startTime).toBeGreaterThanOrEqual(200);
	});

	it('should not apply delay when delay is 0', async () => {
		const plugin: Plugin = {
			id: 'test-plugin',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET',
			responses: { 200: { message: 'test' } },
			defaultStatus: 200,
			delay: 0,
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
		expect(endTime - startTime).toBeLessThan(50); // Should be very fast
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
				'type=admin': { 200: { message: 'admin' } },
				'type=user': { 200: { message: 'user' } },
			},
		};

		const platform = createMockPlatform({
			name: 'test',
			plugins: [plugin],
		});

		const handlers = mswHandlersFromPlatform(platform);

		// Test admin query
		const adminResponse = await handlers[0].resolver({
			url: 'http://localhost/api/test?type=admin',
			method: 'GET',
		} as any);
		expect(await adminResponse.json()).toEqual({ message: 'admin' });

		// Test user query
		const userResponse = await handlers[0].resolver({
			url: 'http://localhost/api/test?type=user',
			method: 'GET',
		} as any);
		expect(await userResponse.json()).toEqual({ message: 'user' });

		// Test no query (should use default)
		const defaultResponse = await handlers[0].resolver({
			url: 'http://localhost/api/test',
			method: 'GET',
		} as any);
		expect(await defaultResponse.json()).toEqual({ message: 'default' });
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
