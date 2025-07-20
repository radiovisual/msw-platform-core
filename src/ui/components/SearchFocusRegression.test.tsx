/**
 * @jest-environment jsdom
 *
 * Regression tests for search input focus stability
 * This test ensures the search input maintains focus during typing and prevents
 * the component unmounting/remounting issue that was causing typing interruption.
 */
import React, { useState } from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import EndpointsTab from './EndpointsTab';
import type { Plugin } from '../../types';

const mockPlugin: Plugin = {
	id: 'plugin-1',
	endpoint: '/api/test',
	method: 'GET',
	responses: { 200: { data: { test: true } } },
	defaultStatus: 200,
	componentId: 'test-service',
};

const mockPlatform = {
	getEndpointBadges: jest.fn(() => []),
	setEndpointScenario: jest.fn(),
	getEffectiveDelay: jest.fn(() => 0),
	setStatusOverride: jest.fn(),
	setDelayOverride: jest.fn(),
	setMiddlewareSetting: jest.fn(),
} as any;

// Test wrapper that simulates the parent state management
const TestWrapper: React.FC = () => {
	const [searchTerm, setSearchTerm] = useState('');

	const props = {
		plugins: [mockPlugin],
		selectedGroupFilters: [],
		onToggleGroupFilter: jest.fn(),
		onClearGroupFilters: jest.fn(),
		groups: [],
		allGroups: [],
		isMocked: jest.fn(() => true),
		onToggleMocked: jest.fn(),
		onUpdateStatusCode: jest.fn(),
		onAddToGroup: jest.fn(),
		onRemoveFromGroup: jest.fn(),
		getStatus: jest.fn(() => 200),
		getStatusCodes: jest.fn(() => [200, 503]),
		endpointScenarios: {},
		onScenarioChange: jest.fn(),
		platform: mockPlatform,
		onUpdateDelay: jest.fn(),
		getDelay: jest.fn(() => 0),
		searchTerm,
		onSearchTermChange: setSearchTerm,
	};

	return <EndpointsTab key="endpoints-tab" {...props} />;
};

describe('Search Focus Regression Tests', () => {
	it('should maintain focus during continuous typing without interruption', async () => {
		render(<TestWrapper />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		// Focus the input
		act(() => {
			searchInput.focus();
		});
		expect(document.activeElement).toBe(searchInput);

		// Simulate typing a word letter by letter
		const testWord = 'testing';
		for (let i = 0; i < testWord.length; i++) {
			const currentValue = testWord.substring(0, i + 1);

			act(() => {
				fireEvent.change(searchInput, { target: { value: currentValue } });
			});

			// Focus should be maintained after each keystroke
			expect(document.activeElement).toBe(searchInput);
			expect(searchInput.value).toBe(currentValue);
		}

		// Final check
		expect(searchInput.value).toBe('testing');
		expect(document.activeElement).toBe(searchInput);
	});

	it('should maintain the same DOM element reference during typing', async () => {
		render(<TestWrapper />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;
		const initialInputRef = searchInput;

		act(() => {
			searchInput.focus();
		});

		// Type multiple characters
		act(() => {
			fireEvent.change(searchInput, { target: { value: 'a' } });
		});

		act(() => {
			fireEvent.change(searchInput, { target: { value: 'ab' } });
		});

		act(() => {
			fireEvent.change(searchInput, { target: { value: 'abc' } });
		});

		// The DOM element should be the same reference (not remounted)
		const finalInput = screen.getByPlaceholderText('Search endpoints...');
		expect(finalInput).toBe(initialInputRef);
		expect(document.activeElement).toBe(finalInput);
	});

	it('should not lose focus when parent component re-renders', async () => {
		render(<TestWrapper />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		act(() => {
			searchInput.focus();
		});
		expect(document.activeElement).toBe(searchInput);

		// Trigger a change that causes parent re-render
		act(() => {
			fireEvent.change(searchInput, { target: { value: 'test' } });
		});

		// Should maintain focus after the re-render
		expect(document.activeElement).toBe(searchInput);
		expect(searchInput.value).toBe('test');

		// Type another character to ensure it's still responsive
		act(() => {
			fireEvent.change(searchInput, { target: { value: 'test2' } });
		});

		expect(document.activeElement).toBe(searchInput);
		expect(searchInput.value).toBe('test2');
	});

	it('should handle rapid typing without focus loss', async () => {
		render(<TestWrapper />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		act(() => {
			searchInput.focus();
		});

		// Simulate rapid typing (multiple changes in quick succession)
		act(() => {
			fireEvent.change(searchInput, { target: { value: 'r' } });
			fireEvent.change(searchInput, { target: { value: 'ra' } });
			fireEvent.change(searchInput, { target: { value: 'rap' } });
			fireEvent.change(searchInput, { target: { value: 'rapi' } });
			fireEvent.change(searchInput, { target: { value: 'rapid' } });
		});

		// Should still have focus and correct value
		expect(document.activeElement).toBe(searchInput);
		expect(searchInput.value).toBe('rapid');
	});
});
