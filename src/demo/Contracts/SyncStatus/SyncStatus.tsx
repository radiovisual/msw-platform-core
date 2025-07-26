import { useEffect, useState } from 'react';
import { SyncStatusResponse } from '../Contract.types';
import { fetchSyncStatus, SyncStatusAPIError } from '../api/get-sync-status';
import './SyncStatus.less';

export interface SyncStatusProps {
	className?: string;
}

export function SyncStatus({ className }: SyncStatusProps) {
	const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchSyncStatus()
			.then(status => {
				setSyncStatus(status);
				setLoading(false);
			})
			.catch((err: SyncStatusAPIError) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleString();
	};

	const getIcon = () => {
		if (loading) return '⏳';
		if (error) return '❌';
		if (syncStatus?.status === 'success') return '✅';
		if (syncStatus?.status === 'in_progress') return '🔄';
		return '❌';
	};

	const getMessage = () => {
		if (loading) return 'Loading sync status...';
		if (error) return `Error: ${error}`;
		if (!syncStatus) return 'No sync status available';

		const relevantTime = syncStatus.status === 'success' ? syncStatus.lastSuccessfulSync : syncStatus.lastSuccessfulSync;

		const timeLabel = syncStatus.status === 'success' ? 'Last sync' : 'Last successful sync';

		return `${timeLabel}: ${formatTimestamp(relevantTime)}`;
	};

	const getStatusMessage = () => {
		if (syncStatus && syncStatus.status !== 'success') {
			return syncStatus.statusMessage;
		}
		return null;
	};

	return (
		<div className={`sync-status ${className || ''}`}>
			<div className="sync-status-main">
				<span className="sync-icon">{getIcon()}</span>
				<span className="sync-message">{getMessage()}</span>
			</div>
			{getStatusMessage() && <div className="sync-error-message">{getStatusMessage()}</div>}
		</div>
	);
}
