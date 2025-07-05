import {
  createPathMiddleware,
  createCustomMiddleware,
} from './helpers';

describe('middleware helpers', () => {
  const minimalPlugin = {
    id: 'p',
    componentId: 'c',
    endpoint: '/e',
    method: 'GET' as const,
    responses: {},
    defaultStatus: 200,
  };
  const makeContext = (settings: any = {}, overrides: any = {}) => ({ 
    settings, 
    plugin: minimalPlugin, 
    response: {}, 
    request: {},
    featureFlags: overrides.featureFlags || {},
    currentStatus: overrides.currentStatus || 200,
    endpointScenario: overrides.endpointScenario,
    activeScenario: overrides.activeScenario,
  });
  const next = (x: any) => x;

  it('createPathMiddleware updates paths from settings', () => {
    const mw = createPathMiddleware({
      key: 'userType',
      label: 'User Type',
      type: 'select',
      options: [
        { value: 'guest', label: 'Guest' },
        { value: 'admin', label: 'Admin' },
      ],
      paths: [
        { path: 'user.type', settingKey: 'userType' },
      ],
    });
    const payload = { user: { type: 'guest' } };
    const context = makeContext({ userType: 'admin' });
    const result = mw.getMiddleware()(payload, context, next);
    expect(result).toEqual({ user: { type: 'admin' } });
    
    // Test badge render
    const badge = mw.getBadge();
    expect(badge.render(minimalPlugin, { userType: 'admin' })).toBe('User Type: admin');
  });

  it('createPathMiddleware does nothing if setting is missing', () => {
    const mw = createPathMiddleware({
      key: 'userType',
      label: 'User Type',
      type: 'text',
      paths: [
        { path: 'user.type', settingKey: 'userType' },
      ],
    });
    const payload = { user: { type: 'guest' } };
    const context = makeContext({});
    const result = mw.getMiddleware()(payload, context, next);
    expect(result).toEqual(payload);
  });

  it('createPathMiddleware updates multiple paths', () => {
    const mw = createPathMiddleware({
      key: 'multiUpdate',
      label: 'Multi Update',
      type: 'text',
      paths: [
        { path: 'user.type', settingKey: 'userType' },
        { path: 'contract.id', settingKey: 'contractId' },
      ],
    });
    const payload = { user: { type: 'guest' }, contract: { id: 1 } };
    const context = makeContext({ userType: 'admin', contractId: 42 });
    const result = mw.getMiddleware()(payload, context, next);
    expect(result).toEqual({ user: { type: 'admin' }, contract: { id: 42 } });
  });

  it('createPathMiddleware skips missing settings', () => {
    const mw = createPathMiddleware({
      key: 'multiUpdate',
      label: 'Multi Update',
      type: 'text',
      paths: [
        { path: 'user.type', settingKey: 'userType' },
        { path: 'contract.id', settingKey: 'contractId' },
      ],
    });
    const payload = { user: { type: 'guest' }, contract: { id: 1 } };
    const context = makeContext({ userType: 'admin' });
    const result = mw.getMiddleware()(payload, context, next);
    expect(result).toEqual({ user: { type: 'admin' }, contract: { id: 1 } });
  });

  it('createCustomMiddleware with feature flag context', () => {
    const mw = createCustomMiddleware({
      key: 'experimentalFeature',
      label: 'Experimental Feature',
      type: 'boolean',
      transform: (response, context) => {
        const { experimentalFeature } = context.settings;
        const { featureFlags } = context;
        
        if (featureFlags.EXPERIMENTAL_HELLO && experimentalFeature) {
          return { ...response, experimental: { enabled: true } };
        }
        return response;
      },
    });
    const payload = { experimental: { enabled: false } };
    
    // With required flag enabled
    const context = makeContext(
      { experimentalFeature: true },
      { featureFlags: { EXPERIMENTAL_HELLO: true } }
    );
    const result = mw.getMiddleware()(payload, context, next);
    expect(result.experimental.enabled).toBe(true);
    
    // Without required flag enabled
    const context2 = makeContext(
      { experimentalFeature: true },
      { featureFlags: { EXPERIMENTAL_HELLO: false } }
    );
    const result2 = mw.getMiddleware()(payload, context2, next);
    expect(result2.experimental.enabled).toBe(false);
  });

  it('createCustomMiddleware with status context', () => {
    const mw = createCustomMiddleware({
      key: 'errorMessage',
      label: 'Error Message',
      type: 'text',
      transform: (response, context) => {
        const { errorMessage } = context.settings;
        const { currentStatus } = context;
        
        if ((currentStatus === 404 || currentStatus === 500) && errorMessage) {
          return { ...response, error: { ...response.error, message: errorMessage } };
        }
        return response;
      },
    });
    const payload = { error: { message: 'default' } };
    
    // With 404 status
    const context = makeContext(
      { errorMessage: 'Not found' },
      { currentStatus: 404 }
    );
    const result = mw.getMiddleware()(payload, context, next);
    expect(result.error.message).toBe('Not found');
    
    // With 200 status (no transform)
    const context2 = makeContext(
      { errorMessage: 'Not found' },
      { currentStatus: 200 }
    );
    const result2 = mw.getMiddleware()(payload, context2, next);
    expect(result2.error.message).toBe('default');
  });

  it('createCustomMiddleware with scenario context', () => {
    const mw = createCustomMiddleware({
      key: 'scenarioOverride',
      label: 'Scenario Override',
      type: 'select',
      transform: (response, context) => {
        const { scenarioOverride } = context.settings;
        const { endpointScenario } = context;
        
        if (endpointScenario && scenarioOverride) {
          return { ...response, user: { ...response.user, permissions: scenarioOverride } };
        }
        return response;
      },
    });
    const payload = { user: { permissions: 'default' } };
    
    // With guest scenario
    const context = makeContext(
      { scenarioOverride: 'minimal' },
      { endpointScenario: 'guest' }
    );
    const result = mw.getMiddleware()(payload, context, next);
    expect(result.user.permissions).toBe('minimal');
    
    // Without scenario (no transform)
    const context2 = makeContext(
      { scenarioOverride: 'minimal' },
      { endpointScenario: undefined }
    );
    const result2 = mw.getMiddleware()(payload, context2, next);
    expect(result2.user.permissions).toBe('default');
  });

  it('createCustomMiddleware with custom badge function', () => {
    const mw = createCustomMiddleware({
      key: 'customTransform',
      label: 'Custom Transform',
      type: 'text',
      transform: (response, context) => {
        const { customTransform } = context.settings;
        const { featureFlags, currentStatus, endpointScenario } = context;
        
        if (featureFlags.EXPERIMENTAL && currentStatus === 200 && endpointScenario === 'admin') {
          return {
            ...response,
            enhanced: true,
            userType: customTransform,
            context: {
              pluginId: context.plugin.id,
              status: currentStatus,
              scenario: endpointScenario,
            },
          };
        }
        return response;
      },
      badge: (context) => {
        const { customTransform } = context.settings;
        const { featureFlags, currentStatus, endpointScenario } = context;
        
        if (!customTransform) return null;
        
        // Show different badge text based on context
        if (featureFlags.EXPERIMENTAL && currentStatus === 200 && endpointScenario === 'admin') {
          return `Custom: ${customTransform} (Enhanced)`;
        }
        
        return `Custom: ${customTransform}`;
      },
    });
    
    const payload = { user: { type: 'guest' } };
    const context = makeContext(
      { customTransform: 'admin' },
      { 
        featureFlags: { EXPERIMENTAL: true },
        currentStatus: 200,
        endpointScenario: 'admin',
      }
    );
    const result = mw.getMiddleware()(payload, context, next);
    expect(result.enhanced).toBe(true);
    expect(result.userType).toBe('admin');
    expect(result.context.pluginId).toBe('p');
    expect(result.context.status).toBe(200);
    expect(result.context.scenario).toBe('admin');
    
    // Test custom badge with full context
    const badge = mw.getBadge();
    const badgeResult = badge.render(minimalPlugin, { customTransform: 'admin' });
    expect(badgeResult).toBe('Custom: admin');
  });
});

describe('middleware helpers (advanced)', () => {
  const minimalPlugin = {
    id: 'p',
    componentId: 'c',
    endpoint: '/e',
    method: 'GET' as const,
    responses: {},
    defaultStatus: 200,
  };
  const makeContext = (settings: any = {}, overrides: any = {}) => ({ 
    settings, 
    plugin: minimalPlugin, 
    response: {}, 
    request: {},
    featureFlags: overrides.featureFlags || {},
    currentStatus: overrides.currentStatus || 200,
    endpointScenario: overrides.endpointScenario,
    activeScenario: overrides.activeScenario,
  });
  const next = (x: any) => x;

  it('createPathMiddleware updates array element', () => {
    const mw = createPathMiddleware({
      key: 'userType',
      label: 'User Type',
      type: 'text',
      paths: [
        { path: 'users.1.type', settingKey: 'userType' },
      ],
    });
    const payload = { users: [{ type: 'guest' }, { type: 'admin' }] };
    const context = makeContext({ userType: 'member' });
    const result = mw.getMiddleware()(payload, context, next);
    expect(result.users[1].type).toBe('member');
    expect(result.users[0].type).toBe('guest');
  });

  it('createPathMiddleware updates multiple array/object paths', () => {
    const mw = createPathMiddleware({
      key: 'multiUpdate',
      label: 'Multi Update',
      type: 'text',
      paths: [
        { path: 'users.0.type', settingKey: 'userType0' },
        { path: 'users.1.type', settingKey: 'userType1' },
        { path: 'contract.id', settingKey: 'contractId' },
      ],
    });
    const payload = { users: [{ type: 'guest' }, { type: 'admin' }], contract: { id: 1 } };
    const context = makeContext({ userType0: 'member', userType1: 'admin', contractId: 42 });
    const result = mw.getMiddleware()(payload, context, next);
    expect(result.users[0].type).toBe('member');
    expect(result.users[1].type).toBe('admin');
    expect(result.contract.id).toBe(42);
  });

  it('createCustomMiddleware with complex conditional logic', () => {
    const mw = createCustomMiddleware({
      key: 'conditionalTransform',
      label: 'Conditional Transform',
      type: 'boolean',
      transform: (response, context) => {
        const { conditionalTransform } = context.settings;
        const { featureFlags, currentStatus, endpointScenario } = context;
        
        // Complex condition: experimental flag + status 200 + admin scenario + setting enabled
        if (featureFlags.EXPERIMENTAL && currentStatus === 200 && endpointScenario === 'admin' && conditionalTransform) {
          return {
            ...response,
            enhanced: true,
            timestamp: new Date().toISOString(),
            context: {
              pluginId: context.plugin.id,
              status: currentStatus,
              scenario: endpointScenario,
              experimentalEnabled: featureFlags.EXPERIMENTAL,
            },
          };
        }
        return response;
      },
    });
    
    const payload = { user: { type: 'guest' } };
    const context = makeContext(
      { conditionalTransform: true },
      { 
        featureFlags: { EXPERIMENTAL: true },
        currentStatus: 200,
        endpointScenario: 'admin',
      }
    );
    const result = mw.getMiddleware()(payload, context, next);
    expect(result.enhanced).toBe(true);
    expect(result.timestamp).toBeDefined();
    expect(result.context.pluginId).toBe('p');
    expect(result.context.status).toBe(200);
    expect(result.context.scenario).toBe('admin');
    expect(result.context.experimentalEnabled).toBe(true);
  });
}); 