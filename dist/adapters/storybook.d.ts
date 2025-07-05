import { MSWHandlersOptions } from './msw';
import type { MockPlatformCore } from '../platform';
/**
 * Generates MSW handlers for Storybook integration.
 * Accepts a platform instance or a function returning a platform.
 * Usage: parameters: { msw: { handlers: storybookHandlersFromPlatform(platform, options) } }
 */
export declare function storybookHandlersFromPlatform(
	platformOrGetter: MockPlatformCore | (() => MockPlatformCore),
	options?: MSWHandlersOptions
): any[];
