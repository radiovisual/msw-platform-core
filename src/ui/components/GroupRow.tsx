import React from 'react';
import Button from './Button';
import { Users, Edit2, Trash2, X } from './Icon';
import type { Plugin } from '../../types';
import PropTypes from 'prop-types';

interface Group {
	id: string;
	name: string;
	endpointIds: string[];
}

interface GroupRowProps {
	group: Group;
	plugins: Plugin[];
	editingGroup: string | null;
	onSetEditingGroup: (groupId: string) => void;
	onRenameGroup: (groupId: string, newName: string) => void;
	onDeleteGroup: (groupId: string) => void;
	onRemoveFromGroup: (pluginId: string, groupId: string) => void;
}

const GroupRow: React.FC<GroupRowProps> = ({
	group,
	plugins,
	editingGroup,
	onSetEditingGroup,
	onRenameGroup,
	onDeleteGroup,
	onRemoveFromGroup,
}) => {
	return (
		<div key={group.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
			<div
				style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #eee' }}
			>
				{editingGroup === group.id ? (
					<input
						defaultValue={group.name}
						onBlur={e => onRenameGroup(group.id, e.currentTarget.value)}
						onKeyDown={e => {
							if (e.key === 'Enter') {
								onRenameGroup(group.id, e.currentTarget.value);
							}
						}}
						style={{ width: 192, borderRadius: 6, padding: '8px 12px', border: '1px solid #ccc' }}
						autoFocus
					/>
				) : (
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<Users style={{ height: 16, width: 16 }} />
						<span>{group.name}</span>
						<span style={{ borderRadius: 6, padding: '4px 8px', fontSize: 12, background: '#f0f0f0' }}>
							{group.endpointIds.length}
						</span>
					</div>
				)}
				<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<Button
						onClick={() => onSetEditingGroup(group.id)}
						style={{ padding: '8px 12px', borderRadius: 6, background: '#fff', border: '1px solid #ccc' }}
						aria-label="edit"
					>
						<Edit2 style={{ height: 16, width: 16 }} />
					</Button>
					<Button
						onClick={() => onDeleteGroup(group.id)}
						style={{
							padding: '8px 12px',
							borderRadius: 6,
							background: '#fff',
							border: '1px solid #ccc',
							color: '#e53e3e',
							cursor: 'pointer',
						}}
						aria-label="trash"
					>
						<Trash2 style={{ height: 16, width: 16 }} />
					</Button>
				</div>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
				{group.endpointIds.map(pluginId => {
					const plugin = plugins.find(ep => ep.id === pluginId);
					if (!plugin) return null;
					return (
						<div
							key={pluginId}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								padding: 12,
								borderRadius: 6,
								border: '1px solid #eee',
							}}
						>
							<span
								style={{
									padding: '4px 8px',
									borderRadius: 4,
									fontSize: 12,
									fontWeight: 600,
									background: '#e6f7ff',
									color: '#0070f3',
								}}
							>
								{plugin.method}
							</span>
							<span style={{ fontFamily: 'monospace', fontSize: 14 }}>{plugin.endpoint}</span>
							<Button
								onClick={() => onRemoveFromGroup(pluginId, group.id)}
								style={{
									padding: '8px 12px',
									borderRadius: 6,
									background: '#fff',
									border: '1px solid #ccc',
									color: '#e53e3e',
									cursor: 'pointer',
								}}
							>
								<X style={{ height: 16, width: 16 }} />
							</Button>
						</div>
					);
				})}
				{group.endpointIds.length === 0 && (
					<div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#888' }}>
						No endpoints in this group yet.
					</div>
				)}
			</div>
		</div>
	);
};

GroupRow.propTypes = {
	group: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		endpointIds: PropTypes.arrayOf(PropTypes.string).isRequired,
	}).isRequired,
	plugins: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		method: PropTypes.string.isRequired,
		endpoint: PropTypes.string.isRequired,
	})).isRequired,
	editingGroup: PropTypes.string,
	onSetEditingGroup: PropTypes.func.isRequired,
	onRenameGroup: PropTypes.func.isRequired,
	onDeleteGroup: PropTypes.func.isRequired,
	onRemoveFromGroup: PropTypes.func.isRequired,
};

export default GroupRow;