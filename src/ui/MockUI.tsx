import React, { useState, useEffect, useCallback } from "react";
import Button from "./components/Button";
import Checkbox from "./components/Checkbox";
import Radio from "./components/Radio";
import Dialog from "./components/Dialog";
import { Tabs, TabList, Tab, TabPanel } from "./components/Tabs";
import Popover from "./components/Popover";
import Label from "./components/Label";
import { Plus, Settings, Users, X, Edit2, Trash2, ChevronDown } from "lucide-react"
import type { MockPlatformCore } from "../platform"
import type { Plugin } from "../types"

// UI-only group type
interface Group {
  id: string
  name: string
  endpointIds: string[]
}

interface MockUIProps {
  platform: MockPlatformCore
  onStateChange?: (opts: { disabledPluginIds: string[] }) => void
  groupStorageKey?: string
  disabledPluginIdsStorageKey?: string
}

function loadGroups(storageKey: string): Group[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveGroups(groups: Group[], storageKey: string) {
  localStorage.setItem(storageKey, JSON.stringify(groups))
}

function loadDisabledPluginIds(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}
function saveDisabledPluginIds(ids: string[], storageKey: string) {
  localStorage.setItem(storageKey, JSON.stringify(ids))
}

// Add scenario persistence helpers
function loadEndpointScenarios(storageKey: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function saveEndpointScenarios(map: Record<string, string>, storageKey: string) {
  localStorage.setItem(storageKey, JSON.stringify(map));
}

export default function MockUI({ platform, onStateChange, groupStorageKey, disabledPluginIdsStorageKey }: MockUIProps) {
  const platformName = platform.getName();
  if (!platformName) {
    throw new Error("Platform name is required for MockUI localStorage namespacing. Received platform: " + JSON.stringify(platform));
  }

  const groupKey = groupStorageKey || `${platformName}.mockui.groups.v1`;
  const disabledKey = disabledPluginIdsStorageKey || `${platformName}.mockui.disabledPluginIds.v1`;
  const endpointScenarioKey = `${platformName}.mockui.endpointScenarios.v1`;
  const [isOpen, setIsOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>(() => loadGroups(groupKey))
  const [disabledPluginIds, setDisabledPluginIds] = useState<string[]>(() => loadDisabledPluginIds(disabledKey))
  const [newGroupName, setNewGroupName] = useState("")
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroupFilters, setSelectedGroupFilters] = useState<string[]>([])
  const [, forceUpdate] = useState(0)
  const [endpointScenarios, setEndpointScenarios] = useState<Record<string, string>>(() => loadEndpointScenarios(endpointScenarioKey));

  const plugins: Plugin[] = platform.getPlugins()
  const featureFlags = platform.getFeatureFlags()

    // Helper to get automatic groups from platform
    const autoGroups = platform.getComponentIds().map(cid => ({
      id: cid,
      name: cid,
      endpointIds: platform.getPlugins().filter(p => p.componentId === cid).map(p => p.id),
      auto: true as const,
    }));
    
  // Helper: get status override or default
  const getStatus = (plugin: Plugin) =>
    platform.getStatusOverride(plugin.id) ?? plugin.defaultStatus

  // Helper: is endpoint mocked?
  const isMocked = (plugin: Plugin) => !disabledPluginIds.includes(plugin.id)

  // Persist groups and disabledPluginIds
  useEffect(() => { saveGroups(groups, groupKey) }, [groups, groupKey])
  useEffect(() => { saveDisabledPluginIds(disabledPluginIds, disabledKey) }, [disabledPluginIds, disabledKey])
  // Persist endpointScenarios
  useEffect(() => { saveEndpointScenarios(endpointScenarios, endpointScenarioKey) }, [endpointScenarios, endpointScenarioKey]);

  // Notify parent/MSW adapter on state change
  useEffect(() => { onStateChange?.({ disabledPluginIds }) }, [disabledPluginIds, onStateChange])

  // UI: toggle endpoint mocked/passthrough
  const toggleEndpointSelection = useCallback((pluginId: string) => {
    setDisabledPluginIds(prev => {
      const arr = prev.includes(pluginId) ? prev.filter(id => id !== pluginId) : [...prev, pluginId]
      return arr
    })
    forceUpdate(x => x + 1)
  }, [])

  // UI: update status code
  const updateStatusCode = useCallback((pluginId: string, statusCode: number) => {
    platform.setStatusOverride(pluginId, statusCode)
    forceUpdate(x => x + 1)
    onStateChange?.({ disabledPluginIds })
  }, [platform, onStateChange, disabledPluginIds])

  // UI: toggle feature flag
  const toggleFeatureFlag = useCallback((flag: string, value: boolean) => {
    platform.setFeatureFlag(flag, value)
    forceUpdate(x => x + 1)
    onStateChange?.({ disabledPluginIds })
  }, [platform, onStateChange, disabledPluginIds])

  // Group operations
  const createGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: Group = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        endpointIds: [],
      }
      setGroups(prev => [...prev, newGroup])
      setNewGroupName("")
    }
  }
  const deleteGroup = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
  }
  const renameGroup = (groupId: string, newName: string) => {
    setGroups(prev => prev.map(g => (g.id === groupId ? { ...g, name: newName } : g)))
    setEditingGroup(null)
  }
  const addToGroup = (pluginId: string, groupId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId && !g.endpointIds.includes(pluginId)
        ? { ...g, endpointIds: [...g.endpointIds, pluginId] }
        : g
    ))
  }
  const removeFromGroup = (pluginId: string, groupId: string) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, endpointIds: g.endpointIds.filter(id => id !== pluginId) } : g
    ))
  }
  const toggleGroupFilter = (groupId: string) => {
    setSelectedGroupFilters(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    )
  }
  const clearGroupFilters = () => setSelectedGroupFilters([])

  // Filtering
  const filteredPlugins = plugins.filter(plugin => {
    // Always show all endpoints that match the search and group filters, regardless of passthrough/mocked state
    const matchesSearch = plugin.endpoint.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup =
      selectedGroupFilters.length === 0 ||
      selectedGroupFilters.some(groupId => {
        if (!groupId) {
          console.warn("[MockUI] selectedGroupFilters contains undefined groupId");
          return false;
        }
        const userGroup = groups.find(g => g.id === groupId);
        if (userGroup && Array.isArray(userGroup.endpointIds) && userGroup.endpointIds.includes(plugin.id)) return true;
        const autoGroup = autoGroups.find(g => g.id === groupId);
        if (!autoGroup) {
          console.warn(`[MockUI] autoGroup not found for groupId: ${groupId}. autoGroups:`, autoGroups);
          return false;
        }
        if (typeof plugin.componentId === "string" && plugin.componentId === autoGroup.name) return true;
        return false;
      });
    return matchesSearch && matchesGroup;
  })

  // Helper: get statusCodes for a plugin
  const getStatusCodes = (plugin: Plugin) => {
    return Object.keys(plugin.responses).map(Number)
  }


  const allGroups = [...autoGroups, ...groups];

  // UI rendering (fix event typing)
  const EndpointRow = ({ plugin }: { plugin: Plugin }) => {
    // Scenario dropdown
    const scenarioList = plugin.scenarios;
    const activeScenarioId = endpointScenarios[plugin.id] || platform.getEndpointScenario(plugin.id);
    const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const scenarioId = e.target.value;
      // Debug: log event target value and scenarioId
      // eslint-disable-next-line no-console
      console.log('[handleScenarioChange] event.target.value:', e.target.value, 'scenarioId:', scenarioId);
      // Debug: log platform and persistence instance
      // eslint-disable-next-line no-console
      console.log('[handleScenarioChange] platform:', platform, 'persistence:', (platform as any).persistence, 'scenarioId:', scenarioId);
      setEndpointScenarios(prev => ({ ...prev, [plugin.id]: scenarioId }));
      platform.setEndpointScenario(plugin.id, scenarioId);
      forceUpdate(x => x + 1);
    };
    return (
      <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 12, background: isMocked(plugin) ? "#f6fff6" : "#fff6f6" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Checkbox
                checked={isMocked(plugin)}
                onChange={() => toggleEndpointSelection(plugin.id)}
                id={`mocked-${plugin.id}`}
                aria-label={`Toggle endpoint ${plugin.endpoint}`}
              />
              <Label htmlFor={`mocked-${plugin.id}`}>mocked?</Label>
            </div>
            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: "#e6f7ff", color: "#0070f3" }}>{plugin.method}</span>
            <span style={{ fontFamily: "monospace", fontSize: 14 }}>{plugin.endpoint}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {/* Auto group badge */}
              <span style={{ border: "1px solid #eee", padding: "0 4px", borderRadius: 4, fontSize: 12, background: "#f0f0f0", opacity: 0.7 }}>
                {plugin.componentId}
              </span>
              {/* User group badges */}
              {groups
                .filter((group: Group) => group.endpointIds.includes(plugin.id))
                .map((group: Group) => (
                  <span key={group.id} style={{ border: "1px solid #eee", padding: "0 4px", borderRadius: 4, fontSize: 12 }}>{group.name}</span>
                ))}
              {/* Scenario dropdown */}
              {scenarioList && scenarioList.length > 0 && (
                <select
                  value={activeScenarioId || ""}
                  onChange={handleScenarioChange}
                  style={{ marginLeft: 8, borderRadius: 4, padding: "2px 8px", fontSize: 12 }}
                >
                  <option value="">Default</option>
                  {scenarioList.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>{scenario.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <Popover
            trigger={
              <Button style={{ border: "1px solid #ccc", borderRadius: 4, padding: "2px 8px", fontSize: 12, background: "#f8f8f8" }}>
                + Add to group
              </Button>
            }
          >
            {(close) => (
              <div style={{ minWidth: 180, padding: 8 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Groups</div>
                {groups.length === 0 && <div style={{ color: "#888", fontSize: 12 }}>No groups yet</div>}
                {groups.map((group: Group) => {
                  const checked = group.endpointIds.includes(plugin.id);
                  return (
                    <div key={group.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Checkbox
                        id={`addtogroup-${plugin.id}-${group.id}`}
                        checked={checked}
                        onChange={() => {
                          if (checked) removeFromGroup(plugin.id, group.id);
                          else addToGroup(plugin.id, group.id);
                        }}
                        aria-label={`Add ${plugin.endpoint} to group ${group.name}`}
                      />
                      <Label htmlFor={`addtogroup-${plugin.id}-${group.id}`}>{group.name}</Label>
                    </div>
                  );
                })}
              </div>
            )}
          </Popover>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
          {getStatusCodes(plugin).map((code: number) => (
            <div key={code} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Radio
                name={`status-${plugin.id}`}
                value={code}
                checked={getStatus(plugin) === code}
                onChange={() => updateStatusCode(plugin.id, code)}
                id={`${plugin.id}-${code}`}
              />
              <Label htmlFor={`${plugin.id}-${code}`}>{code}</Label>
            </div>
          ))}
        </div>
        {!isMocked(plugin) && (
          <p style={{ fontSize: 12, color: "#888", fontStyle: "italic" }}>endpoint will passthrough to localhost:4711</p>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Floating Button */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50 }}>
        <Button onClick={() => setIsOpen(true)} style={{ borderRadius: "50%", height: 56, width: 56, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ccc" }} data-testid="open-settings">
          <Settings style={{ height: 24, width: 24 }} />
        </Button>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          {isOpen && (
            <div style={{
              maxWidth: 800,
              width: "90vw",
              maxHeight: "80vh",
              height: "80vh",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 4px 32px rgba(0,0,0,0.18)",
              border: "1px solid #eee",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              padding: 0
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #eee", flex: "0 0 auto" }}>
                <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Endpoint Manager</h2>
                <Button style={{ padding: 8 }} onClick={() => setIsOpen(false)} data-testid="close-dialog">
                  <X style={{ height: 16, width: 16 }} />
                </Button>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <Tabs defaultValue="endpoints">
                  <div style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    background: "#fff",
                    borderBottom: "1px solid #eee",
                  }}>
                    <TabList>
                      <Tab value="endpoints">Endpoints</Tab>
                      <Tab value="groups">Groups</Tab>
                      <Tab value="feature-flags">Feature Flags</Tab>
                      <Tab value="settings">Settings</Tab>
                    </TabList>
                  </div>
                  <TabPanel value="endpoints">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: 18, fontWeight: 500 }}>All Endpoints</h3>
                      <span style={{ borderRadius: 6, padding: "4px 8px", fontSize: 12, background: "#e0f2fe", color: "#0070f3" }}>{plugins.filter((ep) => isMocked(ep)).length} selected</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                      <input
                        placeholder="Search endpoints..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.currentTarget.value)}
                        style={{ flex: 1, borderRadius: 6, padding: "8px 12px", border: "1px solid #ccc" }}
                      />
                      <Popover trigger={
                        <Button style={{ borderRadius: 6, padding: "8px 12px", display: "flex", alignItems: "center", gap: 4, background: "#fff", border: "1px solid #ccc" }}>
                          {selectedGroupFilters.length === 0
                            ? "Filter by groups"
                            : `${selectedGroupFilters.length} group${selectedGroupFilters.length > 1 ? "s" : ""} selected`}
                          <ChevronDown style={{ height: 16, width: 16 }} />
                        </Button>
                      }>
                        {(close) => (
                          <div style={{ width: 200, padding: 8, background: "#fff", borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <button
                                style={{ width: "100%", textAlign: "left", fontSize: 12, padding: "4px 8px", borderRadius: 4, cursor: "pointer", background: "#f0f0f0" }}
                                onClick={() => { clearGroupFilters(); close(); }}
                              >
                                All Groups
                              </button>
                              {allGroups.map((group) => (
                                <div key={group.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <Checkbox
                                    id={`filter-${group.id}`}
                                    checked={selectedGroupFilters.includes(group.id)}
                                    onChange={() => { toggleGroupFilter(group.id); close(); }}
                                    aria-label={`Filter by group ${group.name}`}
                                  />
                                  <Label htmlFor={`filter-${group.id}`} style={{ fontSize: 14, flex: 1 }}>
                                    {group.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Popover>
                    </div>
                    {selectedGroupFilters.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                        {selectedGroupFilters.map((groupId) => {
                          const group = groups.find((g) => g.id === groupId)
                          return group ? (
                            <span key={groupId} style={{ border: "1px solid #eee", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                              {group.name}
                              <X style={{ height: 12, width: 12, cursor: "pointer" }} onClick={() => toggleGroupFilter(groupId)} />
                            </span>
                          ) : null
                        })}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                      {filteredPlugins.map((plugin) => (
                        <EndpointRow key={plugin.id} plugin={plugin} />
                      ))}
                      {filteredPlugins.length === 0 && (
                        <div style={{ textAlign: "center", padding: "32px 0", color: "#888" }}>No endpoints match your current filters.</div>
                      )}
                    </div>
                  </TabPanel>
                  <TabPanel value="groups">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: 18, fontWeight: 500 }}>Groups</h3>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          placeholder="New group name"
                          value={newGroupName}
                          onChange={(e) => setNewGroupName((e.currentTarget as HTMLInputElement).value)}
                          style={{ width: 160, borderRadius: 6, padding: "8px 12px", border: "1px solid #ccc" }}
                          onKeyDown={(e) => e.key === "Enter" && createGroup()}
                        />
                        <Button onClick={createGroup} style={{ padding: "8px 12px", borderRadius: 6, background: "#fff", border: "1px solid #ccc" }}>
                          <Plus style={{ height: 16, width: 16 }} />
                        </Button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                      {autoGroups.map((group) => (
                        <div key={group.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, background: "#f8f8f8", opacity: 0.7 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <Users style={{ height: 16, width: 16 }} />
                            <span>{group.name}</span>
                            <span style={{ borderRadius: 6, padding: "4px 8px", fontSize: 12, background: "#f0f0f0" }}>{plugins.filter(p => p.componentId === group.name).length}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {plugins.filter(p => p.componentId === group.name).map((plugin) => (
                              <div key={plugin.id} style={{ display: "flex", justifyContent: "space-between", padding: 12, borderRadius: 6, border: "1px solid #eee" }}>
                                <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: "#e6f7ff", color: "#0070f3" }}>{plugin.method}</span>
                                <span style={{ fontFamily: "monospace", fontSize: 14 }}>{plugin.endpoint}</span>
                              </div>
                            ))}
                            {plugins.filter(p => p.componentId === group.name).length === 0 && (
                              <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: "#888" }}>
                                No endpoints in this group yet.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {groups.map((group) => (
                        <div key={group.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid #eee" }}>
                            {editingGroup === group.id ? (
                              <input
                                defaultValue={group.name}
                                onBlur={(e) => renameGroup(group.id, (e.currentTarget as HTMLInputElement).value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    renameGroup(group.id, (e.currentTarget as HTMLInputElement).value)
                                  }
                                }}
                                style={{ width: 192, borderRadius: 6, padding: "8px 12px", border: "1px solid #ccc" }}
                                autoFocus
                              />
                            ) : (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Users style={{ height: 16, width: 16 }} />
                                <span>{group.name}</span>
                                <span style={{ borderRadius: 6, padding: "4px 8px", fontSize: 12, background: "#f0f0f0" }}>{group.endpointIds.length}</span>
                              </div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Button onClick={() => setEditingGroup(group.id)} style={{ padding: "8px 12px", borderRadius: 6, background: "#fff", border: "1px solid #ccc" }} aria-label="edit">
                                <Edit2 style={{ height: 16, width: 16 }} />
                              </Button>
                              <Button
                                onClick={() => deleteGroup(group.id)}
                                style={{ padding: "8px 12px", borderRadius: 6, background: "#fff", border: "1px solid #ccc", color: "#e53e3e", cursor: "pointer" }}
                                aria-label="trash"
                              >
                                <Trash2 style={{ height: 16, width: 16 }} />
                              </Button>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                            {group.endpointIds.map((pluginId) => {
                              const plugin = plugins.find((ep) => ep.id === pluginId)
                              if (!plugin) return null
                              return (
                                <div key={pluginId} style={{ display: "flex", justifyContent: "space-between", padding: 12, borderRadius: 6, border: "1px solid #eee" }}>
                                  <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600, background: "#e6f7ff", color: "#0070f3" }}>{plugin.method}</span>
                                  <span style={{ fontFamily: "monospace", fontSize: 14 }}>{plugin.endpoint}</span>
                                  <Button
                                    onClick={() => removeFromGroup(pluginId, group.id)}
                                    style={{ padding: "8px 12px", borderRadius: 6, background: "#fff", border: "1px solid #ccc", color: "#e53e3e", cursor: "pointer" }}
                                  >
                                    <X style={{ height: 16, width: 16 }} />
                                  </Button>
                                </div>
                              )
                            })}
                            {group.endpointIds.length === 0 && (
                              <div style={{ textAlign: "center", padding: "24px 0", fontSize: 12, color: "#888" }}>
                                No endpoints in this group yet.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {groups.length === 0 && (
                        <div style={{ textAlign: "center", padding: "32px 0", color: "#888" }}>
                          No groups created yet. Create your first group above.
                        </div>
                      )}
                    </div>
                  </TabPanel>
                  <TabPanel value="feature-flags">
                    <h3 style={{ fontSize: 18, fontWeight: 500 }}>Feature Flags</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
                      {Object.entries(featureFlags).map(([flag, enabled]) => (
                        <div key={flag} style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
                          <div>
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{flag}</span>
                            <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                              {enabled ? "Currently enabled" : "Currently disabled"}
                            </p>
                          </div>
                          <Checkbox
                            checked={!!enabled}
                            onChange={e => toggleFeatureFlag(flag, !enabled)}
                            id={flag}
                            aria-label={`Toggle feature flag ${flag}`}
                          />
                        </div>
                      ))}
                    </div>
                  </TabPanel>
                  <TabPanel value="settings">
                    <span style={{ fontSize: 18, color: "#bbb" }}>Settings coming soon.</span>
                  </TabPanel>
                </Tabs>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </>
  )
} 