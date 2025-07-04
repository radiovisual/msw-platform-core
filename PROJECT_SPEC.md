# Project Specification: mock-platform-core

## File/Module Structure

- mock-platform-core/
  - README.md
  - PROJECT_SPEC.md
  - TODO.md
  - src/
    - index.ts                # Entry point, exports core API
    - platform.ts             # Core platform logic (plugin/flag registry)
    - types.ts                # TypeScript types/interfaces
    - persistence.ts          # Persistence abstraction (localStorage, etc.)
    - adapters/
      - msw.ts                # MSW adapter
      - storybook.ts          # Storybook adapter
      - cypress.ts            # Cypress adapter
    - ui/
      - MockUI.tsx            # Embeddable React UI (optional, or in separate package)

## High-Level Development Plan

1. **Core API**
   - [ ] Define types for plugins, responses, feature flags, scenarios
   - [ ] Implement plugin/flag registry
   - [ ] Implement registration API
   - [ ] Implement handler generation (for MSW, etc.)
   - [ ] Implement persistence abstraction

2. **Adapters**
   - [ ] MSW adapter: generate handlers for MSW
   - [ ] Storybook adapter: generate handlers for Storybook
   - [ ] Cypress adapter: generate handlers for Cypress

3. **UI**
   - [ ] Embeddable React component for toggling flags, status codes, etc.
   - [ ] UI should consume the core API and update state without reloads

4. **Documentation & Examples**
   - [ ] Usage examples for each environment
   - [ ] API documentation
   - [ ] Migration guide from demo app

## Guiding Principles
- Minimal config: just supply JSON payloads, endpoints, and flags
- Environment-agnostic: works in dev, Storybook, Cypress, etc.
- Extensible: easy to add new adapters or UI features
- Portable: can be published as an npm package 