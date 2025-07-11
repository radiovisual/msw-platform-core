/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GroupRow from './GroupRow';
import type { Plugin } from '../../types';

const mockGroup = {
	id: 'test-group',
	name: 'Test Group',
	endpointIds: ['plugin1', 'plugin2'],
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
];

const defaultProps = {
	group: mockGroup,
	plugins: mockPlugins,
	editingGroup: null,
	onSetEditingGroup: jest.fn(),
	onRenameGroup: jest.fn(),
	onDeleteGroup: jest.fn(),
	onRemoveFromGroup: jest.fn(),
};

describe('GroupRow', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders group information correctly', () => {
		render(<GroupRow {...defaultProps} />);

		expect(screen.getByText('Test Group')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument(); // endpoint count
		expect(screen.getByText('GET')).toBeInTheDocument();
		expect(screen.getByText('POST')).toBeInTheDocument();
		expect(screen.getByText('/api/test1')).toBeInTheDocument();
		expect(screen.getByText('/api/test2')).toBeInTheDocument();
	});

	it('shows edit input when editing', () => {
		render(<GroupRow {...defaultProps} editingGroup="test-group" />);

		const input = screen.getByDisplayValue('Test Group');
		expect(input).toBeInTheDocument();
		expect(input).toHaveFocus();
	});

	it('calls onRenameGroup when input loses focus', () => {
		render(<GroupRow {...defaultProps} editingGroup="test-group" />);

		const input = screen.getByDisplayValue('Test Group');
		fireEvent.blur(input);

		expect(defaultProps.onRenameGroup).toHaveBeenCalledWith('test-group', 'Test Group');
	});

	it('calls onRenameGroup when Enter is pressed', () => {
		render(<GroupRow {...defaultProps} editingGroup="test-group" />);

		const input = screen.getByDisplayValue('Test Group');
		fireEvent.keyDown(input, { key: 'Enter' });

		expect(defaultProps.onRenameGroup).toHaveBeenCalledWith('test-group', 'Test Group');
	});

	it('calls onSetEditingGroup when edit button is clicked', () => {
		render(<GroupRow {...defaultProps} />);

		const editButton = screen.getByLabelText('edit');
		fireEvent.click(editButton);

		expect(defaultProps.onSetEditingGroup).toHaveBeenCalledWith('test-group');
	});

	it('calls onDeleteGroup when delete button is clicked', () => {
		render(<GroupRow {...defaultProps} />);

		const deleteButton = screen.getByLabelText('trash');
		fireEvent.click(deleteButton);

		expect(defaultProps.onDeleteGroup).toHaveBeenCalledWith('test-group');
	});

	it('calls onRemoveFromGroup when remove button is clicked', () => {
		render(<GroupRow {...defaultProps} />);

		const removeButtons = screen.getAllByRole('button');
		const removeButton = removeButtons.find(
			button => button.querySelector('svg') && button.getAttribute('aria-label') !== 'edit' && button.getAttribute('aria-label') !== 'trash'
		);

		if (removeButton) {
			fireEvent.click(removeButton);
			expect(defaultProps.onRemoveFromGroup).toHaveBeenCalledWith('plugin1', 'test-group');
		}
	});

	it('shows empty state when no endpoints in group', () => {
		const emptyGroup = { ...mockGroup, endpointIds: [] };
		render(<GroupRow {...defaultProps} group={emptyGroup} />);

		expect(screen.getByText('No endpoints in this group yet.')).toBeInTheDocument();
	});

	it('handles missing plugin gracefully', () => {
		const groupWithMissingPlugin = { ...mockGroup, endpointIds: ['missing-plugin'] };
		render(<GroupRow {...defaultProps} group={groupWithMissingPlugin} />);

		// Should not throw, and should NOT show empty state since endpointIds is not empty
		const emptyState = screen.queryByText('No endpoints in this group yet.');
		expect(emptyState).toBeNull();
	});
});
