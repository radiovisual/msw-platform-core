import React, { useState, useMemo } from 'react';
import Button from './Button';
import Popover from './Popover';
import SearchBar from './SearchBar';
import { ChevronDown, X } from './Icon';
import EndpointRow from './EndpointRow';
import GroupFilterPopover from './GroupFilterPopover';
import { useResponsive } from '../hooks/useResponsive';
import { theme } from '../theme';
import type { Plugin } from '../../types';
import type { MockPlatformCore } from '../../classes/MockPlatformCore';

interface Group {
	id: string;
	name: string;
	endpointIds: string[];
}

interface EndpointsTabProps {
	plugins: Plugin[];
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
	platform: MockPlatformCore;
	onUpdateDelay: (pluginId: string, delay: number) => void;
	getDelay: (pluginId: string) => number;
}

const EndpointsTab: React.FC<EndpointsTabProps> = ({
	plugins,
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
	platform,
	onUpdateDelay,
	getDelay,
}) => {
	const screenSize = useResponsive();
	const isMobile = screenSize === 'mobile';
	const [searchTerm, setSearchTerm] = useState('');

	// Filter plugins based on search term and group filters
	const filteredPlugins = useMemo(() => {
		return plugins.filter(plugin => {
			// Always show all endpoints that match the search and group filters, regardless of passthrough/mocked state
			const matchesSearch = plugin.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesGroup =
				selectedGroupFilters.length === 0 ||
				selectedGroupFilters.some(groupId => {
					if (!groupId) {
						// eslint-disable-next-line no-console
						console.warn('[MockUI] selectedGroupFilters contains undefined groupId');
						return false;
					}
					const userGroup = groups.find(g => g.id === groupId);
					if (userGroup && Array.isArray(userGroup.endpointIds) && userGroup.endpointIds.includes(plugin.id)) return true;
					const autoGroups = allGroups.filter(g => g.id === groupId);
					const autoGroup = autoGroups.find(g => g.id === groupId);
					if (!autoGroup) {
						// eslint-disable-next-line no-console
						console.warn(`[MockUI] autoGroup not found for groupId: ${groupId}. allGroups:`, allGroups);
						return false;
					}
					if (typeof plugin.componentId === 'string' && plugin.componentId === autoGroup.name) return true;
					return false;
				});
			return matchesSearch && matchesGroup;
		});
	}, [plugins, searchTerm, selectedGroupFilters, groups, allGroups]);

	return (
		<div style={{ padding: isMobile ? '16px' : '24px' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '20px',
					flexWrap: isMobile ? 'wrap' : 'nowrap',
					gap: isMobile ? '12px' : '0',
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
					All Endpoints
				</h3>
				<div
					style={{
						padding: '6px 12px',
						borderRadius: theme.borderRadius.full,
						fontSize: '12px',
						background: theme.colors.primary,
						color: 'white',
						fontWeight: '500',
						boxShadow: theme.shadows.sm,
					}}
				>
					{plugins.filter(ep => isMocked(ep)).length} / {plugins.length} enabled
				</div>
			</div>

			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '12px',
					marginBottom: '20px',
					flexDirection: isMobile ? 'column' : 'row',
				}}
			>
				<SearchBar
					value={searchTerm}
					onChange={setSearchTerm}
					placeholder="Search endpoints..."
					style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}
				/>
				<Popover
					trigger={
						<Button
							style={{
								borderRadius: theme.borderRadius.md,
								padding: '10px 16px',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								background: 'white',
								border: `1px solid ${theme.colors.gray[300]}`,
								color: theme.colors.gray[700],
								fontSize: '14px',
								fontWeight: '500',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
								width: isMobile ? '100%' : 'auto',
								justifyContent: isMobile ? 'center' : 'flex-start',
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
						platform={platform}
						onUpdateDelay={onUpdateDelay}
						getDelay={getDelay}
					/>
				))}
				{filteredPlugins.length === 0 && (
					<div style={{ textAlign: 'center', padding: '32px 0', color: '#888' }}>No endpoints match your current filters.</div>
				)}
			</div>
		</div>
	);
};

export default EndpointsTab;
