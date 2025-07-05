import React from 'react';
import { render, screen } from '@testing-library/react';
import AutoGroupRow from './AutoGroupRow';
import type { Plugin } from '../../types';

const mockAutoGroup = {
	id: 'test-component',
	name: 'test-component',
	endpointIds: ['plugin1', 'plugin2'],
	auto: true,
};

const mockPlugins: Plugin[] = [
	{
		id: 'plugin1',
		method: 'GET',
		endpoint: '/api/test1',
		componentId: 'test-component',
		defaultStatus: 200,
		responses: {},
	},
	{
		id: 'plugin2',
		method: 'POST',
		endpoint: '/api/test2',
		componentId: 'test-component',
		defaultStatus: 201,
		responses: {},
	},
	{
		id: 'plugin3',
		method: 'PUT',
		endpoint: '/api/test3',
		componentId: 'other-component',
		defaultStatus: 200,
		responses: {},
	},
];

const defaultProps = {
	group: mockAutoGroup,
	plugins: mockPlugins,
};

describe('AutoGroupRow', () => {
	it('renders auto group information correctly', () => {
		render(<AutoGroupRow {...defaultProps} />);

		expect(screen.getByText('test-component')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument(); // endpoint count for this component
		expect(screen.getByText('GET')).toBeInTheDocument();
		expect(screen.getByText('POST')).toBeInTheDocument();
		expect(screen.getByText('/api/test1')).toBeInTheDocument();
		expect(screen.getByText('/api/test2')).toBeInTheDocument();
	});

	it('filters plugins by component ID', () => {
		render(<AutoGroupRow {...defaultProps} />);

		// Should not show plugin3 since it belongs to 'other-component'
		expect(screen.queryByText('PUT')).not.toBeInTheDocument();
		expect(screen.queryByText('/api/test3')).not.toBeInTheDocument();
	});

	it('shows empty state when no endpoints in component', () => {
		const emptyAutoGroup = { ...mockAutoGroup, name: 'empty-component' };
		render(<AutoGroupRow {...defaultProps} group={emptyAutoGroup} />);

		expect(screen.getByText('No endpoints in this group yet.')).toBeInTheDocument();
	});

	it('applies correct styling for auto groups', () => {
		render(<AutoGroupRow {...defaultProps} />);

		const container = screen.getByText('test-component').closest('div');
		expect(container).toHaveStyle({ background: expect.stringMatching(/248|f8f8f8/i) });
	});

	it('displays correct endpoint count', () => {
		render(<AutoGroupRow {...defaultProps} />);

		// Should show count of plugins that belong to this component
		const countElement = screen.getByText('2');
		expect(countElement).toBeInTheDocument();
	});
});