import React from 'react';
import Button from './Button';
import { Plus } from './Icon';
import GroupRow from './GroupRow';
import AutoGroupRow from './AutoGroupRow';
import { useResponsive } from '../hooks/useResponsive';
import { theme } from '../theme';
import type { Plugin } from '../../types';

interface Group {
	id: string;
	name: string;
	endpointIds: string[];
}

interface AutoGroup {
	id: string;
	name: string;
	endpointIds: string[];
	auto: boolean;
}

interface GroupsTabProps {
	groups: Group[];
	autoGroups: AutoGroup[];
	plugins: Plugin[];
	newGroupName: string;
	onNewGroupNameChange: (value: string) => void;
	onCreateGroup: () => void;
	editingGroup: string | null;
	onSetEditingGroup: (groupId: string) => void;
	onRenameGroup: (groupId: string, newName: string) => void;
	onDeleteGroup: (groupId: string) => void;
	onRemoveFromGroup: (pluginId: string, groupId: string) => void;
}

const GroupsTab: React.FC<GroupsTabProps> = ({
	groups,
	autoGroups,
	plugins,
	newGroupName,
	onNewGroupNameChange,
	onCreateGroup,
	editingGroup,
	onSetEditingGroup,
	onRenameGroup,
	onDeleteGroup,
	onRemoveFromGroup,
}) => {
	const screenSize = useResponsive();
	const isMobile = screenSize === 'mobile';

	return (
		<div style={{ padding: isMobile ? '16px' : '24px' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '20px',
					flexDirection: isMobile ? 'column' : 'row',
					gap: isMobile ? '16px' : '0',
				}}
			>
				<h3
					style={{
						fontSize: isMobile ? '16px' : '18px',
						fontWeight: '600',
						margin: 0,
						color: theme.colors.gray[800],
					}}
				>
					Groups
				</h3>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						width: isMobile ? '100%' : 'auto',
					}}
				>
					<input
						placeholder="New group name"
						value={newGroupName}
						onChange={e => onNewGroupNameChange(e.currentTarget.value)}
						style={{
							width: isMobile ? '100%' : '160px',
							borderRadius: theme.borderRadius.md,
							padding: '8px 12px',
							border: `1px solid ${theme.colors.gray[300]}`,
							fontSize: '14px',
							outline: 'none',
							transition: 'border-color 0.2s ease',
						}}
						onKeyDown={e => e.key === 'Enter' && onCreateGroup()}
					/>
					<Button
						onClick={onCreateGroup}
						style={{
							padding: '8px 12px',
							borderRadius: theme.borderRadius.md,
							background: theme.colors.primary,
							border: `1px solid ${theme.colors.primary}`,
							color: 'white',
							display: 'flex',
							alignItems: 'center',
							gap: '4px',
							fontSize: '14px',
							fontWeight: '500',
						}}
					>
						<Plus style={{ height: 16, width: 16 }} />
						{!isMobile && 'Create'}
					</Button>
				</div>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				{autoGroups.map(group => (
					<AutoGroupRow key={group.id} group={group} plugins={plugins} />
				))}
				{groups.map(group => (
					<GroupRow
						key={group.id}
						group={group}
						plugins={plugins}
						editingGroup={editingGroup}
						onSetEditingGroup={onSetEditingGroup}
						onRenameGroup={onRenameGroup}
						onDeleteGroup={onDeleteGroup}
						onRemoveFromGroup={onRemoveFromGroup}
					/>
				))}
				{groups.length === 0 && (
					<div
						style={{
							textAlign: 'center',
							padding: '32px 0',
							color: theme.colors.gray[600],
							fontSize: '14px',
						}}
					>
						No groups created yet. Create your first group above.
					</div>
				)}
			</div>
		</div>
	);
};

export default GroupsTab;
