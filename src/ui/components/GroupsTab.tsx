import React from 'react';
import Button from './Button';
import { Plus } from 'lucide-react';
import GroupRow from './GroupRow';
import AutoGroupRow from './AutoGroupRow';
import type { Plugin } from '../../types';
import PropTypes from 'prop-types';

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
	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h3 style={{ fontSize: 18, fontWeight: 500 }}>Groups</h3>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<input
						placeholder="New group name"
						value={newGroupName}
						onChange={e => onNewGroupNameChange(e.currentTarget.value)}
						style={{ width: 160, borderRadius: 6, padding: '8px 12px', border: '1px solid #ccc' }}
						onKeyDown={e => e.key === 'Enter' && onCreateGroup()}
					/>
					<Button
						onClick={onCreateGroup}
						style={{ padding: '8px 12px', borderRadius: 6, background: '#fff', border: '1px solid #ccc' }}
					>
						<Plus style={{ height: 16, width: 16 }} />
					</Button>
				</div>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
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
					<div style={{ textAlign: 'center', padding: '32px 0', color: '#888' }}>
						No groups created yet. Create your first group above.
					</div>
				)}
			</div>
		</div>
	);
};

GroupsTab.propTypes = {
	groups: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		endpointIds: PropTypes.arrayOf(PropTypes.string).isRequired,
	})).isRequired,
	autoGroups: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		endpointIds: PropTypes.arrayOf(PropTypes.string).isRequired,
		auto: PropTypes.bool.isRequired,
	})).isRequired,
	plugins: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		method: PropTypes.string.isRequired,
		endpoint: PropTypes.string.isRequired,
		componentId: PropTypes.string.isRequired,
	})).isRequired,
	newGroupName: PropTypes.string.isRequired,
	onNewGroupNameChange: PropTypes.func.isRequired,
	onCreateGroup: PropTypes.func.isRequired,
	editingGroup: PropTypes.string,
	onSetEditingGroup: PropTypes.func.isRequired,
	onRenameGroup: PropTypes.func.isRequired,
	onDeleteGroup: PropTypes.func.isRequired,
	onRemoveFromGroup: PropTypes.func.isRequired,
};

export default GroupsTab; 