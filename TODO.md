# TODO: mock-platform-core Migration & Development

## Core API
- [x] Define TypeScript types for Plugin, Response, FeatureFlag, Scenario
- [x] Implement plugin/flag registry (platform.ts)
- [x] Implement registration API (createMockPlatform)
- [x] Implement handler generation for MSW (next)
- [x] Implement persistence abstraction (localStorage, session, in-memory)
- [x] Add status code override support
- [x] Add scenario registration and activation
- [x] Add edge case handling (missing plugin, missing status, scenario not found)

## Adapters
- [x] MSW adapter: generate handlers from core API
- [ ] Storybook adapter: generate handlers from core API
- [ ] Cypress adapter: generate handlers from core API

## UI
- [ ] Port PopupUI to a reusable React component (ui/MockUI.tsx)
- [ ] Refactor UI to use core API and update state without reloads
- [ ] Add support for toggling feature flags, status codes, and scenarios

## Documentation
- [x] Write usage examples for React app, Storybook, Cypress
- [ ] Document core API and adapters


## Migration Steps
- [x] Identify reusable logic in src/mocks/pluginRegistry.ts and src/components/PopupUI.tsx
- [x] Move and refactor registry logic to core package
- [ ] Move and refactor UI logic to core/ui or separate UI package
- [ ] Update demo app to use new core package for mocks and UI 