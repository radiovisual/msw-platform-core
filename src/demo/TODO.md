# Project TODO List

## Development Tasks

### Table Implementation
- [x] Create working contract table with clickable rows
- [x] Create working search filter
- [ ] Adjust the search filter with the new rules (TBD if any)
- [ ] Create working row selection to drill down to next table
- [ ] Create working column sorting (TBD)
- [ ] Create working column filtering (TBD)

### API Integration
- [x] Create contracts API client
- [x] Create sync status API client
- [ ] Update the sync status endpoint with the real endpoint data (and the msw mocks)


### UI Components
- [x] Create SyncStatus component
- [x] Implement proper sync status display with icons and error messages
- [ ] Create proper loading states for all components
- [ ] Create proper error boundaries
- [ ] Use Snackbar for error messages from endpoints
- [ ] Review error handling 
- [ ] Add Routing support

### Styling & Design
- [x] Add LESS support to Storybook
- [x] Add basic styles to the contracts table
- [x] Style the sync status component


### Data Management
- [x] Create proper contract data generation
- [x] Create proper sync status mock responses
- [ ] Add data validation and error handling

### Testing & Quality
- [ ] Add unit tests for all components
- [ ] Add integration tests for API clients
- [ ] Add Storybook stories for all components
- [ ] Add accessibility testing
- [ ] Add performance testing
- [ ] Auto-publish the storybooks to GitHub pages

### Documentation
- [ ] Document all API endpoints
- [ ] Document component usage
- [ ] Create development guidelines
- [ ] Add inline code documentation

## Bug Fixes & Improvements

### Known Issues
- [ ] Fix table height issues on smaller screens
- [ ] Improve error handling for network failures
- [ ] Add proper loading states during data fetching

### Performance Optimizations
- [ ] Implement virtual scrolling for large datasets. (Q: Do we need this?)
- [ ] Add proper memoization for expensive calculations  (Q: Do we need this?)
- [ ] Optimize bundle size
- [ ] Add lazy loading for components
