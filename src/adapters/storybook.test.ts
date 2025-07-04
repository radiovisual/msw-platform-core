import { createMockPlatform } from '../platform';
import { mswHandlersFromPlatform } from './msw';
import { storybookHandlersFromPlatform } from './storybook';

describe('storybookHandlersFromPlatform', () => {
  const plugin = {
    id: 'test',
    endpoint: '/api/test',
    method: 'GET' as const,
    responses: {
      200: { ok: true },
    },
    defaultStatus: 200,
  };

  function getHandlerInfo(handler: any) {
    return handler.info ? { method: handler.info.method, path: handler.info.path } : null;
  }

  it('returns handlers with the same method and path as mswHandlersFromPlatform (platform instance)', () => {
    const platform = createMockPlatform({ name: "test", plugins: [plugin] });
    const mswHandlers = mswHandlersFromPlatform(platform);
    const storybookHandlers = storybookHandlersFromPlatform(platform);
    expect(storybookHandlers.length).toBe(mswHandlers.length);
    for (let i = 0; i < mswHandlers.length; i++) {
      expect(getHandlerInfo(storybookHandlers[i])).toEqual(getHandlerInfo(mswHandlers[i]));
      expect(typeof storybookHandlers[i].resolver).toBe('function');
    }
  });

  it('returns handlers with the same method and path as mswHandlersFromPlatform (platform getter)', () => {
    const platform = createMockPlatform({ name: "test",plugins: [plugin] });
    const getter = () => platform;
    const mswHandlers = mswHandlersFromPlatform(getter);
    const storybookHandlers = storybookHandlersFromPlatform(getter);
    expect(storybookHandlers.length).toBe(mswHandlers.length);
    for (let i = 0; i < mswHandlers.length; i++) {
      expect(getHandlerInfo(storybookHandlers[i])).toEqual(getHandlerInfo(mswHandlers[i]));
      expect(typeof storybookHandlers[i].resolver).toBe('function');
    }
  });

  it('handlers are compatible with MSW (have a .predicate and .resolver)', () => {
    const platform = createMockPlatform({ name: "test",plugins: [plugin] });
    const handlers = storybookHandlersFromPlatform(platform);
    expect(handlers[0]).toHaveProperty('predicate');
    expect(handlers[0]).toHaveProperty('resolver');
  });
}); 