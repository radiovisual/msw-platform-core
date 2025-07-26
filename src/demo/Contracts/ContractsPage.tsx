import { useEffect, useState } from 'react';
import { Contract } from './Contract.types';
import { fetchContracts, ContractsAPIError } from './api/get-contracts';
import { ContractTable } from './ContractsTable';
import { SyncStatus } from './SyncStatus/SyncStatus';
import './ContractsPage.less';

export default function ContractsPage() {
	const [contracts, setContracts] = useState<Contract[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchContracts()
			.then(contracts => {
				setContracts(contracts);
				setLoading(false);
			})
			.catch((err: ContractsAPIError) => {
				setError(err.message);
				setLoading(false);
			});
	}, []);

	const handleRowClick = (contract: Contract) => {
		// TODO: Remove this alert when page navigation is ready
		// eslint-disable-next-line no-alert
		alert(`You clicked contract ${contract.datauserName} ${contract.datauserBR}`);
	};

	return (
		<div className="contracts-page">
			<div className="page-header">
				<h1>Contracts</h1>
			</div>

			{loading && <div className="status-message loading">Loading contracts...</div>}
			{error && <div className="status-message error">Error: {error}</div>}

			{!loading && !error && contracts.length === 0 && <div className="status-message empty">No contracts available.</div>}

			{!loading && !error && contracts.length > 0 && (
				<div className="table-container">
					<SyncStatus className="sync-status-banner" />
					<ContractTable contracts={contracts} onRowClick={handleRowClick} />
				</div>
			)}
		</div>
	);
}
