# CLAUDE.md

IMPORTANT! You must ignore all the files in the src/demo project completely when doing all your file searches and code analaysis and refactors unless you are explicitly told to work on the demo project.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Testing
- `npm run build` - Compiles TypeScript to JavaScript in the `dist/` directory
- `npm run test` - Runs TypeScript type checking followed by Jest tests
- `npm run typecheck` - Runs TypeScript compiler without emitting files
- `npm run lint` - Runs ESLint and fixes auto-fixable issues
- `npm run format` - Formats code with Prettier

### Storybook
- `npm run storybook` - Starts Storybook dev server on port 6006
- `npm run build-storybook` - Builds Storybook for production

### Single Test Execution
- `jest path/to/specific.test.ts` - Run a specific test file
- `jest --testNamePattern="test name"` - Run tests matching a pattern

## Architecture Overview

This is a **mock platform core** library that provides a reusable system for mocking API endpoints across different environments (MSW, Storybook, tests). The architecture follows a plugin-based approach:

### Core Components

**MockPlatformCore** (`src/classes/MockPlatformCore.ts`):
- Central orchestrator managing plugins, feature flags, scenarios, and middleware
- Handles persistence through pluggable storage providers
- Manages response transformation and middleware application
- Tracks status/delay overrides and endpoint scenarios

**Plugin System** (`src/types.ts`):
- Plugins define mock endpoints with responses, scenarios, and middleware
- Support for dynamic route matching (`:id` parameters) and query response variations
- Custom response headers and multiple content types (JSON, HTML, XML, binary)
- Configurable response delays and endpoint scenarios
- Transform methods for runtime response customization

**Adapters** (`src/adapters/`):
- `msw.ts` - Generates MSW handlers for browser/Node.js environments
- `storybook.ts` - Semantic alias for MSW adapter, designed for Storybook integration
- Both support passthrough mode to disable specific mocks

**Middleware System** (`src/classes/PlatformMiddleware.ts`):
- Dynamic response transformation based on runtime settings
- Helper functions for path-based updates and custom transformations
- Context-aware middleware with access to feature flags, scenarios, and status codes
- UI integration for runtime control

**UI Components** (`src/ui/`):
- `MockUI.tsx` - Embeddable React component for runtime mock control
- Tabs for endpoints, feature flags, groups, and dynamic settings
- Floating widget with persistence across browser sessions

### Key Design Patterns

1. **Plugin-based Architecture**: Each API endpoint is a plugin with its own configuration, responses, and middleware
2. **Adapter Pattern**: Different environments (MSW, Storybook) use adapters to generate appropriate handlers
3. **Middleware Chain**: Plugins can apply multiple middleware transformations in sequence
4. **Persistence Abstraction**: Pluggable storage (localStorage, in-memory, custom) via `PersistenceProvider` interface
5. **Context-Rich Transformations**: Middleware receives full context including feature flags, scenarios, and current state

### TypeScript Configuration

- Target: ES6 with CommonJS modules
- Strict mode enabled
- Outputs both JavaScript and declaration files to `dist/`
- Jest types and DOM types included

### Testing Setup

- Jest with jsdom environment for React component testing
- ts-jest preset for TypeScript support
- Setup file provides polyfills for TextEncoder, fetch API, and BroadcastChannel
- Testing Library for React component testing

The codebase emphasizes type safety, modularity, and runtime flexibility while maintaining backward compatibility with simple response definitions.

## Important React Patterns & Common Pitfalls

### Component Identity and Focus Management

**Critical Issue Resolved**: Search input typing interruption due to component unmounting/remounting.

**Root Cause**: Function components defined inside render methods cause React to create new function instances on every re-render, leading to complete component tree unmounting/remounting.

**Example of the Problem**:
```jsx
// ❌ BAD - Creates new function on every render
const ParentComponent = () => {
  const [state, setState] = useState();
  
  const ChildComponent = () => (  // This function is recreated every render!
    <div>Child content</div>
  );
  
  return <ChildComponent />;  // React sees this as a different component each time
};
```

**Solution**: Use `useMemo` to memoize component content:
```jsx
// ✅ GOOD - Memoized component content
const ParentComponent = () => {
  const [state, setState] = useState();
  
  const childContent = useMemo(() => (
    <div>Child content</div>
  ), [dependencies]);
  
  return {childContent};
};
```

**Additional Safeguards Applied**:
1. **Stable `key` props**: Always provide explicit keys for components that manage focus
2. **React state over platform methods**: Use React state for UI updates instead of calling platform methods that might return new object references
3. **Focus restoration**: Implement focus restoration in input components as a backup safety mechanism

**Files involved in the fix**:
- `src/ui/MockUI.tsx`: Memoized MockUIContent with proper dependencies
- `src/ui/components/EndpointsTab.tsx`: Added stable key props
- `src/ui/components/SearchBar.tsx`: Enhanced focus restoration logic

**Regression Tests**: 
- `src/ui/components/SearchFocusRegression.test.tsx`
- `src/ui/ComponentIdentityRegression.test.tsx`

This pattern is critical for any UI components that manage focus, input state, or complex component trees.

### State Synchronization Between Platform and React

**Critical Issue Resolved**: Delayed or missing UI updates when platform state changes.

**Root Cause**: React components calling platform methods directly without corresponding React state to trigger re-renders.

**Example of the Problem**:
```jsx
// ❌ BAD - React doesn't know when platform state changes
const MyComponent = ({ platform }) => (
  <div>
    Status: {platform.isGloballyDisabled() ? 'Disabled' : 'Enabled'}
    <button onClick={() => platform.setGlobalDisable(true)}>
      Disable
    </button>
  </div>
);
```

**Solution**: Mirror platform state in React state for immediate UI updates:
```jsx
// ✅ GOOD - React state mirrors platform state
const MyComponent = ({ platform }) => {
  const [globalDisable, setGlobalDisable] = useState(() => platform.isGloballyDisabled());
  
  const handleToggle = useCallback(() => {
    const newValue = !globalDisable;
    platform.setGlobalDisable(newValue);
    setGlobalDisable(newValue);  // Sync React state immediately
  }, [platform, globalDisable]);
  
  return (
    <div>
      Status: {globalDisable ? 'Disabled' : 'Enabled'}
      <button onClick={handleToggle}>
        {globalDisable ? 'Enable' : 'Disable'}
      </button>
    </div>
  );
};
```

**Key Principles**:
1. **Mirror Platform State**: Create React state variables for any platform state that affects UI rendering
2. **Immediate Sync**: Update both platform and React state simultaneously in event handlers
3. **Consistent Props**: Pass React state (not platform methods) to child components
4. **Memoization Dependencies**: Include React state in useMemo/useCallback dependencies

**Files involved in the fix**:
- `src/ui/MockUI.tsx`: Added `globalDisable` React state, updated handlers and dependencies
- `src/ui/components/DynamicSettingsTab.tsx`: Receives `globalDisable` as prop instead of reading from platform

**Regression Tests**: 
- `src/ui/GlobalDisableRegression.test.tsx`

This pattern ensures immediate, consistent UI updates across all components and prevents state synchronization delays.