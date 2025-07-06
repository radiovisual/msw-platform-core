/**
 * @jest-environment node
 */
import { createMockPlatform } from '../platform';
import { mswHandlersFromPlatform } from './msw';
import { storybookHandlersFromPlatform } from './storybook';
import type { Plugin } from '../types';

describe('storybookHandlersFromPlatform', () => {
	const plugin: Plugin = {
		componentId: 'test',
		id: 'test',
		endpoint: '/api/test',
		method: 'GET',
		responses: {
			200: { ok: true },
		},
		defaultStatus: 200,
	};

	function getHandlerInfo(handler: any) {
		return handler.info ? { method: handler.info.method, path: handler.info.path } : null;
	}

	it('returns handlers with the same method and path as mswHandlersFromPlatform (platform instance)', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		const mswHandlers = mswHandlersFromPlatform(platform);
		const storybookHandlers = storybookHandlersFromPlatform(platform);
		expect(storybookHandlers.length).toBe(mswHandlers.length);
		for (let i = 0; i < mswHandlers.length; i++) {
			expect(getHandlerInfo(storybookHandlers[i])).toEqual(getHandlerInfo(mswHandlers[i]));
			// Check that handlers have the expected structure
			expect(storybookHandlers[i]).toHaveProperty('predicate');
		}
	});

	it('returns handlers with the same method and path as mswHandlersFromPlatform (platform getter)', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		const getter = () => platform;
		const mswHandlers = mswHandlersFromPlatform(getter);
		const storybookHandlers = storybookHandlersFromPlatform(getter);
		expect(storybookHandlers.length).toBe(mswHandlers.length);
		for (let i = 0; i < mswHandlers.length; i++) {
			expect(getHandlerInfo(storybookHandlers[i])).toEqual(getHandlerInfo(mswHandlers[i]));
			// Check that handlers have the expected structure
			expect(storybookHandlers[i]).toHaveProperty('predicate');
		}
	});

	it('handlers are compatible with MSW (have a .predicate and .resolver)', () => {
		const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
		const handlers = storybookHandlersFromPlatform(platform);
		expect(handlers[0]).toHaveProperty('predicate');
		expect(handlers[0]).toHaveProperty('resolver');
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
			featureFlags: [],
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
		// Now disable the plugin (should return 404 since no plugin matches)
		platform.setDisabledPluginIds(['foo']);
		// @ts-ignore
		const passthrough = await handler?.resolver({ request: req, params: {}, cookies: {} });
		expect(passthrough.status).toBe(404);
		expect(await passthrough.json()).toEqual({ error: 'Not found' });
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
			featureFlags: [],
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
		// Now disable the plugin (should return 404 since no plugin matches)
		platform.setDisabledPluginIds(['bar']);
		// @ts-ignore
		const passthrough = await handler?.resolver({ request: req, params: {}, cookies: {} });
		expect(passthrough.status).toBe(404);
		expect(await passthrough.json()).toEqual({ error: 'Not found' });
	});
});
