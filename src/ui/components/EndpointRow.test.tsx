/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EndpointRow from './EndpointRow';
import type { Plugin } from '../../types';
import type { MockPlatformCore } from '../../classes/MockPlatformCore';

const mockPlugin: Plugin = {
	id: 'test-plugin',
	method: 'GET',
	endpoint: '/api/test',
	componentId: 'test-component',
	defaultStatus: 200,
	scenarios: [
		{ id: 'scenario1', label: 'Success', responses: {} },
		{ id: 'scenario2', label: 'Error', responses: {} },
	],
	swaggerUrl: 'http://example.com/swagger',
	responses: {},
};

const mockGroups = [
	{ id: 'group1', name: 'Test Group', endpointIds: ['test-plugin'] },
	{ id: 'group2', name: 'Another Group', endpointIds: [] },
];

// Create a mock platform for testing
const mockPlatform = {
	getEndpointBadges: jest.fn(() => []),
} as unknown as MockPlatformCore;

const defaultProps = {
	plugin: {
		id: 'test-plugin',
		componentId: 'TestComponent',
		endpoint: '/api/test',
		method: 'GET' as const,
		responses: { 200: { message: 'test' } },
		defaultStatus: 200,
	},
	isMocked: true,
	onToggleMocked: jest.fn(),
	onUpdateStatusCode: jest.fn(),
	onAddToGroup: jest.fn(),
	onRemoveFromGroup: jest.fn(),
	getStatus: jest.fn(() => 200),
	getStatusCodes: jest.fn(() => [200, 404]),
	groups: mockGroups,
	endpointScenarios: {},
	onScenarioChange: jest.fn(),
	platform: mockPlatform,
	onUpdateDelay: jest.fn(),
	getDelay: jest.fn(() => 150),
};

describe('EndpointRow', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders endpoint information correctly', () => {
		render(<EndpointRow {...defaultProps} />);

		expect(screen.getByText('GET')).toBeInTheDocument();
		expect(screen.getByText('/api/test')).toBeInTheDocument();
		expect(screen.getByText('TestComponent')).toBeInTheDocument();
		expect(screen.getByText('Test Group')).toBeInTheDocument();
	});

	it('shows mocked state correctly', () => {
		render(<EndpointRow {...defaultProps} isMocked />);

		const toggle = screen.getByLabelText('Mock');
		expect(toggle).toBeInTheDocument();
	});

	it('shows passthrough state correctly', () => {
		render(<EndpointRow {...defaultProps} isMocked={false} />);

		const toggle = screen.getByLabelText('Mock');
		expect(toggle).toBeInTheDocument();
		expect(screen.getByText(/endpoint will passthrough/i)).toBeInTheDocument();
	});

	it('calls onToggleMocked when toggle is clicked', () => {
		render(<EndpointRow {...defaultProps} />);

		const toggle = screen.getByLabelText('Mock');
		fireEvent.click(toggle);

		expect(defaultProps.onToggleMocked).toHaveBeenCalledWith('test-plugin');
	});

	it('renders status code options', () => {
		render(<EndpointRow {...defaultProps} />);

		expect(screen.getByText('200')).toBeInTheDocument();
		expect(screen.getByText('404')).toBeInTheDocument();
	});

	it('calls onUpdateStatusCode when status badge is clicked', () => {
		render(<EndpointRow {...defaultProps} />);

		const status404 = screen.getByText('404');
		fireEvent.click(status404);

		expect(defaultProps.onUpdateStatusCode).toHaveBeenCalledWith('test-plugin', 404);
	});

	it('renders scenario dropdown when scenarios are available', () => {
		const pluginWithScenarios = {
			...defaultProps.plugin,
			scenarios: [
				{ id: 'default', label: 'Default', responses: { 200: { message: 'ok' } } },
				{ id: 'success', label: 'Success', responses: { 200: { message: 'yay' } } },
			],
		};
		render(<EndpointRow {...defaultProps} plugin={pluginWithScenarios} />);
		const scenarioSelect = screen.getByRole('combobox');
		expect(scenarioSelect).toBeInTheDocument();
		expect(screen.getAllByText('Default').length).toBeGreaterThan(0);
		expect(screen.getByText('Success')).toBeInTheDocument();
	});

	it('calls onScenarioChange when scenario is selected', () => {
		const pluginWithScenarios = {
			...defaultProps.plugin,
			scenarios: [{ id: 'scenario1', label: 'Scenario 1', responses: { 200: { message: 'ok' } } }],
		};
		render(<EndpointRow {...defaultProps} plugin={pluginWithScenarios} />);
		const scenarioSelect = screen.getByRole('combobox');
		fireEvent.change(scenarioSelect, { target: { value: 'scenario1' } });
		expect(defaultProps.onScenarioChange).toHaveBeenCalledWith('test-plugin', 'scenario1');
	});

	it('shows swagger button when swaggerUrl is provided', () => {
		const pluginWithSwagger = {
			...defaultProps.plugin,
			swaggerUrl: 'https://example.com/swagger',
		};
		render(<EndpointRow {...defaultProps} plugin={pluginWithSwagger} />);
		const swaggerButton = screen.getByTestId('open-swagger-test-plugin');
		expect(swaggerButton).toBeInTheDocument();
	});

	it('does not show swagger button when swaggerUrl is not provided', () => {
		const pluginWithoutSwagger = { ...mockPlugin, swaggerUrl: undefined };
		render(<EndpointRow {...defaultProps} plugin={pluginWithoutSwagger} />);

		expect(screen.queryByTestId('open-swagger-test-plugin')).not.toBeInTheDocument();
	});

	it('shows add to group button', () => {
		render(<EndpointRow {...defaultProps} />);

		const addToGroupButton = screen.getByRole('button', { name: /groups/i });
		expect(addToGroupButton).toBeInTheDocument();
	});

	it('displays endpoint with query parameters when plugin has queryResponses', () => {
		const pluginWithQuery: Plugin = {
			id: 'test',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET' as const,
			responses: { 200: {} },
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: {} },
			},
		};

		render(
			<EndpointRow
				plugin={pluginWithQuery}
				isMocked
				onToggleMocked={jest.fn()}
				onUpdateStatusCode={jest.fn()}
				onAddToGroup={jest.fn()}
				onRemoveFromGroup={jest.fn()}
				getStatus={jest.fn()}
				getStatusCodes={() => [200]}
				groups={[]}
				endpointScenarios={{}}
				onScenarioChange={jest.fn()}
				platform={mockPlatform}
				onUpdateDelay={jest.fn()}
				getDelay={() => 150}
			/>
		);

		expect(screen.getByText('/api/test')).toBeInTheDocument();
		expect(screen.getByText('?type=admin')).toBeInTheDocument();
	});

	it('displays all endpoint variants with query parameters when plugin has multiple queryResponses', () => {
		const pluginWithMultipleQuery: Plugin = {
			id: 'test',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET' as const,
			responses: { 200: {} },
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: {} },
				'type=guest': { 200: {} },
				'status=active': { 200: {} },
			},
		};

		render(
			<EndpointRow
				plugin={pluginWithMultipleQuery}
				isMocked
				onToggleMocked={jest.fn()}
				onUpdateStatusCode={jest.fn()}
				onAddToGroup={jest.fn()}
				onRemoveFromGroup={jest.fn()}
				getStatus={jest.fn()}
				getStatusCodes={() => [200]}
				groups={[]}
				endpointScenarios={{}}
				onScenarioChange={jest.fn()}
				platform={mockPlatform}
				onUpdateDelay={jest.fn()}
				getDelay={() => 150}
			/>
		);

		expect(screen.getByText('/api/test')).toBeInTheDocument();
		expect(screen.getByText('?type=admin')).toBeInTheDocument();
		expect(screen.getByText('?type=guest')).toBeInTheDocument();
		expect(screen.getByText('?status=active')).toBeInTheDocument();
	});

	it('displays endpoint without query parameters when plugin has no queryResponses', () => {
		const pluginWithoutQuery: Plugin = {
			id: 'test',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET' as const,
			responses: { 200: {} },
			defaultStatus: 200,
		};

		render(
			<EndpointRow
				plugin={pluginWithoutQuery}
				isMocked
				onToggleMocked={jest.fn()}
				onUpdateStatusCode={jest.fn()}
				onAddToGroup={jest.fn()}
				onRemoveFromGroup={jest.fn()}
				getStatus={jest.fn()}
				getStatusCodes={() => [200]}
				groups={[]}
				endpointScenarios={{}}
				onScenarioChange={jest.fn()}
				platform={mockPlatform}
				onUpdateDelay={jest.fn()}
				getDelay={() => 150}
			/>
		);

		expect(screen.getByText('/api/test')).toBeInTheDocument();
	});

	it('displays endpoint without query parameters when queryResponses is empty', () => {
		const pluginWithEmptyQuery: Plugin = {
			id: 'test',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET' as const,
			responses: { 200: {} },
			defaultStatus: 200,
			queryResponses: {},
		};

		render(
			<EndpointRow
				plugin={pluginWithEmptyQuery}
				isMocked
				onToggleMocked={jest.fn()}
				onUpdateStatusCode={jest.fn()}
				onAddToGroup={jest.fn()}
				onRemoveFromGroup={jest.fn()}
				getStatus={jest.fn()}
				getStatusCodes={() => [200]}
				groups={[]}
				endpointScenarios={{}}
				onScenarioChange={jest.fn()}
				platform={mockPlatform}
				onUpdateDelay={jest.fn()}
				getDelay={() => 150}
			/>
		);

		expect(screen.getByText('/api/test')).toBeInTheDocument();
	});

	it('displays delay input with correct value', () => {
		const plugin: Plugin = {
			id: 'test',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET' as const,
			responses: { 200: {} },
			defaultStatus: 200,
		};

		const mockGetDelay = jest.fn(() => 150);
		const mockOnUpdateDelay = jest.fn();

		render(
			<EndpointRow
				plugin={plugin}
				isMocked
				onToggleMocked={jest.fn()}
				onUpdateStatusCode={jest.fn()}
				onAddToGroup={jest.fn()}
				onRemoveFromGroup={jest.fn()}
				getStatus={jest.fn()}
				getStatusCodes={() => [200]}
				groups={[]}
				endpointScenarios={{}}
				onScenarioChange={jest.fn()}
				platform={mockPlatform}
				onUpdateDelay={mockOnUpdateDelay}
				getDelay={mockGetDelay}
			/>
		);

		const delayInput = screen.getByDisplayValue('150');
		expect(delayInput).toBeInTheDocument();
		expect(delayInput).toHaveValue(150);
	});

	it('calls onUpdateDelay when delay input changes', () => {
		const plugin: Plugin = {
			id: 'test',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET' as const,
			responses: { 200: {} },
			defaultStatus: 200,
		};

		const mockGetDelay = jest.fn(() => 150);
		const mockOnUpdateDelay = jest.fn();

		render(
			<EndpointRow
				plugin={plugin}
				isMocked
				onToggleMocked={jest.fn()}
				onUpdateStatusCode={jest.fn()}
				onAddToGroup={jest.fn()}
				onRemoveFromGroup={jest.fn()}
				getStatus={jest.fn()}
				getStatusCodes={() => [200]}
				groups={[]}
				endpointScenarios={{}}
				onScenarioChange={jest.fn()}
				platform={mockPlatform}
				onUpdateDelay={mockOnUpdateDelay}
				getDelay={mockGetDelay}
			/>
		);

		const delayInput = screen.getByDisplayValue('150');
		fireEvent.change(delayInput, { target: { value: '1000' } });

		expect(mockOnUpdateDelay).toHaveBeenCalledWith('test', 1000);
	});

	it('handles empty delay input value', () => {
		const plugin: Plugin = {
			id: 'test',
			componentId: 'test',
			endpoint: '/api/test',
			method: 'GET' as const,
			responses: { 200: {} },
			defaultStatus: 200,
		};

		const mockGetDelay = jest.fn(() => 150);
		const mockOnUpdateDelay = jest.fn();

		render(
			<EndpointRow
				plugin={plugin}
				isMocked
				onToggleMocked={jest.fn()}
				onUpdateStatusCode={jest.fn()}
				onAddToGroup={jest.fn()}
				onRemoveFromGroup={jest.fn()}
				getStatus={jest.fn()}
				getStatusCodes={() => [200]}
				groups={[]}
				endpointScenarios={{}}
				onScenarioChange={jest.fn()}
				platform={mockPlatform}
				onUpdateDelay={mockOnUpdateDelay}
				getDelay={mockGetDelay}
			/>
		);

		const delayInput = screen.getByDisplayValue('150');
		fireEvent.change(delayInput, { target: { value: '' } });

		expect(mockOnUpdateDelay).toHaveBeenCalledWith('test', 0);
	});
});
