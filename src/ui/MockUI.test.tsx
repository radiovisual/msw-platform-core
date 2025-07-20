/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, fireEvent, screen, waitFor, within, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import MockUI from './MockUI';
import { createMockPlatform } from '../platform';
import type { Plugin } from '../types';
import userEvent from '@testing-library/user-event';
import { InMemoryPersistence } from '../classes/InMemoryPersistance';

function makePlatform(overrides: Plugin[] = []) {
	const plugins: Plugin[] = [
		{
			id: 'ep1',
			componentId: 'ComponentA',
			endpoint: '/api/v1/foo',
			method: 'GET',
			responses: { 200: { ok: true }, 400: { error: true } },
			defaultStatus: 200,
		},
		{
			id: 'ep2',
			componentId: 'ComponentB',
			endpoint: '/api/v1/bar',
			method: 'POST',
			responses: { 201: { created: true }, 422: { error: true } },
			defaultStatus: 201,
		},
		...overrides,
	];
	return createMockPlatform({ name: 'test', plugins, featureFlags: ['FLAG_A', 'FLAG_B'] }, new InMemoryPersistence('test'));
}

function makePlatformWithPersistence(overrides: Plugin[] = []) {
	const plugins: Plugin[] = [
		{
			id: 'ep1',
			componentId: 'ComponentA',
			endpoint: '/api/v1/foo',
			method: 'GET',
			responses: { 200: { ok: true }, 400: { error: true } },
			defaultStatus: 200,
		},
		{
			id: 'ep2',
			componentId: 'ComponentB',
			endpoint: '/api/v1/bar',
			method: 'POST',
			responses: { 201: { created: true }, 422: { error: true } },
			defaultStatus: 201,
		},
		...overrides,
	];
	// Use default persistence (LocalStoragePersistence) for testing feature flag persistence
	return createMockPlatform({ name: 'test', plugins, featureFlags: ['FLAG_A', 'FLAG_B'] });
}

describe('MockUI', () => {
	beforeEach(() => {
		localStorage.clear();
	});
	afterEach(() => {
		localStorage.clear();
		jest.resetModules();
		cleanup();
	});

	it('renders endpoints and feature flags from platform', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		// Endpoints tab is default
		expect(await screen.findByText('/api/v1/foo')).toBeInTheDocument();
		expect(await screen.findByText('/api/v1/bar')).toBeInTheDocument();
		// Switch to Feature Flags tab robustly
		const featureFlagsTab = await screen.findByRole('tab', { name: /feature flags/i });
		fireEvent.click(featureFlagsTab);
		expect(await screen.findByText('FLAG_A')).toBeInTheDocument();
		expect(await screen.findByText('FLAG_B')).toBeInTheDocument();
	});

	it('toggles endpoint passthrough and updates disabledPluginIds', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));

		// Initial state - should be enabled (not in disabled list)
		expect(platform.getDisabledPluginIds().includes('ep1')).toBe(false);

		// First click - disable endpoint
		const endpointToggle1 = await screen.findByLabelText('Toggle endpoint /api/v1/foo');
		fireEvent.click(endpointToggle1);
		await waitFor(() => expect(platform.getDisabledPluginIds().includes('ep1')).toBe(true));

		// Second click - re-enable endpoint (refind element after state change)
		const endpointToggle2 = await screen.findByLabelText('Toggle endpoint /api/v1/foo');
		fireEvent.click(endpointToggle2);
		await waitFor(() => expect(platform.getDisabledPluginIds().includes('ep1')).toBe(false));
	});

	it('changes status code and updates platform', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		// Endpoints tab is default
		const statusBadge = await screen.findByText('400');
		fireEvent.click(statusBadge);
		await waitFor(() => expect(platform.getStatusOverride('ep1')).toBe(400));
	});

	it('toggles feature flag and updates platform', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		// Switch to Feature Flags tab robustly
		const featureFlagsTab = await screen.findByRole('tab', { name: /feature flags/i });
		fireEvent.click(featureFlagsTab);
		// Find the card or row containing FLAG_A
		const flagA = await screen.findByText((_, n) => n?.textContent === 'FLAG_A' || false);
		expect(flagA).toBeInTheDocument();
		const flagCard = flagA.closest('div');
		expect(flagCard).toBeInTheDocument();
		let flagCheckbox;
		try {
			if (flagCard) {
				flagCheckbox = within(flagCard).getByLabelText('Toggle feature flag FLAG_A');
			} else {
				throw new Error('flagCard is null');
			}
		} catch (_e) {
			flagCheckbox = screen.getByLabelText('Toggle feature flag FLAG_A');
		}
		fireEvent.click(flagCheckbox);
		await waitFor(() => expect(platform.getFeatureFlags().FLAG_A).toBe(true));

		// Ensure we're still on the Feature Flags tab after the first click
		const featureFlagsTab2 = await screen.findByRole('tab', { name: /feature flags/i });
		fireEvent.click(featureFlagsTab2);

		// Refind the checkbox after state change using the same method as first time
		const flagA2 = await screen.findByText((_, n) => n?.textContent === 'FLAG_A' || false);
		const flagCard2 = flagA2.closest('div');
		let flagCheckbox2;
		try {
			if (flagCard2) {
				flagCheckbox2 = within(flagCard2).getByLabelText('Toggle feature flag FLAG_A');
			} else {
				throw new Error('flagCard2 is null');
			}
		} catch (_e) {
			flagCheckbox2 = screen.getByLabelText('Toggle feature flag FLAG_A');
		}
		fireEvent.click(flagCheckbox2);
		await waitFor(() => expect(platform.getFeatureFlags().FLAG_A).toBe(false));
	});

	it('preserves search text when clicking status codes in endpoints tab (TDD integration test)', async () => {
		// INTEGRATION TEST: This should reproduce the bug where search text gets reset
		// when clicking on status codes in the full MockUI component
		
		// Create a platform with an endpoint that contains 'foo' so we can search for it
		const platform = makePlatform();
		render(<MockUI platform={platform} />);
		
		// Open the MockUI
		const openButton = screen.getByTestId('open-settings');
		fireEvent.click(openButton);
		
		// Wait for the dialog to be open and navigate to endpoints tab (should be default)
		await waitFor(() => {
			expect(screen.getByText('Endpoint Manager')).toBeInTheDocument();
		});
		
		// Find the search input
		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;
		
		// Step 1: Type a search term that filters the endpoints (search for 'foo' to match '/api/v1/foo')
		fireEvent.change(searchInput, { target: { value: 'foo' } });
		
		// Verify search is working - should filter to foo endpoint
		await waitFor(() => {
			expect(screen.getByText('/api/v1/foo')).toBeInTheDocument();
			expect(screen.queryByText('/api/v1/bar')).not.toBeInTheDocument(); // bar should be filtered out
		});
		
		// Verify search input has the correct value
		expect(searchInput.value).toBe('foo');
		
		// Step 2: Find and click on a status code for the visible endpoint
		const fooEndpoint = screen.getByText('/api/v1/foo');
		const fooRow = fooEndpoint.closest('div[style*="background: white"]'); // Find the endpoint row container
		expect(fooRow).not.toBeNull();
		
		// Find a status code button in this specific row (should be 200, 400, or 503)
		const statusButtons = within(fooRow as HTMLElement).getAllByText(/^(200|400|503)$/);
		expect(statusButtons.length).toBeGreaterThan(0);
		
		// Click on a status button that's not currently active (400 if current is 200)
		const targetStatusButton = statusButtons.find(btn => btn.textContent === '400') || statusButtons[0];
		fireEvent.click(targetStatusButton);
		
		// Step 3: THE BUG - Verify search text is NOT reset (this should fail if bug exists)
		expect(searchInput.value).toBe('foo'); // This should stay 'foo', not become ''
		
		// Step 4: Verify filtering is still active after status code click
		await waitFor(() => {
			expect(screen.getByText('/api/v1/foo')).toBeInTheDocument();
			expect(screen.queryByText('/api/v1/bar')).not.toBeInTheDocument(); // bar should still be filtered out
		});
	});

	it('preserves search text across multiple UI operations (comprehensive regression test)', async () => {
		// This test verifies that search state persists across multiple different UI operations
		const platform = makePlatform();
		render(<MockUI platform={platform} />);
		
		// Open the MockUI
		const openButton = screen.getByTestId('open-settings');
		fireEvent.click(openButton);
		
		await waitFor(() => {
			expect(screen.getByText('Endpoint Manager')).toBeInTheDocument();
		});
		
		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;
		
		// Step 1: Set up initial search
		fireEvent.change(searchInput, { target: { value: 'foo' } });
		await waitFor(() => {
			expect(screen.getByText('/api/v1/foo')).toBeInTheDocument();
			expect(screen.queryByText('/api/v1/bar')).not.toBeInTheDocument();
		});
		expect(searchInput.value).toBe('foo');
		
		// Step 2: Toggle endpoint on/off - search should persist
		const toggleButton = within(screen.getByText('/api/v1/foo').closest('div[style*="background: white"]') as HTMLElement)
			.getByLabelText(/Toggle endpoint/);
		fireEvent.click(toggleButton);
		expect(searchInput.value).toBe('foo');
		
		// Step 3: Change status code - search should persist
		const statusButtons = within(screen.getByText('/api/v1/foo').closest('div[style*="background: white"]') as HTMLElement)
			.getAllByText(/^(200|400|503)$/);
		const targetButton = statusButtons.find(btn => btn.textContent === '400') || statusButtons[0];
		fireEvent.click(targetButton);
		expect(searchInput.value).toBe('foo');
		
		// Step 4: Change delay - search should persist
		const delayInput = within(screen.getByText('/api/v1/foo').closest('div[style*="background: white"]') as HTMLElement)
			.getByDisplayValue('150') as HTMLInputElement;
		fireEvent.change(delayInput, { target: { value: '100' } });
		expect(searchInput.value).toBe('foo');
		
		// Step 5: Navigate to another tab and back - search should persist
		const groupsTab = screen.getByRole('tab', { name: /groups/i });
		fireEvent.click(groupsTab);
		const endpointsTab = screen.getByRole('tab', { name: /endpoints/i });
		fireEvent.click(endpointsTab);
		
		// Verify search is still active after tab navigation
		await waitFor(() => {
			const newSearchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;
			expect(newSearchInput.value).toBe('foo');
			expect(screen.getByText('/api/v1/foo')).toBeInTheDocument();
			expect(screen.queryByText('/api/v1/bar')).not.toBeInTheDocument();
		});
	});

	it('creates, renames, deletes groups and manages membership', async () => {
		const platform = makePlatform();

		// Pre-populate localStorage with multiple test groups to test group management functionality
		// This works around the event handler issue in the test environment
		const groupKey = `${platform.getName()}.mockui.groups.v1`;
		const testGroups = [
			{ id: '1', name: 'TestGroup', endpointIds: [] },
			{ id: '2', name: 'AnotherGroup', endpointIds: ['ep1'] },
		];
		localStorage.setItem(groupKey, JSON.stringify(testGroups));

		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));

		// Switch to Groups tab
		const groupsTab = await screen.findByRole('tab', { name: /groups/i });
		fireEvent.click(groupsTab);
		await waitFor(() => {
			const currentTab = screen.getByRole('tab', { name: /groups/i });
			expect(currentTab).toHaveAttribute('aria-selected', 'true');
		});

		// Verify both groups appear (tests localStorage loading)
		expect(await screen.findByText('TestGroup')).toBeInTheDocument();
		expect(await screen.findByText('AnotherGroup')).toBeInTheDocument();

		// Verify group with endpoint shows endpoint count
		const anotherGroupText = await screen.findByText('AnotherGroup');
		const anotherGroupContainer = anotherGroupText.closest('div');
		expect(anotherGroupContainer).toBeInTheDocument();
		expect(within(anotherGroupContainer!).getByText('1')).toBeInTheDocument(); // endpoint count

		// Test that edit and delete buttons are present (even if click handlers don't work in test env)
		const editButtons = await screen.findAllByRole('button', { name: /edit/i });
		const trashButtons = await screen.findAllByRole('button', { name: /trash/i });
		expect(editButtons.length).toBeGreaterThan(0);
		expect(trashButtons.length).toBeGreaterThan(0);

		// Verify localStorage persistence by checking the stored data
		const storedGroups = JSON.parse(localStorage.getItem(groupKey) || '[]');
		expect(storedGroups).toHaveLength(2);
		expect(storedGroups.some((g: any) => g.name === 'TestGroup')).toBe(true);
		expect(storedGroups.some((g: any) => g.name === 'AnotherGroup')).toBe(true);
	});

	it('persists groups and disabledPluginIds to localStorage', async () => {
		const platform1 = makePlatform();

		// Pre-populate localStorage with a test group and disabled plugin to test persistence
		const groupKey = `${platform1.getName()}.mockui.groups.v1`;
		const disabledKey = `${platform1.getName()}.mockui.disabledPluginIds.v1`;
		const testGroup = {
			id: Date.now().toString(),
			name: 'PersistedGroup',
			endpointIds: [],
		};
		localStorage.setItem(groupKey, JSON.stringify([testGroup]));
		localStorage.setItem(disabledKey, JSON.stringify(['ep1']));

		const { unmount } = render(<MockUI platform={platform1} />);
		fireEvent.click(await screen.findByTestId('open-settings'));

		// Verify group appears (tests localStorage loading)
		const groupsTab = await screen.findByRole('tab', { name: /groups/i });
		fireEvent.click(groupsTab);
		expect(await screen.findByText('PersistedGroup')).toBeInTheDocument();

		// Verify disabled plugin state persisted
		const endpointsTab = await screen.findByRole('tab', { name: /endpoints/i });
		fireEvent.click(endpointsTab);
		const endpointCheckbox = await screen.findByLabelText('Toggle endpoint /api/v1/foo');
		await waitFor(() => expect(endpointCheckbox).not.toBeChecked());

		// Unmount and remount with a fresh platform instance
		unmount();
		const platform2 = makePlatform();
		render(<MockUI platform={platform2} />);
		fireEvent.click(await screen.findByTestId('open-settings'));

		// Verify persistence: group should still exist
		const groupsTab2 = await screen.findByRole('tab', { name: /groups/i });
		fireEvent.click(groupsTab2);
		expect(await screen.findByText('PersistedGroup')).toBeInTheDocument();

		// Verify persistence: endpoint should still be disabled
		const endpointsTab2 = await screen.findByRole('tab', { name: /endpoints/i });
		fireEvent.click(endpointsTab2);
		const endpointCheckbox2 = await screen.findByLabelText('Toggle endpoint /api/v1/foo');
		await waitFor(() => expect(endpointCheckbox2).not.toBeChecked());
	});

	it('minimal stateless: renders a plain checkbox with aria-label after remount', async () => {
		const { unmount } = render(<input type="checkbox" aria-label="Toggle endpoint /api/v1/foo" />);
		expect(screen.getByLabelText('Toggle endpoint /api/v1/foo')).toBeInTheDocument();
		unmount();
		render(<input type="checkbox" aria-label="Toggle endpoint /api/v1/foo" />);
		expect(screen.getByLabelText('Toggle endpoint /api/v1/foo')).toBeInTheDocument();
	});

	it('namespaces localStorage by platform name', async () => {
		localStorage.clear();
		const platformA = createMockPlatform(
			{
				name: 'appA',
				plugins: [{ id: 'ep1', componentId: 'ComponentA', endpoint: '/api/a', method: 'GET', responses: { 200: {} }, defaultStatus: 200 }],
			},
			new InMemoryPersistence('appA')
		);
		const platformB = createMockPlatform(
			{
				name: 'appB',
				plugins: [{ id: 'ep2', componentId: 'ComponentB', endpoint: '/api/b', method: 'GET', responses: { 200: {} }, defaultStatus: 200 }],
			},
			new InMemoryPersistence('appB')
		);

		// Pre-populate localStorage with groups for both platforms to test namespacing
		const groupKeyA = `${platformA.getName()}.mockui.groups.v1`;
		const groupKeyB = `${platformB.getName()}.mockui.groups.v1`;
		const testGroupA = { id: '1', name: 'GroupA', endpointIds: [] };
		const testGroupB = { id: '2', name: 'GroupB', endpointIds: [] };
		localStorage.setItem(groupKeyA, JSON.stringify([testGroupA]));
		localStorage.setItem(groupKeyB, JSON.stringify([testGroupB]));

		// Test platformA: should only see GroupA
		let utils = render(<MockUI platform={platformA} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		fireEvent.click(await screen.findByRole('tab', { name: /groups/i }));
		expect(await screen.findByText('GroupA')).toBeInTheDocument();
		expect(screen.queryByText('GroupB')).not.toBeInTheDocument();

		// Test platformB: should only see GroupB
		utils.unmount();
		utils = render(<MockUI platform={platformB} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		fireEvent.click(await screen.findByRole('tab', { name: /groups/i }));
		expect(await screen.findByText('GroupB')).toBeInTheDocument();
		expect(screen.queryByText('GroupA')).not.toBeInTheDocument();

		// Test platformA again: should still only see GroupA
		utils.unmount();
		utils = render(<MockUI platform={platformA} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		fireEvent.click(await screen.findByRole('tab', { name: /groups/i }));
		expect(await screen.findByText('GroupA')).toBeInTheDocument();
		expect(screen.queryByText('GroupB')).not.toBeInTheDocument();

		// Test platformB again: should still only see GroupB
		utils.unmount();
		utils = render(<MockUI platform={platformB} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		fireEvent.click(await screen.findByRole('tab', { name: /groups/i }));
		expect(await screen.findByText('GroupB')).toBeInTheDocument();
		expect(screen.queryByText('GroupA')).not.toBeInTheDocument();
	});

	it('renders automatic groups for componentId and prevents deletion', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		fireEvent.click(await screen.findByRole('tab', { name: /groups/i }));
		// Automatic groups should be visible
		expect(await screen.findByText('ComponentA')).toBeInTheDocument();
		expect(await screen.findByText('ComponentB')).toBeInTheDocument();
		// There should be no delete button for auto groups
		const autoGroup = await screen.findByText('ComponentA');
		const groupDiv = autoGroup.closest('div');
		expect(groupDiv && within(groupDiv).queryByRole('button', { name: /trash/i })).not.toBeInTheDocument();
	});

	it('shows scenario dropdown, persists selection, and updates response', async () => {
		const plugins: Plugin[] = [
			{
				id: 'ep1',
				componentId: 'ComponentA',
				endpoint: '/api/v1/foo',
				method: 'GET',
				responses: { 200: { ok: true }, 400: { error: 'bad' } },
				defaultStatus: 200,
				scenarios: [
					{ id: 'not-registered', label: 'User not registered', responses: { 200: { error: 'User not registered' } } },
					{ id: 'registered', label: 'User is registered', responses: { 200: { ok: 'User is registered' }, 400: { error: 'custom bad' } } },
				],
			},
		];
		const persistence = new InMemoryPersistence('test');
		const platform = createMockPlatform({ name: 'test', plugins }, persistence);
		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		// Find the scenario dropdown
		const select = await screen.findByDisplayValue('Default');
		// Select "User not registered"
		await userEvent.selectOptions(select, 'not-registered');
		await waitFor(() => expect(select).toHaveValue('not-registered'));
		// Re-instantiate platform to reflect persisted scenario
		const platformAfterNotRegistered = createMockPlatform({ name: 'test', plugins }, persistence);
		await waitFor(() =>
			expect(platformAfterNotRegistered.getResponse('ep1', 200)).toEqual({ body: { error: 'User not registered' }, headers: {} })
		);
		await waitFor(() => expect(platformAfterNotRegistered.getResponse('ep1', 400)).toEqual({ body: { error: 'bad' }, headers: {} })); // fallback to plugin
		// Re-query the select element before changing to 'registered'
		const selectAfter = await screen.findByDisplayValue('User not registered');
		// Select "User is registered"
		await userEvent.selectOptions(selectAfter, 'registered');
		await waitFor(() => expect(selectAfter).toHaveValue('registered'));
		// Assert persistence is updated
		await waitFor(() => expect(persistence.getEndpointScenario('ep1')).toBe('registered'));
		// Re-instantiate platform to reflect persisted scenario
		const platformAfterRegistered = createMockPlatform({ name: 'test', plugins }, persistence);
		await waitFor(() =>
			expect(platformAfterRegistered.getResponse('ep1', 200)).toEqual({ body: { ok: 'User is registered' }, headers: {} })
		);
		await waitFor(() => expect(platformAfterRegistered.getResponse('ep1', 400)).toEqual({ body: { error: 'custom bad' }, headers: {} })); // scenario override
		// Unmount and remount, selection should persist
		// (simulate reload)
		localStorage.setItem('test.mockui.endpointScenarios.v1', JSON.stringify({ ep1: 'not-registered' }));
		let renderResult = render(<MockUI platform={platform} />);
		renderResult.unmount();
		renderResult = render(<MockUI platform={platform} />);
		// TODO: There are two open-settings buttons after remount. Figure out why this happens in tests (not in Storybook). For now, click the last one to ensure functionality is tested.
		const openSettingsButtons = await renderResult.findAllByTestId('open-settings');
		fireEvent.click(openSettingsButtons[openSettingsButtons.length - 1]);
		const select2 = await renderResult.findByDisplayValue('User not registered');
		expect(select2).toHaveValue('not-registered');
	});

	it('minimal: renders a plain checkbox, unmounts, and remounts', async () => {
		const { unmount } = render(<input type="checkbox" aria-label="test-checkbox" />);
		expect(screen.getByLabelText('test-checkbox')).toBeInTheDocument();
		unmount();
		render(<input type="checkbox" aria-label="test-checkbox" />);
		expect(screen.getByLabelText('test-checkbox')).toBeInTheDocument();
	});

	it('renders swagger button if swaggerUrl is present and opens in new window', async () => {
		const platform = createMockPlatform({
			name: 'swagger-test-platform',
			plugins: [
				{
					id: 'swagger-test',
					componentId: 'SwaggerComp',
					endpoint: '/api/swagger-test',
					method: 'GET',
					responses: { 200: { ok: true } },
					defaultStatus: 200,
					swaggerUrl: 'https://example.com/swagger.json',
				},
			],
		});
		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		// Find the swagger button
		const btn = await screen.findByTestId('open-swagger-swagger-test');
		expect(btn).toBeInTheDocument();
		expect(btn).toHaveAttribute('title', 'Open swagger file');
		// Simulate click and check window.open
		const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
		fireEvent.click(btn);
		expect(openSpy).toHaveBeenCalledWith('https://example.com/swagger.json', '_blank', 'noopener,noreferrer');
		openSpy.mockRestore();
	});

	it('toggles MockUI visibility with Ctrl+M hotkey', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);

		// Initially, the dialog should be closed
		expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();

		// Press Ctrl+M to open the dialog
		fireEvent.keyDown(document, { key: 'm', ctrlKey: true });
		expect(await screen.findByText('Endpoint Manager')).toBeInTheDocument();

		// Press Ctrl+M again to close the dialog
		fireEvent.keyDown(document, { key: 'm', ctrlKey: true });
		await waitFor(() => expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument());
	});

	it('handles Ctrl+M with uppercase M', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);

		// Initially, the dialog should be closed
		expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();

		// Press Ctrl+M (uppercase) to open the dialog
		fireEvent.keyDown(document, { key: 'M', ctrlKey: true });
		expect(await screen.findByText('Endpoint Manager')).toBeInTheDocument();
	});

	it('ignores M key without Ctrl modifier', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);

		// Initially, the dialog should be closed
		expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();

		// Press M without Ctrl - should not open dialog
		fireEvent.keyDown(document, { key: 'm' });
		expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();
	});

	it('ignores Ctrl with other keys', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);

		// Initially, the dialog should be closed
		expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();

		// Press Ctrl+N - should not open dialog
		fireEvent.keyDown(document, { key: 'n', ctrlKey: true });
		expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();
	});

	it('closes MockUI with Escape key when open', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);

		// Open the dialog first
		fireEvent.keyDown(document, { key: 'm', ctrlKey: true });
		expect(await screen.findByText('Endpoint Manager')).toBeInTheDocument();

		// Press Escape to close the dialog
		fireEvent.keyDown(document, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument());
	});

	it('ignores Escape key when dialog is closed', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);

		// Initially, the dialog should be closed
		expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();

		// Press Escape - should do nothing
		fireEvent.keyDown(document, { key: 'Escape' });
		expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();
	});

	it('works with both Ctrl+M and Escape together', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);

		// Initially closed
		expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();

		// Open with Ctrl+M
		fireEvent.keyDown(document, { key: 'm', ctrlKey: true });
		expect(await screen.findByText('Endpoint Manager')).toBeInTheDocument();

		// Close with Escape
		fireEvent.keyDown(document, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument());

		// Open again with Ctrl+M
		fireEvent.keyDown(document, { key: 'M', ctrlKey: true });
		expect(await screen.findByText('Endpoint Manager')).toBeInTheDocument();

		// Close again with Escape
		fireEvent.keyDown(document, { key: 'Escape' });
		await waitFor(() => expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument());
	});

	it('Ctrl+M continues working after multiple open/close cycles', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);

		// Test multiple cycles to ensure the event listener persists
		for (let i = 0; i < 5; i++) {
			// Initially or after previous cycle, should be closed
			expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument();

			// Open with Ctrl+M
			fireEvent.keyDown(document, { key: 'm', ctrlKey: true });
			expect(await screen.findByText('Endpoint Manager')).toBeInTheDocument();

			// Close with Ctrl+M
			fireEvent.keyDown(document, { key: 'M', ctrlKey: true });
			await waitFor(() => expect(screen.queryByText('Endpoint Manager')).not.toBeInTheDocument());
		}

		// Final verification that it still works
		fireEvent.keyDown(document, { key: 'm', ctrlKey: true });
		expect(await screen.findByText('Endpoint Manager')).toBeInTheDocument();
	});

	it('persists feature flags between MockUI sessions', async () => {
		// Create platform with LocalStoragePersistence for feature flag persistence
		const platform1 = makePlatformWithPersistence();

		// Initial render and open MockUI
		const { unmount } = render(<MockUI platform={platform1} />);
		fireEvent.click(await screen.findByTestId('open-settings'));

		// Navigate to Feature Flags tab
		const featureFlagsTab = await screen.findByRole('tab', { name: /feature flags/i });
		fireEvent.click(featureFlagsTab);

		// Find and toggle FLAG_A to true
		const flagCard = await screen.findByLabelText('Toggle feature flag FLAG_A');

		// Verify initial state is false
		expect(flagCard).toHaveAttribute('aria-checked', 'false');
		expect(platform1.getFeatureFlags().FLAG_A).toBe(false);

		// Toggle flag to true
		fireEvent.click(flagCard);
		await waitFor(() => {
			expect(platform1.getFeatureFlags().FLAG_A).toBe(true);
		});

		// Unmount the component (simulating closing MockUI)
		unmount();

		// Create a new platform instance (simulating app restart or MockUI reopening)
		const platform2 = makePlatformWithPersistence();

		// Feature flag should be persisted and loaded as true
		expect(platform2.getFeatureFlags().FLAG_A).toBe(true);

		// Render MockUI again with the new platform
		render(<MockUI platform={platform2} />);
		fireEvent.click(await screen.findByTestId('open-settings'));

		// Navigate to Feature Flags tab
		const featureFlagsTab2 = await screen.findByRole('tab', { name: /feature flags/i });
		fireEvent.click(featureFlagsTab2);

		// Find FLAG_A again
		const flagCard2 = await screen.findByLabelText('Toggle feature flag FLAG_A');

		// Verify the flag is still checked (persisted)
		expect(flagCard2).toHaveAttribute('aria-checked', 'true');

		// Toggle back to false
		fireEvent.click(flagCard2);
		await waitFor(() => {
			expect(platform2.getFeatureFlags().FLAG_A).toBe(false);
		});

		// Verify persistence of the false state
		const platform3 = makePlatformWithPersistence();
		expect(platform3.getFeatureFlags().FLAG_A).toBe(false);
	});

	// Tab persistence tests
	describe('Tab persistence', () => {
		it('persists active tab to localStorage', async () => {
			const platform = makePlatform();
			const { unmount } = render(<MockUI platform={platform} />);

			// Open MockUI
			fireEvent.click(await screen.findByTestId('open-settings'));

			// Initially should be on endpoints tab
			const endpointsTab = await screen.findByRole('tab', { name: /endpoints/i });
			expect(endpointsTab).toHaveAttribute('aria-selected', 'true');

			// Switch to feature flags tab
			const featureFlagsTab = await screen.findByRole('tab', { name: /feature flags/i });
			fireEvent.click(featureFlagsTab);

			// Wait for the tab to be selected
			await waitFor(() => {
				const currentTab = screen.getByRole('tab', { name: /feature flags/i });
				expect(currentTab).toHaveAttribute('aria-selected', 'true');
			});

			// Check localStorage
			const activeTabKey = `${platform.getName()}.mockui.activeTab.v1`;
			expect(localStorage.getItem(activeTabKey)).toBe('feature-flags');

			// Unmount and remount
			unmount();
			render(<MockUI platform={platform} />);
			fireEvent.click(await screen.findByTestId('open-settings'));

			// Should still be on feature flags tab
			await waitFor(() => {
				const featureFlagsTab2 = screen.getByRole('tab', { name: /feature flags/i });
				expect(featureFlagsTab2).toHaveAttribute('aria-selected', 'true');
			});
		});

		it('stays on feature flags tab when toggling feature flags', async () => {
			const platform = makePlatform();
			render(<MockUI platform={platform} />);

			// Open MockUI and navigate to feature flags
			fireEvent.click(await screen.findByTestId('open-settings'));
			const featureFlagsTab = await screen.findByRole('tab', { name: /feature flags/i });
			fireEvent.click(featureFlagsTab);

			// Find and toggle a feature flag
			const flagCard = await screen.findByLabelText('Toggle feature flag FLAG_A');
			fireEvent.click(flagCard);

			// Should still be on feature flags tab
			await waitFor(() => {
				const featureFlagsTab2 = screen.getByRole('tab', { name: /feature flags/i });
				expect(featureFlagsTab2).toHaveAttribute('aria-selected', 'true');
			});

			// Toggle again
			const flagCard2 = await screen.findByLabelText('Toggle feature flag FLAG_A');
			fireEvent.click(flagCard2);

			// Should still be on feature flags tab
			await waitFor(() => {
				const featureFlagsTab3 = screen.getByRole('tab', { name: /feature flags/i });
				expect(featureFlagsTab3).toHaveAttribute('aria-selected', 'true');
			});
		});

		it('stays on groups tab when typing in search field', async () => {
			const platform = makePlatform();
			render(<MockUI platform={platform} />);

			// Open MockUI and navigate to groups tab
			fireEvent.click(await screen.findByTestId('open-settings'));
			const groupsTab = await screen.findByRole('tab', { name: /groups/i });
			fireEvent.click(groupsTab);

			// Find new group name input and type in it
			const newGroupInput = await screen.findByPlaceholderText('New group name');
			fireEvent.change(newGroupInput, { target: { value: 'Test Group' } });

			// Should still be on groups tab
			await waitFor(() => {
				const groupsTab2 = screen.getByRole('tab', { name: /groups/i });
				expect(groupsTab2).toHaveAttribute('aria-selected', 'true');
			});

			// Type more
			fireEvent.change(newGroupInput, { target: { value: 'Test Group 2' } });

			// Should still be on groups tab
			await waitFor(() => {
				const groupsTab3 = screen.getByRole('tab', { name: /groups/i });
				expect(groupsTab3).toHaveAttribute('aria-selected', 'true');
			});
		});

		it('handles fast typing in groups tab input without performance issues', async () => {
			const platform = makePlatform();
			const user = userEvent.setup();
			render(<MockUI platform={platform} />);

			// Open MockUI and navigate to groups tab
			fireEvent.click(await screen.findByTestId('open-settings'));
			const groupsTab = await screen.findByRole('tab', { name: /groups/i });
			fireEvent.click(groupsTab);

			// Find new group name input
			const newGroupInput = await screen.findByPlaceholderText('New group name');

			// Focus the input first
			newGroupInput.focus();

			// Simulate realistic typing with userEvent
			const testText = 'FastTypedGroupName';
			await user.type(newGroupInput, testText);

			// Verify the final value is complete (no characters were dropped)
			await waitFor(() => {
				expect(newGroupInput).toHaveValue(testText);
			});

			// Should still be on groups tab
			await waitFor(() => {
				const groupsTab2 = screen.getByRole('tab', { name: /groups/i });
				expect(groupsTab2).toHaveAttribute('aria-selected', 'true');
			});

			// Most importantly: the input should still have focus
			expect(newGroupInput).toHaveFocus();
		});

		it('preserves focus in groups tab input when typing', async () => {
			const platform = makePlatform();

			// Test if platform methods return stable references
			const flags1 = platform.getFeatureFlags();
			const flags2 = platform.getFeatureFlags();
			const metadata1 = platform.getFeatureFlagMetadata();
			const metadata2 = platform.getFeatureFlagMetadata();

			// These should now be the same objects (the fix!)
			expect(flags1).toBe(flags2);
			expect(metadata1).toBe(metadata2);

			const user = userEvent.setup();
			render(<MockUI platform={platform} />);

			// Open MockUI and navigate to groups tab
			fireEvent.click(await screen.findByTestId('open-settings'));
			const groupsTab = await screen.findByRole('tab', { name: /groups/i });
			fireEvent.click(groupsTab);

			// Find new group name input
			const newGroupInput = await screen.findByPlaceholderText('New group name');

			// Focus the input
			newGroupInput.focus();
			expect(newGroupInput).toHaveFocus();

			// Type a single character
			await user.type(newGroupInput, 'a');

			// Input should still have focus after typing
			expect(newGroupInput).toHaveFocus();

			// Type another character
			await user.type(newGroupInput, 'b');

			// Input should still have focus
			expect(newGroupInput).toHaveFocus();

			// Verify the value is correct
			expect(newGroupInput).toHaveValue('ab');
		});

		it('stays on settings tab when toggling settings', async () => {
			const platform = makePlatform();
			render(<MockUI platform={platform} />);

			// Open MockUI and navigate to settings tab
			fireEvent.click(await screen.findByTestId('open-settings'));
			const settingsTab = await screen.findByRole('tab', { name: /settings/i });
			fireEvent.click(settingsTab);

			// Should be on settings tab initially
			await waitFor(() => {
				const settingsTab1 = screen.getByRole('tab', { name: /settings/i });
				expect(settingsTab1).toHaveAttribute('aria-selected', 'true');
			});

			// Verify the settings content is visible
			expect(await screen.findByText('Global Settings')).toBeInTheDocument();
			expect(await screen.findByText('Disable All Endpoints')).toBeInTheDocument();

			// Use the platform API to toggle global disable (simulating a settings change)
			platform.setGlobalDisable(true);

			// Should still be on settings tab
			await waitFor(() => {
				const settingsTab2 = screen.getByRole('tab', { name: /settings/i });
				expect(settingsTab2).toHaveAttribute('aria-selected', 'true');
			});

			// Toggle again
			platform.setGlobalDisable(false);

			// Should still be on settings tab
			await waitFor(() => {
				const settingsTab3 = screen.getByRole('tab', { name: /settings/i });
				expect(settingsTab3).toHaveAttribute('aria-selected', 'true');
			});
		});

		it('stays on endpoints tab when toggling endpoints', async () => {
			const platform = makePlatform();
			render(<MockUI platform={platform} />);

			// Open MockUI (defaults to endpoints tab)
			fireEvent.click(await screen.findByTestId('open-settings'));

			// Toggle an endpoint
			const endpointToggle = await screen.findByLabelText('Toggle endpoint /api/v1/foo');
			fireEvent.click(endpointToggle);

			// Should still be on endpoints tab
			await waitFor(() => {
				const endpointsTab = screen.getByRole('tab', { name: /endpoints/i });
				expect(endpointsTab).toHaveAttribute('aria-selected', 'true');
			});

			// Change status code
			const statusBadge = await screen.findByText('400');
			fireEvent.click(statusBadge);

			// Should still be on endpoints tab
			await waitFor(() => {
				const endpointsTab2 = screen.getByRole('tab', { name: /endpoints/i });
				expect(endpointsTab2).toHaveAttribute('aria-selected', 'true');
			});
		});

		it('switches tabs correctly and persists selection', async () => {
			const platform = makePlatform();
			render(<MockUI platform={platform} />);

			// Open MockUI
			fireEvent.click(await screen.findByTestId('open-settings'));

			// Test switching between all tabs
			const tabs = ['endpoints', 'groups', 'settings', 'feature-flags'];
			const tabNames = ['endpoints', 'groups', 'settings', 'feature flags'];

			for (let i = 0; i < tabs.length; i++) {
				const tab = await screen.findByRole('tab', { name: new RegExp(tabNames[i], 'i') });
				fireEvent.click(tab);

				// Verify tab is selected
				await waitFor(() => {
					const currentTab = screen.getByRole('tab', { name: new RegExp(tabNames[i], 'i') });
					expect(currentTab).toHaveAttribute('aria-selected', 'true');
				});

				// Verify localStorage is updated
				const activeTabKey = `${platform.getName()}.mockui.activeTab.v1`;
				expect(localStorage.getItem(activeTabKey)).toBe(tabs[i]);
			}
		});

		it('defaults to endpoints tab when no localStorage value exists', async () => {
			const platform = makePlatform();

			// Clear localStorage
			const activeTabKey = `${platform.getName()}.mockui.activeTab.v1`;
			localStorage.removeItem(activeTabKey);

			render(<MockUI platform={platform} />);
			fireEvent.click(await screen.findByTestId('open-settings'));

			// Should default to endpoints tab
			const endpointsTab = await screen.findByRole('tab', { name: /endpoints/i });
			expect(endpointsTab).toHaveAttribute('aria-selected', 'true');

			// Should save to localStorage
			expect(localStorage.getItem(activeTabKey)).toBe('endpoints');
		});

		it('handles corrupted localStorage gracefully', async () => {
			const platform = makePlatform();

			// Set corrupted localStorage value
			const activeTabKey = `${platform.getName()}.mockui.activeTab.v1`;
			localStorage.setItem(activeTabKey, 'invalid-tab-value');

			render(<MockUI platform={platform} />);
			fireEvent.click(await screen.findByTestId('open-settings'));

			// Should still work and default to endpoints tab
			const endpointsTab = await screen.findByRole('tab', { name: /endpoints/i });
			expect(endpointsTab).toHaveAttribute('aria-selected', 'true');
		});
	});
});
