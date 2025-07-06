import { mswHandlersFromPlatform } from './msw';
import { createMockPlatform } from '../platform';
import type { Plugin } from '../types';

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