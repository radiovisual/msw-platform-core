# msw-platform-core

A reusable, portable mock platform core for frontend and full-stack projects.

## TODO

- [] Test file type response support (html. text responses)
- [] Set custom headers for the different response types (application/problem+json, etc)
- [] Global disable
- [] Manupulate response payloads directly from the UI for each endpoint

## Goals
- Register mock API endpoints with minimal config (just JSON payloads, endpoint, method, status codes, feature flags)
- Generate handlers for MSW, Storybook, Cypress, etc. from a single source of truth
- Provide a UI for toggling feature flags, response codes, and scenarios at runtime
- Make it easy to integrate into any React app, Storybook, or test suite
- Abstract persistence and allow for custom storage

## Architecture Overview

- **Core API**: Register plugins (endpoints), feature flags, and scenarios
- **Adapters**: For MSW, Storybook, Cypress, etc.
- **UI**: Embeddable React component for runtime control
- **Persistence**: Pluggable (localStorage, session, in-memory)
- **Middleware**: Responses can be easily customized with flexible middleware

## Example Usage

### 1. Define your plugins and create the platform

```js
import { createMockPlatform } from "msw-platform-core";

const platform = createMockPlatform({
  plugins: [
    {
      id: "user",
      endpoint: "/api/user",
      method: "GET",
      responses: {
        200: { name: "Alice" },
        404: { error: "Not found" },
      },
      defaultStatus: 200,
      featureFlags: ["EXPERIMENTAL_USER"],
      delay: 300, // Optional: Response delay in milliseconds (default: 150)
    },
  ],
  featureFlags: [
    { name: "EXPERIMENTAL_USER", description: "Enables experimental user features", default: false },
    { name: "NEW_UI", description: "Enables new UI components", default: true },
  ],
});
```

### 1.1. Response Delays

You can configure response delays for each endpoint to simulate real network conditions, slow APIs, or test loading states in your application.

#### Configuring Delays

Add a `delay` property to your plugin definition with a number in milliseconds:

```js
const platform = createMockPlatform({
  plugins: [
    {
      id: "fast-api",
      endpoint: "/api/fast",
      method: "GET",
      responses: { 200: { message: "Fast response" } },
      defaultStatus: 200,
      delay: 100, // 100ms delay
    },
    {
      id: "slow-api",
      endpoint: "/api/slow",
      method: "GET",
      responses: { 200: { message: "Slow response" } },
      defaultStatus: 200,
      delay: 2000, // 2 second delay
    },
    {
      id: "instant-api",
      endpoint: "/api/instant",
      method: "GET",
      responses: { 200: { message: "Instant response" } },
      defaultStatus: 200,
      delay: 0, // No delay
    },
  ],
});
```

#### Runtime Delay Control

The MockUI provides a delay input field for each endpoint, allowing you to adjust delays at runtime:

- **Default Delay**: 150ms for all endpoints (unless specified otherwise)
- **Runtime Override**: Use the delay input in the MockUI to change delays during development
- **Persistence**: Delay overrides are saved to localStorage and restored on page reload
- **Range**: 0ms to 100,000ms (100 seconds)

#### Use Cases

- **Loading States**: Test how your UI handles different loading times
- **Network Simulation**: Simulate slow network conditions
- **API Testing**: Test timeout handling and retry logic
- **User Experience**: Ensure your app provides good UX during slow responses

#### Programmatic API

```js
// Get the effective delay for a plugin (override or default)
const delay = platform.getEffectiveDelay("user"); // Returns 150 (default)

// Set a delay override
platform.setDelayOverride("user", 1000); // 1 second delay

// Get the delay override (if set)
const override = platform.getDelayOverride("user"); // Returns 1000
```

### 2. Use with MSW in your app or tests

#### Browser (client-side, e.g. React app or Storybook)

```js
import { setupWorker } from "msw";
import { mswHandlersFromPlatform } from "msw-platform-core";

const worker = setupWorker(...mswHandlersFromPlatform(platform));
worker.start();

// Now all fetches to /api/user will be mocked according to the platform state
```

#### Node.js (server-side, e.g. Jest or Vitest tests)

```js
import { setupServer } from "msw/node";
import { mswHandlersFromPlatform } from "msw-platform-core";

const server = setupServer(...mswHandlersFromPlatform(platform));

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 3. Feature Flags

Feature flags can be defined as simple strings or as objects with descriptions and default values:

```js
const platform = createMockPlatform({
  plugins: [...],
  featureFlags: [
    // Simple string (legacy format)
    "LEGACY_FLAG",
    
    // Object with description and default
    { 
      name: "EXPERIMENTAL_USER", 
      description: "Enables experimental user features", 
      default: false 
    },
    { 
      name: "NEW_UI", 
      description: "Enables new UI components", 
      default: true 
    },
  ],
});
```

#### Feature Flag UI Features

The MockUI provides an enhanced feature flags interface with:

- **Clickable Cards**: Entire feature flag cards are clickable for easy toggling
- **Visual Status Indicators**: Green background for enabled flags, red for disabled
- **Search Functionality**: Search through feature flags by name or description
- **Descriptions**: Display optional descriptions for each feature flag
- **Default Values**: Support for setting default values when flags are first created
- **Keyboard Accessibility**: Cards can be activated with Enter or Space keys
- **Hover Effects**: Subtle hover animations for better user feedback

#### Toggling flags and status at runtime

```js
// Toggle a feature flag
platform.setFeatureFlag("EXPERIMENTAL_USER", true);

// Override the status code for a plugin
platform.setStatusOverride("user", 404);
```

### 4. Endpoint Scenarios (Per-Endpoint Variations)

You can define multiple **scenarios** for each endpoint, allowing you to easily switch between different variations (e.g., "User not registered" vs. "User is registered").

#### Defining Scenarios

Add a `scenarios` array to your plugin definition. Each scenario can override any subset of status codes. If a status code is not defined in the scenario, the plugin's main `responses` will be used as a fallback.

```js
const platform = createMockPlatform({
  plugins: [
    {
      id: "register",
      endpoint: "/api/register",
      method: "POST",
      responses: {
        200: { ok: true },
        400: { error: "Bad request" },
      },
      defaultStatus: 200,
      scenarios: [
        {
          id: "not-registered",
          label: "User not registered",
          responses: {
            200: { error: "User not registered" },
            // 400 not defined here, will fallback to plugin.responses[400]
          },
        },
        {
          id: "registered",
          label: "User is registered",
          responses: {
            200: { ok: "User is registered" },
            400: { error: "Custom bad request" },
          },
        },
      ],
    },
  ],
});
```

#### Using Scenarios in the UI

- In the MockUI "All Endpoints" tab, a dropdown will appear for each endpoint with scenarios.
- Select a scenario to activate it for that endpoint. The response will update accordingly.
- The selected scenario is persisted to localStorage and restored on reload.

#### Programmatic API

```js
// Set the active scenario for an endpoint
platform.setEndpointScenario("register", "not-registered");

// Get the active scenario for an endpoint
const scenarioId = platform.getEndpointScenario("register");

// The response returned by getResponse will use the active scenario if set
// and the requested status code. If not defined in the scenario, falls back to plugin.responses
const resp200 = platform.getResponse("register", 200); // scenario or plugin 200
const resp400 = platform.getResponse("register", 400); // scenario or plugin 400
```

#### In Tests and Storybook

- You can set the scenario programmatically in your tests or Storybook stories for deterministic results.
- The UI and MSW handlers will respect the active scenario.

### 4. Example handler (for reference)

Handlers are generated for you, but here's what they look like under the hood:

```js
import { http, HttpResponse } from "msw";

http.get("/api/user", () => {
  // This logic is auto-generated by mswHandlersFromPlatform
  return HttpResponse.json({ name: "Alice" }, { status: 200 });
});
```

---

## Dynamic Route Matching and Wildcards

The platform supports MSW-style dynamic route matching and wildcards in plugin endpoints. This means you can define endpoints with parameters (e.g., `/api/v1/user/:id`) or wildcards (e.g., `/api/v1/user/*`), and any request matching that pattern will be handled by your mock.

**How it works:**
- The `endpoint` property of a plugin can use Express-style parameters (e.g., `:id`, `:orderId`) and wildcards (`*`).
- These patterns are passed directly to MSW, which handles the matching logic.
- You do **not** need to do anything special—just use the pattern you want in your plugin definition.

**Example:**
```ts
const userPlugin = {
  id: 'user',
  endpoint: '/api/v1/user/:id', // :id will match any value
  method: 'GET',
  responses: {
    200: { id: '123', name: 'John Doe' },
    404: { error: 'User not found' },
  },
  defaultStatus: 200,
};
```

Any request to `/api/v1/user/123`, `/api/v1/user/abc`, etc., will match this plugin.

You can also use multiple parameters:
```ts
const orderPlugin = {
  id: 'order',
  endpoint: '/api/v1/orders/:orderId/items/:itemId',
  method: 'GET',
  responses: {
    200: { orderId: '...', itemId: '...', ... },
  },
  defaultStatus: 200,
};
```

**Note:**
- This works for both relative and absolute URLs.
- The matching is handled by MSW, so you get all the flexibility of MSW's route matching out of the box.

---

## Query Parameter Wildcards

The platform supports wildcards in query parameters, allowing you to match any value for a specific parameter. This is useful when you care about the presence of a parameter but not its specific value.

**How it works:**
- Use `*` as the value for any query parameter to match any value for that parameter.
- You can combine exact matches with wildcards in the same query string.
- The matching is done in order of specificity (exact matches take precedence over wildcards).

**Example:**
```ts
const userPlugin = {
  id: 'user',
  endpoint: '/api/user',
  method: 'GET',
  responses: {
    200: { message: 'Default user response' },
  },
  defaultStatus: 200,
  queryResponses: {
    'type=admin': { 200: { message: 'Admin user response' } },
    'type=*': { 200: { message: 'Any type user response' } },
    'status=active&role=*': { 200: { message: 'Active user with any role' } },
  },
};
```

**Matching behavior:**
- `/api/user?type=admin` → Returns "Admin user response" (exact match)
- `/api/user?type=guest` → Returns "Any type user response" (wildcard match)
- `/api/user?type=member` → Returns "Any type user response" (wildcard match)
- `/api/user?status=active&role=admin` → Returns "Active user with any role" (wildcard match)
- `/api/user?status=active&role=user` → Returns "Active user with any role" (wildcard match)
- `/api/user` → Returns "Default user response" (no query parameters)

**Use cases:**
- **Parameter presence detection:** Use `'param=*'` to match when a parameter is present regardless of its value
- **Mixed matching:** Combine exact matches for important parameters with wildcards for less critical ones
- **Fallback responses:** Use wildcards to provide generic responses when specific values don't match

---

## Guide: Using mswHandlersFromPlatform in a Real React Application

### 1. Install dependencies

```bash
npm install msw msw-platform-core
```

### 2. Create your mock platform and handlers

```js
// src/mocks/platform.js
import { createMockPlatform } from 'msw-platform-core';

export const platform = createMockPlatform({
  plugins: [
    {
      id: 'user',
      endpoint: '/api/user',
      method: 'GET',
      responses: {
        200: { name: 'Alice' },
        404: { error: 'Not found' },
      },
      defaultStatus: 200,
      featureFlags: ['EXPERIMENTAL_USER'],
    },
    {
      id: 'items',
      endpoint: '/api/items',
      method: 'GET',
      responses: {
        200: [
          { id: '1', name: 'Book' },
          { id: '2', name: 'Pen' },
        ],
      },
      defaultStatus: 200,
    },
  ],
  featureFlags: [
    { name: 'EXPERIMENTAL_USER', description: 'Enables experimental user features', default: false },
  ],
});
```

```js
// src/mocks/handlers.js
import { mswHandlersFromPlatform } from 'msw-platform-core';
import { platform } from './platform';

export const handlers = mswHandlersFromPlatform(platform);
```

### 3. Set up MSW in the browser

```js
// src/mocks/browser.js
import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

### 4. Start the worker before your app renders

```js
// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (process.env.NODE_ENV === 'development') {
  const { worker } = require('./mocks/browser');
  worker.start();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

### 5. Use the platform API in your React app

```js
// src/App.js
import React, { useState } from 'react';
import { platform } from './mocks/platform';

export default function App() {
  const [user, setUser] = useState(null);
  const [flag, setFlag] = useState(platform.getFeatureFlags().EXPERIMENTAL_USER);

  const fetchUser = async () => {
    const res = await fetch('/api/user');
    setUser(await res.json());
  };

  const toggleFlag = () => {
    platform.setFeatureFlag('EXPERIMENTAL_USER', !flag);
    setFlag(!flag);
  };

  return (
    <div>
      <h1>Mocked User API Example</h1>
      <button onClick={fetchUser}>Fetch User</button>
      <button onClick={toggleFlag} style={{ marginLeft: 8 }}>
        Toggle EXPERIMENTAL_USER (currently {String(flag)})
      </button>
      <pre>{user && JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
```

---

### How it works
- All requests to `/api/user` and `/api/items` are intercepted and mocked by MSW using the handlers generated by `mswHandlersFromPlatform`.
- You can toggle feature flags or status codes at runtime using the platform API, and the next request will reflect the new mock state.
- This pattern works for any React app, Storybook, or test suite using MSW v2+ and Node 18+.

--- 

## Guide: Integrating with Storybook using storybookHandlersFromPlatform

### 1. Install dependencies

```bash
npm install msw msw-storybook-addon msw-platform-core
```

### 2. Configure Storybook to use MSW

**.storybook/preview.ts**
```ts
import type { Preview } from "@storybook/react";
import { initialize, mswDecorator } from "msw-storybook-addon";

initialize({
  onUnhandledRequest: "bypass",
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export const decorators = [mswDecorator];
export default preview;
```

:bulb: You might need to run `mkdir .storybook/public && npx msw init .storybook/public` to get the mockServiceWorker.js registered with your storybook projects

**.storybook/main.ts**
```ts
import type { StorybookConfig } from "@storybook/react-webpack5";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-webpack5-compiler-swc",
    "@storybook/addon-essentials",
    "msw-storybook-addon",
  ],
  staticDirs: ["./public"], // 👈 serve mockServiceWorker.js
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
};
export default config;
```

### 3. Create your platform and handlers

```js
// src/mocks/platform.js
import { createMockPlatform } from 'msw-platform-core';

export const platform = createMockPlatform({
  plugins: [
    {
      id: 'user',
      endpoint: '/api/user',
      method: 'GET',
      responses: {
        200: { name: 'Alice' },
        404: { error: 'Not found' },
      },
      defaultStatus: 200,
      featureFlags: ['EXPERIMENTAL_USER'],
    },
  ],
  featureFlags: [
    { name: 'EXPERIMENTAL_USER', description: 'Enables experimental user features', default: false },
  ],
});
```

### 4. Use the Storybook adapter in your stories

```js
// src/App.stories.tsx
import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { App } from "./App";
import { platform } from "./mocks/platform";
import { storybookHandlersFromPlatform } from "msw-platform-core";

const meta: Meta<typeof App> = {
  title: "App",
  component: App,
};
export default meta;

type Story = StoryObj<typeof App>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: storybookHandlersFromPlatform(platform),
    },
  },
};

export const AltMode: Story = {
  parameters: {
    msw: {
      handlers: storybookHandlersFromPlatform(() => {
        platform.setFeatureFlag("EXPERIMENTAL_USER", true);
        return platform;
      }),
    },
  },
};
```

---

### How it works
- The `storybookHandlersFromPlatform` adapter generates MSW handlers for your platform config.
- You can use different platform states per story by passing a function that mutates the platform before returning it.
- This enables powerful, stateful mocking in Storybook, with full support for feature flags, status overrides, and scenarios.

--- 

## Storybook Adapter vs MSW Adapter: What's the Difference?

- **MSW Adapter (`mswHandlersFromPlatform`)**: Generates MSW handlers from your platform config for use in any environment (Node.js, browser, tests, etc.).
- **Storybook Adapter (`storybookHandlersFromPlatform`)**: A semantic alias for the MSW adapter, designed specifically for Storybook integration. It makes your intent clear and matches the expected usage for the `msw` parameter in Storybook stories.
- **Why is this useful?**
  - Keeps your Storybook stories clean and intention-revealing.
  - Allows you to use the same platform config and runtime API as your app/tests, but in a Storybook context.
  - Supports per-story platform state (e.g., toggling flags or status codes for a specific story).
  - Enables powerful, stateful mocking in Storybook, including feature flags, status overrides, and scenarios.

In summary: Use the Storybook adapter in your Storybook stories for clarity and maintainability, and use the MSW adapter everywhere else.

--- 

## Proxy Passthrough: Disabling Mocks and Allowing Real Backend/Proxy

Both the MSW and Storybook adapters now support a passthrough feature. You can disable specific mocks by plugin id, and those requests will not be intercepted—they will be passed through to your real backend or proxy (e.g., localhost:4711).

### How to use

#### In your app or tests (Node.js or browser):

```js
import { mswHandlersFromPlatform } from 'msw-platform-core';
import { platform } from './mocks/platform';

const handlers = mswHandlersFromPlatform(platform, {
  disabledPluginIds: ['user'], // disables the 'user' mock, lets it passthrough
});
```

#### In Storybook:

```js
import { storybookHandlersFromPlatform } from 'msw-platform-core';
import { platform } from './mocks/platform';

export const Default = {
  parameters: {
    msw: {
      handlers: storybookHandlersFromPlatform(platform, {
        disabledPluginIds: ['user'], // disables the 'user' mock
      }),
    },
  },
};
```

:bulb: You can also disable mocks directly from the `MockUI` component. If the mock is disabled, then the network request should just passthrough naturally.

### How it works
- When a plugin id is listed in `disabledPluginIds`, requests for that endpoint are not mocked and will be handled by the real backend or proxy (e.g., localhost:4711).
- This is useful for hybrid development, debugging, or when you want to test against real data for some endpoints and mock others.
- You can toggle which mocks are enabled/disabled at runtime

--- 

## Middleware System: Dynamic Response Transformations

The middleware system allows you to dynamically transform API responses based on runtime settings. This is perfect for scenarios like:
- Setting user types across multiple endpoints
- Overriding contract information based on environment
- Conditionally modifying responses based on feature flags
- Adding authentication headers or tokens

### Basic Example: Simple Path Updates

The easiest way to get started is with the helper functions:

```typescript
import { createPathMiddleware } from 'msw-platform-core';

// Create middleware that updates user.type in responses
const userTypeMiddleware = createPathMiddleware({
  key: 'userType',
  label: 'User Type',
  description: 'Sets the user type in response payloads',
  path: 'user.type',
  type: 'select',
  options: [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' },
    { value: 'guest', label: 'Guest' },
  ],
  defaultValue: 'member',
});

// Attach to specific plugins and register with platform
userTypeMiddleware.attachTo(['user', 'user-profile'], platform);
```

### Enhanced Context Information

All middleware transformation functions receive the complete context information:

```typescript
type MiddlewareContext = {
  plugin: Plugin;                    // The plugin being processed
  request?: any;                     // The incoming request (if any)
  response: any;                     // The current response being transformed
  settings: Record<string, any>;     // All middleware-specific settings
  // Enhanced context information
  featureFlags: Record<string, boolean>;  // Current feature flag state
  currentStatus: number;                    // Current response status code
  endpointScenario?: string;               // Current endpoint scenario
  activeScenario?: string;                 // Current global scenario
};
```

This means every middleware can check feature flags, status codes, scenarios, and more!

### Path Middleware (Simplified)

The `createPathMiddleware` function handles both single and multiple paths:

```typescript
import { createPathMiddleware } from 'msw-platform-core';

// Single path
const userTypeMiddleware = createPathMiddleware({
  key: 'userType',
  label: 'User Type',
  type: 'select',
  options: [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' },
  ],
  paths: [
    { path: 'user.type', settingKey: 'userType' },
  ],
});

// Multiple paths
const contractMiddleware = createPathMiddleware({
  key: 'contractType',
  label: 'Contract Type',
  type: 'select',
  options: [
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Standard' },
  ],
  paths: [
    { path: 'user.type', settingKey: 'userType' },
    { path: 'contract.user.type', settingKey: 'userType' },
  ],
});

userTypeMiddleware.attachTo(['user'], platform);
contractMiddleware.attachTo(['user', 'contracts'], platform);
```

### Custom Middleware with Full Context

Create custom middleware that leverages all available context information:

```typescript
import { createCustomMiddleware } from 'msw-platform-core';

// Feature flag aware middleware
const experimentalMiddleware = createCustomMiddleware({
  key: 'experimentalFeature',
  label: 'Experimental Feature',
  type: 'boolean',
  transform: (response, context) => {
    const { experimentalFeature } = context.settings;
    const { featureFlags } = context;
    
    // Only apply if experimental flag is enabled AND setting is true
    if (featureFlags.EXPERIMENTAL_HELLO && experimentalFeature) {
      return { ...response, experimental: { enabled: true } };
    }
    return response;
  },
});

// Status-aware middleware
const errorHandlingMiddleware = createCustomMiddleware({
  key: 'errorMessage',
  label: 'Error Message',
  type: 'text',
  transform: (response, context) => {
    const { errorMessage } = context.settings;
    const { currentStatus } = context;
    
    // Only apply to error status codes
    if ((currentStatus === 404 || currentStatus === 500) && errorMessage) {
      return { ...response, error: { ...response.error, message: errorMessage } };
    }
    return response;
  },
});

// Scenario-aware middleware
const scenarioMiddleware = createCustomMiddleware({
  key: 'scenarioOverride',
  label: 'Scenario Override',
  type: 'select',
  transform: (response, context) => {
    const { scenarioOverride } = context.settings;
    const { endpointScenario } = context;
    
    // Only apply if we have a scenario and setting
    if (endpointScenario && scenarioOverride) {
      return { ...response, user: { ...response.user, permissions: scenarioOverride } };
    }
    return response;
  },
});

// Complex middleware with all context
const advancedMiddleware = createCustomMiddleware({
  key: 'advancedTransform',
  label: 'Advanced Transform',
  type: 'text',
  transform: (response, context) => {
    const { advancedTransform } = context.settings;
    const { featureFlags, currentStatus, endpointScenario, plugin } = context;
    
    // Complex condition using all context information
    if (featureFlags.EXPERIMENTAL && currentStatus === 200 && endpointScenario === 'admin') {
      return {
        ...response,
        enhanced: true,
        userType: advancedTransform,
        context: {
          pluginId: plugin.id,
          status: currentStatus,
          scenario: endpointScenario,
          experimentalEnabled: featureFlags.EXPERIMENTAL,
        },
      };
    }
    return response;
  },
  // Optional custom badge function with full context
  badge: (context) => {
    const { advancedTransform } = context.settings;
    const { featureFlags, currentStatus, endpointScenario } = context;
    
    if (!advancedTransform) return null;
    
    // Show different badge text based on context
    if (featureFlags.EXPERIMENTAL && currentStatus === 200 && endpointScenario === 'admin') {
      return `Advanced: ${advancedTransform} (Enhanced)`;
    }
    
    return `Advanced: ${advancedTransform}`;
  },
});

experimentalMiddleware.attachTo(['hello'], platform);
errorHandlingMiddleware.attachTo(['user', 'user-status'], platform);
scenarioMiddleware.attachTo(['user-status'], platform);
advancedMiddleware.attachTo(['user'], platform);
```

### Static Configuration (Recommended)

The cleanest approach is to declare middleware directly in your plugin definitions:

```typescript
const userTypeMiddleware = createPathMiddleware({
  key: 'userType',
  label: 'User Type',
  description: 'Sets user.type in response payloads',
  type: 'select',
  options: [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' },
  ],
  paths: [
    { path: 'user.type', settingKey: 'userType' },
  ],
});

const platform = createMockPlatform({
  name: 'my-app',
  plugins: [
    {
      id: 'user',
      componentId: 'User',
      endpoint: '/api/user',
      method: 'GET',
      responses: { 200: { user: { type: 'member' } } },
      defaultStatus: 200,
      // ✅ Middleware automatically registered and attached
      useMiddleware: [userTypeMiddleware],
    },
  ],
});
```

### Runtime Registration (Optional)

For dynamic middleware or shared middleware across multiple plugins:

```typescript
// Option 1: Register immediately with platform
const contractMiddleware = createPathMiddleware({
  key: 'contractType',
  label: 'Contract Type',
  type: 'select',
  paths: [
    { path: 'user.type', settingKey: 'userType' },
    { path: 'contract.user.type', settingKey: 'userType' },
  ],
});

// Attach and register in one step
contractMiddleware.attachTo(['user', 'contracts'], platform);

// Option 2: Attach first, register later
const authMiddleware = createPathMiddleware({
  key: 'authToken',
  label: 'Auth Token',
  type: 'text',
  paths: [
    { path: 'auth.token', settingKey: 'authToken' },
  ],
});

// Attach to plugins and register with platform
authMiddleware.attachTo(['user', 'profile'], platform);
```

**Key Benefits:**
- **`useMiddleware`**: Everything handled automatically - registration, settings, badges, and plugin attachment
- **`attachTo(plugins, platform)`**: One-step registration and attachment
- **`attachTo(plugins)`**: Just attachment, register later if needed
- **No redundant calls**: Each method handles its own registration

### Advanced Examples: Complex Transformations

#### Custom Transformations with Full Context

For complex scenarios, use custom middleware with full context access:

```typescript
import { createCustomMiddleware } from 'msw-platform-core';

const statusOverrideMiddleware = createCustomMiddleware({
  key: 'statusOverride',
  label: 'Status Override',
  description: 'Overrides status based on user type, contract type, and feature flags',
  type: 'select',
  options: [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' },
  ],
  defaultValue: 'active',
  transform: (response, context) => {
    const { statusOverride, userType, contractType } = context.settings;
    const { featureFlags, currentStatus } = context;
    
    // Only override if user is admin or contract is premium, and experimental flag is enabled
    if ((userType === 'admin' || contractType === 'premium') && 
        statusOverride && 
        featureFlags.EXPERIMENTAL_STATUS_OVERRIDE) {
      return { ...response, status: statusOverride };
    }
    
    return response;
  },
});

statusOverrideMiddleware.attachTo(['user-status'], platform);
```

### Runtime Registration for Dynamic Middleware

For middleware that might be added conditionally or shared across multiple plugins:

```typescript
// Create reusable middleware
const authMiddleware = createPathMiddleware({
  key: 'authToken',
  label: 'Auth Token',
  description: 'Adds authentication token to responses',
  path: 'auth.token',
  type: 'text',
  defaultValue: 'mock-token-123',
});

// Runtime attachment - flexible and reusable
authMiddleware.attachTo(['user', 'profile', 'settings'], platform);
```

### Array and Nested Path Updates

The middleware system supports complex path updates including arrays:

```typescript
const arrayMiddleware = createPathMiddleware({
  key: 'arraySettings',
  label: 'Array Settings',
  description: 'Updates values in arrays and nested objects',
  type: 'select',
  options: [
    { value: 'enabled', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' },
  ],
  defaultValue: 'enabled',
  paths: [
    { path: 'users.0.type', settingKey: 'arraySettings' },
    { path: 'users.1.type', settingKey: 'arraySettings' },
    { path: 'config.features.0.status', settingKey: 'arraySettings' },
  ],
});
```

### Conditional Middleware

Apply middleware only when certain conditions are met:

```typescript
const conditionalMiddleware = createCustomMiddleware({
  key: 'conditionalOverride',
  label: 'Conditional Override',
  description: 'Only applies when specific conditions are met',
  type: 'boolean',
  defaultValue: false,
  transform: (response, context) => {
    const { conditionalOverride, userType } = context.settings;
    const { featureFlags, currentStatus } = context;
    
    // Only apply if enabled AND user is admin AND experimental flag is on AND status is 200
    if (conditionalOverride && userType === 'admin' && 
        featureFlags.EXPERIMENTAL && currentStatus === 200) {
      return {
        ...response,
        adminOnly: true,
        timestamp: new Date().toISOString(),
      };
    }
    
    return response;
  },
});
```

### Why Use the Helper Functions?

#### Without Helpers (Manual Approach)
```typescript
// ❌ Manual middleware creation - verbose and error-prone
const manualMiddleware = {
  middleware: (payload, context, next) => {
    const userType = context.settings.userType;
    if (userType !== undefined) {
      // Manual deep cloning and path traversal
      const cloned = JSON.parse(JSON.stringify(payload));
      if (cloned.user && typeof cloned.user === 'object') {
        cloned.user.type = userType;
      }
      return next(cloned);
    }
    return next(payload);
  },
};

// ❌ Manual plugin attachment (no UI registration possible)
platform.useOnPlugin('user', manualMiddleware.middleware);
```

#### With Helpers (Clean Approach)
```typescript
// ✅ Clean, declarative, and type-safe
const userTypeMiddleware = createPathMiddleware({
  key: 'userType',
  label: 'User Type',
  description: 'Sets user.type in response payloads',
  type: 'select',
  options: [
    { value: 'member', label: 'Member' },
    { value: 'admin', label: 'Admin' },
  ],
  paths: [
    { path: 'user.type', settingKey: 'userType' },
  ],
});

// ✅ Everything handled automatically
userTypeMiddleware.attachTo(['user'], platform);
```

### Benefits of the Helper Functions

1. **🎯 Self-Documenting**: Configuration clearly shows what the middleware does
2. **🛡️ Type-Safe**: Full TypeScript support with proper interfaces
3. **⚡ Automatic**: Settings, badges, and plugin attachment handled automatically
4. **🔄 Reusable**: Same middleware can be attached to multiple plugins
5. **📦 All-in-One**: Middleware logic, UI controls, and configuration in one place
6. **🧪 Testable**: Helper functions are thoroughly tested and robust

### Middleware Utilities

For advanced use cases, you can also use the utility functions directly:

```typescript
import { updateValueAtPath, updateMultiplePaths, findPaths } from 'msw-platform-core';

// Update a single path
const updated = updateValueAtPath(response, 'user.type', 'admin');

// Update multiple paths
const updated = updateMultiplePaths(response, [
  { path: 'user.type', value: 'admin' },
  { path: 'contract.type', value: 'premium' },
]);

// Find all matching paths with wildcards
const paths = findPaths(response, 'users.*.type'); // ['users.0.type', 'users.1.type']
```

The middleware system provides a powerful, flexible way to transform your mock responses dynamically while keeping your code clean and maintainable.

--- 

## Popup Mock UI Widget

The Popup Mock UI widget provides a floating control panel for toggling mock endpoints, feature flags, and groups at runtime. It works seamlessly with the MSW adapter and persists your changes across browser sessions.

### Usage

1. **Register your endpoints and feature flags with the platform:**

```ts
import { createMockPlatform } from 'msw-platform-core'

const platform = createMockPlatform()
// ...register endpoints, feature flags, etc.
```

2. **Add the Popup UI widget to your app:**

```tsx
import MockUI from 'msw-platform-core'

function App() {
  return (
    <>
      {/* ...your app... */}
      <MockUI platform={platform} />
    </>
  )
}
```

3. **Control your mocks at runtime:**

- Open the floating widget (bottom-right).
- Toggle endpoints on/off, change status codes, manage groups, enable/disable feature flags and manage your middleware settings
- Changes are saved to localStorage and persist across reloads.
