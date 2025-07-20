import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MockUI, createMockPlatform, Plugin } from '../../';
import { mswHandlersFromPlatform } from '../../adapters/msw';

// Simple transform demo - focuses on core capabilities
const basicTransformPlugin: Plugin = {
	id: 'basic-transform',
	componentId: 'BasicAPI',
	endpoint: '/api/basic',
	method: 'GET',
	responses: {
		200: { message: 'Hello World', userId: 123 },
		500: { error: 'Server Error' },
	},
	defaultStatus: 200,
	transform: (response, context) => {
		// 1. Override status code (200 → 500)
		if (context.featureFlags.FORCE_ERROR) {
			return {
				body: { error: 'Transform forced this error', original: response },
				status: 500,
				headers: { 'X-Transform': 'error-override' },
			};
		}

		// 2. Add custom headers
		if (context.featureFlags.ADD_HEADERS) {
			return {
				body: response,
				headers: {
					'X-Custom-Header': 'Added by transform',
					'X-User-ID': String(response.userId),
					'X-Timestamp': new Date().toISOString(),
				},
			};
		}

		// 3. Change response format to XML
		if (context.featureFlags.RETURN_XML) {
			return {
				body: `<?xml version="1.0"?>\n<response>\n  <message>${response.message}</message>\n  <userId>${response.userId}</userId>\n</response>`,
				headers: { 'Content-Type': 'application/xml' },
			};
		}

		return response;
	},
};

// User data plugin with filtering example
const userDataPlugin: Plugin = {
	id: 'user-data',
	componentId: 'UserAPI',
	endpoint: '/api/user',
	method: 'GET',
	responses: {
		200: {
			id: 'user123',
			name: 'John Doe',
			email: 'john@example.com',
			role: 'user',
			ssn: '123-45-6789',
		},
		401: { error: 'Unauthorized' },
	},
	defaultStatus: 200,
	scenarios: [
		{
			id: 'admin-user',
			label: 'Admin User',
			responses: {
				200: {
					id: 'admin456',
					name: 'Admin User',
					email: 'admin@example.com',
					role: 'admin',
					ssn: '987-65-4321',
				},
			},
		},
	],
	transform: (response, context) => {
		// Filter sensitive data based on user role
		if (context.featureFlags.FILTER_SENSITIVE_DATA && response.role !== 'admin') {
			const filtered = { ...response };
			delete filtered.ssn;
			filtered.email = '***@***.***';
			return {
				body: { ...filtered, _filtered: true },
				headers: { 'X-Data-Filtered': 'true' },
			};
		}

		return response;
	},
};

// Create simplified platform
const platform = createMockPlatform({
	name: 'simple-transform-demo',
	plugins: [basicTransformPlugin, userDataPlugin],
	featureFlags: [
		// Basic transform flags (only affect /api/basic)
		{ name: 'FORCE_ERROR', description: 'Override success to 500 error (/api/basic)', default: false },
		{ name: 'ADD_HEADERS', description: 'Add custom headers (/api/basic)', default: false },
		{ name: 'RETURN_XML', description: 'Return XML format (/api/basic)', default: false },

		// User data flags (only affect /api/user)
		{ name: 'FILTER_SENSITIVE_DATA', description: 'Hide sensitive data (/api/user)', default: false },
	],
});

// Simple demo component
function TransformDemoApp() {
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [responseHeaders, setResponseHeaders] = useState<Record<string, string>>({});

	// Individual flag states for reliable UI updates
	const [forceError, setForceError] = useState(false);
	const [addHeaders, setAddHeaders] = useState(false);
	const [returnXml, setReturnXml] = useState(false);
	const [filterSensitiveData, setFilterSensitiveData] = useState(false);

	// Helper function to update both platform and local state
	const updateFeatureFlag = (flagName: string, value: boolean) => {
		platform.setFeatureFlag(flagName, value);

		// Update local state based on flag name
		switch (flagName) {
			case 'FORCE_ERROR':
				setForceError(value);
				break;
			case 'ADD_HEADERS':
				setAddHeaders(value);
				break;
			case 'RETURN_XML':
				setReturnXml(value);
				break;
			case 'FILTER_SENSITIVE_DATA':
				setFilterSensitiveData(value);
				break;
		}
	};

	const makeRequest = async (url: string) => {
		setError(null);
		setResult(null);
		setResponseHeaders({});
		try {
			const response = await fetch(url);

			// Extract headers for display
			const headers: Record<string, string> = {};
			response.headers.forEach((value, key) => {
				headers[key] = value;
			});
			setResponseHeaders(headers);

			const contentType = response.headers.get('content-type') || '';
			let data;

			if (contentType.includes('application/json')) {
				data = await response.json();
			} else {
				data = await response.text();
			}

			setResult({ status: response.status, data });
		} catch (e) {
			setError(String(e));
		}
	};

	return (
		<div style={{ padding: 32 }}>
			<h2>Transform Method Demo</h2>
			<p>Simple examples showing how transform methods can modify responses. Each feature flag clearly shows which endpoint it affects.</p>
			<hr />

			<div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
				<div style={{ flex: 1 }}>
					<h3>Test Endpoints</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
						<button onClick={() => makeRequest('/api/basic')} style={{ padding: '8px 12px' }}>
							GET /api/basic - Basic transforms
						</button>
						<button onClick={() => makeRequest('/api/user')} style={{ padding: '8px 12px' }}>
							GET /api/user - Data filtering
						</button>
					</div>

					<h3>Feature Flags</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '14px' }}>
						<div style={{ backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px', marginBottom: 8 }}>
							<strong>Basic API (/api/basic)</strong>
						</div>
						<label style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 16 }}>
							<input type="checkbox" checked={forceError} onChange={e => updateFeatureFlag('FORCE_ERROR', e.target.checked)} />
							Override success (200) → error (500)
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 16 }}>
							<input type="checkbox" checked={addHeaders} onChange={e => updateFeatureFlag('ADD_HEADERS', e.target.checked)} />
							Add custom headers
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 16 }}>
							<input type="checkbox" checked={returnXml} onChange={e => updateFeatureFlag('RETURN_XML', e.target.checked)} />
							Return XML instead of JSON
						</label>

						<div style={{ backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '4px', marginTop: 12, marginBottom: 8 }}>
							<strong>User API (/api/user)</strong>
						</div>
						<label style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 16 }}>
							<input
								type="checkbox"
								checked={filterSensitiveData}
								onChange={e => updateFeatureFlag('FILTER_SENSITIVE_DATA', e.target.checked)}
							/>
							Filter sensitive data (email, SSN)
						</label>
					</div>
				</div>

				<div style={{ flex: 1 }}>
					<h3>Response</h3>
					{Object.keys(responseHeaders).length > 0 && (
						<div style={{ marginBottom: '10px' }}>
							<strong>Headers:</strong>
							<pre
								style={{
									fontSize: '11px',
									backgroundColor: '#f5f5f5',
									padding: '8px',
									borderRadius: '4px',
									margin: '4px 0',
								}}
							>
								{Object.entries(responseHeaders)
									.filter(([key]) => key.startsWith('x-') || key.startsWith('content-'))
									.map(([key, value]) => `${key}: ${value}`)
									.join('\n') || 'No custom headers'}
							</pre>
						</div>
					)}
					<pre
						style={{
							width: '100%',
							padding: '10px',
							backgroundColor: 'lightgray',
							borderRadius: 5,
							color: 'black',
							fontFamily: 'monospace',
							fontSize: '12px',
							minHeight: '200px',
							overflow: 'auto',
						}}
					>
						{result ? JSON.stringify(result, null, 2) : error ? error : 'Click a button to test!'}
					</pre>
				</div>
			</div>

			<MockUI platform={platform} />
		</div>
	);
}

// Status override focused demo
function StatusOverrideDemoApp() {
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	// Individual flag states for reliable UI updates
	const [force404, setForce404] = useState(false);
	const [maintenanceMode, setMaintenanceMode] = useState(false);

	const statusPlatform = createMockPlatform({
		name: 'status-demo',
		plugins: [
			{
				id: 'status-demo',
				componentId: 'StatusAPI',
				endpoint: '/api/status',
				method: 'GET',
				responses: {
					200: { message: 'Everything is OK' },
				},
				defaultStatus: 200,
				transform: (response, context) => {
					if (context.featureFlags.FORCE_404) {
						return {
							body: { error: 'Not Found', message: 'Resource does not exist' },
							status: 404,
							headers: { 'X-Override-Reason': 'feature-flag' },
						};
					}
					if (context.featureFlags.MAINTENANCE_MODE) {
						return {
							body: { error: 'Service Unavailable', message: 'Under maintenance' },
							status: 503,
							headers: { 'Retry-After': '3600' },
						};
					}
					return response;
				},
			},
		],
		featureFlags: [
			{ name: 'FORCE_404', description: 'Override 200 → 404 Not Found', default: false },
			{ name: 'MAINTENANCE_MODE', description: 'Override 200 → 503 Service Unavailable', default: false },
		],
	});

	// Helper function to update both platform and local state
	const updateStatusFlag = (flagName: string, value: boolean) => {
		statusPlatform.setFeatureFlag(flagName, value);

		// Update local state based on flag name
		switch (flagName) {
			case 'FORCE_404':
				setForce404(value);
				break;
			case 'MAINTENANCE_MODE':
				setMaintenanceMode(value);
				break;
		}
	};

	const fetchStatus = async () => {
		setError(null);
		setResult(null);
		try {
			const response = await fetch('/api/status');
			const data = await response.json();
			setResult({ status: response.status, data });
		} catch (e) {
			setError(String(e));
		}
	};

	return (
		<div style={{ padding: 32 }}>
			<h2>Status Code Override Demo</h2>
			<p>Simple example showing how transform methods can override HTTP status codes.</p>
			<hr />

			<div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
				<div style={{ flex: 1 }}>
					<button onClick={fetchStatus} style={{ padding: '8px 12px', marginBottom: '16px' }}>
						GET /api/status
					</button>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '14px' }}>
						<label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
							<input type="checkbox" checked={force404} onChange={e => updateStatusFlag('FORCE_404', e.target.checked)} />
							Force 404 Not Found
						</label>
						<label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
							<input type="checkbox" checked={maintenanceMode} onChange={e => updateStatusFlag('MAINTENANCE_MODE', e.target.checked)} />
							Force 503 Service Unavailable
						</label>
					</div>
				</div>

				<div style={{ flex: 1 }}>
					<h3>Response</h3>
					<pre
						style={{
							width: '100%',
							padding: '10px',
							backgroundColor: 'lightgray',
							borderRadius: 5,
							color: 'black',
							fontFamily: 'monospace',
							fontSize: '12px',
							minHeight: '100px',
						}}
					>
						{result ? JSON.stringify(result, null, 2) : error ? error : 'Click button to test!'}
					</pre>
				</div>
			</div>

			<MockUI platform={statusPlatform} />
		</div>
	);
}

export const TransformMethodDemo: Story = {
	name: 'Interactive Transform Demo',
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(platform),
		},
	},
	render: () => <TransformDemoApp />,
};

export const StatusCodeOverrides: Story = {
	name: 'Status Code Override Demo',
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(
				createMockPlatform({
					name: 'status-demo',
					plugins: [
						{
							id: 'status-demo',
							componentId: 'StatusAPI',
							endpoint: '/api/status',
							method: 'GET',
							responses: {
								200: { message: 'Everything is OK' },
							},
							defaultStatus: 200,
							transform: (response, context) => {
								if (context.featureFlags.FORCE_404) {
									return {
										body: { error: 'Not Found', message: 'Resource does not exist' },
										status: 404,
										headers: { 'X-Override-Reason': 'feature-flag' },
									};
								}
								if (context.featureFlags.MAINTENANCE_MODE) {
									return {
										body: { error: 'Service Unavailable', message: 'Under maintenance' },
										status: 503,
										headers: { 'Retry-After': '3600' },
									};
								}
								return response;
							},
						},
					],
					featureFlags: [
						{ name: 'FORCE_404', description: 'Override 200 → 404 Not Found', default: false },
						{ name: 'MAINTENANCE_MODE', description: 'Override 200 → 503 Service Unavailable', default: false },
					],
				})
			),
		},
	},
	render: () => <StatusOverrideDemoApp />,
};

// Meta configuration
const meta: Meta<typeof TransformDemoApp> = {
	title: 'MockUI/Transform Methods',
	component: TransformDemoApp,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;
