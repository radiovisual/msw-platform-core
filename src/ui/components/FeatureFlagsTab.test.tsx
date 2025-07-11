/**
 * @jest-environment jsdom
 */
import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import FeatureFlagsTab from './FeatureFlagsTab';

const mockFeatureFlags = {
	'feature-1': true,
	'feature-2': false,
	'feature-3': true,
};

const mockFeatureFlagMetadata = {
	'feature-1': { description: 'First feature flag for testing' },
	'feature-2': { description: 'Second feature flag with default false', default: false },
	'feature-3': { description: 'Third feature flag with default true', default: true },
};

const defaultProps = {
	featureFlags: mockFeatureFlags,
	featureFlagMetadata: mockFeatureFlagMetadata,
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

	it('shows descriptions when available', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		expect(screen.getByText('First feature flag for testing')).toBeInTheDocument();
		expect(screen.getByText('Second feature flag with default false')).toBeInTheDocument();
		expect(screen.getByText('Third feature flag with default true')).toBeInTheDocument();
	});

	it('shows enabled/disabled status correctly', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		// Should show "Enabled" and "Disabled" instead of "Currently enabled/disabled"
		const enabled = screen.getAllByText('Enabled');
		const disabled = screen.getAllByText('Disabled');
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

	it('calls onToggleFeatureFlag when card is clicked', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		// Find the card containing feature-2 and click it
		const feature2Card = screen.getByText('feature-2').closest('div[role="checkbox"]');
		expect(feature2Card).toBeInTheDocument();
		fireEvent.click(feature2Card!);

		expect(defaultProps.onToggleFeatureFlag).toHaveBeenCalledWith('feature-2', true);
	});

	it('calls onToggleFeatureFlag when card is clicked with Enter key', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const feature2Card = screen.getByText('feature-2').closest('div[role="checkbox"]');
		expect(feature2Card).toBeInTheDocument();
		fireEvent.keyDown(feature2Card!, { key: 'Enter' });

		expect(defaultProps.onToggleFeatureFlag).toHaveBeenCalledWith('feature-2', true);
	});

	it('calls onToggleFeatureFlag when card is clicked with Space key', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const feature2Card = screen.getByText('feature-2').closest('div[role="checkbox"]');
		expect(feature2Card).toBeInTheDocument();
		fireEvent.keyDown(feature2Card!, { key: ' ' });

		expect(defaultProps.onToggleFeatureFlag).toHaveBeenCalledWith('feature-2', true);
	});

	it('does not call onToggleFeatureFlag for other keys', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const feature2Card = screen.getByText('feature-2').closest('div[role="checkbox"]');
		expect(feature2Card).toBeInTheDocument();
		fireEvent.keyDown(feature2Card!, { key: 'Tab' });

		expect(defaultProps.onToggleFeatureFlag).not.toHaveBeenCalled();
	});

	it('has correct accessibility labels', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		expect(screen.getByLabelText('Toggle feature flag feature-1')).toBeInTheDocument();
		expect(screen.getByLabelText('Toggle feature flag feature-2')).toBeInTheDocument();
		expect(screen.getByLabelText('Toggle feature flag feature-3')).toBeInTheDocument();
	});

	it('renders search input', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search feature flags...');
		expect(searchInput).toBeInTheDocument();
	});

	it('filters feature flags by name when searching', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search feature flags...');
		fireEvent.change(searchInput, { target: { value: 'feature-1' } });

		expect(screen.getByText('feature-1')).toBeInTheDocument();
		expect(screen.queryByText('feature-2')).not.toBeInTheDocument();
		expect(screen.queryByText('feature-3')).not.toBeInTheDocument();
	});

	it('filters feature flags by description when searching', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search feature flags...');
		fireEvent.change(searchInput, { target: { value: 'testing' } });

		expect(screen.getByText('feature-1')).toBeInTheDocument();
		expect(screen.queryByText('feature-2')).not.toBeInTheDocument();
		expect(screen.queryByText('feature-3')).not.toBeInTheDocument();
	});

	it('shows results count when searching', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search feature flags...');
		fireEvent.change(searchInput, { target: { value: 'feature' } });

		expect(screen.getByText('3 of 3 feature flags')).toBeInTheDocument();
	});

	it('shows no results message when search has no matches', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const searchInput = screen.getByPlaceholderText('Search feature flags...');
		fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

		expect(screen.getByText('No feature flags match "nonexistent"')).toBeInTheDocument();
	});

	it('works without feature flag metadata', () => {
		const propsWithoutMetadata = {
			featureFlags: mockFeatureFlags,
			onToggleFeatureFlag: jest.fn(),
		};

		render(<FeatureFlagsTab {...propsWithoutMetadata} />);

		expect(screen.getByText('feature-1')).toBeInTheDocument();
		expect(screen.getByText('feature-2')).toBeInTheDocument();
		expect(screen.getByText('feature-3')).toBeInTheDocument();
		expect(screen.getAllByText('Enabled')).toHaveLength(2);
		expect(screen.getAllByText('Disabled')).toHaveLength(1);
	});

	it('prevents event bubbling when checkbox is clicked', () => {
		render(<FeatureFlagsTab {...defaultProps} />);

		const checkboxes = screen.getAllByRole('checkbox');

		// Click the checkbox
		fireEvent.click(checkboxes[1]);

		// Should only call once (not twice from card + checkbox)
		expect(defaultProps.onToggleFeatureFlag).toHaveBeenCalledTimes(1);
		expect(defaultProps.onToggleFeatureFlag).toHaveBeenCalledWith('feature-2', true);
	});
});
