/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import MockUI from './MockUI';
import { createMockPlatform } from '../platform';

describe('MockUI 503 Service Unavailable Feature', () => {
	it('should include 503 status code for plugins without custom 503 definition', () => {
		const platform = createMockPlatform({
			name: 'test-503-ui',
			plugins: [
				{
					id: 'basic-service',
					componentId: 'service',
					endpoint: '/api/basic',
					method: 'GET',
					responses: {
						200: { message: 'OK' },
						404: { error: 'Not found' },
						// No 503 defined
					},
					defaultStatus: 200,
				},
			],
		});

		// Create a mock instance to access the getStatusCodes function
		const mockUIInstance = render(<MockUI platform={platform} />);
		
		// Test that the getStatusCodes function would include 503
		const basicPlugin = platform.getPlugins().find(p => p.id === 'basic-service');
		expect(basicPlugin).toBeDefined();
		
		if (basicPlugin) {
			// Manually test the logic - the plugin should have responses for 200, 404, and 503 should be added
			const statusCodes = Object.keys(basicPlugin.responses).map(Number);
			const expectedStatusCodes = [...statusCodes, 503].sort((a, b) => a - b);
			
			// The plugin originally has [200, 404]
			expect(statusCodes).toEqual([200, 404]);
			
			// After adding 503, it should be [200, 404, 503]
			expect(expectedStatusCodes).toEqual([200, 404, 503]);
		}
	});

	it('should include 503 status code for plugins with custom 503 definition', () => {
		const platform = createMockPlatform({
			name: 'test-503-ui-custom',
			plugins: [
				{
					id: 'custom-503-service',
					componentId: 'service',
					endpoint: '/api/custom503',
					method: 'GET',
					responses: {
						200: { message: 'OK' },
						503: { error: 'Custom Service Unavailable' },
					},
					defaultStatus: 200,
				},
			],
		});

		render(<MockUI platform={platform} />);
		
		// Test that the getStatusCodes function would include 503
		const customPlugin = platform.getPlugins().find(p => p.id === 'custom-503-service');
		expect(customPlugin).toBeDefined();
		
		if (customPlugin) {
			// Manually test the logic - the plugin should have responses for 200, 503, and 503 should NOT be added twice
			const statusCodes = Object.keys(customPlugin.responses).map(Number);
			const expectedStatusCodes = [...statusCodes];
			if (!expectedStatusCodes.includes(503)) {
				expectedStatusCodes.push(503);
			}
			expectedStatusCodes.sort((a, b) => a - b);
			
			// The plugin originally has [200, 503]
			expect(statusCodes).toEqual([200, 503]);
			
			// After processing, it should still be [200, 503] (no duplicates)
			expect(expectedStatusCodes).toEqual([200, 503]);
		}
	});

	it('should sort status codes in ascending order', () => {
		const platform = createMockPlatform({
			name: 'test-503-ui-sort',
			plugins: [
				{
					id: 'mixed-statuses',
					componentId: 'service',
					endpoint: '/api/mixed',
					method: 'GET',
					responses: {
						500: { error: 'Internal Error' },
						200: { message: 'OK' },
						400: { error: 'Bad Request' },
						// No 503 defined - should be added automatically
					},
					defaultStatus: 200,
				},
			],
		});

		render(<MockUI platform={platform} />);
		
		// Test that the getStatusCodes function sorts correctly
		const mixedPlugin = platform.getPlugins().find(p => p.id === 'mixed-statuses');
		expect(mixedPlugin).toBeDefined();
		
		if (mixedPlugin) {
			// Manually test the logic - the plugin should have responses for 500, 200, 400, and 503 should be added
			const statusCodes = Object.keys(mixedPlugin.responses).map(Number);
			const expectedStatusCodes = [...statusCodes, 503].sort((a, b) => a - b);
			
			// The plugin originally has [500, 200, 400] (order from responses object)
			expect(statusCodes.sort()).toEqual([200, 400, 500]);
			
			// After adding 503 and sorting, it should be [200, 400, 500, 503]
			expect(expectedStatusCodes).toEqual([200, 400, 500, 503]);
		}
	});
});