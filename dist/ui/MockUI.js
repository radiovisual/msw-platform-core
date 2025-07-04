"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MockUI;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Dialog = __importStar(require("@radix-ui/react-dialog"));
const Tabs = __importStar(require("@radix-ui/react-tabs"));
const Checkbox = __importStar(require("@radix-ui/react-checkbox"));
const RadioGroup = __importStar(require("@radix-ui/react-radio-group"));
const Label = __importStar(require("@radix-ui/react-label"));
const Popover = __importStar(require("@radix-ui/react-popover"));
const lucide_react_1 = require("lucide-react");
const GROUPS_STORAGE_KEY = "mockui.groups.v1";
const DISABLED_STORAGE_KEY = "mockui.disabledPluginIds.v1";
function loadGroups(storageKey) {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw)
            return [];
        return JSON.parse(raw);
    }
    catch (_a) {
        return [];
    }
}
function saveGroups(groups, storageKey) {
    localStorage.setItem(storageKey, JSON.stringify(groups));
}
function loadDisabledPluginIds(storageKey) {
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw)
            return [];
        return JSON.parse(raw);
    }
    catch (_a) {
        return [];
    }
}
function saveDisabledPluginIds(ids, storageKey) {
    localStorage.setItem(storageKey, JSON.stringify(ids));
}
const methodColors = {
    GET: "bg-green-100 text-green-800",
    POST: "bg-blue-100 text-blue-800",
    PUT: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800",
    PATCH: "bg-purple-100 text-purple-800",
};
function MockUI({ platform, onStateChange, groupStorageKey, disabledPluginIdsStorageKey }) {
    const groupKey = groupStorageKey || GROUPS_STORAGE_KEY;
    const disabledKey = disabledPluginIdsStorageKey || DISABLED_STORAGE_KEY;
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const [groups, setGroups] = (0, react_1.useState)(() => loadGroups(groupKey));
    const [disabledPluginIds, setDisabledPluginIds] = (0, react_1.useState)(() => loadDisabledPluginIds(disabledKey));
    const [newGroupName, setNewGroupName] = (0, react_1.useState)("");
    const [editingGroup, setEditingGroup] = (0, react_1.useState)(null);
    const [searchTerm, setSearchTerm] = (0, react_1.useState)("");
    const [selectedGroupFilters, setSelectedGroupFilters] = (0, react_1.useState)([]);
    const [, forceUpdate] = (0, react_1.useState)(0);
    const plugins = platform.getPlugins();
    const featureFlags = platform.getFeatureFlags();
    // Helper: get status override or default
    const getStatus = (plugin) => { var _a; return (_a = platform.getStatusOverride(plugin.id)) !== null && _a !== void 0 ? _a : plugin.defaultStatus; };
    // Helper: is endpoint mocked?
    const isMocked = (plugin) => !disabledPluginIds.includes(plugin.id);
    // Persist groups and disabledPluginIds
    (0, react_1.useEffect)(() => { saveGroups(groups, groupKey); }, [groups, groupKey]);
    (0, react_1.useEffect)(() => { saveDisabledPluginIds(disabledPluginIds, disabledKey); }, [disabledPluginIds, disabledKey]);
    // Notify parent/MSW adapter on state change
    (0, react_1.useEffect)(() => { onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange({ disabledPluginIds }); }, [disabledPluginIds, onStateChange]);
    // UI: toggle endpoint mocked/passthrough
    const toggleEndpointSelection = (0, react_1.useCallback)((pluginId) => {
        setDisabledPluginIds(prev => {
            const arr = prev.includes(pluginId) ? prev.filter(id => id !== pluginId) : [...prev, pluginId];
            return arr;
        });
        forceUpdate(x => x + 1);
    }, []);
    // UI: update status code
    const updateStatusCode = (0, react_1.useCallback)((pluginId, statusCode) => {
        platform.setStatusOverride(pluginId, statusCode);
        forceUpdate(x => x + 1);
        onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange({ disabledPluginIds });
    }, [platform, onStateChange, disabledPluginIds]);
    // UI: toggle feature flag
    const toggleFeatureFlag = (0, react_1.useCallback)((flag, value) => {
        platform.setFeatureFlag(flag, value);
        forceUpdate(x => x + 1);
        onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange({ disabledPluginIds });
    }, [platform, onStateChange, disabledPluginIds]);
    // Group operations
    const createGroup = () => {
        if (newGroupName.trim()) {
            const newGroup = {
                id: Date.now().toString(),
                name: newGroupName.trim(),
                endpointIds: [],
            };
            setGroups(prev => [...prev, newGroup]);
            setNewGroupName("");
        }
    };
    const deleteGroup = (groupId) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
    };
    const renameGroup = (groupId, newName) => {
        setGroups(prev => prev.map(g => (g.id === groupId ? Object.assign(Object.assign({}, g), { name: newName }) : g)));
        setEditingGroup(null);
    };
    const addToGroup = (pluginId, groupId) => {
        setGroups(prev => prev.map(g => g.id === groupId && !g.endpointIds.includes(pluginId)
            ? Object.assign(Object.assign({}, g), { endpointIds: [...g.endpointIds, pluginId] }) : g));
    };
    const removeFromGroup = (pluginId, groupId) => {
        setGroups(prev => prev.map(g => g.id === groupId ? Object.assign(Object.assign({}, g), { endpointIds: g.endpointIds.filter(id => id !== pluginId) }) : g));
    };
    const toggleGroupFilter = (groupId) => {
        setSelectedGroupFilters(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
    };
    const clearGroupFilters = () => setSelectedGroupFilters([]);
    // Filtering
    const filteredPlugins = plugins.filter(plugin => {
        const matchesSearch = plugin.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGroup = selectedGroupFilters.length === 0 ||
            selectedGroupFilters.some(groupId => { var _a; return (_a = groups.find(g => g.id === groupId)) === null || _a === void 0 ? void 0 : _a.endpointIds.includes(plugin.id); });
        return matchesSearch && matchesGroup;
    });
    // Helper: get statusCodes for a plugin
    const getStatusCodes = (plugin) => {
        return Object.keys(plugin.responses).map(Number);
    };
    // UI rendering (fix event typing)
    const EndpointRow = ({ plugin }) => ((0, jsx_runtime_1.jsxs)("div", { className: `border rounded-lg p-4 space-y-3 transition-colors ${isMocked(plugin) ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(Checkbox.Root, { checked: isMocked(plugin), onCheckedChange: () => toggleEndpointSelection(plugin.id), className: "w-4 h-4 border rounded", id: `mocked-${plugin.id}`, children: (0, jsx_runtime_1.jsx)(Checkbox.Indicator, { className: "flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "block w-2 h-2 bg-green-600 rounded" }) }) }), (0, jsx_runtime_1.jsx)(Label.Root, { htmlFor: `mocked-${plugin.id}`, className: "text-xs text-gray-600", children: "mocked?" })] }), (0, jsx_runtime_1.jsx)("span", { className: `px-2 py-1 rounded text-xs font-semibold ${methodColors[plugin.method]}`, children: plugin.method }), (0, jsx_runtime_1.jsx)("span", { className: "font-mono text-sm", children: plugin.endpoint }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1", children: groups
                                    .filter((group) => group.endpointIds.includes(plugin.id))
                                    .map((group) => ((0, jsx_runtime_1.jsx)("span", { className: "border px-1 py-0 rounded text-xs", children: group.name }, group.id))) })] }), (0, jsx_runtime_1.jsxs)("select", { className: "border rounded px-2 py-1 text-xs", onChange: e => addToGroup(plugin.id, e.currentTarget.value), value: "", children: [(0, jsx_runtime_1.jsx)("option", { value: "", disabled: true, children: "+ Add to group" }), groups.map((group) => ((0, jsx_runtime_1.jsx)("option", { value: group.id, children: group.name }, group.id)))] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center space-x-4", children: (0, jsx_runtime_1.jsx)(RadioGroup.Root, { className: "flex space-x-4", value: getStatus(plugin).toString(), onValueChange: value => updateStatusCode(plugin.id, Number.parseInt(value)), children: getStatusCodes(plugin).map((code) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(RadioGroup.Item, { value: code.toString(), id: `${plugin.id}-${code}`, className: "w-4 h-4 border rounded-full", children: (0, jsx_runtime_1.jsx)(RadioGroup.Indicator, { className: "block w-2 h-2 bg-blue-600 rounded-full mx-auto my-auto" }) }), (0, jsx_runtime_1.jsx)(Label.Root, { htmlFor: `${plugin.id}-${code}`, className: "text-sm", children: code })] }, code))) }) }), !isMocked(plugin) && ((0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500 italic", children: "endpoint will passthrough to localhost:4711" }))] }));
    return ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("div", { className: "fixed bottom-6 right-6 z-50", children: (0, jsx_runtime_1.jsxs)(Dialog.Root, { open: isOpen, onOpenChange: setIsOpen, children: [(0, jsx_runtime_1.jsx)(Dialog.Trigger, { asChild: true, children: (0, jsx_runtime_1.jsx)("button", { className: "rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow bg-white flex items-center justify-center border", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Settings, { className: "h-6 w-6" }) }) }), (0, jsx_runtime_1.jsxs)(Dialog.Content, { className: "max-w-4xl max-h-[80vh] overflow-hidden bg-white rounded-lg shadow-xl border", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-6 border-b", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-semibold", children: "Endpoint Manager" }), (0, jsx_runtime_1.jsx)("button", { className: "p-2", onClick: () => setIsOpen(false), children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-4 w-4" }) })] }), (0, jsx_runtime_1.jsxs)(Tabs.Root, { defaultValue: "endpoints", className: "flex-1", children: [(0, jsx_runtime_1.jsxs)(Tabs.List, { className: "grid w-full grid-cols-4 border-b", children: [(0, jsx_runtime_1.jsx)(Tabs.Trigger, { value: "endpoints", className: "py-2", children: "Endpoints" }), (0, jsx_runtime_1.jsx)(Tabs.Trigger, { value: "groups", className: "py-2", children: "Groups" }), (0, jsx_runtime_1.jsx)(Tabs.Trigger, { value: "feature-flags", className: "py-2", children: "Feature Flags" }), (0, jsx_runtime_1.jsx)(Tabs.Trigger, { value: "settings", className: "py-2", children: "Settings" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "p-6 overflow-y-auto max-h-[60vh]", children: [(0, jsx_runtime_1.jsxs)(Tabs.Content, { value: "endpoints", className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium", children: "All Endpoints" }), (0, jsx_runtime_1.jsxs)("span", { className: "border rounded px-2 py-1 text-xs bg-gray-100", children: [plugins.filter((ep) => isMocked(ep)).length, " selected"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)("input", { placeholder: "Search endpoints...", value: searchTerm, onChange: (e) => setSearchTerm(e.currentTarget.value), className: "flex-1 border rounded px-2 py-1" }), (0, jsx_runtime_1.jsxs)(Popover.Root, { children: [(0, jsx_runtime_1.jsx)(Popover.Trigger, { asChild: true, children: (0, jsx_runtime_1.jsxs)("button", { className: "border rounded px-4 py-2 flex items-center gap-2 bg-white", children: [selectedGroupFilters.length === 0
                                                                                    ? "Filter by groups"
                                                                                    : `${selectedGroupFilters.length} group${selectedGroupFilters.length > 1 ? "s" : ""} selected`, (0, jsx_runtime_1.jsx)(lucide_react_1.ChevronDown, { className: "h-4 w-4" })] }) }), (0, jsx_runtime_1.jsx)(Popover.Content, { className: "w-48 p-2 bg-white border rounded shadow", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("button", { className: "w-full text-left text-xs py-1 px-2 hover:bg-gray-100 rounded", onClick: clearGroupFilters, children: "All Groups" }), groups.map((group) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(Checkbox.Root, { id: `filter-${group.id}`, checked: selectedGroupFilters.includes(group.id), onCheckedChange: () => toggleGroupFilter(group.id), className: "w-4 h-4 border rounded", children: (0, jsx_runtime_1.jsx)(Checkbox.Indicator, { className: "flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "block w-2 h-2 bg-blue-600 rounded" }) }) }), (0, jsx_runtime_1.jsx)(Label.Root, { htmlFor: `filter-${group.id}`, className: "text-sm flex-1", children: group.name })] }, group.id)))] }) })] })] }), selectedGroupFilters.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2", children: selectedGroupFilters.map((groupId) => {
                                                            const group = groups.find((g) => g.id === groupId);
                                                            return group ? ((0, jsx_runtime_1.jsxs)("span", { className: "border px-2 py-1 rounded flex items-center gap-1 text-xs", children: [group.name, (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-3 w-3 cursor-pointer", onClick: () => toggleGroupFilter(groupId) })] }, groupId)) : null;
                                                        }) })), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [filteredPlugins.map((plugin) => ((0, jsx_runtime_1.jsx)(EndpointRow, { plugin: plugin }, plugin.id))), filteredPlugins.length === 0 && ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-8 text-gray-500", children: "No endpoints match your current filters." }))] })] }), (0, jsx_runtime_1.jsxs)(Tabs.Content, { value: "groups", className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium", children: "Groups" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("input", { placeholder: "New group name", value: newGroupName, onChange: (e) => setNewGroupName(e.currentTarget.value), className: "w-40 border rounded px-2 py-1", onKeyDown: (e) => e.key === "Enter" && createGroup() }), (0, jsx_runtime_1.jsx)("button", { onClick: createGroup, className: "p-2 border rounded bg-white", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Plus, { className: "h-4 w-4" }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [groups.map((group) => ((0, jsx_runtime_1.jsxs)("div", { className: "border rounded p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between pb-3", children: [editingGroup === group.id ? ((0, jsx_runtime_1.jsx)("input", { defaultValue: group.name, onBlur: (e) => renameGroup(group.id, e.currentTarget.value), onKeyDown: (e) => {
                                                                                    if (e.key === "Enter") {
                                                                                        renameGroup(group.id, e.currentTarget.value);
                                                                                    }
                                                                                }, className: "w-48 border rounded px-2 py-1", autoFocus: true })) : ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)(lucide_react_1.Users, { className: "h-4 w-4" }), (0, jsx_runtime_1.jsx)("span", { children: group.name }), (0, jsx_runtime_1.jsx)("span", { className: "border rounded px-2 py-1 text-xs bg-gray-100", children: group.endpointIds.length })] })), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => setEditingGroup(group.id), className: "p-2 border rounded bg-white", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Edit2, { className: "h-4 w-4" }) }), (0, jsx_runtime_1.jsx)("button", { onClick: () => deleteGroup(group.id), className: "p-2 border rounded bg-white text-red-500 hover:text-red-700", children: (0, jsx_runtime_1.jsx)(lucide_react_1.Trash2, { className: "h-4 w-4" }) })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [group.endpointIds.map((pluginId) => {
                                                                                const plugin = plugins.find((ep) => ep.id === pluginId);
                                                                                if (!plugin)
                                                                                    return null;
                                                                                return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 border rounded", children: [(0, jsx_runtime_1.jsx)("span", { className: `px-2 py-1 rounded text-xs font-semibold ${methodColors[plugin.method]}`, children: plugin.method }), (0, jsx_runtime_1.jsx)("span", { className: "font-mono text-sm", children: plugin.endpoint }), (0, jsx_runtime_1.jsx)("button", { onClick: () => removeFromGroup(pluginId, group.id), className: "p-2 border rounded bg-white text-red-500 hover:text-red-700", children: (0, jsx_runtime_1.jsx)(lucide_react_1.X, { className: "h-4 w-4" }) })] }, pluginId));
                                                                            }), group.endpointIds.length === 0 && ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-4 text-gray-500 text-sm", children: "No endpoints in this group yet." }))] })] }, group.id))), groups.length === 0 && ((0, jsx_runtime_1.jsx)("div", { className: "text-center py-8 text-gray-500", children: "No groups created yet. Create your first group above." }))] })] }), (0, jsx_runtime_1.jsxs)(Tabs.Content, { value: "feature-flags", className: "space-y-4", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-medium", children: "Feature Flags" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: Object.entries(featureFlags).map(([flag, enabled]) => ((0, jsx_runtime_1.jsxs)("div", { className: "border rounded p-4 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium", children: flag }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500 mt-1", children: enabled ? "Currently enabled" : "Currently disabled" })] }), (0, jsx_runtime_1.jsx)(Checkbox.Root, { checked: enabled, onCheckedChange: (checked) => toggleFeatureFlag(flag, !!checked), className: "w-4 h-4 border rounded", id: flag, children: (0, jsx_runtime_1.jsx)(Checkbox.Indicator, { className: "flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "block w-2 h-2 bg-blue-600 rounded" }) }) })] }, flag))) })] }), (0, jsx_runtime_1.jsx)(Tabs.Content, { value: "settings", className: "flex flex-col items-center justify-center h-40 text-gray-400", children: (0, jsx_runtime_1.jsx)("span", { className: "text-lg", children: "Settings coming soon." }) })] })] })] })] }) }) }));
}
