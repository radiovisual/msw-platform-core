import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import MockUI from '../MockUI';
import { createMockPlatform } from '../../platform';
import { mswHandlersFromPlatform } from '../../adapters/msw';

// Define plugins for /api/demo with different query param patterns
const exactPlugin = {
	id: 'demo-exact',
	componentId: 'Demo',
	endpoint: '/api/demo',
	method: 'GET' as const,
	responses: {
		200: { message: 'Exact match: baz=specific' },
	},
	defaultStatus: 200,
	queryResponses: {
		'baz=specific': { 200: { message: 'Exact match: baz=specific' } },
	},
};

const wildcardPlugin = {
	id: 'demo-wildcard',
	componentId: 'Demo',
	endpoint: '/api/demo',
	method: 'GET' as const,
	responses: {
		200: { message: 'Wildcard match: baz=*' },
	},
	defaultStatus: 200,
	queryResponses: {
		'baz=*': { 200: { message: 'Wildcard match: baz=*' } },
	},
};

const fallbackPlugin = {
	id: 'demo-fallback',
	componentId: 'Demo',
	endpoint: '/api/demo',
	method: 'GET' as const,
	responses: {
		200: { message: 'Fallback: no query params' },
	},
	defaultStatus: 200,
};

const multiParamPlugin = {
	id: 'demo-multi',
	componentId: 'Demo',
	endpoint: '/api/demo',
	method: 'GET' as const,
	responses: {
		200: { message: 'Multi-param match' },
	},
	defaultStatus: 200,
	queryResponses: {
		'foo=bar&baz=*': { 200: { message: 'Multi-param: foo=bar & baz=*' } },
		'foo=*&baz=specific': { 200: { message: 'Multi-param: foo=* & baz=specific' } },
	},
};

const platform = createMockPlatform({
	name: 'query-param-demo',
	plugins: [exactPlugin, wildcardPlugin, fallbackPlugin, multiParamPlugin],
});

// Create platforms for different edge case scenarios
const fallbackPlatform = createMockPlatform({
	name: 'fallback-demo',
	plugins: [{
		id: 'with-fallback',
		componentId: 'Demo',
		endpoint: '/api/fallback',
		method: 'GET' as const,
		responses: {
			200: { message: 'Default fallback response' },
		},
		defaultStatus: 200,
		queryResponses: {
			'type=admin': { 200: { message: 'Admin-specific response' } },
			'status=active': { 200: { message: 'Active status response' } },
		},
	}],
});

const passthroughPlatform = createMockPlatform({
	name: 'passthrough-demo',
	plugins: [
		{
			id: 'enabled-plugin',
			componentId: 'Demo',
			endpoint: '/api/passthrough',
			method: 'GET' as const,
			responses: { 200: { message: 'Enabled plugin response' } },
			defaultStatus: 200,
			queryResponses: {
				'type=admin': { 200: { message: 'Admin response from enabled plugin' } },
			},
		},
		{
			id: 'disabled-plugin',
			componentId: 'Demo',
			endpoint: '/api/passthrough',
			method: 'GET' as const,
			responses: { 200: { message: 'Disabled plugin response' } },
			defaultStatus: 200,
		},
	],
});

const priorityPlatform = createMockPlatform({
	name: 'priority-demo',
	plugins: [
		{
			id: 'exact-priority',
			componentId: 'Demo',
			endpoint: '/api/priority',
			method: 'GET' as const,
			responses: { 200: { message: 'Exact match wins' } },
			defaultStatus: 200,
			queryResponses: {
				'type=user': { 200: { message: 'Exact: type=user' } },
			},
		},
		{
			id: 'wildcard-priority',
			componentId: 'Demo',
			endpoint: '/api/priority',
			method: 'GET' as const,
			responses: { 200: { message: 'Wildcard match' } },
			defaultStatus: 200,
			queryResponses: {
				'type=*': { 200: { message: 'Wildcard: type=*' } },
			},
		},
	],
});

function QueryParamDemoApp() {
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	// Fetch functions for each scenario
	const fetchExact = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/demo?baz=specific');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchWildcard = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/demo?baz=anything');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchFallback = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/demo');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchMultiParam1 = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/demo?foo=bar&baz=anything');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};
	const fetchMultiParam2 = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/demo?foo=anything&baz=specific');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};

	return (
		<div style={{ padding: 32 }}>
			<h2>MockUI Query Parameter Demo</h2>
			<p>
				This demo shows how different plugins for the same endpoint can match based on query parameters, including exact, wildcard, and
				multi-parameter patterns.
			</p>
			<hr />
			<div style={{ padding: '15px 0', alignItems: 'baseline', display: 'flex', flexDirection: 'column', gap: 10 }}>
				<button onClick={fetchExact}>
					Fetch <code>/api/demo?baz=specific</code> (should match <b>exactPlugin</b>)
				</button>
				<button onClick={fetchWildcard}>
					Fetch <code>/api/demo?baz=anything</code> (should match <b>wildcardPlugin</b>)
				</button>
				<button onClick={fetchFallback}>
					Fetch <code>/api/demo</code> (should match <b>fallbackPlugin</b>)
				</button>
				<button onClick={fetchMultiParam1}>
					Fetch <code>/api/demo?foo=bar&amp;baz=anything</code> (should match <b>multiParamPlugin</b> <code>foo=bar&amp;baz=*</code>)
				</button>
				<button onClick={fetchMultiParam2}>
					Fetch <code>/api/demo?foo=anything&amp;baz=specific</code> (should match <b>multiParamPlugin</b>{' '}
					<code>foo=*&amp;baz=specific</code>)
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

function FallbackBehaviorDemo() {
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchMatching = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/fallback?type=admin');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};

	const fetchNonMatching = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/fallback?type=user');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};

	const fetchNoParams = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/fallback');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};

	return (
		<div style={{ padding: 32 }}>
			<h2>Fallback Behavior Demo</h2>
			<p>
				When a plugin has queryResponses but the request doesn't match any of them, it falls back to the default response in the 
				<code>responses</code> object.
			</p>
			<hr />
			<div style={{ padding: '15px 0', alignItems: 'baseline', display: 'flex', flexDirection: 'column', gap: 10 }}>
				<button onClick={fetchMatching}>
					Fetch <code>/api/fallback?type=admin</code> (should match queryResponse)
				</button>
				<button onClick={fetchNonMatching}>
					Fetch <code>/api/fallback?type=user</code> (should fallback to default response)
				</button>
				<button onClick={fetchNoParams}>
					Fetch <code>/api/fallback</code> (should fallback to default response)
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
			<MockUI platform={fallbackPlatform} />
		</div>
	);
}

function PassthroughDemo() {
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchEnabled = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/passthrough?type=admin');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};

	const fetchNoMatch = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/passthrough');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};

	return (
		<div style={{ padding: 32 }}>
			<h2>Passthrough Behavior Demo</h2>
			<p>
				When some plugins are disabled and enabled plugins don't match the request, the system returns passthrough (letting real backend handle it).
				Try disabling the "disabled-plugin" in the MockUI below and test different scenarios.
			</p>
			<hr />
			<div style={{ padding: '15px 0', alignItems: 'baseline', display: 'flex', flexDirection: 'column', gap: 10 }}>
				<button onClick={fetchEnabled}>
					Fetch <code>/api/passthrough?type=admin</code> (should match enabled plugin)
				</button>
				<button onClick={fetchNoMatch}>
					Fetch <code>/api/passthrough</code> (might passthrough if disabled plugin present)
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
			<MockUI platform={passthroughPlatform} />
		</div>
	);
}

function PriorityDemo() {
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	const fetchExactMatch = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/priority?type=user');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};

	const fetchWildcardMatch = async () => {
		setError(null);
		setResult(null);
		try {
			const res = await fetch('/api/priority?type=admin');
			const data = await res.json();
			setResult(data);
		} catch (e) {
			setError(String(e));
		}
	};

	return (
		<div style={{ padding: 32 }}>
			<h2>Priority Rules Demo</h2>
			<p>
				Exact matches have higher priority than wildcard matches. The system calculates specificity: exact matches get 10 points, 
				wildcards get 1 point per parameter.
			</p>
			<hr />
			<div style={{ padding: '15px 0', alignItems: 'baseline', display: 'flex', flexDirection: 'column', gap: 10 }}>
				<button onClick={fetchExactMatch}>
					Fetch <code>/api/priority?type=user</code> (should match exact plugin, not wildcard)
				</button>
				<button onClick={fetchWildcardMatch}>
					Fetch <code>/api/priority?type=admin</code> (should match wildcard plugin only)
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
			<MockUI platform={priorityPlatform} />
		</div>
	);
}

const meta: Meta<typeof QueryParamDemoApp> = {
	title: 'MockUI/QueryParams',
	component: QueryParamDemoApp,
};
export default meta;

type Story = StoryObj<typeof QueryParamDemoApp>;
type FallbackStory = StoryObj<typeof FallbackBehaviorDemo>;
type PassthroughStory = StoryObj<typeof PassthroughDemo>;
type PriorityStory = StoryObj<typeof PriorityDemo>;

export const Default: Story = {
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(platform),
		},
	},
};

export const FallbackBehavior: FallbackStory = {
	render: () => <FallbackBehaviorDemo />,
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(fallbackPlatform),
		},
	},
};

export const PassthroughBehavior: PassthroughStory = {
	render: () => <PassthroughDemo />,
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(passthroughPlatform),
		},
	},
};

export const PriorityRules: PriorityStory = {
	render: () => <PriorityDemo />,
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(priorityPlatform),
		},
	},
};
