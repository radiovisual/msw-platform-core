/**
 * @jest-environment node
 */

import { setupServer } from 'msw/node';
import { createMockPlatform } from './platform';
import { mswHandlersFromPlatform } from './adapters/msw';
import type { Plugin } from './types';

describe('503 Service Unavailable Feature', () => {
	let server: ReturnType<typeof setupServer>;

	beforeAll(() => {
		server = setupServer();
		server.listen();
	});

	afterEach(() => {
		server.resetHandlers();
	});

	afterAll(() => {
		server.close();
	});

	describe('Default 503 Service Unavailable', () => {
		it('should return default 503 response when no custom 503 is defined', async () => {
			const plugin: Plugin = {
				id: 'test-plugin',
				componentId: 'test',
				endpoint: '/api/test',
				method: 'GET',
				responses: {
					200: { message: 'success' },
					404: { error: 'not found' },
				},
				defaultStatus: 200,
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Override status to 503
			platform.setStatusOverride('test-plugin', 503);

			const res = await fetch('http://localhost/api/test');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ error: 'Service Unavailable' });
		});

		it('should return default 503 response for plugins with only 200 status', async () => {
			const plugin: Plugin = {
				id: 'simple-plugin',
				componentId: 'test',
				endpoint: '/api/simple',
				method: 'GET',
				responses: {
					200: { data: 'simple response' },
				},
				defaultStatus: 200,
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Override status to 503
			platform.setStatusOverride('simple-plugin', 503);

			const res = await fetch('http://localhost/api/simple');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ error: 'Service Unavailable' });
		});

		it('should return default 503 response with appropriate headers', async () => {
			const plugin: Plugin = {
				id: 'headers-plugin',
				componentId: 'test',
				endpoint: '/api/headers',
				method: 'GET',
				responses: {
					200: { message: 'success' },
				},
				defaultStatus: 200,
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Override status to 503
			platform.setStatusOverride('headers-plugin', 503);

			const res = await fetch('http://localhost/api/headers');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ error: 'Service Unavailable' });
			expect(res.headers.get('content-type')).toContain('application/json');
		});
	});

	describe('Custom 503 Service Unavailable', () => {
		it('should return custom 503 response when defined in plugin', async () => {
			const plugin: Plugin = {
				id: 'custom-503-plugin',
				componentId: 'test',
				endpoint: '/api/custom503',
				method: 'GET',
				responses: {
					200: { message: 'success' },
					503: { 
						error: 'Custom Service Unavailable',
						maintenance: true,
						retryAfter: 300
					},
				},
				defaultStatus: 200,
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Override status to 503
			platform.setStatusOverride('custom-503-plugin', 503);

			const res = await fetch('http://localhost/api/custom503');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ 
				error: 'Custom Service Unavailable',
				maintenance: true,
				retryAfter: 300
			});
		});

		it('should return custom 503 response with custom headers', async () => {
			const plugin: Plugin = {
				id: 'custom-503-headers-plugin',
				componentId: 'test',
				endpoint: '/api/custom503headers',
				method: 'GET',
				responses: {
					200: { message: 'success' },
					503: { 
						body: { error: 'Maintenance Mode', estimatedDowntime: '2 hours' },
						headers: {
							'Retry-After': '7200',
							'X-Maintenance': 'true',
							'Content-Type': 'application/json'
						}
					},
				},
				defaultStatus: 200,
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Override status to 503
			platform.setStatusOverride('custom-503-headers-plugin', 503);

			const res = await fetch('http://localhost/api/custom503headers');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ 
				error: 'Maintenance Mode',
				estimatedDowntime: '2 hours'
			});
			expect(res.headers.get('retry-after')).toBe('7200');
			expect(res.headers.get('x-maintenance')).toBe('true');
		});
	});

	describe('503 Service Unavailable with Scenarios', () => {
		it('should return default 503 when scenario has no custom 503', async () => {
			const plugin: Plugin = {
				id: 'scenario-plugin',
				componentId: 'test',
				endpoint: '/api/scenario',
				method: 'GET',
				responses: {
					200: { message: 'default response' },
				},
				defaultStatus: 200,
				scenarios: [
					{
						id: 'test-scenario',
						label: 'Test Scenario',
						responses: {
							200: { message: 'scenario response' },
							404: { error: 'scenario not found' },
						},
					},
				],
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Set scenario and override status to 503
			platform.setEndpointScenario('scenario-plugin', 'test-scenario');
			platform.setStatusOverride('scenario-plugin', 503);

			const res = await fetch('http://localhost/api/scenario');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ error: 'Service Unavailable' });
		});

		it('should return custom 503 when scenario defines custom 503', async () => {
			const plugin: Plugin = {
				id: 'scenario-custom-503-plugin',
				componentId: 'test',
				endpoint: '/api/scenariocustom503',
				method: 'GET',
				responses: {
					200: { message: 'default response' },
					503: { error: 'Default Service Unavailable' },
				},
				defaultStatus: 200,
				scenarios: [
					{
						id: 'maintenance-scenario',
						label: 'Maintenance Scenario',
						responses: {
							200: { message: 'scenario response' },
							503: { 
								error: 'Scenario Maintenance Mode',
								reason: 'Database upgrade in progress'
							},
						},
					},
				],
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Set scenario and override status to 503
			platform.setEndpointScenario('scenario-custom-503-plugin', 'maintenance-scenario');
			platform.setStatusOverride('scenario-custom-503-plugin', 503);

			const res = await fetch('http://localhost/api/scenariocustom503');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ 
				error: 'Scenario Maintenance Mode',
				reason: 'Database upgrade in progress'
			});
		});

		it('should fallback to plugin 503 when scenario has no 503 but plugin does', async () => {
			const plugin: Plugin = {
				id: 'fallback-503-plugin',
				componentId: 'test',
				endpoint: '/api/fallback503',
				method: 'GET',
				responses: {
					200: { message: 'default response' },
					503: { error: 'Plugin Service Unavailable' },
				},
				defaultStatus: 200,
				scenarios: [
					{
						id: 'no-503-scenario',
						label: 'No 503 Scenario',
						responses: {
							200: { message: 'scenario response' },
							404: { error: 'scenario not found' },
						},
					},
				],
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Set scenario and override status to 503
			platform.setEndpointScenario('fallback-503-plugin', 'no-503-scenario');
			platform.setStatusOverride('fallback-503-plugin', 503);

			const res = await fetch('http://localhost/api/fallback503');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ error: 'Plugin Service Unavailable' });
		});
	});

	describe('503 Service Unavailable with Query Parameters', () => {
		it('should return default 503 when queryResponse has no custom 503', async () => {
			const plugin: Plugin = {
				id: 'query-503-plugin',
				componentId: 'test',
				endpoint: '/api/query503',
				method: 'GET',
				responses: {
					200: { message: 'default response' },
				},
				defaultStatus: 200,
				queryResponses: {
					'type=admin': { 
						200: { message: 'admin response' },
						404: { error: 'admin not found' }
					},
				},
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Override status to 503
			platform.setStatusOverride('query-503-plugin', 503);

			const res = await fetch('http://localhost/api/query503?type=admin');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ error: 'Service Unavailable' });
		});

		it('should return custom 503 when queryResponse defines custom 503', async () => {
			const plugin: Plugin = {
				id: 'query-custom-503-plugin',
				componentId: 'test',
				endpoint: '/api/querycustom503',
				method: 'GET',
				responses: {
					200: { message: 'default response' },
					503: { error: 'Default Service Unavailable' },
				},
				defaultStatus: 200,
				queryResponses: {
					'type=admin': { 
						200: { message: 'admin response' },
						503: { 
							error: 'Admin Service Unavailable',
							adminContact: 'admin@example.com'
						}
					},
				},
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Override status to 503
			platform.setStatusOverride('query-custom-503-plugin', 503);

			const res = await fetch('http://localhost/api/querycustom503?type=admin');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ 
				error: 'Admin Service Unavailable',
				adminContact: 'admin@example.com'
			});
		});
	});

	describe('503 Service Unavailable with Transform Functions', () => {
		it('should apply transform function to default 503 response', async () => {
			const plugin: Plugin = {
				id: 'transform-503-plugin',
				componentId: 'test',
				endpoint: '/api/transform503',
				method: 'GET',
				responses: {
					200: { message: 'success' },
				},
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.currentStatus === 503) {
						// Handle ResponseData objects (with body and headers)
						if (response && typeof response === 'object' && 'body' in response) {
							return {
								...response,
								body: {
									...response.body,
									timestamp: '2023-01-01T00:00:00Z',
									requestId: 'test-request-id'
								}
							};
						}
						// Handle simple response objects
						return {
							...response,
							timestamp: '2023-01-01T00:00:00Z',
							requestId: 'test-request-id'
						};
					}
					return response;
				},
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Override status to 503
			platform.setStatusOverride('transform-503-plugin', 503);

			const res = await fetch('http://localhost/api/transform503');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ 
				error: 'Service Unavailable',
				timestamp: '2023-01-01T00:00:00Z',
				requestId: 'test-request-id'
			});
		});

		it('should apply transform function to custom 503 response', async () => {
			const plugin: Plugin = {
				id: 'transform-custom-503-plugin',
				componentId: 'test',
				endpoint: '/api/transformcustom503',
				method: 'GET',
				responses: {
					200: { message: 'success' },
					503: { error: 'Custom Service Unavailable' },
				},
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.currentStatus === 503) {
						return {
							...response,
							transformed: true,
							pluginId: context.plugin?.id
						};
					}
					return response;
				},
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			server.resetHandlers();
			server.use(...mswHandlersFromPlatform(platform));

			// Override status to 503
			platform.setStatusOverride('transform-custom-503-plugin', 503);

			const res = await fetch('http://localhost/api/transformcustom503');
			const json = await res.json();

			expect(res.status).toBe(503);
			expect(json).toEqual({ 
				error: 'Custom Service Unavailable',
				transformed: true,
				pluginId: 'transform-custom-503-plugin'
			});
		});
	});

	describe('503 Service Unavailable Platform API', () => {
		it('should return default 503 response from platform.getResponse()', () => {
			const plugin: Plugin = {
				id: 'api-test-plugin',
				componentId: 'test',
				endpoint: '/api/apitest',
				method: 'GET',
				responses: {
					200: { message: 'success' },
				},
				defaultStatus: 200,
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			
			// Test getResponse with 503 status
			const response = platform.getResponse('api-test-plugin', 503);
			
			expect(response).toEqual({ error: 'Service Unavailable' });
		});

		it('should return custom 503 response from platform.getResponse()', () => {
			const plugin: Plugin = {
				id: 'api-custom-plugin',
				componentId: 'test',
				endpoint: '/api/apicustom',
				method: 'GET',
				responses: {
					200: { message: 'success' },
					503: { error: 'Custom API Unavailable' },
				},
				defaultStatus: 200,
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			
			// Test getResponse with 503 status
			const response = platform.getResponse('api-custom-plugin', 503);
			
			expect(response).toEqual({ error: 'Custom API Unavailable' });
		});

		it('should return default 503 response with headers from platform.getResponseWithHeaders()', () => {
			const plugin: Plugin = {
				id: 'api-headers-plugin',
				componentId: 'test',
				endpoint: '/api/apiheaders',
				method: 'GET',
				responses: {
					200: { message: 'success' },
				},
				defaultStatus: 200,
			};

			const platform = createMockPlatform({ name: 'test', plugins: [plugin] });
			
			// Test getResponseWithHeaders with 503 status
			const response = platform.getResponseWithHeaders('api-headers-plugin', 503);
			
			expect(response).toEqual({
				body: { error: 'Service Unavailable' },
				headers: { 'Content-Type': 'application/json' }
			});
		});
	});
});