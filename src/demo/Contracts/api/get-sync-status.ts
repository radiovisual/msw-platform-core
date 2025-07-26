import { SyncStatusResponse } from '../Contract.types';

export class SyncStatusAPIError extends Error {
	constructor(message: string, public status?: number) {
		super(message);
		this.name = 'SyncStatusAPIError';
	}
}

export async function fetchSyncStatus(): Promise<SyncStatusResponse> {
	try {
		const response = await fetch('/contracts/sync-status');

		if (!response.ok) {
			const message = `Failed to fetch sync status. Status: ${response.status}`;
			throw new SyncStatusAPIError(message, response.status);
		}

		const data: SyncStatusResponse = await response.json();

		// Validate structure
		if (!data.lastSuccessfulSync || !data.lastAttemptedSync || !data.status || !data.statusMessage) {
			throw new SyncStatusAPIError('Malformed sync status response');
		}

		return data;
	} catch (err: any) {
		if (err instanceof SyncStatusAPIError) {
			throw err;
		}
		throw new SyncStatusAPIError('Network error while fetching sync status');
	}
}
