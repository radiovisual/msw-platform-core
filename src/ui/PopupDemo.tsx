import React from 'react';
import { createMockPlatform } from '../platform';
import PopupMockUI from './PopupMockUI';
import PopupMockUIAdvanced from './PopupMockUIAdvanced';

// Create a demo platform for testing
const demoPlatform = createMockPlatform({
	name: 'popup-demo',
	plugins: [
		{
			id: 'user-api',
			componentId: 'UserComponent',
			endpoint: '/api/user',
			method: 'GET',
			responses: {
				200: { name: 'John Doe', email: 'john@example.com' },
				404: { error: 'User not found' },
			},
			defaultStatus: 200,
		},
		{
			id: 'posts-api',
			componentId: 'PostsComponent',
			endpoint: '/api/posts',
			method: 'GET',
			responses: {
				200: [{ id: 1, title: 'Hello World' }, { id: 2, title: 'React is awesome' }],
				500: { error: 'Server error' },
			},
			defaultStatus: 200,
		},
		{
			id: 'create-post',
			componentId: 'PostsComponent',
			endpoint: '/api/posts',
			method: 'POST',
			responses: {
				201: { id: 3, title: 'New post created' },
				400: { error: 'Invalid data' },
			},
			defaultStatus: 201,
		},
	],
	featureFlags: [
		{ name: 'EXPERIMENTAL_UI', description: 'Enable experimental UI features', default: false },
		{ name: 'DARK_MODE', description: 'Enable dark mode theme', default: true },
		{ name: 'ANALYTICS', description: 'Enable analytics tracking', default: false },
	],
});

export const PopupMockUIDemo: React.FC = () => {
	const handleStateChange = (opts: { disabledPluginIds: string[] }) => {
		console.log('MockUI state changed:', opts);
	};

	return (
		<div style={{ padding: '24px' }}>
			<h1>Popup MockUI Demo</h1>
			<p style={{ marginBottom: '24px', color: '#6b7280' }}>
				This demo shows the popup window approach for MockUI. Click the floating button 
				to open MockUI in a separate popup window, completely avoiding any z-index issues.
			</p>

			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
				<div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
					<h3>Simple Popup Version</h3>
					<p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
						Basic HTML rendering with simple toggle functionality
					</p>
					<PopupMockUI 
						platform={demoPlatform} 
						onStateChange={handleStateChange}
					/>
				</div>

				<div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
					<h3>Advanced Popup Version</h3>
					<p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
						Styled interface with tabs, better UI, and more features
					</p>
					<PopupMockUIAdvanced 
						platform={demoPlatform} 
						onStateChange={handleStateChange}
					/>
				</div>
			</div>

			<div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
				<h2>Platform Status</h2>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }}>
					<div>
						<strong>Endpoints:</strong> {demoPlatform.getPlugins().length}
					</div>
					<div>
						<strong>Disabled:</strong> {demoPlatform.getDisabledPluginIds().length}
					</div>
					<div>
						<strong>Feature Flags:</strong> {Object.keys(demoPlatform.getFeatureFlags()).length}
					</div>
				</div>
			</div>

			<div style={{ marginTop: '24px', padding: '16px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
				<h3 style={{ color: '#92400e', marginBottom: '8px' }}>Benefits of Popup Approach:</h3>
				<ul style={{ color: '#92400e', paddingLeft: '20px' }}>
					<li>✅ <strong>No z-index issues</strong> - Runs in separate window context</li>
					<li>✅ <strong>More screen real estate</strong> - Can be larger than modal</li>
					<li>✅ <strong>Persistent</strong> - Stays open while working in main app</li>
					<li>✅ <strong>Keyboard shortcuts work</strong> - Ctrl+M toggles popup</li>
					<li>✅ <strong>Simple implementation</strong> - No complex portal or extension setup</li>
				</ul>
			</div>

			<div style={{ marginTop: '16px', padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #ef4444' }}>
				<h3 style={{ color: '#b91c1c', marginBottom: '8px' }}>Considerations:</h3>
				<ul style={{ color: '#b91c1c', paddingLeft: '20px' }}>
					<li>⚠️ <strong>Popup blockers</strong> - Users may need to allow popups</li>
					<li>⚠️ <strong>Window management</strong> - Additional window to manage</li>
					<li>⚠️ <strong>React rendering</strong> - Complex to render full React components in popup</li>
				</ul>
			</div>
		</div>
	);
};

export default PopupMockUIDemo;