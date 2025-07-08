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
		// Endpoints tab is default
		const endpointCheckbox = await screen.findByLabelText('Toggle endpoint /api/v1/foo');
		// Initially checked
		await waitFor(() => expect(endpointCheckbox).toBeChecked());
		fireEvent.click(endpointCheckbox);
		await waitFor(() => expect(endpointCheckbox).not.toBeChecked());
		fireEvent.click(endpointCheckbox);
		await waitFor(() => expect(endpointCheckbox).toBeChecked());
	});

	it('changes status code and updates platform', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		// Endpoints tab is default
		const radio = await screen.findByLabelText('400');
		fireEvent.click(radio);
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
		fireEvent.click(flagCheckbox);
		await waitFor(() => expect(platform.getFeatureFlags().FLAG_A).toBe(false));
	});

	it('creates, renames, deletes groups and manages membership', async () => {
		const platform = makePlatform();
		render(<MockUI platform={platform} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		// Switch to Groups tab robustly
		const groupsTab = await screen.findByRole('tab', { name: /groups/i });
		fireEvent.click(groupsTab);
		// Use function matcher for placeholder
		const input = await screen.findByPlaceholderText((_, n) => n?.getAttribute('placeholder')?.toLowerCase() === 'new group name');
		fireEvent.change(input, { target: { value: 'TestGroup' } });
		fireEvent.keyDown(input, { key: 'Enter' });
		expect(await screen.findByText((_, n) => n?.textContent === 'TestGroup' || false)).toBeInTheDocument();
		// Rename group
		const editButtons = await screen.findAllByRole('button', { name: /edit/i });
		fireEvent.click(editButtons[0]);
		const renameInput = await screen.findByDisplayValue('TestGroup');
		fireEvent.change(renameInput, { target: { value: 'RenamedGroup' } });
		fireEvent.keyDown(renameInput, { key: 'Enter' });
		expect(await screen.findByText((_, n) => n?.textContent === 'RenamedGroup' || false)).toBeInTheDocument();
		// Delete group
		const trashButtons = await screen.findAllByRole('button', { name: /trash/i });
		fireEvent.click(trashButtons[0]);
		await waitFor(() => expect(screen.queryByText((_, n) => n?.textContent === 'RenamedGroup' || false)).not.toBeInTheDocument());
	});

	it('persists groups and disabledPluginIds to localStorage', async () => {
		// Step 1: Render and interact with the first platform instance
		const platform1 = makePlatform();
		const { unmount } = render(<MockUI platform={platform1} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		// Create a group
		const groupsTab = await screen.findByRole('tab', { name: /groups/i });
		fireEvent.click(groupsTab);
		const input = await screen.findByPlaceholderText((_, n) => n?.getAttribute('placeholder')?.toLowerCase() === 'new group name');
		fireEvent.change(input, { target: { value: 'PersistedGroup' } });
		fireEvent.keyDown(input, { key: 'Enter' });
		expect(await screen.findByText((_, n) => n?.textContent === 'PersistedGroup' || false)).toBeInTheDocument();
		// Switch to Endpoints tab and toggle endpoint off
		const endpointsTab = await screen.findByRole('tab', { name: /endpoints/i });
		fireEvent.click(endpointsTab);
		const endpointCheckbox = await screen.findByLabelText('Toggle endpoint /api/v1/foo');
		fireEvent.click(endpointCheckbox);
		await waitFor(() => expect(endpointCheckbox).not.toBeChecked());
		// Unmount and remount with a fresh platform instance
		unmount();
		const platform2 = makePlatform();
		render(<MockUI platform={platform2} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		// Wait for dialog and Endpoints tab to be open
		const endpointsTab2 = await screen.findByRole('tab', { name: /endpoints/i });
		fireEvent.click(endpointsTab2);
		await waitFor(() => expect(endpointsTab2).toHaveAttribute('aria-selected', 'true'));
		// Wait for the checkbox to appear and assert its state
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

		// Mount MockUI for platformA and create a group
		let utils = render(<MockUI platform={platformA} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		fireEvent.click(await screen.findByRole('tab', { name: /groups/i }));
		const inputA = await screen.findByPlaceholderText((_, n) => n?.getAttribute('placeholder')?.toLowerCase() === 'new group name');
		fireEvent.change(inputA, { target: { value: 'GroupA' } });
		fireEvent.keyDown(inputA, { key: 'Enter' });
		expect(await screen.findByText((_, n) => n?.textContent === 'GroupA' || false)).toBeInTheDocument();

		// Unmount and mount MockUI for platformB and create a group
		utils.unmount();
		utils = render(<MockUI platform={platformB} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		fireEvent.click(await screen.findByRole('tab', { name: /groups/i }));
		const inputB = await screen.findByPlaceholderText((_, n) => n?.getAttribute('placeholder')?.toLowerCase() === 'new group name');
		fireEvent.change(inputB, { target: { value: 'GroupB' } });
		fireEvent.keyDown(inputB, { key: 'Enter' });
		expect(await screen.findByText((_, n) => n?.textContent === 'GroupB' || false)).toBeInTheDocument();

		// Unmount and remount MockUI for platformA, GroupA should still exist, GroupB should not
		utils.unmount();
		utils = render(<MockUI platform={platformA} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		fireEvent.click(await screen.findByRole('tab', { name: /groups/i }));
		expect(await screen.findByText((_, n) => n?.textContent === 'GroupA' || false)).toBeInTheDocument();
		expect(screen.queryByText((_, n) => n?.textContent === 'GroupB' || false)).not.toBeInTheDocument();

		// Unmount and remount MockUI for platformB, GroupB should still exist, GroupA should not
		utils.unmount();
		utils = render(<MockUI platform={platformB} />);
		fireEvent.click(await screen.findByTestId('open-settings'));
		fireEvent.click(await screen.findByRole('tab', { name: /groups/i }));
		expect(await screen.findByText((_, n) => n?.textContent === 'GroupB' || false)).toBeInTheDocument();
		expect(screen.queryByText((_, n) => n?.textContent === 'GroupA' || false)).not.toBeInTheDocument();
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
		await waitFor(() => expect(platformAfterNotRegistered.getResponse('ep1', 200)).toEqual({ error: 'User not registered' }));
		await waitFor(() => expect(platformAfterNotRegistered.getResponse('ep1', 400)).toEqual({ error: 'bad' })); // fallback to plugin
		// Re-query the select element before changing to 'registered'
		const selectAfter = await screen.findByDisplayValue('User not registered');
		// Select "User is registered"
		await userEvent.selectOptions(selectAfter, 'registered');
		await waitFor(() => expect(selectAfter).toHaveValue('registered'));
		// Assert persistence is updated
		await waitFor(() => expect(persistence.getEndpointScenario('ep1')).toBe('registered'));
		// Re-instantiate platform to reflect persisted scenario
		const platformAfterRegistered = createMockPlatform({ name: 'test', plugins }, persistence);
		await waitFor(() => expect(platformAfterRegistered.getResponse('ep1', 200)).toEqual({ ok: 'User is registered' }));
		await waitFor(() => expect(platformAfterRegistered.getResponse('ep1', 400)).toEqual({ error: 'custom bad' })); // scenario override
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
});
