import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import MockUI from '../MockUI';
import { createMockPlatform } from '../../platform';
import { mswHandlersFromPlatform } from '../../adapters/msw';

const meta: Meta<typeof MockUI> = {
	title: 'MockUI/503 Service Unavailable',
	component: MockUI,
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;
type Story = StoryObj<typeof MockUI>;

// Create a platform with various 503 Service Unavailable configurations
const platform = createMockPlatform({
	name: '503-demo',
	plugins: [
		{
			id: 'basic-service',
			componentId: 'service',
			endpoint: '/api/service/basic',
			method: 'GET',
			responses: { 
				200: { message: 'Basic service is running' },
				400: { error: 'Bad request' }
			},
			defaultStatus: 200,
		},
		{
			id: 'service-with-custom-503',
			componentId: 'service',
			endpoint: '/api/service/custom503',
			method: 'GET',
			responses: { 
				200: { message: 'Service with custom 503 is running' },
				503: { 
					error: 'Custom Service Unavailable',
					maintenance: true,
					retryAfter: 300
				}
			},
			defaultStatus: 200,
		},
		{
			id: 'service-with-custom-503-headers',
			componentId: 'service',
			endpoint: '/api/service/custom503headers',
			method: 'GET',
			responses: { 
				200: { message: 'Service with custom 503 headers is running' },
				503: { 
					body: { error: 'Maintenance Mode', estimatedDowntime: '2 hours' },
					headers: {
						'Retry-After': '7200',
						'X-Maintenance': 'true',
						'Content-Type': 'application/json'
					}
				}
			},
			defaultStatus: 200,
		},
		{
			id: 'service-with-scenarios',
			componentId: 'service',
			endpoint: '/api/service/scenarios',
			method: 'GET',
			responses: { 
				200: { message: 'Service with scenarios is running' },
				503: { error: 'Default Service Unavailable' }
			},
			defaultStatus: 200,
			scenarios: [
				{
					id: 'maintenance-scenario',
					label: 'Maintenance Mode',
					responses: {
						200: { message: 'Maintenance scenario active' },
						503: { 
							error: 'Scenario Maintenance Mode',
							reason: 'Database upgrade in progress'
						}
					}
				}
			]
		},
		{
			id: 'service-with-query-params',
			componentId: 'service',
			endpoint: '/api/service/query',
			method: 'GET',
			responses: { 
				200: { message: 'Query service is running' },
				503: { error: 'Default Service Unavailable' }
			},
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 
					200: { message: 'Admin query service is running' },
					503: { 
						error: 'Admin Service Unavailable',
						adminContact: 'admin@example.com'
					}
				}
			}
		},
		{
			id: 'service-with-transform',
			componentId: 'service',
			endpoint: '/api/service/transform',
			method: 'GET',
			responses: { 
				200: { message: 'Transform service is running' },
				503: { error: 'Custom Service Unavailable' }
			},
			defaultStatus: 200,
			transform: (response, context) => {
				if (context.currentStatus === 503) {
					// Handle ResponseData objects (with body and headers)
					if (response && typeof response === 'object' && 'body' in response) {
						return {
							...response,
							body: {
								...response.body,
								timestamp: new Date().toISOString(),
								requestId: 'demo-request-id'
							}
						};
					}
					// Handle simple response objects
					return {
						...response,
						timestamp: new Date().toISOString(),
						requestId: 'demo-request-id'
					};
				}
				return response;
			}
		}
	],
});

// Add 503 Service Unavailable demonstration component
const ServiceUnavailableDemo = () => {
	const [results, setResults] = React.useState<Array<{ endpoint: string; status: number; response: any; headers: any; timestamp: string }>>([]);
	const [loading, setLoading] = React.useState<string | null>(null);
	const [currentStatuses, setCurrentStatuses] = React.useState({
		basic: platform.getStatusOverride('basic-service') || 200,
		custom503: platform.getStatusOverride('service-with-custom-503') || 200,
		custom503headers: platform.getStatusOverride('service-with-custom-503-headers') || 200,
		scenarios: platform.getStatusOverride('service-with-scenarios') || 200,
		query: platform.getStatusOverride('service-with-query-params') || 200,
		transform: platform.getStatusOverride('service-with-transform') || 200,
	});

	// Function to update status display
	const updateStatusDisplay = () => {
		setCurrentStatuses({
			basic: platform.getStatusOverride('basic-service') || 200,
			custom503: platform.getStatusOverride('service-with-custom-503') || 200,
			custom503headers: platform.getStatusOverride('service-with-custom-503-headers') || 200,
			scenarios: platform.getStatusOverride('service-with-scenarios') || 200,
			query: platform.getStatusOverride('service-with-query-params') || 200,
			transform: platform.getStatusOverride('service-with-transform') || 200,
		});
	};

	// Set up polling to check for status changes
	React.useEffect(() => {
		const interval = setInterval(updateStatusDisplay, 500);
		return () => clearInterval(interval);
	}, []);

	const makeRequest = async (endpoint: string, description: string, queryParams?: string) => {
		setLoading(description);
		const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;

		try {
			const response = await fetch(url);
			const data = await response.json();
			const headersObj: any = {};
			response.headers.forEach((value, key) => {
				headersObj[key] = value;
			});

			setResults(prev => [
				...prev,
				{
					endpoint: description,
					status: response.status,
					response: data,
					headers: headersObj,
					timestamp: new Date().toLocaleTimeString(),
				},
			]);
		} catch (error) {
			setResults(prev => [
				...prev,
				{
					endpoint: description,
					status: 0,
					response: { error: 'Request failed', details: String(error) },
					headers: {},
					timestamp: new Date().toLocaleTimeString(),
				},
			]);
		} finally {
			setLoading(null);
		}
	};

	const clearResults = () => {
		setResults([]);
	};

	const getStatusColor = (status: number) => {
		if (status === 503) return '#F44336';
		if (status === 200) return '#4CAF50';
		return '#FF9800';
	};

	const getStatusText = (status: number) => {
		if (status === 503) return '503 Service Unavailable';
		if (status === 200) return '200 OK';
		return `${status}`;
	};

	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h2 style={{ marginBottom: '20px' }}>503 Service Unavailable Demonstration</h2>

			<div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px', border: '1px solid #2196f3' }}>
				<h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔄 Live Platform State</h4>
				<p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Current status overrides (updates automatically when changed in MockUI):</p>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
					{Object.entries(currentStatuses).map(([key, status]) => (
						<div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
							<div style={{ width: '12px', height: '12px', backgroundColor: getStatusColor(status), borderRadius: '50%' }} />
							<span style={{ fontWeight: 'bold' }}>{key}:</span> {getStatusText(status)}
						</div>
					))}
				</div>
			</div>

			<div style={{ marginBottom: '20px' }}>
				<h3>Test Buttons</h3>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px', marginBottom: '20px' }}>
					<button
						onClick={() => makeRequest('/api/service/basic', 'Basic Service (default 503)')}
						disabled={loading !== null}
						style={{
							padding: '12px 16px',
							backgroundColor: getStatusColor(currentStatuses.basic),
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							textAlign: 'left',
						}}
					>
						<div style={{ fontWeight: 'bold' }}>Basic Service</div>
						<div style={{ fontSize: '12px', opacity: 0.9 }}>
							{loading === 'Basic Service (default 503)' ? 'Loading...' : 'Returns default 503 when status = 503'}
						</div>
					</button>

					<button
						onClick={() => makeRequest('/api/service/custom503', 'Custom 503 Service')}
						disabled={loading !== null}
						style={{
							padding: '12px 16px',
							backgroundColor: getStatusColor(currentStatuses.custom503),
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							textAlign: 'left',
						}}
					>
						<div style={{ fontWeight: 'bold' }}>Custom 503 Service</div>
						<div style={{ fontSize: '12px', opacity: 0.9 }}>
							{loading === 'Custom 503 Service' ? 'Loading...' : 'Returns custom 503 response'}
						</div>
					</button>

					<button
						onClick={() => makeRequest('/api/service/custom503headers', 'Custom 503 Headers Service')}
						disabled={loading !== null}
						style={{
							padding: '12px 16px',
							backgroundColor: getStatusColor(currentStatuses.custom503headers),
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							textAlign: 'left',
						}}
					>
						<div style={{ fontWeight: 'bold' }}>Custom 503 Headers</div>
						<div style={{ fontSize: '12px', opacity: 0.9 }}>
							{loading === 'Custom 503 Headers Service' ? 'Loading...' : 'Returns 503 with custom headers'}
						</div>
					</button>

					<button
						onClick={() => makeRequest('/api/service/scenarios', 'Scenarios Service')}
						disabled={loading !== null}
						style={{
							padding: '12px 16px',
							backgroundColor: getStatusColor(currentStatuses.scenarios),
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							textAlign: 'left',
						}}
					>
						<div style={{ fontWeight: 'bold' }}>Scenarios Service</div>
						<div style={{ fontSize: '12px', opacity: 0.9 }}>
							{loading === 'Scenarios Service' ? 'Loading...' : 'Try different scenarios + 503'}
						</div>
					</button>

					<button
						onClick={() => makeRequest('/api/service/query', 'Query Service (no params)')}
						disabled={loading !== null}
						style={{
							padding: '12px 16px',
							backgroundColor: getStatusColor(currentStatuses.query),
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							textAlign: 'left',
						}}
					>
						<div style={{ fontWeight: 'bold' }}>Query Service</div>
						<div style={{ fontSize: '12px', opacity: 0.9 }}>
							{loading === 'Query Service (no params)' ? 'Loading...' : 'Returns default 503 response'}
						</div>
					</button>

					<button
						onClick={() => makeRequest('/api/service/query', 'Query Service (admin)', 'type=admin')}
						disabled={loading !== null}
						style={{
							padding: '12px 16px',
							backgroundColor: getStatusColor(currentStatuses.query),
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							textAlign: 'left',
						}}
					>
						<div style={{ fontWeight: 'bold' }}>Query Service (Admin)</div>
						<div style={{ fontSize: '12px', opacity: 0.9 }}>
							{loading === 'Query Service (admin)' ? 'Loading...' : 'Returns admin-specific 503'}
						</div>
					</button>

					<button
						onClick={() => makeRequest('/api/service/transform', 'Transform Service')}
						disabled={loading !== null}
						style={{
							padding: '12px 16px',
							backgroundColor: getStatusColor(currentStatuses.transform),
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
							textAlign: 'left',
						}}
					>
						<div style={{ fontWeight: 'bold' }}>Transform Service</div>
						<div style={{ fontSize: '12px', opacity: 0.9 }}>
							{loading === 'Transform Service' ? 'Loading...' : 'Applies transform to 503 response'}
						</div>
					</button>
				</div>

				<button
					onClick={clearResults}
					style={{ padding: '8px 16px', backgroundColor: '#666', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
				>
					Clear Results
				</button>
			</div>

			{results.length > 0 && (
				<div>
					<h3>Request Results</h3>
					<div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
						{results.map((result, index) => (
							<div
								key={index}
								style={{
									padding: '15px',
									borderBottom: index < results.length - 1 ? '1px solid #eee' : 'none',
									backgroundColor: result.status === 503 ? '#ffebee' : result.status === 200 ? '#f1f8e9' : '#fff3e0',
								}}
							>
								<div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
									{result.endpoint} - {result.timestamp}
								</div>
								<div style={{ marginBottom: '10px' }}>
									<strong>Status:</strong> 
									<span style={{ 
										color: getStatusColor(result.status), 
										fontWeight: 'bold',
										marginLeft: '8px'
									}}>
										{result.status} {result.status === 503 ? '(Service Unavailable)' : result.status === 200 ? '(OK)' : ''}
									</span>
								</div>
								<div style={{ marginBottom: '10px' }}>
									<strong>Response:</strong>
									<pre style={{ 
										backgroundColor: '#f5f5f5', 
										padding: '10px', 
										borderRadius: '4px', 
										fontSize: '12px',
										overflow: 'auto',
										margin: '5px 0'
									}}>
										{JSON.stringify(result.response, null, 2)}
									</pre>
								</div>
								{Object.keys(result.headers).length > 0 && (
									<div>
										<strong>Headers:</strong>
										<pre style={{ 
											backgroundColor: '#f5f5f5', 
											padding: '10px', 
											borderRadius: '4px', 
											fontSize: '12px',
											overflow: 'auto',
											margin: '5px 0'
										}}>
											{JSON.stringify(result.headers, null, 2)}
										</pre>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			<div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
				<h4>🚀 503 Service Unavailable Feature</h4>
				<ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
					<li><strong>Default 503:</strong> Available for free on all endpoints - no configuration needed</li>
					<li><strong>Custom 503:</strong> Define custom responses with <code>responses: {'{'} 503: {'{'} ... {'}'} {'}'}</code></li>
					<li><strong>Custom Headers:</strong> Use ResponseData format with <code>body</code> and <code>headers</code></li>
					<li><strong>Scenarios:</strong> Scenarios can override 503 responses, fallback to plugin responses</li>
					<li><strong>Query Parameters:</strong> Query-specific 503 responses supported</li>
					<li><strong>Transform Functions:</strong> Transform functions apply to 503 responses</li>
				</ul>
			</div>

			<div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '4px', border: '1px solid #4CAF50' }}>
				<h4 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>✅ How to Test</h4>
				<ol style={{ margin: '10px 0', paddingLeft: '20px' }}>
					<li>Use MockUI below to set any endpoint's status to <strong>503</strong></li>
					<li>Click the corresponding test button above</li>
					<li>See the response - default 503 or custom 503 if defined</li>
					<li>Try different scenarios and query parameters</li>
					<li>Notice how the platform state updates automatically</li>
				</ol>
			</div>
		</div>
	);
};

export const Default: Story = {
	args: {
		platform,
	},
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(platform),
		},
	},
	render: (args: any) => (
		<div>
			<ServiceUnavailableDemo />
			<hr style={{ margin: '40px 0', border: 'none', borderTop: '2px solid #ddd' }} />
			<MockUI {...args} />
		</div>
	),
};