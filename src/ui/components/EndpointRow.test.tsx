import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EndpointRow from './EndpointRow';
import type { Plugin } from '../../types';

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

const defaultProps = {
	plugin: mockPlugin,
	isMocked: true,
	onToggleMocked: jest.fn(),
	onUpdateStatusCode: jest.fn(),
	onAddToGroup: jest.fn(),
	onRemoveFromGroup: jest.fn(),
	getStatus: jest.fn(() => 200),
	getStatusCodes: jest.fn(() => [200, 404, 500]),
	groups: mockGroups,
	endpointScenarios: {},
	onScenarioChange: jest.fn(),
};

describe('EndpointRow', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders endpoint information correctly', () => {
		render(<EndpointRow {...defaultProps} />);

		expect(screen.getByText('GET')).toBeInTheDocument();
		expect(screen.getByText('/api/test')).toBeInTheDocument();
		expect(screen.getByText('test-component')).toBeInTheDocument();
		expect(screen.getByText('Test Group')).toBeInTheDocument();
	});

	it('shows mocked state correctly', () => {
		render(<EndpointRow {...defaultProps} isMocked />);
		
		const checkbox = screen.getByRole('checkbox', { name: /toggle endpoint/i });
		expect(checkbox).toBeChecked();
	});

	it('shows passthrough state correctly', () => {
		render(<EndpointRow {...defaultProps} isMocked={false} />);
		
		const checkbox = screen.getByRole('checkbox', { name: /toggle endpoint/i });
		expect(checkbox).not.toBeChecked();
		expect(screen.getByText('endpoint will passthrough to localhost:4711')).toBeInTheDocument();
	});

	it('calls onToggleMocked when checkbox is clicked', () => {
		render(<EndpointRow {...defaultProps} />);
		
		const checkbox = screen.getByRole('checkbox', { name: /toggle endpoint/i });
		fireEvent.click(checkbox);
		
		expect(defaultProps.onToggleMocked).toHaveBeenCalledWith('test-plugin');
	});

	it('renders status code options', () => {
		render(<EndpointRow {...defaultProps} />);
		
		expect(screen.getByLabelText('200')).toBeInTheDocument();
		expect(screen.getByLabelText('404')).toBeInTheDocument();
		expect(screen.getByLabelText('500')).toBeInTheDocument();
	});

	it('calls onUpdateStatusCode when status radio is clicked', () => {
		render(<EndpointRow {...defaultProps} />);
		
		const status404 = screen.getByLabelText('404');
		fireEvent.click(status404);
		
		expect(defaultProps.onUpdateStatusCode).toHaveBeenCalledWith('test-plugin', 404);
	});

	it('renders scenario dropdown when scenarios are available', () => {
		render(<EndpointRow {...defaultProps} />);
		
		const scenarioSelect = screen.getByRole('combobox');
		expect(scenarioSelect).toBeInTheDocument();
		expect(screen.getByText('Default')).toBeInTheDocument();
		expect(screen.getByText('Success')).toBeInTheDocument();
		expect(screen.getByText('Error')).toBeInTheDocument();
	});

	it('calls onScenarioChange when scenario is selected', () => {
		render(<EndpointRow {...defaultProps} />);
		
		const scenarioSelect = screen.getByRole('combobox');
		fireEvent.change(scenarioSelect, { target: { value: 'scenario1' } });
		
		expect(defaultProps.onScenarioChange).toHaveBeenCalledWith('test-plugin', 'scenario1');
	});

	it('shows swagger button when swaggerUrl is provided', () => {
		const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
		
		render(<EndpointRow {...defaultProps} />);
		
		const swaggerButton = screen.getByTestId('open-swagger-test-plugin');
		expect(swaggerButton).toBeInTheDocument();
		
		fireEvent.click(swaggerButton);
		expect(openSpy).toHaveBeenCalledWith('http://example.com/swagger', '_blank', 'noopener,noreferrer');
		
		openSpy.mockRestore();
	});

	it('does not show swagger button when swaggerUrl is not provided', () => {
		const pluginWithoutSwagger = { ...mockPlugin, swaggerUrl: undefined };
		render(<EndpointRow {...defaultProps} plugin={pluginWithoutSwagger} />);
		
		expect(screen.queryByTestId('open-swagger-test-plugin')).not.toBeInTheDocument();
	});

	it('shows add to group button', () => {
		render(<EndpointRow {...defaultProps} />);
		
		const addToGroupButton = screen.getByTestId('add-to-group-test-plugin');
		expect(addToGroupButton).toBeInTheDocument();
	});

	it('applies correct background color based on mocked state', () => {
		const { rerender } = render(<EndpointRow {...defaultProps} isMocked />);
		
		const container = screen.getByText('GET').closest('div');
		expect(container).toHaveStyle({ background: expect.stringMatching(/246|255/) });
		
		rerender(<EndpointRow {...defaultProps} isMocked={false} />);
		expect(container).toHaveStyle({ background: expect.stringMatching(/246|255/) });
	});
}); 