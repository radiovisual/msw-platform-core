import { http, HttpResponse } from 'msw';
import { MockPlatformCore } from '../platform';
import { Plugin } from '../types';

export interface MSWHandlersOptions {
  /**
   * List of plugin IDs to disable (passthrough to real backend/proxy)
   */
  disabledPluginIds?: string[];
}

// Accepts either a platform instance or a function returning a platform
export function mswHandlersFromPlatform(
  platformOrGetter: MockPlatformCore | (() => MockPlatformCore),
  options?: MSWHandlersOptions
) {
  const getPlatform = typeof platformOrGetter === 'function' ? platformOrGetter : () => platformOrGetter;
  const disabled = options?.disabledPluginIds || [];
  return getPlatform().getPlugins().flatMap((plugin: Plugin) => {
    const method = plugin.method.toLowerCase();
    // @ts-ignore: dynamic method access is valid
    const handler = (endpoint: string) => http[method](endpoint, () => {
      if (disabled.includes(plugin.id)) {
        // Return undefined to let MSW passthrough to the real backend/proxy
        return undefined;
      }
      try {
        const platform = getPlatform();
        const status = platform.getStatusOverride(plugin.id) ?? plugin.defaultStatus;
        const response = platform.getResponse(plugin.id, status);
        if (response === undefined) {
          return HttpResponse.json({ error: 'Not found' }, { status: 404 });
        }
        return HttpResponse.json(response, { status });
      } catch (err) {
        console.error('MSW handler error:', err);
        return HttpResponse.json({ error: String(err) }, { status: 500 });
      }
    });
    // Register for both relative and absolute URL
    return [
      handler(plugin.endpoint),
      handler(`http://localhost${plugin.endpoint}`)
    ];
  });
} 