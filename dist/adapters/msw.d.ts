import { MockPlatformCore } from '../platform';
export interface MSWHandlersOptions {
    /**
     * List of plugin IDs to disable (passthrough to real backend/proxy)
     */
    disabledPluginIds?: string[];
}
export declare function mswHandlersFromPlatform(platformOrGetter: MockPlatformCore | (() => MockPlatformCore), options?: MSWHandlersOptions): any[];
