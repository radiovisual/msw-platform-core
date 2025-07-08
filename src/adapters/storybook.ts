import { mswHandlersFromPlatform, MSWHandlersOptions } from './msw';
import type { MockPlatformCore } from '../classes/MockPlatformCore';

/**
 * Generates MSW handlers for Storybook integration.
 * Accepts a platform instance or a function returning a platform.
 * Usage: parameters: { msw: { handlers: storybookHandlersFromPlatform(platform, options) } }
 */
export function storybookHandlersFromPlatform(
	platformOrGetter: MockPlatformCore | (() => MockPlatformCore),
	_options?: MSWHandlersOptions
) {
	return mswHandlersFromPlatform(platformOrGetter);
}
