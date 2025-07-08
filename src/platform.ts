import type { MockPlatformConfig } from './types';
import { MockPlatformCore } from './classes/MockPlatformCore';
import type { PersistenceProvider } from './classes/interfaces/PersistanceProvider';

export function createMockPlatform(config: MockPlatformConfig, persistence?: PersistenceProvider) {
	return new MockPlatformCore(config, persistence);
}
