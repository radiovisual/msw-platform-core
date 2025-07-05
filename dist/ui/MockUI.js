'use strict';
var __importDefault =
	(this && this.__importDefault) ||
	function (mod) {
		return mod && mod.__esModule ? mod : { default: mod };
	};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = MockUI;
const jsx_runtime_1 = require('react/jsx-runtime');
const react_1 = require('react');
const Button_1 = __importDefault(require('./components/Button'));
const Checkbox_1 = __importDefault(require('./components/Checkbox'));
const Radio_1 = __importDefault(require('./components/Radio'));
const Dialog_1 = __importDefault(require('./components/Dialog'));
const Tabs_1 = require('./components/Tabs');
const Popover_1 = __importDefault(require('./components/Popover'));
const Label_1 = __importDefault(require('./components/Label'));
const lucide_react_1 = require('lucide-react');
function loadGroups(storageKey) {
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) return [];
		return JSON.parse(raw);
	} catch (_a) {
		return [];
	}
}
function saveGroups(groups, storageKey) {
	localStorage.setItem(storageKey, JSON.stringify(groups));
}
function loadDisabledPluginIds(storageKey) {
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) return [];
		return JSON.parse(raw);
	} catch (_a) {
		return [];
	}
}
function saveDisabledPluginIds(ids, storageKey) {
	localStorage.setItem(storageKey, JSON.stringify(ids));
}
// Add scenario persistence helpers
function loadEndpointScenarios(storageKey) {
	try {
		const raw = localStorage.getItem(storageKey);
		if (!raw) return {};
		return JSON.parse(raw);
	} catch (_a) {
		return {};
	}
}
function saveEndpointScenarios(map, storageKey) {
	localStorage.setItem(storageKey, JSON.stringify(map));
}
function MockUI({ platform, onStateChange, groupStorageKey, disabledPluginIdsStorageKey }) {
	const platformName = platform.getName();
	if (!platformName) {
		throw new Error('Platform name is required for MockUI localStorage namespacing. Received platform: ' + JSON.stringify(platform));
	}
	const groupKey = groupStorageKey || `${platformName}.mockui.groups.v1`;
	const disabledKey = disabledPluginIdsStorageKey || `${platformName}.mockui.disabledPluginIds.v1`;
	const endpointScenarioKey = `${platformName}.mockui.endpointScenarios.v1`;
	const [isOpen, setIsOpen] = (0, react_1.useState)(false);
	const [groups, setGroups] = (0, react_1.useState)(() => loadGroups(groupKey));
	const [disabledPluginIds, setDisabledPluginIds] = (0, react_1.useState)(() => {
		const ids = loadDisabledPluginIds(disabledKey);
		platform.setDisabledPluginIds(ids);
		return ids;
	});
	const [newGroupName, setNewGroupName] = (0, react_1.useState)('');
	const [editingGroup, setEditingGroup] = (0, react_1.useState)(null);
	const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
	const [selectedGroupFilters, setSelectedGroupFilters] = (0, react_1.useState)([]);
	const [, forceUpdate] = (0, react_1.useState)(0);
	const [endpointScenarios, setEndpointScenarios] = (0, react_1.useState)(() => loadEndpointScenarios(endpointScenarioKey));
	const plugins = platform.getPlugins();
	const featureFlags = platform.getFeatureFlags();
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
	const getStatus = plugin => {
		var _a;
		return (_a = platform.getStatusOverride(plugin.id)) !== null && _a !== void 0 ? _a : plugin.defaultStatus;
	};
	// Helper: is endpoint mocked?
	const isMocked = plugin => !platform.getDisabledPluginIds().includes(plugin.id);
	// Persist groups and disabledPluginIds
	(0, react_1.useEffect)(() => {
		saveGroups(groups, groupKey);
	}, [groups, groupKey]);
	(0, react_1.useEffect)(() => {
		saveDisabledPluginIds(disabledPluginIds, disabledKey);
	}, [disabledPluginIds, disabledKey]);
	// Persist endpointScenarios
	(0, react_1.useEffect)(() => {
		saveEndpointScenarios(endpointScenarios, endpointScenarioKey);
	}, [endpointScenarios, endpointScenarioKey]);
	// Notify parent/MSW adapter on state change
	(0, react_1.useEffect)(() => {
		onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange({ disabledPluginIds });
	}, [disabledPluginIds, onStateChange]);
	// UI: toggle endpoint mocked/passthrough
	const toggleEndpointSelection = (0, react_1.useCallback)(
		pluginId => {
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
	const updateStatusCode = (0, react_1.useCallback)(
		(pluginId, statusCode) => {
			platform.setStatusOverride(pluginId, statusCode);
			forceUpdate(x => x + 1);
			onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);
	// UI: toggle feature flag
	const toggleFeatureFlag = (0, react_1.useCallback)(
		(flag, value) => {
			platform.setFeatureFlag(flag, value);
			forceUpdate(x => x + 1);
			onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange({ disabledPluginIds });
		},
		[platform, onStateChange, disabledPluginIds]
	);
	// Group operations
	const createGroup = () => {
		if (newGroupName.trim()) {
			const newGroup = {
				id: Date.now().toString(),
				name: newGroupName.trim(),
				endpointIds: [],
			};
			setGroups(prev => [...prev, newGroup]);
			setNewGroupName('');
		}
	};
	const deleteGroup = groupId => {
		setGroups(prev => prev.filter(g => g.id !== groupId));
	};
	const renameGroup = (groupId, newName) => {
		setGroups(prev => prev.map(g => (g.id === groupId ? Object.assign(Object.assign({}, g), { name: newName }) : g)));
		setEditingGroup(null);
	};
	const addToGroup = (pluginId, groupId) => {
		setGroups(prev =>
			prev.map(g =>
				g.id === groupId && !g.endpointIds.includes(pluginId)
					? Object.assign(Object.assign({}, g), { endpointIds: [...g.endpointIds, pluginId] })
					: g
			)
		);
	};
	const removeFromGroup = (pluginId, groupId) => {
		setGroups(prev =>
			prev.map(g =>
				g.id === groupId ? Object.assign(Object.assign({}, g), { endpointIds: g.endpointIds.filter(id => id !== pluginId) }) : g
			)
		);
	};
	const toggleGroupFilter = groupId => {
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
	const getStatusCodes = plugin => {
		return Object.keys(plugin.responses).map(Number);
	};
	const allGroups = [...autoGroups, ...groups];
	// UI rendering (fix event typing)
	const EndpointRow = ({ plugin }) => {
		// Scenario dropdown
		const scenarioList = plugin.scenarios;
		const activeScenarioId = endpointScenarios[plugin.id] || platform.getEndpointScenario(plugin.id);
		const handleScenarioChange = e => {
			const scenarioId = e.target.value;
			// Debug: log event target value and scenarioId
			// eslint-disable-next-line no-console
			console.log('[handleScenarioChange] event.target.value:', e.target.value, 'scenarioId:', scenarioId);
			// Debug: log platform and persistence instance
			// eslint-disable-next-line no-console
			console.log('[handleScenarioChange] platform:', platform, 'persistence:', platform.persistence, 'scenarioId:', scenarioId);
			setEndpointScenarios(prev => Object.assign(Object.assign({}, prev), { [plugin.id]: scenarioId }));
			platform.setEndpointScenario(plugin.id, scenarioId);
			forceUpdate(x => x + 1);
		};
		return (0, jsx_runtime_1.jsxs)('div', {
			style: {
				border: '1px solid #eee',
				borderRadius: 8,
				padding: 16,
				marginBottom: 12,
				background: isMocked(plugin) ? '#f6fff6' : '#fff6f6',
			},
			children: [
				(0, jsx_runtime_1.jsxs)('div', {
					style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
					children: [
						(0, jsx_runtime_1.jsxs)('div', {
							style: { display: 'flex', alignItems: 'center', gap: 12 },
							children: [
								(0, jsx_runtime_1.jsxs)('div', {
									style: { display: 'flex', alignItems: 'center', gap: 6 },
									children: [
										(0, jsx_runtime_1.jsx)(Checkbox_1.default, {
											checked: isMocked(plugin),
											onChange: () => toggleEndpointSelection(plugin.id),
											id: `mocked-${plugin.id}`,
											'aria-label': `Toggle endpoint ${plugin.endpoint}`,
										}),
										(0, jsx_runtime_1.jsx)(Label_1.default, { htmlFor: `mocked-${plugin.id}`, children: 'mocked?' }),
									],
								}),
								(0, jsx_runtime_1.jsx)('span', {
									style: { padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#e6f7ff', color: '#0070f3' },
									children: plugin.method,
								}),
								(0, jsx_runtime_1.jsx)('span', { style: { fontFamily: 'monospace', fontSize: 14 }, children: plugin.endpoint }),
								(0, jsx_runtime_1.jsxs)('div', {
									style: { display: 'flex', flexWrap: 'wrap', gap: 4 },
									children: [
										(0, jsx_runtime_1.jsx)('span', {
											style: {
												border: '1px solid #eee',
												padding: '0 4px',
												borderRadius: 4,
												fontSize: 12,
												background: '#f0f0f0',
												opacity: 0.7,
											},
											children: plugin.componentId,
										}),
										groups
											.filter(group => group.endpointIds.includes(plugin.id))
											.map(group =>
												(0, jsx_runtime_1.jsx)(
													'span',
													{ style: { border: '1px solid #eee', padding: '0 4px', borderRadius: 4, fontSize: 12 }, children: group.name },
													group.id
												)
											),
										scenarioList &&
											scenarioList.length > 0 &&
											(0, jsx_runtime_1.jsxs)('select', {
												value: activeScenarioId || '',
												onChange: handleScenarioChange,
												style: { marginLeft: 8, borderRadius: 4, padding: '2px 8px', fontSize: 12 },
												children: [
													(0, jsx_runtime_1.jsx)('option', { value: '', children: 'Default' }),
													scenarioList.map(scenario =>
														(0, jsx_runtime_1.jsx)('option', { value: scenario.id, children: scenario.label }, scenario.id)
													),
												],
											}),
									],
								}),
							],
						}),
						(0, jsx_runtime_1.jsx)('div', {
							style: { display: 'flex', alignItems: 'center', gap: 0, marginLeft: 'auto' },
							children: (0, jsx_runtime_1.jsxs)('div', {
								style: { position: 'relative', display: 'flex', alignItems: 'center' },
								children: [
									(0, jsx_runtime_1.jsx)(Popover_1.default, {
										placement: 'right',
										trigger: (0, jsx_runtime_1.jsx)(Button_1.default, {
											style: {
												border: 'none',
												background: 'none',
												cursor: 'pointer',
												padding: 2,
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: 16,
											},
											title: 'Add to group',
											'aria-label': 'Add to group',
											'data-testid': `add-to-group-${plugin.id}`,
											children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { style: { width: 16, height: 16 } }),
										}),
										children: close =>
											(0, jsx_runtime_1.jsxs)('div', {
												style: {
													minWidth: 180,
													maxWidth: '90vw',
													left: 'auto',
													right: 0,
													padding: 8,
													position: 'absolute',
													top: '100%',
													zIndex: 1000,
													background: '#fff',
													boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
													borderRadius: 6,
												},
												children: [
													(0, jsx_runtime_1.jsx)('div', {
														style: { fontWeight: 600, fontSize: 13, marginBottom: 6 },
														children: 'Add to Groups',
													}),
													groups.length === 0 &&
														(0, jsx_runtime_1.jsx)('div', { style: { color: '#888', fontSize: 12 }, children: 'No groups yet' }),
													groups.map(group => {
														const checked = group.endpointIds.includes(plugin.id);
														return (0, jsx_runtime_1.jsxs)(
															'div',
															{
																style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
																children: [
																	(0, jsx_runtime_1.jsx)(Checkbox_1.default, {
																		id: `addtogroup-${plugin.id}-${group.id}`,
																		checked: checked,
																		onChange: () => {
																			if (checked) removeFromGroup(plugin.id, group.id);
																			else addToGroup(plugin.id, group.id);
																		},
																		'aria-label': `Add ${plugin.endpoint} to group ${group.name}`,
																	}),
																	(0, jsx_runtime_1.jsx)(Label_1.default, {
																		htmlFor: `addtogroup-${plugin.id}-${group.id}`,
																		children: group.name,
																	}),
																],
															},
															group.id
														);
													}),
												],
											}),
									}),
									plugin.swaggerUrl &&
										(0, jsx_runtime_1.jsx)('button', {
											style: {
												border: 'none',
												background: 'none',
												cursor: 'pointer',
												marginLeft: 4,
												padding: 2,
												display: 'inline-flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: 16,
											},
											title: 'Open swagger file',
											'aria-label': 'Open swagger file',
											onClick: e => {
												e.stopPropagation();
												window.open(plugin.swaggerUrl, '_blank', 'noopener,noreferrer');
											},
											'data-testid': `open-swagger-${plugin.id}`,
											children: (0, jsx_runtime_1.jsx)(lucide_react_1.FileText, { style: { width: 16, height: 16 } }),
										}),
								],
							}),
						}),
					],
				}),
				(0, jsx_runtime_1.jsx)('div', {
					style: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 },
					children: getStatusCodes(plugin).map(code =>
						(0, jsx_runtime_1.jsxs)(
							'div',
							{
								style: { display: 'flex', alignItems: 'center', gap: 4 },
								children: [
									(0, jsx_runtime_1.jsx)(Radio_1.default, {
										name: `status-${plugin.id}`,
										value: code,
										checked: getStatus(plugin) === code,
										onChange: () => updateStatusCode(plugin.id, code),
										id: `${plugin.id}-${code}`,
									}),
									(0, jsx_runtime_1.jsx)(Label_1.default, { htmlFor: `${plugin.id}-${code}`, children: code }),
								],
							},
							code
						)
					),
				}),
				!isMocked(plugin) &&
					(0, jsx_runtime_1.jsx)('p', {
						style: { fontSize: 12, color: '#888', fontStyle: 'italic' },
						children: 'endpoint will passthrough (not mocked)',
					}),
			],
		});
	};
	return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, {
		children: (0, jsx_runtime_1.jsxs)('div', {
			style: { position: 'fixed', bottom: 24, right: 24, zIndex: 50 },
			children: [
				(0, jsx_runtime_1.jsx)(Button_1.default, {
					onClick: () => setIsOpen(true),
					style: {
						borderRadius: '50%',
						height: 56,
						width: 56,
						boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						border: '1px solid #ccc',
					},
					'data-testid': 'open-settings',
					children: (0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { style: { height: 24, width: 24 } }),
				}),
				(0, jsx_runtime_1.jsx)(Dialog_1.default, {
					open: isOpen,
					onOpenChange: setIsOpen,
					children:
						isOpen &&
						(0, jsx_runtime_1.jsxs)('div', {
							style: {
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
							},
							children: [
								(0, jsx_runtime_1.jsxs)('div', {
									style: {
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: '16px 24px',
										borderBottom: '1px solid #eee',
										flex: '0 0 auto',
									},
									children: [
										(0, jsx_runtime_1.jsx)('h2', { style: { fontSize: 22, fontWeight: 600, margin: 0 }, children: 'Endpoint Manager' }),
										(0, jsx_runtime_1.jsx)(Button_1.default, {
											style: { padding: 8 },
											onClick: () => setIsOpen(false),
											'data-testid': 'close-dialog',
											children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { style: { height: 16, width: 16 } }),
										}),
									],
								}),
								(0, jsx_runtime_1.jsx)('div', {
									style: { flex: 1, minHeight: 0, overflowY: 'auto' },
									children: (0, jsx_runtime_1.jsxs)(Tabs_1.Tabs, {
										defaultValue: 'endpoints',
										children: [
											(0, jsx_runtime_1.jsx)('div', {
												style: {
													position: 'sticky',
													top: 0,
													zIndex: 2,
													background: '#fff',
													borderBottom: '1px solid #eee',
												},
												children: (0, jsx_runtime_1.jsxs)(Tabs_1.TabList, {
													children: [
														(0, jsx_runtime_1.jsx)(Tabs_1.Tab, { value: 'endpoints', children: 'Endpoints' }),
														(0, jsx_runtime_1.jsx)(Tabs_1.Tab, { value: 'groups', children: 'Groups' }),
														(0, jsx_runtime_1.jsx)(Tabs_1.Tab, { value: 'feature-flags', children: 'Feature Flags' }),
														(0, jsx_runtime_1.jsx)(Tabs_1.Tab, { value: 'settings', children: 'Settings' }),
													],
												}),
											}),
											(0, jsx_runtime_1.jsxs)(Tabs_1.TabPanel, {
												value: 'endpoints',
												children: [
													(0, jsx_runtime_1.jsxs)('div', {
														style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
														children: [
															(0, jsx_runtime_1.jsx)('h3', { style: { fontSize: 18, fontWeight: 500 }, children: 'All Endpoints' }),
															(0, jsx_runtime_1.jsxs)('span', {
																style: { borderRadius: 6, padding: '4px 8px', fontSize: 12, background: '#e0f2fe', color: '#0070f3' },
																children: [plugins.filter(ep => isMocked(ep)).length, ' selected'],
															}),
														],
													}),
													(0, jsx_runtime_1.jsxs)('div', {
														style: { display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 },
														children: [
															(0, jsx_runtime_1.jsx)('input', {
																placeholder: 'Search endpoints...',
																value: searchTerm,
																onChange: e => setSearchTerm(e.currentTarget.value),
																style: { flex: 1, borderRadius: 6, padding: '8px 12px', border: '1px solid #ccc' },
															}),
															(0, jsx_runtime_1.jsx)(Popover_1.default, {
																trigger: (0, jsx_runtime_1.jsxs)(Button_1.default, {
																	style: {
																		borderRadius: 6,
																		padding: '8px 12px',
																		display: 'flex',
																		alignItems: 'center',
																		gap: 4,
																		background: '#fff',
																		border: '1px solid #ccc',
																	},
																	children: [
																		selectedGroupFilters.length === 0
																			? 'Filter by groups'
																			: `${selectedGroupFilters.length} group${selectedGroupFilters.length > 1 ? 's' : ''} selected`,
																		(0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { style: { height: 16, width: 16 } }),
																	],
																}),
																children: close =>
																	(0, jsx_runtime_1.jsx)('div', {
																		style: {
																			width: 200,
																			padding: 8,
																			background: '#fff',
																			borderRadius: 6,
																			boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
																		},
																		children: (0, jsx_runtime_1.jsxs)('div', {
																			style: { display: 'flex', flexDirection: 'column', gap: 4 },
																			children: [
																				(0, jsx_runtime_1.jsx)('button', {
																					style: {
																						width: '100%',
																						textAlign: 'left',
																						fontSize: 12,
																						padding: '4px 8px',
																						borderRadius: 4,
																						cursor: 'pointer',
																						background: '#f0f0f0',
																					},
																					onClick: () => {
																						clearGroupFilters();
																						close();
																					},
																					children: 'All Groups',
																				}),
																				allGroups.map(group =>
																					(0, jsx_runtime_1.jsxs)(
																						'div',
																						{
																							style: { display: 'flex', alignItems: 'center', gap: 8 },
																							children: [
																								(0, jsx_runtime_1.jsx)(Checkbox_1.default, {
																									id: `filter-${group.id}`,
																									checked: selectedGroupFilters.includes(group.id),
																									onChange: () => {
																										toggleGroupFilter(group.id);
																										close();
																									},
																									'aria-label': `Filter by group ${group.name}`,
																								}),
																								(0, jsx_runtime_1.jsx)(Label_1.default, {
																									htmlFor: `filter-${group.id}`,
																									style: { fontSize: 14, flex: 1 },
																									children: group.name,
																								}),
																							],
																						},
																						group.id
																					)
																				),
																			],
																		}),
																	}),
															}),
														],
													}),
													selectedGroupFilters.length > 0 &&
														(0, jsx_runtime_1.jsx)('div', {
															style: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 },
															children: selectedGroupFilters.map(groupId => {
																const group = groups.find(g => g.id === groupId);
																return group
																	? (0, jsx_runtime_1.jsxs)(
																			'span',
																			{
																				style: {
																					border: '1px solid #eee',
																					padding: '4px 8px',
																					borderRadius: 6,
																					display: 'flex',
																					alignItems: 'center',
																					gap: 4,
																					fontSize: 12,
																				},
																				children: [
																					group.name,
																					(0, jsx_runtime_1.jsx)(lucide_react_1.X, {
																						style: { height: 12, width: 12, cursor: 'pointer' },
																						onClick: () => toggleGroupFilter(groupId),
																					}),
																				],
																			},
																			groupId
																	  )
																	: null;
															}),
														}),
													(0, jsx_runtime_1.jsxs)('div', {
														style: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 },
														children: [
															filteredPlugins.map(plugin => (0, jsx_runtime_1.jsx)(EndpointRow, { plugin: plugin }, plugin.id)),
															filteredPlugins.length === 0 &&
																(0, jsx_runtime_1.jsx)('div', {
																	style: { textAlign: 'center', padding: '32px 0', color: '#888' },
																	children: 'No endpoints match your current filters.',
																}),
														],
													}),
												],
											}),
											(0, jsx_runtime_1.jsxs)(Tabs_1.TabPanel, {
												value: 'groups',
												children: [
													(0, jsx_runtime_1.jsxs)('div', {
														style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
														children: [
															(0, jsx_runtime_1.jsx)('h3', { style: { fontSize: 18, fontWeight: 500 }, children: 'Groups' }),
															(0, jsx_runtime_1.jsxs)('div', {
																style: { display: 'flex', alignItems: 'center', gap: 8 },
																children: [
																	(0, jsx_runtime_1.jsx)('input', {
																		placeholder: 'New group name',
																		value: newGroupName,
																		onChange: e => setNewGroupName(e.currentTarget.value),
																		style: { width: 160, borderRadius: 6, padding: '8px 12px', border: '1px solid #ccc' },
																		onKeyDown: e => e.key === 'Enter' && createGroup(),
																	}),
																	(0, jsx_runtime_1.jsx)(Button_1.default, {
																		onClick: createGroup,
																		style: { padding: '8px 12px', borderRadius: 6, background: '#fff', border: '1px solid #ccc' },
																		children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { style: { height: 16, width: 16 } }),
																	}),
																],
															}),
														],
													}),
													(0, jsx_runtime_1.jsxs)('div', {
														style: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 },
														children: [
															autoGroups.map(group =>
																(0, jsx_runtime_1.jsxs)(
																	'div',
																	{
																		style: { border: '1px solid #eee', borderRadius: 8, padding: 16, background: '#f8f8f8', opacity: 0.7 },
																		children: [
																			(0, jsx_runtime_1.jsxs)('div', {
																				style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
																				children: [
																					(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { style: { height: 16, width: 16 } }),
																					(0, jsx_runtime_1.jsx)('span', { children: group.name }),
																					(0, jsx_runtime_1.jsx)('span', {
																						style: { borderRadius: 6, padding: '4px 8px', fontSize: 12, background: '#f0f0f0' },
																						children: plugins.filter(p => p.componentId === group.name).length,
																					}),
																				],
																			}),
																			(0, jsx_runtime_1.jsxs)('div', {
																				style: { display: 'flex', flexDirection: 'column', gap: 12 },
																				children: [
																					plugins
																						.filter(p => p.componentId === group.name)
																						.map(plugin =>
																							(0, jsx_runtime_1.jsxs)(
																								'div',
																								{
																									style: {
																										display: 'flex',
																										justifyContent: 'space-between',
																										padding: 12,
																										borderRadius: 6,
																										border: '1px solid #eee',
																									},
																									children: [
																										(0, jsx_runtime_1.jsx)('span', {
																											style: {
																												padding: '4px 8px',
																												borderRadius: 4,
																												fontSize: 12,
																												fontWeight: 600,
																												background: '#e6f7ff',
																												color: '#0070f3',
																											},
																											children: plugin.method,
																										}),
																										(0, jsx_runtime_1.jsx)('span', {
																											style: { fontFamily: 'monospace', fontSize: 14 },
																											children: plugin.endpoint,
																										}),
																									],
																								},
																								plugin.id
																							)
																						),
																					plugins.filter(p => p.componentId === group.name).length === 0 &&
																						(0, jsx_runtime_1.jsx)('div', {
																							style: { textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#888' },
																							children: 'No endpoints in this group yet.',
																						}),
																				],
																			}),
																		],
																	},
																	group.id
																)
															),
															groups.map(group =>
																(0, jsx_runtime_1.jsxs)(
																	'div',
																	{
																		style: { border: '1px solid #eee', borderRadius: 8, padding: 16 },
																		children: [
																			(0, jsx_runtime_1.jsxs)('div', {
																				style: {
																					display: 'flex',
																					justifyContent: 'space-between',
																					paddingBottom: 12,
																					borderBottom: '1px solid #eee',
																				},
																				children: [
																					editingGroup === group.id
																						? (0, jsx_runtime_1.jsx)('input', {
																								defaultValue: group.name,
																								onBlur: e => renameGroup(group.id, e.currentTarget.value),
																								onKeyDown: e => {
																									if (e.key === 'Enter') {
																										renameGroup(group.id, e.currentTarget.value);
																									}
																								},
																								style: { width: 192, borderRadius: 6, padding: '8px 12px', border: '1px solid #ccc' },
																								autoFocus: true,
																						  })
																						: (0, jsx_runtime_1.jsxs)('div', {
																								style: { display: 'flex', alignItems: 'center', gap: 8 },
																								children: [
																									(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { style: { height: 16, width: 16 } }),
																									(0, jsx_runtime_1.jsx)('span', { children: group.name }),
																									(0, jsx_runtime_1.jsx)('span', {
																										style: { borderRadius: 6, padding: '4px 8px', fontSize: 12, background: '#f0f0f0' },
																										children: group.endpointIds.length,
																									}),
																								],
																						  }),
																					(0, jsx_runtime_1.jsxs)('div', {
																						style: { display: 'flex', alignItems: 'center', gap: 8 },
																						children: [
																							(0, jsx_runtime_1.jsx)(Button_1.default, {
																								onClick: () => setEditingGroup(group.id),
																								style: {
																									padding: '8px 12px',
																									borderRadius: 6,
																									background: '#fff',
																									border: '1px solid #ccc',
																								},
																								'aria-label': 'edit',
																								children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, {
																									style: { height: 16, width: 16 },
																								}),
																							}),
																							(0, jsx_runtime_1.jsx)(Button_1.default, {
																								onClick: () => deleteGroup(group.id),
																								style: {
																									padding: '8px 12px',
																									borderRadius: 6,
																									background: '#fff',
																									border: '1px solid #ccc',
																									color: '#e53e3e',
																									cursor: 'pointer',
																								},
																								'aria-label': 'trash',
																								children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, {
																									style: { height: 16, width: 16 },
																								}),
																							}),
																						],
																					}),
																				],
																			}),
																			(0, jsx_runtime_1.jsxs)('div', {
																				style: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 },
																				children: [
																					group.endpointIds.map(pluginId => {
																						const plugin = plugins.find(ep => ep.id === pluginId);
																						if (!plugin) return null;
																						return (0, jsx_runtime_1.jsxs)(
																							'div',
																							{
																								style: {
																									display: 'flex',
																									justifyContent: 'space-between',
																									padding: 12,
																									borderRadius: 6,
																									border: '1px solid #eee',
																								},
																								children: [
																									(0, jsx_runtime_1.jsx)('span', {
																										style: {
																											padding: '4px 8px',
																											borderRadius: 4,
																											fontSize: 12,
																											fontWeight: 600,
																											background: '#e6f7ff',
																											color: '#0070f3',
																										},
																										children: plugin.method,
																									}),
																									(0, jsx_runtime_1.jsx)('span', {
																										style: { fontFamily: 'monospace', fontSize: 14 },
																										children: plugin.endpoint,
																									}),
																									(0, jsx_runtime_1.jsx)(Button_1.default, {
																										onClick: () => removeFromGroup(pluginId, group.id),
																										style: {
																											padding: '8px 12px',
																											borderRadius: 6,
																											background: '#fff',
																											border: '1px solid #ccc',
																											color: '#e53e3e',
																											cursor: 'pointer',
																										},
																										children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, {
																											style: { height: 16, width: 16 },
																										}),
																									}),
																								],
																							},
																							pluginId
																						);
																					}),
																					group.endpointIds.length === 0 &&
																						(0, jsx_runtime_1.jsx)('div', {
																							style: { textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#888' },
																							children: 'No endpoints in this group yet.',
																						}),
																				],
																			}),
																		],
																	},
																	group.id
																)
															),
															groups.length === 0 &&
																(0, jsx_runtime_1.jsx)('div', {
																	style: { textAlign: 'center', padding: '32px 0', color: '#888' },
																	children: 'No groups created yet. Create your first group above.',
																}),
														],
													}),
												],
											}),
											(0, jsx_runtime_1.jsxs)(Tabs_1.TabPanel, {
												value: 'feature-flags',
												children: [
													(0, jsx_runtime_1.jsx)('h3', { style: { fontSize: 18, fontWeight: 500 }, children: 'Feature Flags' }),
													(0, jsx_runtime_1.jsx)('div', {
														style: {
															display: 'grid',
															gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
															gap: 16,
															marginTop: 16,
														},
														children: Object.entries(featureFlags).map(([flag, enabled]) =>
															(0, jsx_runtime_1.jsxs)(
																'div',
																{
																	style: { border: '1px solid #eee', borderRadius: 8, padding: 16 },
																	children: [
																		(0, jsx_runtime_1.jsxs)('div', {
																			children: [
																				(0, jsx_runtime_1.jsx)('span', { style: { fontSize: 14, fontWeight: 500 }, children: flag }),
																				(0, jsx_runtime_1.jsx)('p', {
																					style: { fontSize: 12, color: '#666', marginTop: 4 },
																					children: enabled ? 'Currently enabled' : 'Currently disabled',
																				}),
																			],
																		}),
																		(0, jsx_runtime_1.jsx)(Checkbox_1.default, {
																			checked: !!enabled,
																			onChange: e => toggleFeatureFlag(flag, !enabled),
																			id: flag,
																			'aria-label': `Toggle feature flag ${flag}`,
																		}),
																	],
																},
																flag
															)
														),
													}),
												],
											}),
											(0, jsx_runtime_1.jsx)(Tabs_1.TabPanel, {
												value: 'settings',
												children: (0, jsx_runtime_1.jsx)('span', {
													style: { fontSize: 18, color: '#bbb' },
													children: 'Settings coming soon.',
												}),
											}),
										],
									}),
								}),
							],
						}),
				}),
			],
		}),
	});
}
