import React from 'react';
import Button from './Button';
import Popover from './Popover';
import { ChevronDown, X } from 'lucide-react';
import EndpointRow from './EndpointRow';
import GroupFilterPopover from './GroupFilterPopover';
import type { Plugin } from '../../types';
import PropTypes from 'prop-types';

interface Group {
	id: string;
	name: string;
	endpointIds: string[];
}

interface EndpointsTabProps {
	plugins: Plugin[];
	filteredPlugins: Plugin[];
	searchTerm: string;
	onSearchChange: (value: string) => void;
	selectedGroupFilters: string[];
	onToggleGroupFilter: (groupId: string) => void;
	onClearGroupFilters: () => void;
	groups: Group[];
	allGroups: Group[];
	isMocked: (plugin: Plugin) => boolean;
	onToggleMocked: (pluginId: string) => void;
	onUpdateStatusCode: (pluginId: string, statusCode: number) => void;
	onAddToGroup: (pluginId: string, groupId: string) => void;
	onRemoveFromGroup: (pluginId: string, groupId: string) => void;
	getStatus: (plugin: Plugin) => number;
	getStatusCodes: (plugin: Plugin) => number[];
	endpointScenarios: { [key: string]: string };
	onScenarioChange: (pluginId: string, scenarioId: string) => void;
}

const EndpointsTab: React.FC<EndpointsTabProps> = ({
	plugins,
	filteredPlugins,
	searchTerm,
	onSearchChange,
	selectedGroupFilters,
	onToggleGroupFilter,
	onClearGroupFilters,
	groups,
	allGroups,
	isMocked,
	onToggleMocked,
	onUpdateStatusCode,
	onAddToGroup,
	onRemoveFromGroup,
	getStatus,
	getStatusCodes,
	endpointScenarios,
	onScenarioChange,
}) => {
	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h3 style={{ fontSize: 18, fontWeight: 500 }}>All Endpoints</h3>
				<span style={{ borderRadius: 6, padding: '4px 8px', fontSize: 12, background: '#e0f2fe', color: '#0070f3' }}>
					{plugins.filter(ep => isMocked(ep)).length} selected
				</span>
			</div>
			<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
				<input
					placeholder="Search endpoints..."
					value={searchTerm}
					onChange={e => onSearchChange(e.currentTarget.value)}
					style={{ flex: 1, borderRadius: 6, padding: '8px 12px', border: '1px solid #ccc' }}
				/>
				<Popover
					trigger={
						<Button
							style={{
								borderRadius: 6,
								padding: '8px 12px',
								display: 'flex',
								alignItems: 'center',
								gap: 4,
								background: '#fff',
								border: '1px solid #ccc',
							}}
						>
							{selectedGroupFilters.length === 0
								? 'Filter by groups'
								: `${selectedGroupFilters.length} group${selectedGroupFilters.length > 1 ? 's' : ''} selected`}
							<ChevronDown style={{ height: 16, width: 16 }} />
						</Button>
					}
				>
					{close => (
						<GroupFilterPopover
							groups={allGroups}
							selectedGroupFilters={selectedGroupFilters}
							onToggleGroupFilter={onToggleGroupFilter}
							onClearGroupFilters={onClearGroupFilters}
							onClose={close}
						/>
					)}
				</Popover>
			</div>
			{selectedGroupFilters.length > 0 && (
				<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
					{selectedGroupFilters.map(groupId => {
						const group = groups.find(g => g.id === groupId);
						return group ? (
							<span
								key={groupId}
								style={{
									border: '1px solid #eee',
									padding: '4px 8px',
									borderRadius: 6,
									display: 'flex',
									alignItems: 'center',
									gap: 4,
									fontSize: 12,
								}}
							>
								{group.name}
								<X style={{ height: 12, width: 12, cursor: 'pointer' }} onClick={() => onToggleGroupFilter(groupId)} />
							</span>
						) : null;
					})}
				</div>
			)}
			<div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
				{filteredPlugins.map(plugin => (
					<EndpointRow
						key={plugin.id}
						plugin={plugin}
						isMocked={isMocked(plugin)}
						onToggleMocked={onToggleMocked}
						onUpdateStatusCode={onUpdateStatusCode}
						onAddToGroup={onAddToGroup}
						onRemoveFromGroup={onRemoveFromGroup}
						getStatus={getStatus}
						getStatusCodes={getStatusCodes}
						groups={groups}
						endpointScenarios={endpointScenarios}
						onScenarioChange={onScenarioChange}
					/>
				))}
				{filteredPlugins.length === 0 && (
					<div style={{ textAlign: 'center', padding: '32px 0', color: '#888' }}>
						No endpoints match your current filters.
					</div>
				)}
			</div>
		</div>
	);
};

EndpointsTab.propTypes = {
	plugins: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		endpoint: PropTypes.string.isRequired,
	})).isRequired,
	filteredPlugins: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
	})).isRequired,
	searchTerm: PropTypes.string.isRequired,
	onSearchChange: PropTypes.func.isRequired,
	selectedGroupFilters: PropTypes.arrayOf(PropTypes.string).isRequired,
	onToggleGroupFilter: PropTypes.func.isRequired,
	onClearGroupFilters: PropTypes.func.isRequired,
	groups: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		endpointIds: PropTypes.arrayOf(PropTypes.string).isRequired,
	})).isRequired,
	allGroups: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		endpointIds: PropTypes.arrayOf(PropTypes.string).isRequired,
	})).isRequired,
	isMocked: PropTypes.func.isRequired,
	onToggleMocked: PropTypes.func.isRequired,
	onUpdateStatusCode: PropTypes.func.isRequired,
	onAddToGroup: PropTypes.func.isRequired,
	onRemoveFromGroup: PropTypes.func.isRequired,
	getStatus: PropTypes.func.isRequired,
	getStatusCodes: PropTypes.func.isRequired,
	endpointScenarios: PropTypes.object.isRequired,
	onScenarioChange: PropTypes.func.isRequired,
};

export default EndpointsTab;