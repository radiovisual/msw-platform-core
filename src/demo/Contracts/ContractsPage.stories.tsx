import type { Meta, StoryObj } from '@storybook/react';
import { MockPlatformCore } from '../../classes/MockPlatformCore';
import { mswHandlersFromPlatform } from '../../adapters/msw';
import MockUI from '../../ui/MockUI';
import ContractsPage from './ContractsPage';
import { createContracts } from './createContracts';
import { Contract, SyncStatusResponse } from './Contract.types';

const contractsData = createContracts(100);

// Mock sync status data
const successfulSyncStatus: SyncStatusResponse = {
	lastSuccessfulSync: '2023-12-15T14:30:00Z',
	lastAttemptedSync: '2023-12-15T14:30:00Z',
	status: 'success',
	statusMessage: 'Synchronization completed successfully',
};

const failedSyncStatus: SyncStatusResponse = {
	lastSuccessfulSync: '2023-12-15T10:00:00Z',
	lastAttemptedSync: '2023-12-15T14:30:00Z',
	status: 'failure',
	statusMessage: 'Network timeout during synchronization',
};

const inProgressSyncStatus: SyncStatusResponse = {
	lastSuccessfulSync: '2023-12-15T10:00:00Z',
	lastAttemptedSync: '2023-12-15T14:30:00Z',
	status: 'in_progress',
	statusMessage: 'Synchronization in progress...',
};

const contractsPlugin = {
	id: 'contracts',
	componentId: 'Contracts',
	endpoint: '/contracts/all',
	method: 'GET' as const,
	responses: {
		200: contractsData,
		404: { error: 'Contracts not found', message: 'No contracts available' },
		500: {
			error: 'Internal Server Error',
			message: 'Failed to fetch contracts from database',
		},
		503: {
			error: 'Service Unavailable',
			message: 'Database connection timeout',
		},
	},
	defaultStatus: 200,
	scenarios: [
		{
			id: 'large-dataset',
			label: 'Large Dataset (500 contracts)',
			responses: { 200: createContracts(500) },
		},
		{
			id: 'small-dataset',
			label: 'Small Dataset (10 contracts)',
			responses: { 200: createContracts(10) },
		},
		{
			id: 'empty-dataset',
			label: 'Empty Dataset',
			responses: { 200: [] },
		},
		{
			id: 'active-only',
			label: 'Active Contracts Only',
			responses: { 200: contractsData.filter((contract: Contract) => contract.contractStatus === 'active') },
		},
		{
			id: 'tech-companies',
			label: 'Tech Companies Only',
			responses: { 200: contractsData.filter((contract: Contract) => contract.datauserName.toLowerCase().includes('tech')) },
		},
	],
};

const syncStatusPlugin = {
	id: 'sync-status',
	componentId: 'SyncStatus',
	endpoint: '/contracts/sync-status',
	method: 'GET' as const,
	responses: {
		200: successfulSyncStatus,
		500: { error: 'Internal Server Error', message: 'Failed to fetch sync status' },
		503: { error: 'Service Unavailable', message: 'Sync service is currently unavailable' },
	},
	defaultStatus: 200,
	scenarios: [
		{
			id: 'successful-sync',
			label: 'Successful Sync',
			responses: { 200: successfulSyncStatus },
		},
		{
			id: 'failed-sync',
			label: 'Failed Sync',
			responses: { 200: failedSyncStatus },
		},
		{
			id: 'sync-in-progress',
			label: 'Sync In Progress',
			responses: { 200: inProgressSyncStatus },
		},
		{
			id: 'stale-sync',
			label: 'Stale Sync (24h old)',
			responses: {
				200: {
					...failedSyncStatus,
					lastSuccessfulSync: '2023-12-14T14:30:00Z',
					statusMessage: 'Last successful sync was over 24 hours ago',
				},
			},
		},
	],
};

const platform = new MockPlatformCore({
	name: 'contracts-demo',
	plugins: [contractsPlugin, syncStatusPlugin],
});

function DemoApp() {
	return (
		<div style={{ position: 'relative', height: '100vh' }}>
			<div style={{ padding: '20px', height: 'calc(100% - 40px)', overflow: 'auto' }}>
				<ContractsPage />
			</div>
			<MockUI platform={platform} />
		</div>
	);
}

const meta: Meta<typeof DemoApp> = {
	title: 'Demo/ContractsPage',
	component: DemoApp,
	parameters: {
		layout: 'fullscreen',
	},
};

export default meta;
type Story = StoryObj<typeof DemoApp>;

export const Default: Story = {
	name: 'Contracts Demo',
	parameters: {
		msw: {
			handlers: mswHandlersFromPlatform(platform),
		},
	},
};
