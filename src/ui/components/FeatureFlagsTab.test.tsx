import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatureFlagsTab from './FeatureFlagsTab';

const mockFeatureFlags = {
	'feature-1': true,
	'feature-2': false,
	'feature-3': true,
};

const defaultProps = {
	featureFlags: mockFeatureFlags,
	onToggleFeatureFlag: jest.fn(),
};

describe('FeatureFlagsTab', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders feature flags correctly', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		expect(screen.getByText('Feature Flags')).toBeInTheDocument();
		expect(screen.getByText('feature-1')).toBeInTheDocument();
		expect(screen.getByText('feature-2')).toBeInTheDocument();
		expect(screen.getByText('feature-3')).toBeInTheDocument();
	});

	it('shows enabled state correctly', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		// There should be two enabled and one disabled
		const enabled = screen.getAllByText('Currently enabled');
		const disabled = screen.getAllByText('Currently disabled');
		expect(enabled).toHaveLength(2);
		expect(disabled).toHaveLength(1);
	});

	it('renders checkboxes with correct states', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const checkboxes = screen.getAllByRole('checkbox');
		expect(checkboxes).toHaveLength(3);

		expect(checkboxes[0]).toBeChecked(); // feature-1: true
		expect(checkboxes[1]).not.toBeChecked(); // feature-2: false
		expect(checkboxes[2]).toBeChecked(); // feature-3: true
	});

	it('calls onToggleFeatureFlag when checkbox is clicked', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const checkboxes = screen.getAllByRole('checkbox');
		fireEvent.click(checkboxes[1]); // feature-2

		expect(defaultProps.onToggleFeatureFlag).toHaveBeenCalledWith('feature-2', true);
	});

	it('calls onToggleFeatureFlag with correct values', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const checkboxes = screen.getAllByRole('checkbox');

		// Toggle enabled feature to disabled
		fireEvent.click(checkboxes[0]); // feature-1
		expect(defaultProps.onToggleFeatureFlag).toHaveBeenCalledWith('feature-1', false);

		// Toggle disabled feature to enabled
		fireEvent.click(checkboxes[1]); // feature-2
		expect(defaultProps.onToggleFeatureFlag).toHaveBeenCalledWith('feature-2', true);
	});

	it('has correct accessibility labels', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		expect(screen.getByLabelText('Toggle feature flag feature-1')).toBeInTheDocument();
		expect(screen.getByLabelText('Toggle feature flag feature-2')).toBeInTheDocument();
		expect(screen.getByLabelText('Toggle feature flag feature-3')).toBeInTheDocument();
	});

	it('applies correct grid layout', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		// Traverse up to find the grid container
		let node = screen.getByText('feature-1').parentElement;
		while (node && window.getComputedStyle(node).display !== 'grid') {
			node = node.parentElement;
		}
		expect(node).not.toBeNull();
		expect(node).toHaveStyle({
			display: 'grid',
			gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
		});
	});
});
