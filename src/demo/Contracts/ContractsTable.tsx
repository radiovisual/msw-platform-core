import { HTMLAttributes, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { SearchableTable } from './SearchableTable';
import { Contract } from './Contract.types';

export interface ContractTableProps extends HTMLAttributes<any> {
	contracts: Contract[];
	onRowClick?: (contract: Contract) => void;
	readonly?: boolean;
}

export function ContractTable(props: ContractTableProps) {
	const [colDefs] = useState<ColDef[]>([
		{ headerName: 'Data User Name', field: 'datauserName', flex: 2, filter: true, sortable: true, minWidth: 200 },
		{ headerName: 'Data User BR', field: 'datauserBR', flex: 1, filter: true, sortable: true, minWidth: 120 },
		{ headerName: 'BIC', field: 'bic', flex: 1, filter: true, sortable: true, minWidth: 120 },
		{ headerName: 'AI Contract ID', field: 'aiContractId', flex: 1, filter: true, sortable: true, minWidth: 140 },
		{ headerName: 'Opening Time', field: 'openingDate', flex: 1, filter: true, sortable: true, minWidth: 140 },
	]);

	return (
		<SearchableTable<Contract>
			rowData={props.contracts}
			columnDefs={colDefs}
			onRowClick={props.onRowClick}
			hasSearch
			searchFields={['datauserName', 'datauserBR', 'bic']}
			searchPlaceholder="Search by Company Name, BR, or BIC..."
			height="550px"
			pageSize={15}
			pageSizeOptions={[15, 30, 60, 100]}
			readonly={props.readonly}
			className={props.className}
		/>
	);
}
