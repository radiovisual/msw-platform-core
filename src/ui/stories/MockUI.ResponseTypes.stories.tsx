import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { createMockPlatform } from '../../platform';
import { mswHandlersFromPlatform } from '../../adapters/msw';
import MockUI from '../MockUI';

// SVG markup for the Users icon
const usersSvg = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
  <path d="M16 3.128a4 4 0 0 1 0 7.744" />
  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
  <circle cx="9" cy="7" r="4" />
</svg>`;

const plugins = [
	{
		id: 'json',
		componentId: 'demo',
		endpoint: '/api/json',
		method: 'GET' as const,
		responses: {
			200: {
				body: { message: 'Hello, JSON!' },
				headers: { 'Content-Type': 'application/json' },
			},
		},
		defaultStatus: 200,
	},
	{
		id: 'html',
		componentId: 'demo',
		endpoint: '/api/html',
		method: 'GET' as const,
		responses: {
			200: {
				body: '<h1 style="color:purple">Hello, HTML!</h1>',
				headers: { 'Content-Type': 'text/html' },
			},
		},
		defaultStatus: 200,
	},
	{
		id: 'text',
		componentId: 'demo',
		endpoint: '/api/text',
		method: 'GET' as const,
		responses: {
			200: {
				body: 'Hello, plain text!',
				headers: { 'Content-Type': 'text/plain' },
			},
		},
		defaultStatus: 200,
	},
	{
		id: 'xml',
		componentId: 'demo',
		endpoint: '/api/xml',
		method: 'GET' as const,
		responses: {
			200: {
				body: '<note><to>User</to><message>Hello XML</message></note>',
				headers: { 'Content-Type': 'application/xml' },
			},
		},
		defaultStatus: 200,
	},
	{
		id: 'bin',
		componentId: 'demo',
		endpoint: '/api/bin',
		method: 'GET' as const,
		responses: {
			200: {
				body: usersSvg,
				headers: { 'Content-Type': 'image/svg+xml' },
			},
		},
		defaultStatus: 200,
	},
];

const platform = createMockPlatform({ name: 'ResponseTypesDemo', plugins });

const meta: Meta = {
	title: 'MockUI/Response Types',
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(platform),
		},
	},
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
	render: () => <ResponseTypesDemo />,
};

function ResponseTypesDemo() {
	const [result, setResult] = useState<any>(null);
	const [type, setType] = useState<string>('');
	const [imgUrl, setImgUrl] = useState<string | null>(null);

	const fetchAndShow = async (endpoint: string, type: string) => {
		setType(type);
		setResult('Loading...');
		setImgUrl(null);
		let res = await fetch(endpoint);
		if (type === 'json') {
			setResult(await res.json());
		} else if (type === 'html') {
			setResult(await res.text());
		} else if (type === 'text') {
			setResult(await res.text());
		} else if (type === 'xml') {
			setResult(await res.text());
		} else if (type === 'bin') {
			let text = await res.text();
			setResult(text);
			const blob = new Blob([text], { type: res.headers.get('content-type') || 'image/svg+xml' });
			setImgUrl(URL.createObjectURL(blob));
		}
	};

	return (
		<div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
			<h2>Custom Response Types Demo</h2>
			<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
				<button onClick={() => fetchAndShow('/api/json', 'json')}>JSON</button>
				<button onClick={() => fetchAndShow('/api/html', 'html')}>HTML</button>
				<button onClick={() => fetchAndShow('/api/text', 'text')}>Text</button>
				<button onClick={() => fetchAndShow('/api/xml', 'xml')}>XML</button>
				<button onClick={() => fetchAndShow('/api/bin', 'bin')}>Binary (SVG)</button>
			</div>
			<div style={{ minHeight: 80, border: '1px solid #ccc', padding: 16, background: '#fafafa' }}>
				{type === 'json' && result && <pre>{JSON.stringify(result, null, 2)}</pre>}
				{type === 'html' && result && <div dangerouslySetInnerHTML={{ __html: result }} />}
				{type === 'text' && result && <pre>{result}</pre>}
				{type === 'xml' && result && <pre>{result}</pre>}
				{type === 'bin' && imgUrl && (
					<div>
						<img src={imgUrl} alt="Users SVG" style={{ maxWidth: 200, display: 'block', margin: '0 auto' }} />
						<div style={{ textAlign: 'center', marginTop: 8 }}>
							<code>image/svg+xml</code>
						</div>
					</div>
				)}
				{type === 'bin' && !imgUrl && result && <pre>{String(result)}</pre>}
				{!type && <span>Click a button to fetch a response type.</span>}
			</div>
			<div style={{ marginTop: 32 }}>
				<MockUI platform={platform} />
			</div>
		</div>
	);
}
