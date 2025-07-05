import React from 'react';
import Checkbox from './Checkbox';
import Label from './Label';

interface Group {
	id: string;
	name: string;
	endpointIds: string[];
}

interface GroupFilterPopoverProps {
	groups: Group[];
	selectedGroupFilters: string[];
	onToggleGroupFilter: (groupId: string) => void;
	onClearGroupFilters: () => void;
	onClose: () => void;
}

const GroupFilterPopover: React.FC<GroupFilterPopoverProps> = ({
	groups,
	selectedGroupFilters,
	onToggleGroupFilter,
	onClearGroupFilters,
	onClose,
}) => {
	return (
		<div style={{ width: 200, padding: 8, background: '#fff', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
				<button
					style={{
						width: '100%',
						textAlign: 'left',
						fontSize: 12,
						padding: '4px 8px',
						borderRadius: 4,
						cursor: 'pointer',
						background: '#f0f0f0',
					}}
					onClick={() => {
						onClearGroupFilters();
						onClose();
					}}
				>
					All Groups
				</button>
				{groups.map(group => (
					<div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<Checkbox
							id={`filter-${group.id}`}
							checked={selectedGroupFilters.includes(group.id)}
							onChange={() => {
								onToggleGroupFilter(group.id);
								onClose();
							}}
							aria-label={`Filter by group ${group.name}`}
						/>
						<Label htmlFor={`filter-${group.id}`} style={{ fontSize: 14, flex: 1 }}>
							{group.name}
						</Label>
					</div>
				))}
			</div>
		</div>
	);
};

export default GroupFilterPopover;