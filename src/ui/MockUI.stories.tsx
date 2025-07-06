import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MockUI from './MockUI';
import { createMockPlatform } from '../platform';
import { mswHandlersFromPlatform } from '../adapters/msw';
import { createPathMiddleware, createCustomMiddleware } from '../middleware/helpers';

// Example of path middleware - updates user.type and contract.user.type
const contractMiddleware = createPathMiddleware({
	key: 'userType',
	label: 'User Type',
	description: 'Sets user type across multiple paths',
	type: 'select',
	options: [
		{ value: 'member', label: 'Member' },
		{ value: 'admin', label: 'Admin' },
		{ value: 'guest', label: 'Guest' },
	],
	defaultValue: 'member',
	paths: [
		{ path: 'user.type', settingKey: 'userType' },
		{ path: 'contract.user.type', settingKey: 'userType' },
	],
});

// Example of status-aware middleware using full context
const _statusMiddleware = createCustomMiddleware({
	key: 'statusOverride',
	label: 'Status Override',
	description: 'Overrides status based on user type and contract type',
	type: 'select',
	options: [
		{ value: 'active', label: 'Active' },
		{ value: 'pending', label: 'Pending' },
		{ value: 'suspended', label: 'Suspended' },
	],
	defaultValue: 'active',
	transform: (response, context) => {
		const { statusOverride, userType, contractType } = context.settings;

		// Only override if user is admin or contract is premium
		if ((userType === 'admin' || contractType === 'premium') && statusOverride) {
			return { ...response, status: statusOverride };
		}

		return response;
	},
});

// Example of feature flag middleware using full context
const _experimentalMiddleware = createCustomMiddleware({
	key: 'experimentalFeature',
	label: 'Experimental Feature',
	description: 'Adds experimental features when EXPERIMENTAL_HELLO is enabled',
	type: 'boolean',
	defaultValue: false,
	transform: (response, context) => {
		const { experimentalFeature } = context.settings;
		const { featureFlags } = context;

		// Only apply if experimental flag is enabled AND setting is true
		if (featureFlags.EXPERIMENTAL_HELLO && experimentalFeature) {
			return {
				...response,
				experimental: { enabled: true },
			};
		}
		return response;
	},
});

// Example of error handling middleware using full context
const _errorHandlingMiddleware = createCustomMiddleware({
	key: 'errorMessage',
	label: 'Error Message',
	description: 'Customizes error messages based on status code',
	type: 'text',
	defaultValue: 'Something went wrong',
	transform: (response, context) => {
		const { errorMessage } = context.settings;
		const { currentStatus } = context;

		// Only apply to error status codes
		if ((currentStatus === 404 || currentStatus === 500) && errorMessage) {
			return {
				...response,
				error: { ...response.error, message: errorMessage },
			};
		}
		return response;
	},
});

// Example of complex middleware with all context
const _advancedMiddleware = createCustomMiddleware({
	key: 'advancedTransform',
	label: 'Advanced Transform',
	type: 'text',
	transform: (response, context) => {
		const { advancedTransform } = context.settings;
		const { featureFlags, currentStatus, endpointScenario, plugin } = context;

		// Complex condition using all context information
		if (featureFlags.EXPERIMENTAL && currentStatus === 200 && endpointScenario === 'admin') {
			return {
				...response,
				enhanced: true,
				userType: advancedTransform,
				context: {
					pluginId: plugin.id,
					status: currentStatus,
					scenario: endpointScenario,
					experimentalEnabled: featureFlags.EXPERIMENTAL,
				},
			};
		}
		return response;
	},
	// Optional custom badge function with full context
	badge: context => {
		const { advancedTransform } = context.settings;
		const { featureFlags, currentStatus, endpointScenario } = context;

		if (!advancedTransform) return null;

		// Show different badge text based on context
		if (featureFlags.EXPERIMENTAL && currentStatus === 200 && endpointScenario === 'admin') {
			return `Advanced: ${advancedTransform} (Enhanced)`;
		}

		return `Advanced: ${advancedTransform}`;
	},
});

// Create a mock platform instance
const platform = createMockPlatform({
	name: 'storybook-demo',
	plugins: [
		{
			id: 'hello',
			componentId: 'Greeting',
			endpoint: '/api/hello',
			method: 'GET',
			responses: {
				200: { message: 'Hello, world!' },
				404: { error: 'Not found' },
			},
			swaggerUrl: 'https://jsonplaceholder.typicode.com/users/1',
			defaultStatus: 200,
			featureFlags: ['EXPERIMENTAL_HELLO'],
			transform: (response, context) => {
				if (context.featureFlags.EXPERIMENTAL_HELLO) {
					return { ...response, message: 'Hello, experimental world!' };
				}
				return response;
			},
		},
		{
			id: 'goodbye',
			componentId: 'Farewell',
			endpoint: '/api/goodbye',
			method: 'GET',
			responses: {
				200: { message: 'Goodbye!' },
				404: { error: 'Not found' },
			},
			defaultStatus: 200,
		},
		{
			id: 'user',
			componentId: 'User',
			endpoint: '/api/user',
			method: 'GET',
			responses: {
				200: { user: { name: 'Michael', type: 'member' } },
				404: { error: 'Not found' },
			},
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: { user: { name: 'Admin', type: 'admin' } } },
				'type=guest': { 200: { user: { name: 'Guest', type: 'guest' } } },
				'type=*': { 200: { user: { name: 'Any Type User', type: 'any' } } },
				'status=active&role=*': { 200: { user: { name: 'Active User', type: 'active', role: 'any' } } },
			},
			// Static middleware configuration - visible in plugin definition
			useMiddleware: [contractMiddleware],
		},
		{
			id: 'user-status',
			componentId: 'User',
			endpoint: '/api/user-status',
			method: 'GET',
			responses: {
				200: { status: 'unknown', user: { type: 'member' } },
				404: { error: 'Not found' },
			},
			defaultStatus: 200,
			scenarios: [
				{ id: 'guest', label: 'Guest User', responses: { 200: { status: 'guest', user: { type: 'guest' } } } },
				{ id: 'member', label: 'Member User', responses: { 200: { status: 'member', user: { type: 'member' } } } },
				{ id: 'admin', label: 'Admin User', responses: { 200: { status: 'admin', user: { type: 'admin' } } } },
			],
			useMiddleware: [],
			// In this example the middleware is registered via the platform.registerMiddleware method
			// useMiddleware: [contractMiddleware],
		},
		{
			id: 'external-user',
			componentId: 'External',
			endpoint: 'https://jsonplaceholder.typicode.com/users/1',
			method: 'GET',
			responses: {
				200: { name: 'Mocked User', email: 'mock@example.com' },
			},
			defaultStatus: 200,
		},
		{
			id: 'with-headers',
			componentId: 'Headers',
			endpoint: '/api/with-headers',
			method: 'GET',
			responses: {
				200: {
					body: { message: 'This response has custom headers!' },
					headers: {
						'X-Custom-Header': 'custom-value',
						'Content-Type': 'application/json',
					},
				},
				400: {
					body: { error: 'Bad request', code: 400 },
					headers: {
						'Content-Type': 'application/problem+json',
						'X-Error-Type': 'bad-request',
					},
				},
			},
			scenarios: [
				{
					id: 'special-scenario',
					label: 'Special Scenario',
					responses: {
						200: {
							body: { message: 'Special scenario with custom headers!' },
							headers: {
								'X-Scenario-Header': 'special-scenario-value',
								'Content-Type': 'application/json',
							},
						},
					},
				},
			],
			queryResponses: {
				'variant=custom': {
					200: {
						body: { message: 'Query param response with custom headers!' },
						headers: {
							'X-Query-Header': 'custom-query-value',
							'Content-Type': 'application/json',
						},
					},
				},
			},
			defaultStatus: 200,
		},
	],
	featureFlags: [
		{ name: 'EXPERIMENTAL_HELLO', description: 'Enables experimental hello message', default: false },
		{ name: 'NEW_UI_FEATURES', description: 'Enables new UI features and improvements', default: true },
		{ name: 'BETA_API', description: 'Enables beta API endpoints and functionality', default: false },
		'LEGACY_FLAG',
	],
});

// Runtime middleware registration - for dynamic middleware that might be added later
contractMiddleware.attachTo(['user-status'], platform);

// Demo component that fetches from the endpoint
function DemoApp() {
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const fetchHello = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/hello');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchGoodbye = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/goodbye');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchUser = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/user');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchUserStatus = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/user-status');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchExternalUser = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('https://jsonplaceholder.typicode.com/users/1');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchUserAdmin = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/user?type=admin');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchUserGuest = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/user?type=guest');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchUserAnyType = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/user?type=member');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchUserActiveRole = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/user?status=active&role=admin');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchWithHeaders = async () => {
		setError(null);
		setResult(null);

		try {
			const res = await fetch('/api/with-headers', { method: 'GET' });
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};

	const fetchWithHeadersQuery = async () => {
		setError(null);
		setResult(null);
		
		try {
			const res = await fetch('/api/with-headers?variant=custom', { method: 'GET' });
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	return (
		<div style={{ padding: 32 }}>
			<h2>MSW UI Manager Demo</h2>
			<p>Click the buttons to make fetch requests. Click the gear icon to manage the mocks.</p>
			<p><strong>Tip:</strong> Open the Network tab in your browser&apos;s dev tools to see the custom response headers!</p>
			<hr />
			<div style={{ padding: '15px 0', alignItems: 'baseline', display: 'flex', flexDirection: 'column', gap: 10 }}>
				<button onClick={fetchHello}>Fetch /api/hello</button>
				<button onClick={fetchGoodbye}>Fetch /api/goodbye</button>
				<button onClick={fetchUser}>Fetch /api/user</button>
				<button onClick={fetchUserAdmin}>Fetch /api/user?type=admin</button>
				<button onClick={fetchUserGuest}>Fetch /api/user?type=guest</button>
				<button onClick={fetchUserAnyType}>Fetch /api/user?type=member (wildcard)</button>
				<button onClick={fetchUserActiveRole}>Fetch /api/user?status=active&role=admin (wildcard)</button>
				<button onClick={fetchUserStatus}>Fetch /api/user-status</button>
				<button onClick={fetchExternalUser}>Fetch https://jsonplaceholder.typicode.com/users/1</button>
					<button onClick={fetchWithHeaders}>
						Fetch /api/with-headers
					</button>
					<button onClick={fetchWithHeadersQuery}>
						Fetch /api/with-headers?variant=custom
					</button>
				<pre
					style={{
						width: '100%',
						padding: '10px',
						backgroundColor: 'lightgray',
						borderRadius: 5,
						color: 'black',
						fontFamily: 'monospace',
						fontSize: '12px',
					}}
				>
					{result ? JSON.stringify(result, null, 2) : error ? error : 'No data yet'}
				</pre>
			</div>
			<MockUI platform={platform} />
		</div>
	);
}

const meta: Meta<typeof DemoApp> = {
	title: 'MockUI/Popup',
	component: DemoApp,
};
export default meta;

type Story = StoryObj<typeof DemoApp>;

export const Default: Story = {
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(platform),
		},
	},
};

export const WithFlagEnabled: Story = {
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(platform),
		},
	},
	render: () => {
		// Enable the feature flag before rendering
		platform.setFeatureFlag('EXPERIMENTAL_HELLO', true);
		return <DemoApp />;
	},
};
