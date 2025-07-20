/* eslint-disable no-console */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Button from './components/Button';
import Dialog from './components/Dialog';
import { Tabs, TabList, Tab, TabPanel } from './components/Tabs';
import { Settings, X } from './components/Icon';
import EndpointsTab from './components/EndpointsTab';
import GroupsTab from './components/GroupsTab';
import FeatureFlagsTab from './components/FeatureFlagsTab';
import { DynamicSettingsTab } from './components/DynamicSettingsTab';
import GlobalDisableBanner from './components/GlobalDisableBanner';
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
	const activeTabKey = `${platformName}.mockui.activeTab.v1`;
	const [isOpen, setIsOpen] = useState(false);
	const [groups, setGroups] = useState<Group[]>(() => loadGroups(groupKey));
	const [disabledPluginIds, setDisabledPluginIds] = useState<string[]>(() => {
		const ids = loadDisabledPluginIds(disabledKey);
		platform.setDisabledPluginIds(ids);
		return ids;
	});
	const [activeTab, setActiveTab] = useState<string>(() => {
		try {
			const storedTab = localStorage.getItem(activeTabKey);
			// Validate that the stored tab is one of the valid tab values
			const validTabs = ['endpoints', 'groups', 'settings', 'feature-flags'];
			if (storedTab && validTabs.includes(storedTab)) {
				return storedTab;
			}
			return 'endpoints';
		} catch {
			return 'endpoints';
		}
	});

	const [editingGroup, setEditingGroup] = useState<string | null>(null);
	const [selectedGroupFilters, setSelectedGroupFilters] = useState<string[]>([]);
	const [endpointScenarios, setEndpointScenarios] = useState<{ [key: string]: string }>(() => loadEndpointScenarios(endpointScenarioKey));

	// IMPORTANT: These React state variables mirror platform state to ensure React components
	// re-render when platform state changes. This prevents the need for forceUpdate() calls
	// which cause unnecessary re-renders and can interrupt user input (like typing in search fields).
	// When adding new platform state, always create a corresponding React state variable here.
	const [statusOverrides, setStatusOverrides] = useState<{ [key: string]: number }>({});
	const [delayOverrides, setDelayOverrides] = useState<{ [key: string]: number }>({});
	const [featureFlagOverrides, setFeatureFlagOverrides] = useState<{ [key: string]: boolean }>({});
	const [globalDisable, setGlobalDisable] = useState<boolean>(() => platform.isGloballyDisabled());

	// Store search term at MockUI level to prevent it from being reset when EndpointsTab remounts
	// This fixes the bug where search filters get reset when clicking status codes
	const [endpointsSearchTerm, setEndpointsSearchTerm] = useState('');

	const plugins: Plugin[] = useMemo(() => platform.getPlugins(), [platform]);
	const featureFlags = useMemo(() => {
		const platformFlags = platform.getFeatureFlags();
		return { ...platformFlags, ...featureFlagOverrides };
	}, [platform, featureFlagOverrides]);
	const featureFlagMetadata = useMemo(() => platform.getFeatureFlagMetadata(), [platform]);

	// Helper to get automatic groups from platform
	const autoGroups = useMemo(
		() =>
			platform.getComponentIds().map(cid => ({
				id: cid,
				name: cid,
				endpointIds: plugins.filter(p => p.componentId === cid).map(p => p.id),
				auto: true,
			})),
		[platform, plugins]
	);

	// Helper: get status override or default
	const getStatus = useCallback((plugin: Plugin) => statusOverrides[plugin.id] ?? plugin.defaultStatus, [statusOverrides]);

	// Helper: is endpoint mocked? Use React state instead of platform method to prevent re-renders
	const isMocked = useCallback((plugin: Plugin) => !disabledPluginIds.includes(plugin.id), [disabledPluginIds]);

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
	// Persist activeTab
	useEffect(() => {
		try {
			localStorage.setItem(activeTabKey, activeTab);
		} catch {
			// Ignore localStorage errors
		}
	}, [activeTab, activeTabKey]);

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
		},
		[platform]
	);

	// UI: update status code
	const updateStatusCode = useCallback(
		(pluginId: string, statusCode: number) => {
			platform.setStatusOverride(pluginId, statusCode);
			setStatusOverrides(prev => ({ ...prev, [pluginId]: statusCode }));
			onStateChange?.({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);

	// UI: update delay
	const updateDelay = useCallback(
		(pluginId: string, delay: number) => {
			platform.setDelayOverride(pluginId, delay);
			setDelayOverrides(prev => ({ ...prev, [pluginId]: delay }));
			onStateChange?.({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);

	// Helper: get delay for a plugin
	const getDelay = useCallback(
		(pluginId: string) => {
			return delayOverrides[pluginId] ?? platform.getEffectiveDelay(pluginId);
		},
		[platform, delayOverrides]
	);

	// UI: toggle feature flag
	const toggleFeatureFlag = useCallback(
		(flag: string, value: boolean) => {
			platform.setFeatureFlag(flag, value);
			setFeatureFlagOverrides(prev => ({ ...prev, [flag]: value }));
			onStateChange?.({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);

	// Group operations
	const createGroup = useCallback((name: string) => {
		const newGroup: Group = {
			id: Date.now().toString(),
			name: name,
			endpointIds: [],
		};
		setGroups(prev => [...prev, newGroup]);
	}, []);
	const deleteGroup = useCallback((groupId: string) => {
		setGroups(prev => prev.filter(g => g.id !== groupId));
	}, []);

	const renameGroup = useCallback((groupId: string, newName: string) => {
		setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, name: newName } : g)));
		setEditingGroup(null);
	}, []);

	const addToGroup = useCallback((pluginId: string, groupId: string) => {
		setGroups(prev =>
			prev.map(g => (g.id === groupId && !g.endpointIds.includes(pluginId) ? { ...g, endpointIds: [...g.endpointIds, pluginId] } : g))
		);
	}, []);

	const removeFromGroup = useCallback((pluginId: string, groupId: string) => {
		setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, endpointIds: g.endpointIds.filter(id => id !== pluginId) } : g)));
	}, []);
	const toggleGroupFilter = useCallback((groupId: string) => {
		setSelectedGroupFilters(prev => (prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]));
	}, []);

	const clearGroupFilters = useCallback(() => setSelectedGroupFilters([]), []);

	const handleSetEditingGroup = useCallback((groupId: string) => {
		setEditingGroup(groupId);
	}, []);

	// Helper: get statusCodes for a plugin
	const getStatusCodes = useCallback((plugin: Plugin) => {
		const statusCodes = Object.keys(plugin.responses).map(Number);
		// Always include 503 Service Unavailable as it's available for free on all endpoints
		if (!statusCodes.includes(503)) {
			statusCodes.push(503);
		}
		return statusCodes.sort((a, b) => a - b);
	}, []);

	const allGroups = useMemo(() => [...autoGroups, ...groups], [autoGroups, groups]);

	// Scenario change handler
	const handleScenarioChange = useCallback(
		(pluginId: string, scenarioId: string) => {
			setEndpointScenarios(prev => ({ ...prev, [pluginId]: scenarioId }));
			platform.setEndpointScenario(pluginId, scenarioId);
		},
		[platform]
	);

	// UI: update middleware setting
	const updateMiddlewareSetting = useCallback(
		(key: string, value: any) => {
			platform.setMiddlewareSetting(key, value);
			onStateChange?.({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);

	// UI: handle global disable change
	const handleGlobalDisableChange = useCallback(() => {
		const newGlobalDisable = platform.isGloballyDisabled();
		setGlobalDisable(newGlobalDisable);
		onStateChange?.({ disabledPluginIds });
	}, [platform, onStateChange, disabledPluginIds]);

	// UI: enable all endpoints
	const handleEnableAll = useCallback(() => {
		// Clear disabled plugin IDs and global disable
		setDisabledPluginIds([]);
		platform.setDisabledPluginIds([]);
		platform.setGlobalDisable(false);
		setGlobalDisable(false);
		saveDisabledPluginIds([], disabledKey);
		onStateChange?.({ disabledPluginIds: [] });
	}, [platform, disabledKey, onStateChange]);

	// UI: handle search term change (wrapped in useCallback to prevent typing interruption)
	const handleSearchTermChange = useCallback((searchTerm: string) => {
		setEndpointsSearchTerm(searchTerm);
	}, []);

	// Keyboard shortcuts: Ctrl+M to toggle MockUI visibility, Escape to close
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.key.toLowerCase() === 'm') {
				event.preventDefault();
				setIsOpen(prev => !prev);
			} else if (event.key === 'Escape') {
				event.preventDefault();
				setIsOpen(prev => (prev ? false : prev)); // Only close if currently open
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, []);

	// Shared MockUI content (memoized to prevent component recreation)
	const MockUIContent = useMemo(
		() => (
			<Tabs value={activeTab} onValueChange={setActiveTab}>
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
					isGloballyDisabled={globalDisable}
					disabledCount={disabledPluginIds.length}
					totalCount={plugins.length}
					onEnableAll={handleEnableAll}
				/>
				<TabPanel key="endpoints-panel" value="endpoints">
					<EndpointsTab
						key="endpoints-tab"
						plugins={plugins}
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
						searchTerm={endpointsSearchTerm}
						onSearchTermChange={handleSearchTermChange}
					/>
				</TabPanel>
				<TabPanel value="groups">
					<GroupsTab
						groups={groups}
						autoGroups={autoGroups}
						plugins={plugins}
						onCreateGroup={createGroup}
						editingGroup={editingGroup}
						onSetEditingGroup={handleSetEditingGroup}
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
						globalDisable={globalDisable}
					/>
				</TabPanel>
				<TabPanel value="feature-flags">
					<FeatureFlagsTab featureFlags={featureFlags} featureFlagMetadata={featureFlagMetadata} onToggleFeatureFlag={toggleFeatureFlag} />
				</TabPanel>
			</Tabs>
		),
		[
			activeTab,
			setActiveTab,
			platform,
			disabledPluginIds,
			plugins,
			globalDisable,
			handleEnableAll,
			selectedGroupFilters,
			toggleGroupFilter,
			clearGroupFilters,
			groups,
			allGroups,
			isMocked,
			toggleEndpointSelection,
			updateStatusCode,
			updateDelay,
			getDelay,
			addToGroup,
			removeFromGroup,
			getStatus,
			getStatusCodes,
			endpointScenarios,
			handleScenarioChange,
			endpointsSearchTerm,
			handleSearchTermChange,
			autoGroups,
			createGroup,
			editingGroup,
			handleSetEditingGroup,
			renameGroup,
			deleteGroup,
			updateMiddlewareSetting,
			handleGlobalDisableChange,
			featureFlags,
			featureFlagMetadata,
			toggleFeatureFlag,
		]
	);

	// Render as modal dialog
	return (
		<>
			{/* Floating Button */}
			<div
				style={{
					position: 'fixed',
					bottom: 24,
					right: 24,
					zIndex: 1000,
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
						<div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>{MockUIContent}</div>
					</div>
				)}
			</Dialog>
		</>
	);
}
