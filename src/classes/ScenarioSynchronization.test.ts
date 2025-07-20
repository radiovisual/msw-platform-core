import { MockPlatformCore } from './MockPlatformCore';
import { Plugin, MiddlewareContext } from '../types';
import { HTTP_METHOD } from '../constants';

describe('ScenarioSynchronization', () => {
	let platform: MockPlatformCore;
	let mockPlugin: Plugin;

	beforeEach(() => {
		// Clear localStorage to ensure test isolation
		localStorage.clear();

		// Create a mock plugin with scenarios and transform function
		mockPlugin = {
			id: 'test-plugin',
			componentId: 'test-component',
			endpoint: '/api/test',
			method: HTTP_METHOD.GET,
			responses: {
				200: { message: 'default response' },
				404: { error: 'not found' },
			},
			defaultStatus: 200,
			scenarios: [
				{
					id: 'error-scenario',
					label: 'Error Scenario',
					responses: {
						500: { error: 'server error' },
					},
				},
				{
					id: 'success-scenario',
					label: 'Success Scenario',
					responses: {
						200: { message: 'success response' },
					},
				},
			],
			transform: (response: any, context: MiddlewareContext) => {
				// This transform function expects context.activeScenario to be defined
				if (context.activeScenario === 'error-scenario') {
					return { ...response, transformedBy: 'error-scenario' };
				}
				if (context.activeScenario === 'success-scenario') {
					return { ...response, transformedBy: 'success-scenario' };
				}
				if (context.activeScenario === 'global-error-scenario') {
					return { ...response, transformedBy: 'global-error-scenario' };
				}
				if (context.activeScenario === 'non-existent-scenario') {
					return { ...response, transformedBy: 'non-existent-scenario' };
				}
				return response;
			},
		};

		platform = new MockPlatformCore({
			name: `test-platform-${Date.now()}-${Math.random()}`,
			plugins: [mockPlugin],
		});
	});

	it('should set context.activeScenario when endpoint scenario is selected', () => {
		// Select an endpoint scenario
		platform.setEndpointScenario('test-plugin', 'error-scenario');

		// Get the response and check that transform was called with correct context
		const result = platform.getResponse('test-plugin', 200);

		// The transform function should have been called with activeScenario set
		expect(result?.body.transformedBy).toBe('error-scenario');
	});

	it('should clear context.activeScenario when endpoint scenario is cleared', () => {
		// First set a scenario
		platform.setEndpointScenario('test-plugin', 'error-scenario');

		// Get response and verify transform uses the scenario
		let result = platform.getResponse('test-plugin', 200);
		expect(result?.body.transformedBy).toBe('error-scenario');

		// Now clear the scenario
		platform.setEndpointScenario('test-plugin', '');

		// Verify endpoint scenario is cleared
		expect(platform.getEndpointScenario('test-plugin')).toBe('');

		// Get response and verify transform doesn't use scenario
		result = platform.getResponse('test-plugin', 200);
		expect(result?.body.transformedBy).toBeUndefined();
	});

	it('should handle multiple endpoint scenarios correctly', () => {
		// Set scenario for first plugin
		platform.setEndpointScenario('test-plugin', 'success-scenario');

		// Verify the endpoint scenario is set
		expect(platform.getEndpointScenario('test-plugin')).toBe('success-scenario');

		// Get response and verify transform uses the scenario
		const result = platform.getResponse('test-plugin', 200);
		expect(result?.body.transformedBy).toBe('success-scenario');
	});

	it('should maintain backward compatibility with direct activateScenario calls', () => {
		// First register a global scenario (activateScenario requires scenarios to exist)
		platform.registerScenario({
			id: 'global-error-scenario',
			name: 'Global Error Scenario',
			description: 'Test global scenario',
			pluginIds: ['test-plugin'],
			flagOverrides: {},
			statusOverrides: {},
		});

		// Directly activate a scenario (old approach)
		platform.activateScenario('global-error-scenario');

		// Verify it's set
		expect(platform.getActiveScenario()).toBe('global-error-scenario');

		// Get response and verify transform uses the global scenario
		const result = platform.getResponse('test-plugin', 200);
		expect(result?.body.transformedBy).toBe('global-error-scenario');
	});

	it('should handle scenario selection with non-existent scenario gracefully', () => {
		// Try to set a scenario that doesn't exist
		platform.setEndpointScenario('test-plugin', 'non-existent-scenario');

		// The endpoint scenario should still be set (for endpoint-specific logic)
		expect(platform.getEndpointScenario('test-plugin')).toBe('non-existent-scenario');

		// Get response and verify transform uses the scenario ID even if it doesn't correspond to a real scenario
		const result = platform.getResponse('test-plugin', 200);
		expect(result?.body.transformedBy).toBe('non-existent-scenario');
	});

	it('should provide both endpointScenario and activeScenario in middleware context', () => {
		let capturedContext: MiddlewareContext | undefined;

		// Create a plugin with transform that captures the context
		const contextCapturePlugin: Plugin = {
			...mockPlugin,
			id: 'context-capture',
			transform: (response: any, context: MiddlewareContext) => {
				capturedContext = context;
				return response;
			},
		};

		const contextPlatform = new MockPlatformCore({
			name: `context-test-platform-${Date.now()}-${Math.random()}`,
			plugins: [contextCapturePlugin],
		});

		// Set an endpoint scenario
		contextPlatform.setEndpointScenario('context-capture', 'error-scenario');

		// Trigger the transform
		contextPlatform.getResponse('context-capture', 200);

		// Verify both context properties are set correctly
		expect(capturedContext?.endpointScenario).toBe('error-scenario');
		expect(capturedContext?.activeScenario).toBe('error-scenario');
	});

	it('should persist scenario state correctly', () => {
		const persistenceName = `persistence-test-platform-${Date.now()}-${Math.random()}`;

		// Create first platform instance
		const firstPlatform = new MockPlatformCore({
			name: persistenceName,
			plugins: [mockPlugin],
		});

		// Set an endpoint scenario
		firstPlatform.setEndpointScenario('test-plugin', 'success-scenario');

		// Create a new platform instance (simulating app restart)
		const newPlatform = new MockPlatformCore({
			name: persistenceName, // Same name for persistence
			plugins: [mockPlugin],
		});

		// The endpoint scenario should be restored
		expect(newPlatform.getEndpointScenario('test-plugin')).toBe('success-scenario');

		// And it should work in transform functions
		const result = newPlatform.getResponse('test-plugin', 200);
		expect(result?.body.transformedBy).toBe('success-scenario');
	});
});
