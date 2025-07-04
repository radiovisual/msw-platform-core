import React from "react"
import { render, fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import MockUI from "./MockUI"
import { createMockPlatform, InMemoryPersistence } from "../platform"
import type { Plugin } from "../types"

function makePlatform(overrides: Plugin[] = []) {
  const plugins: Plugin[] = [
    {
      id: "ep1",
      componentId: "ComponentA",
      endpoint: "/api/v1/foo",
      method: "GET",
      responses: { 200: { ok: true }, 400: { error: true } },
      defaultStatus: 200,
    },
    {
      id: "ep2",
      componentId: "ComponentB",
      endpoint: "/api/v1/bar",
      method: "POST",
      responses: { 201: { created: true }, 422: { error: true } },
      defaultStatus: 201,
    },
    ...overrides as Plugin[],
  ]
  return createMockPlatform({ name: "test", plugins, featureFlags: ["FLAG_A", "FLAG_B"] }, new InMemoryPersistence("test"))
}

describe("MockUI", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders endpoints and feature flags from platform", async () => {
    const platform = makePlatform()
    render(<MockUI platform={platform} />)
    fireEvent.click(await screen.findByRole("button"))
    // Endpoints tab is default
    expect(await screen.findByText((c, n) => n?.textContent === "/api/v1/foo" || false)).toBeInTheDocument()
    expect(await screen.findByText((c, n) => n?.textContent === "/api/v1/bar" || false)).toBeInTheDocument()
    // Switch to Feature Flags tab robustly
    const featureFlagsTab = await screen.findByRole("tab", { name: /feature flags/i })
    fireEvent.click(featureFlagsTab)
    expect(await screen.findByText((c, n) => n?.textContent === "FLAG_A" || false)).toBeInTheDocument()
    expect(await screen.findByText((c, n) => n?.textContent === "FLAG_B" || false)).toBeInTheDocument()
  })

  it("toggles endpoint passthrough and updates disabledPluginIds", async () => {
    const platform = makePlatform()
    let lastDisabled: string[] = []
    render(
      <MockUI
        platform={platform}
        onStateChange={({ disabledPluginIds }) => {
          lastDisabled = disabledPluginIds
        }}
      />
    )
    fireEvent.click(await screen.findByRole("button"))
    // Endpoints tab is default
    const checkboxes = await screen.findAllByRole("checkbox")
    fireEvent.click(checkboxes[0])
    await waitFor(() => expect(lastDisabled).toContain("ep1"))
    fireEvent.click(checkboxes[0])
    // Wait for state to settle after toggling
    await waitFor(() => expect(lastDisabled).not.toContain("ep1"))
  })

  it("changes status code and updates platform", async () => {
    const platform = makePlatform()
    render(<MockUI platform={platform} />)
    fireEvent.click(await screen.findByRole("button"))
    // Endpoints tab is default
    const radio = await screen.findByLabelText("400")
    fireEvent.click(radio)
    await waitFor(() => expect(platform.getStatusOverride("ep1")).toBe(400))
  })

  it("toggles feature flag and updates platform", async () => {
    const platform = makePlatform()
    render(<MockUI platform={platform} />)
    fireEvent.click(await screen.findByRole("button"))
    // Switch to Feature Flags tab robustly
    const featureFlagsTab = await screen.findByRole("tab", { name: /feature flags/i })
    fireEvent.click(featureFlagsTab)
    // Find the card or row containing FLAG_A
    const flagA = await screen.findByText((c, n) => n?.textContent === "FLAG_A" || false)
    expect(flagA).toBeInTheDocument()
    const flagCard = flagA.closest("div")
    expect(flagCard).toBeInTheDocument()
    const checkbox = within(flagCard!).getByRole("checkbox")
    fireEvent.click(checkbox)
    await waitFor(() => expect(platform.getFeatureFlags().FLAG_A).toBe(true))
    fireEvent.click(checkbox)
    await waitFor(() => expect(platform.getFeatureFlags().FLAG_A).toBe(false))
  })

  it("creates, renames, deletes groups and manages membership", async () => {
    const platform = makePlatform()
    render(<MockUI platform={platform} />)
    fireEvent.click(await screen.findByRole("button"))
    // Switch to Groups tab robustly
    const groupsTab = await screen.findByRole("tab", { name: /groups/i })
    fireEvent.click(groupsTab)
    // Use function matcher for placeholder
    const input = await screen.findByPlaceholderText((c, n) => n?.getAttribute("placeholder")?.toLowerCase() === "new group name")
    fireEvent.change(input, { target: { value: "TestGroup" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(await screen.findByText((c, n) => n?.textContent === "TestGroup" || false)).toBeInTheDocument()
    // Rename group
    const editButtons = await screen.findAllByRole("button", { name: /edit/i })
    fireEvent.click(editButtons[0])
    const renameInput = await screen.findByDisplayValue("TestGroup")
    fireEvent.change(renameInput, { target: { value: "RenamedGroup" } })
    fireEvent.keyDown(renameInput, { key: "Enter" })
    expect(await screen.findByText((c, n) => n?.textContent === "RenamedGroup" || false)).toBeInTheDocument()
    // Delete group
    const trashButtons = await screen.findAllByRole("button", { name: /trash/i })
    fireEvent.click(trashButtons[0])
    await waitFor(() => expect(screen.queryByText((c, n) => n?.textContent === "RenamedGroup" || false)).not.toBeInTheDocument())
  })

  it("persists groups and disabledPluginIds to localStorage", async () => {
    const platform = makePlatform()
    const { unmount } = render(<MockUI platform={platform} />)
    fireEvent.click(await screen.findByRole("button"))
    // Switch to Groups tab robustly
    const groupsTab = await screen.findByRole("tab", { name: /groups/i })
    fireEvent.click(groupsTab)
    const input = await screen.findByPlaceholderText((c, n) => n?.getAttribute("placeholder")?.toLowerCase() === "new group name")
    fireEvent.change(input, { target: { value: "PersistedGroup" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(await screen.findByText((c, n) => n?.textContent === "PersistedGroup" || false)).toBeInTheDocument()
    // Toggle endpoint off
    const checkboxes = await screen.findAllByRole("checkbox")
    fireEvent.click(checkboxes[0])
    await waitFor(() => expect((screen.getAllByRole("checkbox"))[0]).not.toBeChecked())
    // Unmount and remount
    unmount()
    render(<MockUI platform={platform} />)
    fireEvent.click(await screen.findByRole("button"))
    const groupsTab2 = await screen.findByRole("tab", { name: /groups/i })
    fireEvent.click(groupsTab2)
    expect(await screen.findByText((c, n) => n?.textContent === "PersistedGroup" || false)).toBeInTheDocument()
    // The endpoint should still be passthrough (unchecked)
    await waitFor(() => expect((screen.getAllByRole("checkbox"))[0]).not.toBeChecked())
  })

  it("namespaces localStorage by platform name", async () => {
    localStorage.clear();
    const platformA = createMockPlatform({ name: "appA", plugins: [
      { id: "ep1", componentId: "ComponentA", endpoint: "/api/a", method: "GET", responses: { 200: {} }, defaultStatus: 200 },
    ], featureFlags: [] }, new InMemoryPersistence("appA"));
    const platformB = createMockPlatform({ name: "appB", plugins: [
      { id: "ep2", componentId: "ComponentB", endpoint: "/api/b", method: "GET", responses: { 200: {} }, defaultStatus: 200 },
    ], featureFlags: [] }, new InMemoryPersistence("appB"));

    // Mount MockUI for platformA and create a group
    let utils = render(<MockUI platform={platformA} />);
    fireEvent.click(await screen.findByRole("button"));
    fireEvent.click(await screen.findByRole("tab", { name: /groups/i }));
    const inputA = await screen.findByPlaceholderText((c, n) => n?.getAttribute("placeholder")?.toLowerCase() === "new group name");
    fireEvent.change(inputA, { target: { value: "GroupA" } });
    fireEvent.keyDown(inputA, { key: "Enter" });
    expect(await screen.findByText((c, n) => n?.textContent === "GroupA" || false)).toBeInTheDocument();

    // Unmount and mount MockUI for platformB and create a group
    utils.unmount();
    utils = render(<MockUI platform={platformB} />);
    fireEvent.click(await screen.findByRole("button"));
    fireEvent.click(await screen.findByRole("tab", { name: /groups/i }));
    const inputB = await screen.findByPlaceholderText((c, n) => n?.getAttribute("placeholder")?.toLowerCase() === "new group name");
    fireEvent.change(inputB, { target: { value: "GroupB" } });
    fireEvent.keyDown(inputB, { key: "Enter" });
    expect(await screen.findByText((c, n) => n?.textContent === "GroupB" || false)).toBeInTheDocument();

    // Unmount and remount MockUI for platformA, GroupA should still exist, GroupB should not
    utils.unmount();
    utils = render(<MockUI platform={platformA} />);
    fireEvent.click(await screen.findByRole("button"));
    fireEvent.click(await screen.findByRole("tab", { name: /groups/i }));
    expect(await screen.findByText((c, n) => n?.textContent === "GroupA" || false)).toBeInTheDocument();
    expect(screen.queryByText((c, n) => n?.textContent === "GroupB" || false)).not.toBeInTheDocument();

    // Unmount and remount MockUI for platformB, GroupB should still exist, GroupA should not
    utils.unmount();
    utils = render(<MockUI platform={platformB} />);
    fireEvent.click(await screen.findByRole("button"));
    fireEvent.click(await screen.findByRole("tab", { name: /groups/i }));
    expect(await screen.findByText((c, n) => n?.textContent === "GroupB" || false)).toBeInTheDocument();
    expect(screen.queryByText((c, n) => n?.textContent === "GroupA" || false)).not.toBeInTheDocument();
  });

  it("renders automatic groups for componentId and prevents deletion", async () => {
    const platform = makePlatform();
    render(<MockUI platform={platform} />);
    fireEvent.click(await screen.findByRole("button"));
    fireEvent.click(await screen.findByRole("tab", { name: /groups/i }));
    // Automatic groups should be visible
    expect(await screen.findByText((c, n) => n?.textContent?.includes("ComponentA (auto)") || false)).toBeInTheDocument();
    expect(await screen.findByText((c, n) => n?.textContent?.includes("ComponentB (auto)") || false)).toBeInTheDocument();
    // There should be no delete button for auto groups
    const autoGroup = await screen.findByText((c, n) => n?.textContent?.includes("ComponentA (auto)") || false);
    const groupDiv = autoGroup.closest("div");
    expect(within(groupDiv!).queryByRole("button", { name: /trash/i })).not.toBeInTheDocument();
  });
}) 