/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import EndpointsTab from './EndpointsTab';
import type { Plugin } from '../../types';

const mockPlugin1: Plugin = {
	id: 'plugin-1',
	endpoint: '/api/users',
	method: 'GET',
	responses: { 200: { data: { users: [] } } },
	defaultStatus: 200,
	componentId: 'users-service',
};

const mockPlugin2: Plugin = {
	id: 'plugin-2',
	endpoint: '/api/orders',
	method: 'POST',
	responses: { 201: { data: { order: {} } } },
	defaultStatus: 201,
	componentId: 'orders-service',
};

const mockPlugin3: Plugin = {
	id: 'plugin-3',
	endpoint: '/api/products',
	method: 'GET',
	responses: { 200: { data: { products: [] } } },
	defaultStatus: 200,
	componentId: 'products-service',
};

const mockGroups = [
	{
		id: 'group-1',
		name: 'Test Group',
		endpointIds: ['plugin-1'],
	},
];

const mockAllGroups = [
	...mockGroups,
	{
		id: 'users-service',
		name: 'users-service',
		endpointIds: ['plugin-1'],
	},
	{
		id: 'orders-service',
		name: 'orders-service',
		endpointIds: ['plugin-2'],
	},
	{
		id: 'products-service',
		name: 'products-service',
		endpointIds: ['plugin-3'],
	},
];

const mockPlatform = {
	getEndpointBadges: jest.fn(() => []),
	setEndpointScenario: jest.fn(),
	getEffectiveDelay: jest.fn(() => 0),
	setStatusOverride: jest.fn(),
	setDelayOverride: jest.fn(),
	setMiddlewareSetting: jest.fn(),
} as any;

const defaultProps = {
	plugins: [mockPlugin1, mockPlugin2, mockPlugin3],
	selectedGroupFilters: [],
	onToggleGroupFilter: jest.fn(),
	onClearGroupFilters: jest.fn(),
	groups: mockGroups,
	allGroups: mockAllGroups,
	isMocked: jest.fn(() => true),
	onToggleMocked: jest.fn(),
	onUpdateStatusCode: jest.fn(),
	onAddToGroup: jest.fn(),
	onRemoveFromGroup: jest.fn(),
	getStatus: jest.fn(() => 200),
	getStatusCodes: jest.fn(() => [200, 201, 503]),
	endpointScenarios: {},
	onScenarioChange: jest.fn(),
	platform: mockPlatform,
	onUpdateDelay: jest.fn(),
	getDelay: jest.fn(() => 0),
	searchTerm: '',
	onSearchTermChange: jest.fn(),
};

describe('EndpointsTab', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders endpoints correctly', () => {
		render(<EndpointsTab {...defaultProps} />);

		expect(screen.getByText('All Endpoints')).toBeInTheDocument();
		expect(screen.getByText('/api/users')).toBeInTheDocument();
		expect(screen.getByText('/api/orders')).toBeInTheDocument();
		expect(screen.getByText('/api/products')).toBeInTheDocument();
	});

	it('renders search input', () => {
		render(<EndpointsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...');
		expect(searchInput).toBeInTheDocument();
	});

	it('filters endpoints by search term', async () => {
		const propsWithSearch = {
			...defaultProps,
			searchTerm: 'users',
		};
		render(<EndpointsTab {...propsWithSearch} />);

		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
			expect(screen.queryByText('/api/products')).not.toBeInTheDocument();
		});
	});

	it('shows all endpoints when search is cleared', async () => {
		// Test with empty search term
		render(<EndpointsTab {...defaultProps} />);

		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.getByText('/api/orders')).toBeInTheDocument();
			expect(screen.getByText('/api/products')).toBeInTheDocument();
		});
	});

	it('shows no endpoints match message when no results', async () => {
		const propsWithSearch = {
			...defaultProps,
			searchTerm: 'nonexistent',
		};
		render(<EndpointsTab {...propsWithSearch} />);

		await waitFor(() => {
			expect(screen.getByText('No endpoints match your current filters.')).toBeInTheDocument();
		});
	});

	it('maintains focus on search input while typing', async () => {
		const onSearchTermChange = jest.fn();
		const propsWithHandler = {
			...defaultProps,
			onSearchTermChange,
		};
		render(<EndpointsTab {...propsWithHandler} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		// Focus the input
		searchInput.focus();
		expect(document.activeElement).toBe(searchInput);

		// Type characters and verify handler is called
		fireEvent.change(searchInput, { target: { value: 'u' } });
		expect(onSearchTermChange).toHaveBeenCalledWith('u');

		fireEvent.change(searchInput, { target: { value: 'us' } });
		expect(onSearchTermChange).toHaveBeenCalledWith('us');

		fireEvent.change(searchInput, { target: { value: 'users' } });
		expect(onSearchTermChange).toHaveBeenCalledWith('users');
	});

	it('maintains focus on search input when filtering results', async () => {
		const propsWithSearch = {
			...defaultProps,
			searchTerm: 'users',
		};
		render(<EndpointsTab {...propsWithSearch} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		// Focus the input
		searchInput.focus();

		// Wait for filtering to complete
		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
		});

		// Focus should still be on the search input
		expect(document.activeElement).toBe(searchInput);
	});

	it('filters endpoints by group filters', async () => {
		const propsWithGroupFilter = {
			...defaultProps,
			selectedGroupFilters: ['users-service'],
		};

		render(<EndpointsTab {...propsWithGroupFilter} />);

		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
			expect(screen.queryByText('/api/products')).not.toBeInTheDocument();
		});
	});

	it('combines search and group filters', async () => {
		const propsWithFilters = {
			...defaultProps,
			selectedGroupFilters: ['users-service', 'orders-service'],
			searchTerm: 'users',
		};

		render(<EndpointsTab {...propsWithFilters} />);

		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
			expect(screen.queryByText('/api/products')).not.toBeInTheDocument();
		});
	});

	it('shows enabled/disabled count correctly', () => {
		render(<EndpointsTab {...defaultProps} />);

		expect(screen.getByText('3 / 3 enabled')).toBeInTheDocument();
	});

	it('updates enabled count when some endpoints are disabled', () => {
		const propsWithDisabled = {
			...defaultProps,
			isMocked: jest.fn(plugin => plugin.id !== 'plugin-2'),
		};

		render(<EndpointsTab {...propsWithDisabled} />);

		expect(screen.getByText('2 / 3 enabled')).toBeInTheDocument();
	});

	it('search input value reflects the controlled prop', async () => {
		const propsWithSearch = {
			...defaultProps,
			searchTerm: 'api/users',
		};
		render(<EndpointsTab {...propsWithSearch} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		// Value should match the prop
		expect(searchInput.value).toBe('api/users');
	});

	it('preserves search filter when status code is changed', async () => {
		const onUpdateStatusCode = jest.fn();
		const propsWithSearch = {
			...defaultProps,
			searchTerm: 'users',
			onUpdateStatusCode,
		};
		render(<EndpointsTab {...propsWithSearch} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;
		
		// Verify filtering is working initially
		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
		});

		// Verify search input has the correct value
		expect(searchInput.value).toBe('users');

		// Find a status code button and click it to change status
		const statusButton = screen.getByText('201');
		fireEvent.click(statusButton);

		// Verify that onUpdateStatusCode was called
		expect(onUpdateStatusCode).toHaveBeenCalled();

		// Check that search term is still preserved (since it's controlled)
		expect(searchInput.value).toBe('users');
		
		// Check that filtering is still active - only users endpoint should be visible
		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
		});
	});

	it('does not lose focus while typing rapidly in search field', async () => {
		const onSearchTermChange = jest.fn();
		const propsWithHandler = {
			...defaultProps,
			onSearchTermChange,
		};
		render(<EndpointsTab {...propsWithHandler} />);
		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		// Focus the input
		searchInput.focus();
		expect(document.activeElement).toBe(searchInput);

		// Simulate rapid typing
		const testString = 'users';
		for (let i = 0; i < testString.length; i++) {
			const currentValue = testString.substring(0, i + 1);
			
			// Type next character
			fireEvent.change(searchInput, { target: { value: currentValue } });
			
			// Focus should still be maintained after each keystroke
			expect(document.activeElement).toBe(searchInput);
		}

		// Verify all changes were captured
		expect(onSearchTermChange).toHaveBeenCalledTimes(testString.length);
		expect(onSearchTermChange).toHaveBeenLastCalledWith('users');
	});

	it('maintains search input focus even when parent components trigger updates', async () => {
		// This test ensures that search input doesn't lose focus when other UI updates occur
		// This is a regression test for the typing interruption bug
		const onUpdateStatusCode = jest.fn();
		const onSearchTermChange = jest.fn();
		const propsWithHandlers = {
			...defaultProps,
			onUpdateStatusCode,
			onSearchTermChange,
		};
		render(<EndpointsTab {...propsWithHandlers} />);
		
		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;
		
		// Focus and start typing
		searchInput.focus();
		fireEvent.change(searchInput, { target: { value: 'api' } });
		
		// Verify focus is maintained
		expect(document.activeElement).toBe(searchInput);
		expect(onSearchTermChange).toHaveBeenCalledWith('api');
		
		// Trigger a status code change (which used to cause re-renders that interrupted typing)
		const statusButtons = screen.getAllByText('201');
		fireEvent.click(statusButtons[0]); // Click the first 201 button
		
		// Continue typing - focus should still be maintained
		fireEvent.change(searchInput, { target: { value: 'api/users' } });
		expect(document.activeElement).toBe(searchInput);
		expect(onSearchTermChange).toHaveBeenCalledWith('api/users');
		
		// Verify the status code handler was called
		expect(onUpdateStatusCode).toHaveBeenCalled();
	});

	it('preserves search text when clicking status codes (TDD test for search reset bug)', async () => {
		// This test should now pass since we're using controlled search state
		const onUpdateStatusCode = jest.fn();
		const propsWithSearch = {
			...defaultProps,
			searchTerm: 'users',
			onUpdateStatusCode,
		};
		render(<EndpointsTab {...propsWithSearch} />);
		
		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;
		
		// Verify search is working - only /api/users should be visible
		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
			expect(screen.queryByText('/api/products')).not.toBeInTheDocument();
		});
		
		// Verify search input has the correct value
		expect(searchInput.value).toBe('users');
		
		// Step 2: Click on a status code for the visible endpoint
		// Find the status code button within the users endpoint row
		const usersEndpoint = screen.getByText('/api/users');
		const usersRow = usersEndpoint.closest('div[style*="background: white"]'); // Find the endpoint row container
		expect(usersRow).not.toBeNull();
		
		// Find a status code button in this specific row (should be 200, 201, or 503)
		const statusButtons = within(usersRow as HTMLElement).getAllByText(/^(200|201|503)$/);
		expect(statusButtons.length).toBeGreaterThan(0);
		
		// Click on a status code that's not currently active
		const inactiveStatusButton = statusButtons.find(btn =>
			!btn.style.background?.includes('rgb(16, 185, 129)') // Not the green active color
		) || statusButtons[0]; // Fallback to first button
		
		fireEvent.click(inactiveStatusButton);
		
		// Step 3: Verify the status code was updated
		expect(onUpdateStatusCode).toHaveBeenCalled();
		
		// Step 4: Verify search text is NOT reset (this should pass now with controlled state)
		expect(searchInput.value).toBe('users'); // This should stay 'users'
		
		// Step 5: Verify filtering is still active after status code click
		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
			expect(screen.queryByText('/api/products')).not.toBeInTheDocument();
		});
	});

	it('prevents typing interruption during component re-renders (useCallback optimization test)', async () => {
		// This test verifies that the useCallback optimization prevents typing interruption
		// when other UI operations trigger re-renders
		const onUpdateStatusCode = jest.fn();
		const onSearchTermChange = jest.fn();
		const propsWithCallbacks = {
			...defaultProps,
			onUpdateStatusCode,
			onSearchTermChange,
		};
		render(<EndpointsTab {...propsWithCallbacks} />);
		
		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;
		
		// Start typing rapidly
		searchInput.focus();
		expect(document.activeElement).toBe(searchInput);
		
		// Simulate rapid typing with multiple character changes
		const typingSequence = ['u', 'us', 'use', 'user', 'users'];
		
		for (let i = 0; i < typingSequence.length; i++) {
			const currentValue = typingSequence[i];
			
			// Type next character
			fireEvent.change(searchInput, { target: { value: currentValue } });
			
			// Verify the onSearchTermChange was called with correct value
			expect(onSearchTermChange).toHaveBeenCalledWith(currentValue);
			
			// Trigger a status code change during typing (this used to cause interruption)
			if (i === 2) { // Halfway through typing
				const statusButtons = screen.getAllByText('201');
				fireEvent.click(statusButtons[0]);
				expect(onUpdateStatusCode).toHaveBeenCalled();
			}
			
			// Focus should be maintained throughout typing
			expect(document.activeElement).toBe(searchInput);
		}
		
		// Verify all typing events were captured correctly
		expect(onSearchTermChange).toHaveBeenCalledTimes(typingSequence.length);
		expect(onSearchTermChange).toHaveBeenLastCalledWith('users');
		
		// Focus should still be on search input
		expect(document.activeElement).toBe(searchInput);
	});
});
