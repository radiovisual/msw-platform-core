/**
 * @jest-environment jsdom
 *
 * Regression tests for global disable functionality
 * This test ensures the global disable toggle updates immediately and consistently
 * across all UI components without delays.
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MockUI from './MockUI';
import { MockPlatformCore } from '../classes/MockPlatformCore';

// Create a mock platform for testing
const createMockPlatform = () => {
	const platform = new MockPlatformCore({
		name: 'test-platform',
		plugins: [
			{
				id: 'test-plugin',
				endpoint: '/api/test',
				method: 'GET',
				responses: { 200: { data: { test: true } } },
				defaultStatus: 200,
				componentId: 'test-service',
			},
		],
	});
	return platform;
};

describe('Global Disable Regression Tests', () => {
	it('should update global disable toggle immediately without delays', async () => {
		const platform = createMockPlatform();

		// Ensure global disable starts as false
		expect(platform.isGloballyDisabled()).toBe(false);

		const { getByTestId } = render(<MockUI platform={platform} />);

		// Open the MockUI
		const openButton = getByTestId('open-settings');
		act(() => {
			fireEvent.click(openButton);
		});

		// Navigate to settings tab
		const settingsTab = screen.getByText('Settings');
		act(() => {
			fireEvent.click(settingsTab);
		});

		// Find the global disable toggle (ModernToggle uses a button)
		const globalToggleLabel = screen.getByText('Disable All Endpoints');
		expect(globalToggleLabel).toBeInTheDocument();

		// Find the toggle button (ModernToggle renders a button)
		const toggleContainer = globalToggleLabel.closest('div')?.parentElement;
		const toggleButton = toggleContainer?.querySelector('button') as HTMLButtonElement;
		expect(toggleButton).toBeTruthy();

		// Initial state - platform should not be globally disabled
		expect(platform.isGloballyDisabled()).toBe(false);

		// Click the toggle to enable global disable
		act(() => {
			fireEvent.click(toggleButton);
		});

		// The platform state should be updated immediately
		expect(platform.isGloballyDisabled()).toBe(true);

		// Click again to disable
		act(() => {
			fireEvent.click(toggleButton);
		});

		// Should immediately update back
		expect(platform.isGloballyDisabled()).toBe(false);
	});

	it('should maintain global disable state when switching tabs', async () => {
		const platform = createMockPlatform();

		const { getByTestId } = render(<MockUI platform={platform} />);

		// Open the MockUI
		const openButton = getByTestId('open-settings');
		act(() => {
			fireEvent.click(openButton);
		});

		// Navigate to settings tab
		const settingsTab = screen.getByText('Settings');
		act(() => {
			fireEvent.click(settingsTab);
		});

		// Find and enable global disable
		const globalToggleLabel = screen.getByText('Disable All Endpoints');
		const toggleContainer = globalToggleLabel.closest('div')?.parentElement;
		const toggleButton = toggleContainer?.querySelector('button') as HTMLButtonElement;

		act(() => {
			fireEvent.click(toggleButton);
		});

		expect(platform.isGloballyDisabled()).toBe(true);

		// Switch to endpoints tab
		const endpointsTab = screen.getByText('Endpoints');
		act(() => {
			fireEvent.click(endpointsTab);
		});

		// Switch back to settings tab
		act(() => {
			fireEvent.click(settingsTab);
		});

		// The platform state should still be globally disabled
		expect(platform.isGloballyDisabled()).toBe(true);
	});

	it('should sync with enable all button functionality', async () => {
		const platform = createMockPlatform();

		// Set global disable to true initially
		platform.setGlobalDisable(true);

		const { getByTestId } = render(<MockUI platform={platform} />);

		// Open the MockUI
		const openButton = getByTestId('open-settings');
		act(() => {
			fireEvent.click(openButton);
		});

		// The global disable banner should be visible
		const enableAllButton = screen.getByText('Enable All');
		expect(enableAllButton).toBeInTheDocument();

		// Navigate to settings tab to check toggle state
		const settingsTab = screen.getByText('Settings');
		act(() => {
			fireEvent.click(settingsTab);
		});

		// Platform should be globally disabled
		expect(platform.isGloballyDisabled()).toBe(true);

		// Click enable all button
		act(() => {
			fireEvent.click(enableAllButton);
		});

		// Platform should no longer be globally disabled
		expect(platform.isGloballyDisabled()).toBe(false);
	});
});
