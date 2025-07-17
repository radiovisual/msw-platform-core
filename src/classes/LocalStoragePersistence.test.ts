/**
 * @jest-environment jsdom
 */
import { LocalStoragePersistence } from './LocalStoragePersistence';

describe('LocalStoragePersistence', () => {
	let persistence: LocalStoragePersistence;
	const testPlatformName = 'test-platform';

	beforeEach(() => {
		localStorage.clear();
		persistence = new LocalStoragePersistence(testPlatformName);
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe('Feature Flags', () => {
		it('should initially return undefined for unset flags', () => {
			expect(persistence.getFlag('TEST_FLAG')).toBeUndefined();
		});

		it('should store and retrieve boolean flag values', () => {
			persistence.setFlag('TEST_FLAG', true);
			expect(persistence.getFlag('TEST_FLAG')).toBe(true);

			persistence.setFlag('TEST_FLAG', false);
			expect(persistence.getFlag('TEST_FLAG')).toBe(false);
		});

		it('should persist flags across instances', () => {
			persistence.setFlag('PERSISTENT_FLAG', true);
			
			const newPersistence = new LocalStoragePersistence(testPlatformName);
			expect(newPersistence.getFlag('PERSISTENT_FLAG')).toBe(true);
		});

		it('should handle multiple flags independently', () => {
			persistence.setFlag('FLAG_A', true);
			persistence.setFlag('FLAG_B', false);
			persistence.setFlag('FLAG_C', true);

			expect(persistence.getFlag('FLAG_A')).toBe(true);
			expect(persistence.getFlag('FLAG_B')).toBe(false);
			expect(persistence.getFlag('FLAG_C')).toBe(true);
		});

		it('should namespace flags by platform name', () => {
			const platformA = new LocalStoragePersistence('platformA');
			const platformB = new LocalStoragePersistence('platformB');

			platformA.setFlag('SHARED_FLAG', true);
			platformB.setFlag('SHARED_FLAG', false);

			expect(platformA.getFlag('SHARED_FLAG')).toBe(true);
			expect(platformB.getFlag('SHARED_FLAG')).toBe(false);
		});

		it('should handle corrupted localStorage data gracefully', () => {
			// Corrupt the localStorage data
			localStorage.setItem(`${testPlatformName}.persistence.flags.v1`, 'invalid json');
			
			expect(persistence.getFlag('TEST_FLAG')).toBeUndefined();
			
			// Should still be able to set flags after corruption
			persistence.setFlag('TEST_FLAG', true);
			expect(persistence.getFlag('TEST_FLAG')).toBe(true);
		});
	});

	describe('Status Overrides', () => {
		it('should store and retrieve status overrides', () => {
			persistence.setStatus('plugin1', 200);
			persistence.setStatus('plugin2', 404);

			expect(persistence.getStatus('plugin1')).toBe(200);
			expect(persistence.getStatus('plugin2')).toBe(404);
		});

		it('should persist status overrides across instances', () => {
			persistence.setStatus('plugin1', 500);
			
			const newPersistence = new LocalStoragePersistence(testPlatformName);
			expect(newPersistence.getStatus('plugin1')).toBe(500);
		});

		it('should return undefined for unset status overrides', () => {
			expect(persistence.getStatus('nonexistent')).toBeUndefined();
		});
	});

	describe('Scenarios', () => {
		it('should store and retrieve active scenario', () => {
			persistence.setActiveScenario('scenario1');
			expect(persistence.getActiveScenario()).toBe('scenario1');
		});

		it('should store and retrieve endpoint scenarios', () => {
			persistence.setEndpointScenario('endpoint1', 'scenario1');
			persistence.setEndpointScenario('endpoint2', 'scenario2');

			expect(persistence.getEndpointScenario('endpoint1')).toBe('scenario1');
			expect(persistence.getEndpointScenario('endpoint2')).toBe('scenario2');
		});

		it('should persist scenarios across instances', () => {
			persistence.setActiveScenario('active-scenario');
			persistence.setEndpointScenario('endpoint1', 'endpoint-scenario');
			
			const newPersistence = new LocalStoragePersistence(testPlatformName);
			expect(newPersistence.getActiveScenario()).toBe('active-scenario');
			expect(newPersistence.getEndpointScenario('endpoint1')).toBe('endpoint-scenario');
		});
	});

	describe('Delays', () => {
		it('should store and retrieve delay overrides', () => {
			persistence.setDelay('plugin1', 1000);
			persistence.setDelay('plugin2', 2000);

			expect(persistence.getDelay('plugin1')).toBe(1000);
			expect(persistence.getDelay('plugin2')).toBe(2000);
		});

		it('should persist delays across instances', () => {
			persistence.setDelay('plugin1', 3000);
			
			const newPersistence = new LocalStoragePersistence(testPlatformName);
			expect(newPersistence.getDelay('plugin1')).toBe(3000);
		});

		it('should return undefined for unset delays', () => {
			expect(persistence.getDelay('nonexistent')).toBeUndefined();
		});
	});

	describe('Global Disable', () => {
		it('should store and retrieve global disable state', () => {
			persistence.setGlobalDisable(true);
			expect(persistence.getGlobalDisable()).toBe(true);

			persistence.setGlobalDisable(false);
			expect(persistence.getGlobalDisable()).toBe(false);
		});

		it('should persist global disable state across instances', () => {
			persistence.setGlobalDisable(true);
			
			const newPersistence = new LocalStoragePersistence(testPlatformName);
			expect(newPersistence.getGlobalDisable()).toBe(true);
		});

		it('should return undefined for unset global disable state', () => {
			expect(persistence.getGlobalDisable()).toBeUndefined();
		});
	});

	describe('localStorage Availability', () => {
		it('should handle localStorage being unavailable gracefully', () => {
			// This test verifies that the LocalStoragePersistence class methods don't throw errors
			// when localStorage is unavailable, which is the main requirement for graceful handling
			
			// Mock localStorage to throw errors
			const originalSetItem = localStorage.setItem;
			const originalGetItem = localStorage.getItem;
			
			localStorage.setItem = jest.fn().mockImplementation(() => {
				throw new Error('localStorage unavailable');
			});
			localStorage.getItem = jest.fn().mockImplementation(() => {
				throw new Error('localStorage unavailable');
			});

			const freshPersistence = new LocalStoragePersistence('fresh-test');

			// The main requirement is that these methods don't throw errors
			expect(() => freshPersistence.setFlag('TEST_FLAG', true)).not.toThrow();
			expect(() => freshPersistence.getFlag('TEST_FLAG')).not.toThrow();
			expect(() => freshPersistence.setStatus('plugin', 200)).not.toThrow();
			expect(() => freshPersistence.getStatus('plugin')).not.toThrow();
			expect(() => freshPersistence.setGlobalDisable(true)).not.toThrow();
			expect(() => freshPersistence.getGlobalDisable()).not.toThrow();

			// Restore original methods
			localStorage.setItem = originalSetItem;
			localStorage.getItem = originalGetItem;
		});
	});

	describe('Key Namespacing', () => {
		it('should use proper key namespacing for different data types', () => {
			const platformName = 'test-app';
			const testPersistence = new LocalStoragePersistence(platformName);

			testPersistence.setFlag('FLAG', true);
			testPersistence.setStatus('plugin', 200);
			testPersistence.setActiveScenario('scenario');
			testPersistence.setEndpointScenario('endpoint', 'scenario');
			testPersistence.setDelay('plugin', 1000);
			testPersistence.setGlobalDisable(true);

			// Check that all keys are properly namespaced
			const keys = Object.keys(localStorage);
			expect(keys).toContain(`${platformName}.persistence.flags.v1`);
			expect(keys).toContain(`${platformName}.persistence.statuses.v1`);
			expect(keys).toContain(`${platformName}.persistence.scenario.v1`);
			expect(keys).toContain(`${platformName}.persistence.endpointScenarios.v1`);
			expect(keys).toContain(`${platformName}.persistence.delays.v1`);
			expect(keys).toContain(`${platformName}.persistence.globalDisable.v1`);
		});
	});
});