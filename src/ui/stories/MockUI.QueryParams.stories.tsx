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

const meta: Meta<typeof QueryParamDemoApp> = {
	title: 'MockUI/QueryParams',
	component: QueryParamDemoApp,
};
export default meta;

type Story = StoryObj<typeof QueryParamDemoApp>;

export const Default: Story = {
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(platform),
		},
	},
};
