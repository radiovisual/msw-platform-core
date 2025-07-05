/* eslint-disable no-console */
import React, { useState, useEffect, useCallback } from 'react';
import Button from './components/Button';
import Dialog from './components/Dialog';
import { Tabs, TabList, Tab, TabPanel } from './components/Tabs';
import { Settings, X } from './components/Icon';
import EndpointsTab from './components/EndpointsTab';
import GroupsTab from './components/GroupsTab';
import FeatureFlagsTab from './components/FeatureFlagsTab';
import { DynamicSettingsTab } from './components/DynamicSettingsTab';
import type { MockPlatformCore } from '../platform';
import type { Plugin } from '../types';

// UI-only group type
interface Group {
	id: string;
	name: string;
	endpointIds: string[];
}

interface MockUIProps {
	platform: MockPlatformCore;
	onStateChange?: (opts: { disabledPluginIds: string[] }) => void;
	groupStorageKey?: string;
	disabledPluginIdsStorageKey?: string;
}

function loadGroups(storageKey: string): Group[] {
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) return [];
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

function saveGroups(groups: Group[], storageKey: string) {
	localStorage.setItem(storageKey, JSON.stringify(groups));
}

function loadDisabledPluginIds(storageKey: string): string[] {
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) return [];
		return JSON.parse(raw);
	} catch {
		return [];
	}
}
function saveDisabledPluginIds(ids: string[], storageKey: string) {
	localStorage.setItem(storageKey, JSON.stringify(ids));
}

// Add scenario persistence helpers
function loadEndpointScenarios(storageKey: string): { [key: string]: string } {
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) return {};
		return JSON.parse(raw);
	} catch {
		return {};
	}
}
function saveEndpointScenarios(map: { [key: string]: string }, storageKey: string) {
	localStorage.setItem(storageKey, JSON.stringify(map));
}

export default function MockUI({ platform, onStateChange, groupStorageKey, disabledPluginIdsStorageKey }: MockUIProps) {
	const platformName = platform.getName();
	if (!platformName) {
		throw new Error('Platform name is required for MockUI localStorage namespacing. Received platform: ' + JSON.stringify(platform));
	}

	const groupKey = groupStorageKey || `${platformName}.mockui.groups.v1`;
	const disabledKey = disabledPluginIdsStorageKey || `${platformName}.mockui.disabledPluginIds.v1`;
	const endpointScenarioKey = `${platformName}.mockui.endpointScenarios.v1`;
	const [isOpen, setIsOpen] = useState(false);
	const [groups, setGroups] = useState<Group[]>(() => loadGroups(groupKey));
	const [disabledPluginIds, setDisabledPluginIds] = useState<string[]>(() => {
		const ids = loadDisabledPluginIds(disabledKey);
		platform.setDisabledPluginIds(ids);
		return ids;
	});
	const [newGroupName, setNewGroupName] = useState('');
	const [editingGroup, setEditingGroup] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [selectedGroupFilters, setSelectedGroupFilters] = useState<string[]>([]);
	const [, forceUpdate] = useState(0);
	const [endpointScenarios, setEndpointScenarios] = useState<{ [key: string]: string }>(() => loadEndpointScenarios(endpointScenarioKey));

	const plugins: Plugin[] = platform.getPlugins();
	const featureFlags = platform.getFeatureFlags();
	const featureFlagMetadata = platform.getFeatureFlagMetadata();

	// Helper to get automatic groups from platform
	const autoGroups = platform.getComponentIds().map(cid => ({
		id: cid,
		name: cid,
		endpointIds: platform
			.getPlugins()
			.filter(p => p.componentId === cid)
			.map(p => p.id),
		auto: true,
	}));

	// Helper: get status override or default
	const getStatus = (plugin: Plugin) => platform.getStatusOverride(plugin.id) ?? plugin.defaultStatus;

	// Helper: is endpoint mocked?
	const isMocked = (plugin: Plugin) => !platform.getDisabledPluginIds().includes(plugin.id);

	// Persist groups and disabledPluginIds
	useEffect(() => {
		saveGroups(groups, groupKey);
	}, [groups, groupKey]);
	useEffect(() => {
		saveDisabledPluginIds(disabledPluginIds, disabledKey);
	}, [disabledPluginIds, disabledKey]);
	// Persist endpointScenarios
	useEffect(() => {
		saveEndpointScenarios(endpointScenarios, endpointScenarioKey);
	}, [endpointScenarios, endpointScenarioKey]);

	// Notify parent/MSW adapter on state change
	useEffect(() => {
		onStateChange?.({ disabledPluginIds });
	}, [disabledPluginIds, onStateChange]);

	// UI: toggle endpoint mocked/passthrough
	const toggleEndpointSelection = useCallback(
		(pluginId: string) => {
			setDisabledPluginIds(prev => {
				const arr = prev.includes(pluginId) ? prev.filter(id => id !== pluginId) : [...prev, pluginId];
				platform.setDisabledPluginIds(arr);
				return arr;
			});
			forceUpdate(x => x + 1);
		},
		[platform]
	);

	// UI: update status code
	const updateStatusCode = useCallback(
		(pluginId: string, statusCode: number) => {
			platform.setStatusOverride(pluginId, statusCode);
			forceUpdate(x => x + 1);
			onStateChange?.({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);

	// UI: toggle feature flag
	const toggleFeatureFlag = useCallback(
		(flag: string, value: boolean) => {
			platform.setFeatureFlag(flag, value);
			forceUpdate(x => x + 1);
			onStateChange?.({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);

	// Group operations
	const createGroup = () => {
		if (newGroupName.trim()) {
			const newGroup: Group = {
				id: Date.now().toString(),
				name: newGroupName.trim(),
				endpointIds: [],
			};
			setGroups(prev => [...prev, newGroup]);
			setNewGroupName('');
		}
	};
	const deleteGroup = (groupId: string) => {
		setGroups(prev => prev.filter(g => g.id !== groupId));
	};
	const renameGroup = (groupId: string, newName: string) => {
		setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, name: newName } : g)));
		setEditingGroup(null);
	};
	const addToGroup = (pluginId: string, groupId: string) => {
		setGroups(prev =>
			prev.map(g => (g.id === groupId && !g.endpointIds.includes(pluginId) ? { ...g, endpointIds: [...g.endpointIds, pluginId] } : g))
		);
	};
	const removeFromGroup = (pluginId: string, groupId: string) => {
		setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, endpointIds: g.endpointIds.filter(id => id !== pluginId) } : g)));
	};
	const toggleGroupFilter = (groupId: string) => {
		setSelectedGroupFilters(prev => (prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]));
	};
	const clearGroupFilters = () => setSelectedGroupFilters([]);

	// Filtering
	const filteredPlugins = plugins.filter(plugin => {
		// Always show all endpoints that match the search and group filters, regardless of passthrough/mocked state
		const matchesSearch = plugin.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesGroup =
			selectedGroupFilters.length === 0 ||
			selectedGroupFilters.some(groupId => {
				if (!groupId) {
					console.warn('[MockUI] selectedGroupFilters contains undefined groupId');
					return false;
				}
				const userGroup = groups.find(g => g.id === groupId);
				if (userGroup && Array.isArray(userGroup.endpointIds) && userGroup.endpointIds.includes(plugin.id)) return true;
				const autoGroup = autoGroups.find(g => g.id === groupId);
				if (!autoGroup) {
					console.warn(`[MockUI] autoGroup not found for groupId: ${groupId}. autoGroups:`, autoGroups);
					return false;
				}
				if (typeof plugin.componentId === 'string' && plugin.componentId === autoGroup.name) return true;
				return false;
			});
		return matchesSearch && matchesGroup;
	});

	// Helper: get statusCodes for a plugin
	const getStatusCodes = (plugin: Plugin) => {
		return Object.keys(plugin.responses).map(Number);
	};

	const allGroups = [...autoGroups, ...groups];

	// Scenario change handler
	const handleScenarioChange = (pluginId: string, scenarioId: string) => {
		setEndpointScenarios(prev => ({ ...prev, [pluginId]: scenarioId }));
		platform.setEndpointScenario(pluginId, scenarioId);
		forceUpdate(x => x + 1);
	};

	// UI: update middleware setting
	const updateMiddlewareSetting = useCallback(
		(key: string, value: any) => {
			platform.setMiddlewareSetting(key, value);
			forceUpdate(x => x + 1);
			onStateChange?.({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);

	return (
		<>
			{/* Floating Button */}
			<div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
				<Button
					onClick={() => setIsOpen(true)}
					style={{
						borderRadius: '50%',
						height: 56,
						width: 56,
						boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						border: '1px solid #ccc',
					}}
					data-testid="open-settings"
				>
					<Settings style={{ height: 24, width: 24 }} />
				</Button>
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					{isOpen && (
						<div
							style={{
								maxWidth: 800,
								width: '90vw',
								maxHeight: '80vh',
								height: '80vh',
								background: '#fff',
								borderRadius: 12,
								boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
								border: '1px solid #eee',
								margin: '0 auto',
								display: 'flex',
								flexDirection: 'column',
								padding: 0,
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '16px 24px',
									borderBottom: '1px solid #eee',
									flex: '0 0 auto',
								}}
							>
								<h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Endpoint Manager</h2>
								<Button style={{ padding: 8 }} onClick={() => setIsOpen(false)} data-testid="close-dialog">
									<X style={{ height: 16, width: 16 }} />
								</Button>
							</div>
							<div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
								<Tabs defaultValue="endpoints">
									<div
										style={{
											position: 'sticky',
											top: 0,
											zIndex: 2,
											background: '#fff',
											borderBottom: '1px solid #eee',
										}}
									>
										<TabList>
											<Tab value="endpoints">Endpoints</Tab>
											<Tab value="groups">Groups</Tab>
											<Tab value="settings">Settings</Tab>
											<Tab value="feature-flags">Feature Flags</Tab>
										</TabList>
									</div>
									<TabPanel value="endpoints">
										<EndpointsTab
											plugins={plugins}
											filteredPlugins={filteredPlugins}
											searchTerm={searchTerm}
											onSearchChange={setSearchTerm}
											selectedGroupFilters={selectedGroupFilters}
											onToggleGroupFilter={toggleGroupFilter}
											onClearGroupFilters={clearGroupFilters}
											groups={groups}
											allGroups={allGroups}
											isMocked={isMocked}
											onToggleMocked={toggleEndpointSelection}
											onUpdateStatusCode={updateStatusCode}
											onAddToGroup={addToGroup}
											onRemoveFromGroup={removeFromGroup}
											getStatus={getStatus}
											getStatusCodes={getStatusCodes}
											endpointScenarios={endpointScenarios}
											onScenarioChange={handleScenarioChange}
											platform={platform}
										/>
									</TabPanel>
									<TabPanel value="groups">
										<GroupsTab
											groups={groups}
											autoGroups={autoGroups}
											plugins={plugins}
											newGroupName={newGroupName}
											onNewGroupNameChange={setNewGroupName}
											onCreateGroup={createGroup}
											editingGroup={editingGroup}
											onSetEditingGroup={setEditingGroup}
											onRenameGroup={renameGroup}
											onDeleteGroup={deleteGroup}
											onRemoveFromGroup={removeFromGroup}
										/>
									</TabPanel>
									<TabPanel value="settings">
										{/* Dynamic middleware settings UI */}
										<DynamicSettingsTab platform={platform} onSettingChange={updateMiddlewareSetting} />
									</TabPanel>
									<TabPanel value="feature-flags">
										<FeatureFlagsTab 
											featureFlags={featureFlags} 
											featureFlagMetadata={featureFlagMetadata}
											onToggleFeatureFlag={toggleFeatureFlag} 
										/>
									</TabPanel>
								</Tabs>
							</div>
						</div>
					)}
				</Dialog>
			</div>
		</>
	);
}
