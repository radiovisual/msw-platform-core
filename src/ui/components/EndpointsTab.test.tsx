/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
		render(<EndpointsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...');
		fireEvent.change(searchInput, { target: { value: 'users' } });

		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
			expect(screen.queryByText('/api/products')).not.toBeInTheDocument();
		});
	});

	it('shows all endpoints when search is cleared', async () => {
		render(<EndpointsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...');

		// First filter
		fireEvent.change(searchInput, { target: { value: 'users' } });
		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.queryByText('/api/orders')).not.toBeInTheDocument();
		});

		// Clear search
		fireEvent.change(searchInput, { target: { value: '' } });
		await waitFor(() => {
			expect(screen.getByText('/api/users')).toBeInTheDocument();
			expect(screen.getByText('/api/orders')).toBeInTheDocument();
			expect(screen.getByText('/api/products')).toBeInTheDocument();
		});
	});

	it('shows no endpoints match message when no results', async () => {
		render(<EndpointsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...');
		fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

		await waitFor(() => {
			expect(screen.getByText('No endpoints match your current filters.')).toBeInTheDocument();
		});
	});

	it('maintains focus on search input while typing', async () => {
		render(<EndpointsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		// Focus the input
		searchInput.focus();
		expect(document.activeElement).toBe(searchInput);

		// Type multiple characters
		fireEvent.change(searchInput, { target: { value: 'u' } });
		await waitFor(() => {
			expect(document.activeElement).toBe(searchInput);
		});

		fireEvent.change(searchInput, { target: { value: 'us' } });
		await waitFor(() => {
			expect(document.activeElement).toBe(searchInput);
		});

		fireEvent.change(searchInput, { target: { value: 'use' } });
		await waitFor(() => {
			expect(document.activeElement).toBe(searchInput);
		});

		fireEvent.change(searchInput, { target: { value: 'user' } });
		await waitFor(() => {
			expect(document.activeElement).toBe(searchInput);
		});

		fireEvent.change(searchInput, { target: { value: 'users' } });
		await waitFor(() => {
			expect(document.activeElement).toBe(searchInput);
		});
	});

	it('maintains focus on search input when filtering results', async () => {
		render(<EndpointsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		// Focus and type
		searchInput.focus();
		fireEvent.change(searchInput, { target: { value: 'users' } });

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
		const propsWithGroupFilter = {
			...defaultProps,
			selectedGroupFilters: ['users-service', 'orders-service'],
		};

		render(<EndpointsTab {...propsWithGroupFilter} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...');
		fireEvent.change(searchInput, { target: { value: 'users' } });

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

	it('search input value persists through typing', async () => {
		render(<EndpointsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search endpoints...') as HTMLInputElement;

		// Type a search term
		fireEvent.change(searchInput, { target: { value: 'api' } });

		// Value should persist
		expect(searchInput.value).toBe('api');

		// Continue typing
		fireEvent.change(searchInput, { target: { value: 'api/users' } });
		expect(searchInput.value).toBe('api/users');
	});
});
