import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import MockUI from './MockUI';
import { createMockPlatform } from '../platform';
import { mswHandlersFromPlatform } from '../adapters/msw';

const meta: Meta<typeof MockUI> = {
	title: 'MockUI/Delay',
	component: MockUI,
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;
type Story = StoryObj<typeof MockUI>;

// Create a platform with various delay configurations
const platform = createMockPlatform({
	name: 'Delay Demo',
	plugins: [
		{
			id: 'fast-user',
			componentId: 'user',
			endpoint: '/api/user/fast',
			method: 'GET',
			responses: { 200: { message: 'Fast user response' } },
			defaultStatus: 200,
			delay: 50,
		},
		{
			id: 'default-user',
			componentId: 'user',
			endpoint: '/api/user/default',
			method: 'GET',
			responses: { 200: { message: 'Default user response' } },
			defaultStatus: 200,
			delay: 150,
		},
		{
			id: 'slow-user',
			componentId: 'user',
			endpoint: '/api/user/slow',
			method: 'GET',
			responses: { 200: { message: 'Slow user response' } },
			defaultStatus: 200,
			delay: 1000,
		},
	],
});

// Add delay demonstration component
const DelayDemo = () => {
	const [results, setResults] = React.useState<Array<{ endpoint: string; duration: number; response: any; timestamp: string }>>([]);
	const [loading, setLoading] = React.useState<string | null>(null);
	const [currentDelays, setCurrentDelays] = React.useState({
		fast: platform.getEffectiveDelay('fast-user'),
		default: platform.getEffectiveDelay('default-user'),
		slow: platform.getEffectiveDelay('slow-user'),
	});

	// Function to update delay display
	const updateDelayDisplay = () => {
		setCurrentDelays({
			fast: platform.getEffectiveDelay('fast-user'),
			default: platform.getEffectiveDelay('default-user'),
			slow: platform.getEffectiveDelay('slow-user'),
		});
	};

	// Set up polling to check for delay changes
	React.useEffect(() => {
		const interval = setInterval(updateDelayDisplay, 500);
		return () => clearInterval(interval);
	}, []);

	const makeRequest = async (endpoint: string, description: string) => {
		setLoading(description);
		const startTime = Date.now();
		
		try {
			const response = await fetch(endpoint);
			const data = await response.json();
			const duration = Date.now() - startTime;
			
			setResults(prev => [...prev, {
				endpoint: description,
				duration,
				response: data,
				timestamp: new Date().toLocaleTimeString(),
			}]);
		} catch (_error) {
			const duration = Date.now() - startTime;
			setResults(prev => [...prev, {
				endpoint: description,
				duration,
				response: { error: 'Request failed' },
				timestamp: new Date().toLocaleTimeString(),
			}]);
		} finally {
			setLoading(null);
		}
	};

	const clearResults = () => {
		setResults([]);
	};

	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h2 style={{ marginBottom: '20px' }}>Delay Demonstration</h2>
			
			<div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px', border: '1px solid #2196f3' }}>
				<h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🔄 Live Platform State</h4>
				<p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
					Current delays (updates automatically when changed in MockUI):
				</p>
				<div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<div style={{ width: '12px', height: '12px', backgroundColor: '#4CAF50', borderRadius: '50%' }} />
						<span style={{ fontWeight: 'bold' }}>Fast:</span> {currentDelays.fast}ms
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<div style={{ width: '12px', height: '12px', backgroundColor: '#FF9800', borderRadius: '50%' }} />
						<span style={{ fontWeight: 'bold' }}>Default:</span> {currentDelays.default}ms
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<div style={{ width: '12px', height: '12px', backgroundColor: '#F44336', borderRadius: '50%' }} />
						<span style={{ fontWeight: 'bold' }}>Slow:</span> {currentDelays.slow}ms
					</div>
				</div>
			</div>
			
			<div style={{ marginBottom: '20px' }}>
				<h3>Test Buttons</h3>
				<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
					<button 
						onClick={() => makeRequest('/api/user/fast', `Fast User (${currentDelays.fast}ms)`)}
						disabled={loading !== null}
						style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
					>
						{loading === `Fast User (${currentDelays.fast}ms)` ? 'Loading...' : `Fast User (${currentDelays.fast}ms)`}
					</button>
					
					<button 
						onClick={() => makeRequest('/api/user/default', `Default User (${currentDelays.default}ms)`)}
						disabled={loading !== null}
						style={{ padding: '8px 16px', backgroundColor: '#FF9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
					>
						{loading === `Default User (${currentDelays.default}ms)` ? 'Loading...' : `Default User (${currentDelays.default}ms)`}
					</button>
					
					<button 
						onClick={() => makeRequest('/api/user/slow', `Slow User (${currentDelays.slow}ms)`)}
						disabled={loading !== null}
						style={{ padding: '8px 16px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
					>
						{loading === `Slow User (${currentDelays.slow}ms)` ? 'Loading...' : `Slow User (${currentDelays.slow}ms)`}
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
					<div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
						{results.map((result, index) => (
							<div 
								key={index} 
								style={{ 
									padding: '10px', 
									borderBottom: index < results.length - 1 ? '1px solid #eee' : 'none',
									backgroundColor: result.duration > 500 ? '#ffebee' : result.duration > 200 ? '#fff3e0' : '#f1f8e9',
								}}
							>
								<div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
									{result.endpoint} - {result.timestamp}
								</div>
								<div style={{ marginBottom: '5px' }}>
									<strong>Duration:</strong> {result.duration}ms
									{result.duration > 500 && <span style={{ color: '#d32f2f', marginLeft: '10px' }}>⚠️ Slow</span>}
									{result.duration <= 200 && <span style={{ color: '#388e3c', marginLeft: '10px' }}>✅ Fast</span>}
								</div>
								<div>
									<strong>Response:</strong> {JSON.stringify(result.response)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}
			
			<div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
				<h4>How it works:</h4>
				<ul>
					<li>Each endpoint has a configured delay (see MockUI below)</li>
					<li>Click buttons to make requests and see actual timing</li>
					<li>Green button = fast response (updates in real-time)</li>
					<li>Orange button = default response (updates in real-time)</li>
					<li>Red button = slow response (updates in real-time)</li>
					<li>Use MockUI to adjust delays in real-time</li>
					<li><strong>Platform State:</strong> The blue box above shows current delays from <code>platform.getEffectiveDelay()</code></li>
					<li><strong>Real-time Updates:</strong> Change delays in MockUI and watch the buttons and display update automatically</li>
				</ul>
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
			<DelayDemo />
			<hr style={{ margin: '40px 0', border: 'none', borderTop: '2px solid #ddd' }} />
			<MockUI {...args} />
		</div>
	),
};
 