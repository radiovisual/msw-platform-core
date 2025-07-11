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

const theme = {
	colors: {
		gray: {
			50: '#f9fafb',
			100: '#f3f4f6',
			200: '#e5e7eb',
			600: '#4b5563',
			700: '#374151',
		},
	},
	borderRadius: {
		sm: '4px',
		md: '6px',
	},
	shadows: {
		lg: '0 2px 8px rgba(0,0,0,0.1)',
	},
};

const GroupFilterPopover: React.FC<GroupFilterPopoverProps> = ({
	groups,
	selectedGroupFilters,
	onToggleGroupFilter,
	onClearGroupFilters,
	onClose,
}) => {
	return (
		<div
			style={{
				width: 200,
				padding: 16,
				background: '#fff',
				borderRadius: theme.borderRadius.md,
				boxShadow: theme.shadows.lg,
				border: `1px solid ${theme.colors.gray[200]}`,
			}}
		>
			<div
				style={{
					fontWeight: '600',
					fontSize: '13px',
					marginBottom: '12px',
					color: theme.colors.gray[700],
				}}
			>
				Add to Groups
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
				<button
					style={{
						width: '100%',
						textAlign: 'left',
						fontSize: 12,
						padding: '6px 8px',
						borderRadius: theme.borderRadius.sm,
						cursor: 'pointer',
						background: theme.colors.gray[50],
						border: `1px solid ${theme.colors.gray[200]}`,
						color: theme.colors.gray[600],
						transition: 'all 0.2s ease',
					}}
					onClick={() => {
						onClearGroupFilters();
						onClose();
					}}
					onMouseEnter={e => {
						e.currentTarget.style.background = theme.colors.gray[100];
					}}
					onMouseLeave={e => {
						e.currentTarget.style.background = theme.colors.gray[50];
					}}
				>
					All Groups
				</button>
				{groups.map(group => (
					<div
						key={group.id}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							padding: '4px 0',
						}}
					>
						<Checkbox
							id={`filter-${group.id}`}
							checked={selectedGroupFilters.includes(group.id)}
							onChange={() => {
								onToggleGroupFilter(group.id);
								onClose();
							}}
							aria-label={`Filter by group ${group.name}`}
						/>
						<Label
							htmlFor={`filter-${group.id}`}
							style={{
								fontSize: 13,
								flex: 1,
								color: theme.colors.gray[700],
								fontWeight: '500',
							}}
						>
							{group.name}
						</Label>
					</div>
				))}
			</div>
		</div>
	);
};

export default GroupFilterPopover;
