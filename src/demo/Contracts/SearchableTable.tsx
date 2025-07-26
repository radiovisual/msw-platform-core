import { HTMLAttributes, useState, useMemo, useEffect, useCallback } from 'react';
import type { ColDef, RowClickedEvent, SelectionChangedEvent } from 'ag-grid-community';
import { DataTable } from './DataTable';
import './SearchableTable.less';

export interface ActionButton {
	label: string;
	onClick: (selectedRows: any[]) => void;
	variant?: 'primary' | 'secondary' | 'danger';
	disabled?: boolean;
}

export interface SearchableTableProps<T = any> extends HTMLAttributes<any> {
	/** The data to display in the table */
	rowData: T[];
	/** Column definitions for ag-grid */
	columnDefs: ColDef[];
	/** Function called when a row is clicked */
	onRowClick?: (data: T) => void;
	/** Whether rows are clickable */
	clickableRows?: boolean;
	/** Row selection mode: 'none', 'single', or 'multiple' */
	selectionMode?: 'none' | 'single' | 'multiple';
	/** Callback when row selection changes */
	onRowSelectionChange?: (selectedRows: T[]) => void;
	/** Whether to show search functionality */
	hasSearch?: boolean;
	/** Fields to include in search (if not provided, searches all string fields) */
	searchFields?: (keyof T)[];
	/** Placeholder text for search input */
	searchPlaceholder?: string;
	/** Action buttons to show at bottom right */
	actionButtons?: ActionButton[];
	/** Custom height for the table */
	height?: string | number;
	/** Page size for pagination */
	pageSize?: number;
	/** Available page sizes */
	pageSizeOptions?: number[];
	/** Whether table is read-only (disables all interactive features) */
	readonly?: boolean;
}

function useDebouncedValue<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}

export function SearchableTable<T = any>({
	rowData,
	columnDefs,
	onRowClick,
	clickableRows = true,
	selectionMode = 'none',
	onRowSelectionChange,
	hasSearch = false,
	searchFields,
	searchPlaceholder = 'Search...',
	actionButtons = [],
	height = '550px',
	pageSize = 15,
	pageSizeOptions = [10, 15, 25, 50],
	readonly = false,
	className,
	...restProps
}: SearchableTableProps<T>) {
	const [selectedRows, setSelectedRows] = useState<T[]>([]);
	const [search, setSearch] = useState('');
	const [_, setGridApi] = useState<any>(null);
	const debouncedSearch = useDebouncedValue(search, 300);

	// Filter data based on search
	const filteredData = useMemo(() => {
		if (!hasSearch || !debouncedSearch.trim()) return rowData;

		const searchLower = debouncedSearch.toLowerCase();

		return rowData.filter(row => {
			if (searchFields && searchFields.length > 0) {
				// Search only specified fields
				return searchFields.some(field => {
					const value = (row as any)[field];
					return value && String(value).toLowerCase().includes(searchLower);
				});
			} else {
				// Search all string fields
				return Object.values(row as any).some(value => value && typeof value === 'string' && value.toLowerCase().includes(searchLower));
			}
		});
	}, [rowData, debouncedSearch, searchFields, hasSearch]);

	// Enhanced column definitions - let ag-Grid handle checkboxes via rowSelection
	const enhancedColumnDefs = useMemo(() => {
		return [...columnDefs];
	}, [columnDefs]);

	// Ensure pageSize is included in pageSizeOptions and the list is sorted
	const enhancedPageSizeOptions = useMemo(() => {
		if (readonly) return false;
		
		const options = [...pageSizeOptions];
		
		// Add pageSize if it's not already in the options
		if (!options.includes(pageSize)) {
			options.push(pageSize);
		}
		
		// Sort the options in ascending order
		return options.sort((a, b) => a - b);
	}, [pageSizeOptions, pageSize, readonly]);

	// Handle row selection changes
	const handleSelectionChanged = useCallback(
		(event: SelectionChangedEvent) => {
			const selected = event.api.getSelectedRows();
			setSelectedRows(selected);
			onRowSelectionChange?.(selected);
		},
		[onRowSelectionChange]
	);

	// Handle row clicks
	const handleRowClick = useCallback(
		(event: RowClickedEvent<T>) => {
			if (onRowClick && event.data && clickableRows && !readonly) {
				onRowClick(event.data);
			}
		},
		[onRowClick, clickableRows, readonly]
	);

	// Handle clear search
	const handleClearSearch = useCallback(() => {
		setSearch('');
	}, []);

	// Grid ready callback
	const handleGridReady = useCallback((params: any) => {
		setGridApi(params.api);
	}, []);

	const tableHeight = typeof height === 'number' ? `${height}px` : height;

	return (
		<div className={`searchable-table ${className || ''}`} {...restProps}>
			{/* Search Header */}
			{hasSearch && !readonly && (
				<div className="searchable-table-header">
					<div className="search-container">
						<input
							type="text"
							placeholder={searchPlaceholder}
							value={search}
							onChange={e => setSearch(e.target.value)}
							className="search-input"
						/>
						{search && (
							<button onClick={handleClearSearch} className="clear-search-btn" title="Clear search">
								✕
							</button>
						)}
					</div>
				</div>
			)}

			{/* Table */}
			<div className="table-container">
				<div className="ag-theme-alpine" style={{ height: tableHeight, width: '100%' }}>
					<DataTable
						rowData={filteredData}
						columnDefs={enhancedColumnDefs}
						pagination={!readonly}
						paginationPageSize={readonly ? undefined : pageSize}
						paginationPageSizeSelector={enhancedPageSizeOptions}
						domLayout="normal"
						rowSelection={
							selectionMode !== 'none' && !readonly
								? {
										mode: selectionMode === 'single' ? 'singleRow' : 'multiRow',
										enableClickSelection: !readonly && clickableRows,
										enableSelectionWithoutKeys: !readonly,
								  }
								: undefined
						}
						cellSelection={!readonly}
						onRowClicked={readonly ? undefined : handleRowClick}
						onSelectionChanged={readonly ? undefined : handleSelectionChanged}
						onGridReady={handleGridReady}
						suppressHorizontalScroll={false}
						enableCellTextSelection
						rowStyle={{ cursor: onRowClick && clickableRows && !readonly ? 'pointer' : 'default' }}
						suppressMultiSort={readonly}
						animateRows={!readonly}
						getRowId={params => params.data.id || String(params.data.contractId || Math.random())}
					/>
				</div>
			</div>

			{/* Action Buttons */}
			{actionButtons.length > 0 && !readonly && (
				<div className="action-buttons">
					{actionButtons.map((button, index) => (
						<button
							key={index}
							onClick={() => button.onClick(selectedRows)}
							disabled={button.disabled || (selectionMode !== 'none' && selectedRows.length === 0) || readonly}
							className={`action-btn action-btn-${button.variant || 'primary'}`}
						>
							{button.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
