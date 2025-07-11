# CLAUDE.md

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