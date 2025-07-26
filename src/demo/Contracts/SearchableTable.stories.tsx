/* eslint-disable no-console, no-alert, react/no-unescaped-entities, react-hooks/rules-of-hooks */
import type { Meta, StoryObj } from '@storybook/react';
import { SearchableTable, ActionButton } from './SearchableTable';
import { createContracts } from './createContracts';
import { ColDef } from 'ag-grid-community';
import { useState } from 'react';
import './SearchableTable.less';

// Create mock data
const mockContracts = createContracts(50);

const contractColumnDefs: ColDef[] = [
	{ headerName: 'Data User Name', field: 'datauserName', flex: 2, filter: true, sortable: true, minWidth: 200 },
	{ headerName: 'Data User BR', field: 'datauserBR', flex: 1, filter: true, sortable: true, minWidth: 120 },
	{ headerName: 'BIC', field: 'bic', flex: 1, filter: true, sortable: true, minWidth: 120 },
	{ headerName: 'AI Contract ID', field: 'aiContractId', flex: 1, filter: true, sortable: true, minWidth: 140 },
	{ headerName: 'Opening Time', field: 'openingDate', flex: 1, filter: true, sortable: true, minWidth: 140 },
];

const meta: Meta<typeof SearchableTable> = {
	title: 'Demo/SearchableTable',
	component: SearchableTable,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		Story => (
			<div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
				<Story />
			</div>
		),
	],
	argTypes: {
		selectionMode: {
			control: 'select',
			options: ['none', 'single', 'multiple'],
			description: 'Row selection mode',
		},
		hasSearch: {
			control: 'boolean',
			description: 'Enable search functionality',
		},
		pageSize: {
			control: 'number',
			description: 'Number of rows per page',
		},
		height: {
			control: 'text',
			description: 'Table height (CSS value)',
		},
		searchPlaceholder: {
			control: 'text',
			description: 'Placeholder text for search input',
		},
		readonly: {
			control: 'boolean',
			description: 'Make table read-only',
		},
		clickableRows: {
			control: 'boolean',
			description: 'Enable row click interactions',
		},
	},
};

export default meta;
type Story = StoryObj<typeof SearchableTable>;

// Basic table without selection or search
export const BasicTable: Story = {
	args: {
		rowData: mockContracts.slice(0, 20),
		columnDefs: contractColumnDefs,
		selectionMode: 'none',
		hasSearch: false,
		height: '400px',
		pageSize: 10,
	},
	render: args => {
		const handleRowClick = (contract: any) => {
			alert(`Clicked contract: ${contract.datauserName} (ID: ${contract.contractId})`);
		};

		return <SearchableTable {...args} onRowClick={handleRowClick} />;
	},
};

// Table with search functionality
export const TableWithSearch: Story = {
	args: {
		rowData: mockContracts,
		columnDefs: contractColumnDefs,
		selectionMode: 'none',
		hasSearch: true,
		searchFields: ['datauserName', 'datauserBR', 'bic'] as any,
		searchPlaceholder: 'Search by Company Name, BR, or BIC...',
		height: '500px',
		pageSize: 15,
	},
	render: args => {
		const handleRowClick = (contract: any) => {
			console.log('Row clicked:', contract);
		};

		return <SearchableTable {...args} onRowClick={handleRowClick} />;
	},
};

// Table with multiple row selection
export const TableWithSelection: Story = {
	args: {
		rowData: mockContracts.slice(0, 30),
		columnDefs: contractColumnDefs,
		selectionMode: 'multiple',
		hasSearch: false,
		height: '500px',
		pageSize: 15,
	},
	render: args => {
		const [selectedRows, setSelectedRows] = useState<any[]>([]);

		const handleSelectionChange = (rows: any[]) => {
			setSelectedRows(rows);
			console.log('Selected rows:', rows);
		};

		return (
			<div>
				<div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
					<strong>Selected: {selectedRows.length} contracts</strong>
					<br />
					<small>💡 Use the checkbox in the header to select/deselect all visible rows</small>
					{selectedRows.length > 0 && (
						<div style={{ marginTop: '5px', fontSize: '12px' }}>{selectedRows.map(row => row.datauserName).join(', ')}</div>
					)}
				</div>
				<SearchableTable {...args} onRowSelectionChange={handleSelectionChange} />
			</div>
		);
	},
};

// Table with action buttons
export const TableWithActions: Story = {
	args: {
		rowData: mockContracts.slice(0, 25),
		columnDefs: contractColumnDefs,
		selectionMode: 'multiple',
		hasSearch: true,
		searchFields: ['datauserName', 'datauserBR', 'bic'] as any,
		searchPlaceholder: 'Search contracts...',
		height: '500px',
		pageSize: 15,
	},
	render: args => {
		const [message, setMessage] = useState<string>('');

		const actionButtons: ActionButton[] = [
			{
				label: 'Approve',
				onClick: (selectedRows: any[]) => {
					setMessage(`Approved ${selectedRows.length} contracts`);
					console.log('Approving contracts:', selectedRows);
				},
				variant: 'primary',
			},
			{
				label: 'Suspend',
				onClick: (selectedRows: any[]) => {
					setMessage(`Suspended ${selectedRows.length} contracts`);
					console.log('Suspending contracts:', selectedRows);
				},
				variant: 'secondary',
			},
			{
				label: 'Delete',
				onClick: (selectedRows: any[]) => {
					if (confirm(`Are you sure you want to delete ${selectedRows.length} contracts?`)) {
						setMessage(`Deleted ${selectedRows.length} contracts`);
						console.log('Deleting contracts:', selectedRows);
					}
				},
				variant: 'danger',
			},
		];

		return (
			<div>
				{message && (
					<div
						style={{
							marginBottom: '10px',
							padding: '10px',
							backgroundColor: '#d4edda',
							borderRadius: '4px',
							color: '#155724',
						}}
					>
						{message}
					</div>
				)}
				<SearchableTable {...args} actionButtons={actionButtons} />
			</div>
		);
	},
};

// Complete feature showcase
export const FullFeaturedTable: Story = {
	args: {
		rowData: mockContracts,
		columnDefs: contractColumnDefs,
		selectionMode: 'multiple',
		hasSearch: true,
		searchFields: ['datauserName', 'datauserBR', 'bic'] as any,
		searchPlaceholder: 'Search contracts...',
		height: '600px',
		pageSize: 20,
		pageSizeOptions: [10, 20, 50, 100],
	},
	render: args => {
		const [selectedRows, setSelectedRows] = useState<any[]>([]);
		const [message, setMessage] = useState<string>('');

		const handleRowClick = (contract: any) => {
			setMessage(`Clicked on contract: ${contract.datauserName} (${contract.contractId})`);
		};

		const handleSelectionChange = (rows: any[]) => {
			setSelectedRows(rows);
		};

		const actionButtons: ActionButton[] = [
			{
				label: 'Export',
				onClick: (selectedRows: any[]) => {
					setMessage(`Exporting ${selectedRows.length} contracts...`);
					// Simulate export
					setTimeout(() => {
						setMessage(`Successfully exported ${selectedRows.length} contracts`);
					}, 1000);
				},
				variant: 'primary',
			},
			{
				label: 'Archive',
				onClick: (selectedRows: any[]) => {
					setMessage(`Archived ${selectedRows.length} contracts`);
				},
				variant: 'secondary',
			},
			{
				label: 'Delete',
				onClick: (selectedRows: any[]) => {
					if (confirm(`Delete ${selectedRows.length} contracts?`)) {
						setMessage(`Deleted ${selectedRows.length} contracts`);
					}
				},
				variant: 'danger',
			},
		];

		return (
			<div>
				<div style={{ marginBottom: '15px' }}>
					<h2>Contract Management System</h2>
					<p>This table demonstrates all SearchableTable features: search, selection, and actions.</p>
				</div>

				{message && (
					<div
						style={{
							marginBottom: '15px',
							padding: '10px',
							backgroundColor: '#e7f3ff',
							borderRadius: '4px',
							border: '1px solid #bee5eb',
							color: '#0056b3',
						}}
					>
						📋 {message}
					</div>
				)}

				<div
					style={{
						marginBottom: '15px',
						padding: '10px',
						backgroundColor: '#f8f9fa',
						borderRadius: '4px',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<span>
						<strong>Total Contracts:</strong> {args.rowData.length}
					</span>
					<span>
						<strong>Selected:</strong> {selectedRows.length}
					</span>
				</div>

				<SearchableTable {...args} onRowClick={handleRowClick} onRowSelectionChange={handleSelectionChange} actionButtons={actionButtons} />
			</div>
		);
	},
};

// Performance test with large dataset
export const LargeDataset: Story = {
	args: {
		rowData: createContracts(1000),
		columnDefs: contractColumnDefs,
		selectionMode: 'multiple',
		hasSearch: true,
		searchFields: ['datauserName'] as any,
		searchPlaceholder: 'Search 1000 contracts...',
		height: '600px',
		pageSize: 50,
		pageSizeOptions: [25, 50, 100, 200],
	},
	render: args => {
		const [performanceInfo, setPerformanceInfo] = useState<string>('');

		const handleSelectionChange = (rows: any[]) => {
			setPerformanceInfo(`Selected ${rows.length} / ${args.rowData.length} contracts`);
		};

		return (
			<div>
				<div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
					⚡ <strong>Performance Test:</strong> 1000 contracts with search and selection
					{performanceInfo && <div>{performanceInfo}</div>}
				</div>
				<SearchableTable
					{...args}
					onRowSelectionChange={handleSelectionChange}
					actionButtons={[
						{
							label: 'Bulk Process',
							onClick: rows => setPerformanceInfo(`Processing ${rows.length} contracts...`),
							variant: 'primary',
						},
					]}
				/>
			</div>
		);
	},
};

// Read-only table demo
export const ReadOnlyTable: Story = {
	args: {
		rowData: mockContracts.slice(0, 25),
		columnDefs: contractColumnDefs,
		selectionMode: 'multiple',
		hasSearch: true,
		searchFields: ['datauserName', 'datauserBR', 'bic'] as any,
		searchPlaceholder: 'Search contracts...',
		height: '500px',
		pageSize: 15,
		readonly: true,
	},
	render: args => {
		const actionButtons: ActionButton[] = [
			{
				label: 'Export',
				onClick: (selectedRows: any[]) => {
					alert(`Would export ${selectedRows.length} contracts`);
				},
				variant: 'primary',
			},
			{
				label: 'Delete',
				onClick: (selectedRows: any[]) => {
					alert(`Would delete ${selectedRows.length} contracts`);
				},
				variant: 'danger',
			},
		];

		return (
			<div>
				<div
					style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f8d7da', borderRadius: '4px', border: '1px solid #f5c6cb' }}
				>
					🔒 <strong>Read-Only Mode:</strong> All interactive features are disabled - no search, selection, pagination, row clicks, or
					action buttons. This mode is perfect for displaying data in a view-only context.
				</div>
				<SearchableTable
					{...args}
					onRowClick={(contract: any) => alert(`Row click disabled in readonly mode: ${contract.datauserName}`)}
					actionButtons={actionButtons}
				/>
			</div>
		);
	},
};

// Clickable rows demo
export const ClickableRowsTable: Story = {
	args: {
		rowData: mockContracts.slice(0, 20),
		columnDefs: contractColumnDefs,
		selectionMode: 'none',
		hasSearch: true,
		searchFields: ['datauserName', 'datauserBR', 'bic'] as any,
		searchPlaceholder: 'Search contracts...',
		height: '500px',
		pageSize: 10,
		clickableRows: true,
	},
	render: args => {
		const [selectedContract, setSelectedContract] = useState<any | null>(null);

		const handleRowClick = (contract: any) => {
			setSelectedContract(contract);
		};

		return (
			<div>
				<div
					style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}
				>
					👆 <strong>Clickable Rows:</strong> Click on any row to view contract details. Notice the pointer cursor on hover.
				</div>

				{selectedContract && (
					<div
						style={{
							marginBottom: '15px',
							padding: '15px',
							backgroundColor: '#d4edda',
							borderRadius: '4px',
							border: '1px solid #c3e6cb',
						}}
					>
						<h4>Selected Contract Details:</h4>
						<p>
							<strong>Data User:</strong> {selectedContract.datauserName}
						</p>
						<p>
							<strong>BR:</strong> {selectedContract.datauserBR}
						</p>
						<p>
							<strong>BIC:</strong> {selectedContract.bic}
						</p>
						<p>
							<strong>Contract ID:</strong> {selectedContract.aiContractId}
						</p>
						<p>
							<strong>Opening Date:</strong> {selectedContract.openingDate}
						</p>
						<p>
							<strong>Contract ID:</strong> {selectedContract.contractId}
						</p>
					</div>
				)}

				<SearchableTable {...args} onRowClick={handleRowClick} />
			</div>
		);
	},
};

// Non-clickable rows demo
export const NonClickableRowsTable: Story = {
	args: {
		rowData: mockContracts.slice(0, 20),
		columnDefs: contractColumnDefs,
		selectionMode: 'multiple',
		hasSearch: true,
		searchFields: ['datauserName', 'datauserBR', 'bic'] as any,
		searchPlaceholder: 'Search contracts...',
		height: '500px',
		pageSize: 10,
		clickableRows: false,
	},
	render: args => {
		const [selectedRows, setSelectedRows] = useState<any[]>([]);

		const handleRowClick = (contract: any) => {
			// This won't be called because clickableRows is false
			alert(`This shouldn't happen: ${contract.datauserName}`);
		};

		const handleSelectionChange = (rows: any[]) => {
			setSelectedRows(rows);
		};

		const actionButtons: ActionButton[] = [
			{
				label: 'View Selected',
				onClick: (selectedRows: any[]) => {
					if (selectedRows.length > 0) {
						alert(`Selected contracts: ${selectedRows.map(c => c.datauserName).join(', ')}`);
					}
				},
				variant: 'primary',
			},
		];

		return (
			<div>
				<div
					style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}
				>
					🚫 <strong>Non-Clickable Rows:</strong> Rows cannot be clicked (notice the default cursor), but selection via checkboxes still
					works. This is useful when you want selection but not row-level interactions.
				</div>

				<div
					style={{
						marginBottom: '15px',
						padding: '10px',
						backgroundColor: '#f8f9fa',
						borderRadius: '4px',
					}}
				>
					<strong>Selected Contracts:</strong> {selectedRows.length}
					{selectedRows.length > 0 && (
						<div style={{ marginTop: '5px', fontSize: '14px' }}>{selectedRows.map(contract => contract.datauserName).join(', ')}</div>
					)}
				</div>

				<SearchableTable {...args} onRowClick={handleRowClick} onRowSelectionChange={handleSelectionChange} actionButtons={actionButtons} />
			</div>
		);
	},
};

// Single selection demo
export const SingleSelectionTable: Story = {
	args: {
		rowData: mockContracts.slice(0, 20),
		columnDefs: contractColumnDefs,
		selectionMode: 'single',
		hasSearch: true,
		searchFields: ['datauserName', 'datauserBR', 'bic'] as any,
		searchPlaceholder: 'Search contracts...',
		height: '500px',
		pageSize: 10,
		clickableRows: false,
	},
	render: args => {
		const [selectedRows, setSelectedRows] = useState<any[]>([]);
		const [message, setMessage] = useState<string>('');

		const handleRowClick = (contract: any) => {
			// This won't be called because clickableRows is false
			alert(`This shouldn't happen: ${contract.datauserName}`);
		};

		const handleSelectionChange = (rows: any[]) => {
			setSelectedRows(rows);
			setMessage(rows.length > 0 ? `Selected: ${rows[0].datauserName}` : 'No selection');
		};

		const actionButtons: ActionButton[] = [
			{
				label: 'View Details',
				onClick: (selectedRows: any[]) => {
					if (selectedRows.length > 0) {
						alert(`Viewing details for contract: ${selectedRows[0].datauserName}`);
					}
				},
				variant: 'primary',
			},
			{
				label: 'Edit Contract',
				onClick: (selectedRows: any[]) => {
					if (selectedRows.length > 0) {
						alert(`Editing contract: ${selectedRows[0].datauserName}`);
					}
				},
				variant: 'secondary',
			},
		];

		return (
			<div>
				<div
					style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '4px', border: '1px solid #bee5eb' }}
				>
					☝️ <strong>Single Selection Mode:</strong> Only one row can be selected at a time. Notice there's no "select all" checkbox in the
					header. This is perfect for scenarios where you need to perform actions on individual contracts.
				</div>

				<div
					style={{
						marginBottom: '15px',
						padding: '10px',
						backgroundColor: '#f8f9fa',
						borderRadius: '4px',
					}}
				>
					<strong>Status:</strong> {message || 'No contract selected'}
					{selectedRows.length > 0 && (
						<div style={{ marginTop: '5px', fontSize: '14px' }}>
							<strong>BIC:</strong> {selectedRows[0].bic} | <strong>BR:</strong> {selectedRows[0].datauserBR}
						</div>
					)}
				</div>

				<SearchableTable {...args} onRowClick={handleRowClick} onRowSelectionChange={handleSelectionChange} actionButtons={actionButtons} />
			</div>
		);
	},
};
