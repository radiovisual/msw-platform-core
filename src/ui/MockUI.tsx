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
import GlobalDisableBanner from './components/GlobalDisableBanner';
import Portal from './utils/Portal';
import type { MockPlatformCore } from '../classes/MockPlatformCore';
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
	usePopupWindow?: boolean;
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

export default function MockUI({
	platform,
	onStateChange,
	groupStorageKey,
	disabledPluginIdsStorageKey,
	usePopupWindow = false,
}: MockUIProps) {
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

	// UI: update delay
	const updateDelay = useCallback(
		(pluginId: string, delay: number) => {
			platform.setDelayOverride(pluginId, delay);
			forceUpdate(x => x + 1);
			onStateChange?.({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);

	// Helper: get delay for a plugin
	const getDelay = useCallback(
		(pluginId: string) => {
			return platform.getEffectiveDelay(pluginId);
		},
		[platform]
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
		const statusCodes = Object.keys(plugin.responses).map(Number);
		// Always include 503 Service Unavailable as it's available for free on all endpoints
		if (!statusCodes.includes(503)) {
			statusCodes.push(503);
		}
		return statusCodes.sort((a, b) => a - b);
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

	// UI: handle global disable change
	const handleGlobalDisableChange = useCallback(() => {
		forceUpdate(x => x + 1);
		onStateChange?.({ disabledPluginIds });
	}, [onStateChange, disabledPluginIds]);

	// UI: enable all endpoints
	const handleEnableAll = useCallback(() => {
		// Clear disabled plugin IDs and global disable
		setDisabledPluginIds([]);
		platform.setDisabledPluginIds([]);
		platform.setGlobalDisable(false);
		saveDisabledPluginIds([], disabledKey);
		forceUpdate(x => x + 1);
		onStateChange?.({ disabledPluginIds: [] });
	}, [platform, disabledKey, onStateChange]);

	// Keyboard shortcuts: Ctrl+M to toggle MockUI visibility, Escape to close (if not popup mode)
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.key.toLowerCase() === 'm') {
				event.preventDefault();
				setIsOpen(prev => !prev);
			} else if (event.key === 'Escape' && !usePopupWindow) {
				event.preventDefault();
				setIsOpen(prev => (prev ? false : prev)); // Only close if currently open
			}
			// Note: In popup mode, Escape key is handled within the popup window itself
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [usePopupWindow]);

	// Shared MockUI content
	const MockUIContent = () => (
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
			{/* Global Disable Banner - Inside Dialog */}
			<GlobalDisableBanner
				isGloballyDisabled={platform.isGloballyDisabled()}
				disabledCount={disabledPluginIds.length}
				totalCount={plugins.length}
				onEnableAll={handleEnableAll}
			/>
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
					onUpdateDelay={updateDelay}
					getDelay={getDelay}
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
				<DynamicSettingsTab
					platform={platform}
					onSettingChange={updateMiddlewareSetting}
					onGlobalDisableChange={handleGlobalDisableChange}
				/>
			</TabPanel>
			<TabPanel value="feature-flags">
				<FeatureFlagsTab featureFlags={featureFlags} featureFlagMetadata={featureFlagMetadata} onToggleFeatureFlag={toggleFeatureFlag} />
			</TabPanel>
		</Tabs>
	);

	// Popup mode: render as fullscreen overlay
	if (usePopupWindow) {
		return (
			<Portal>
				{/* Floating Button */}
				<div
					style={{
						position: 'fixed',
						bottom: 24,
						right: 24,
						zIndex: 2147483647, // Maximum z-index value
					}}
				>
					<Button
						onClick={() => setIsOpen(prev => !prev)}
						style={{
							borderRadius: '50%',
							height: 56,
							width: 56,
							boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							border: '1px solid #ccc',
							backgroundColor: isOpen ? '#3b82f6' : 'white',
							color: isOpen ? 'white' : '#374151',
						}}
						data-testid="open-settings"
						title={isOpen ? 'Close MockUI (Ctrl+M)' : 'Open MockUI (Ctrl+M)'}
					>
						<Settings style={{ height: 24, width: 24 }} />
					</Button>
				</div>

				{/* Fullscreen overlay when open */}
				{isOpen && (
					<div
						style={{
							position: 'fixed',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							zIndex: 2147483646, // Just below the button
							background: 'rgba(0, 0, 0, 0.5)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							padding: '20px',
						}}
						onClick={e => {
							// Close when clicking backdrop
							if (e.target === e.currentTarget) {
								setIsOpen(false);
							}
						}}
					>
						<div
							style={{
								width: '95vw',
								height: '95vh',
								maxWidth: 1200,
								maxHeight: 900,
								background: '#fff',
								borderRadius: 12,
								boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
								border: '1px solid #eee',
								display: 'flex',
								flexDirection: 'column',
								padding: 0,
								overflow: 'hidden',
							}}
							onClick={e => e.stopPropagation()}
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
								<MockUIContent />
							</div>
						</div>
					</div>
				)}
			</Portal>
		);
	}

	// Normal mode: render as modal dialog
	return (
		<Portal>
			{/* Floating Button */}
			<div
				style={{
					position: 'fixed',
					bottom: 24,
					right: 24,
					zIndex: 1, // Relative to the Portal's stacking context
				}}
			>
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
			</div>
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
							<MockUIContent />
						</div>
					</div>
				)}
			</Dialog>
		</Portal>
	);
}
