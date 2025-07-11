import type { Meta, StoryObj } from '@storybook/react';
import { createMockPlatform } from '../platform';
import PopupDemo from './PopupDemo';

const meta: Meta<typeof PopupDemo> = {
	title: 'MockUI/Popup Window Approach',
	component: PopupDemo,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
# Popup Window MockUI

This story demonstrates the popup window approach for MockUI, which solves z-index stacking context issues by opening MockUI in a separate browser window.

## Key Features

- **No Z-Index Issues**: Runs in separate window context
- **Keyboard Shortcuts**: Ctrl+M toggles popup, Escape closes it
- **Real-time Updates**: Changes sync between popup and main app
- **Persistent**: Popup stays open while working in main app

## Versions

- **Simple**: Basic HTML rendering with toggle functionality
- **Advanced**: Styled interface with tabs and better UX

## Usage

Click the floating button in either demo section to open MockUI in a popup window. The popup will show your platform's endpoints and feature flags with full toggle functionality.

**Note**: Popup blockers may prevent the window from opening initially. Allow popups for this domain if needed.
				`,
			},
		},
	},
};

export default meta;
type Story = StoryObj<typeof PopupDemo>;

export const Default: Story = {
	name: 'Popup MockUI Demo',
};

export const WithComplexStacking: Story = {
	name: 'With Complex Z-Index Issues',
	decorators: [
		(Story) => (
			<div>
				{/* Simulate a page with high z-index elements that would block normal modals */}
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
						zIndex: 9999,
						padding: '20px',
						overflow: 'auto',
					}}
				>
					<div
						style={{
							background: 'white',
							borderRadius: '12px',
							padding: '24px',
							maxWidth: '800px',
							margin: '0 auto',
							position: 'relative',
							zIndex: 10000,
						}}
					>
						<h1 style={{ color: '#333', marginBottom: '16px' }}>Page with High Z-Index Modal</h1>
						<p style={{ marginBottom: '24px', color: '#666' }}>
							This simulates a page where normal modals would be blocked by existing high z-index elements.
							The MockUI popup approach completely bypasses this issue by opening in a separate window.
						</p>
						
						<div
							style={{
								background: '#f8f9fa',
								padding: '20px',
								borderRadius: '8px',
								border: '2px dashed #dee2e6',
								marginBottom: '24px',
							}}
						>
							<h3 style={{ color: '#495057', marginBottom: '12px' }}>Try It:</h3>
							<ol style={{ color: '#6c757d', paddingLeft: '20px' }}>
								<li>Look for the MockUI floating button (it should be visible despite this high z-index content)</li>
								<li>Click it or press <kbd>Ctrl+M</kbd> to open the popup</li>
								<li>The popup window will open completely separate from this page context</li>
								<li>Toggle endpoints and feature flags in the popup</li>
								<li>See how it works regardless of page z-index issues</li>
							</ol>
						</div>

						<Story />
					</div>
				</div>
			</div>
		),
	],
};