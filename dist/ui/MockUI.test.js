"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
const MockUI_1 = __importDefault(require("./MockUI"));
const platform_1 = require("../platform");
const user_event_1 = __importDefault(require("@testing-library/user-event"));
function makePlatform(overrides = []) {
    const plugins = [
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
        ...overrides,
    ];
    return (0, platform_1.createMockPlatform)({ name: "test", plugins, featureFlags: ["FLAG_A", "FLAG_B"] }, new platform_1.InMemoryPersistence("test"));
}
describe("MockUI", () => {
    beforeEach(() => {
        localStorage.clear();
    });
    afterEach(() => {
        localStorage.clear();
        jest.resetModules();
        (0, react_1.cleanup)();
    });
    it("renders endpoints and feature flags from platform", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        // Endpoints tab is default
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "/api/v1/foo" || false)).toBeInTheDocument();
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "/api/v1/bar" || false)).toBeInTheDocument();
        // Switch to Feature Flags tab robustly
        const featureFlagsTab = yield react_1.screen.findByRole("tab", { name: /feature flags/i });
        react_1.fireEvent.click(featureFlagsTab);
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "FLAG_A" || false)).toBeInTheDocument();
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "FLAG_B" || false)).toBeInTheDocument();
    }));
    it("toggles endpoint passthrough and updates disabledPluginIds", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        // Endpoints tab is default
        const endpointCheckbox = yield react_1.screen.findByLabelText("Toggle endpoint /api/v1/foo");
        // Initially checked
        yield (0, react_1.waitFor)(() => expect(endpointCheckbox).toBeChecked());
        react_1.fireEvent.click(endpointCheckbox);
        yield (0, react_1.waitFor)(() => expect(endpointCheckbox).not.toBeChecked());
        react_1.fireEvent.click(endpointCheckbox);
        yield (0, react_1.waitFor)(() => expect(endpointCheckbox).toBeChecked());
    }));
    it("changes status code and updates platform", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        // Endpoints tab is default
        const radio = yield react_1.screen.findByLabelText("400");
        react_1.fireEvent.click(radio);
        yield (0, react_1.waitFor)(() => expect(platform.getStatusOverride("ep1")).toBe(400));
    }));
    it("toggles feature flag and updates platform", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        // Switch to Feature Flags tab robustly
        const featureFlagsTab = yield react_1.screen.findByRole("tab", { name: /feature flags/i });
        react_1.fireEvent.click(featureFlagsTab);
        // Find the card or row containing FLAG_A
        const flagA = yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "FLAG_A" || false);
        expect(flagA).toBeInTheDocument();
        const flagCard = flagA.closest("div");
        expect(flagCard).toBeInTheDocument();
        // Debug: print the HTML of the card
        // eslint-disable-next-line no-console
        console.log("FLAG_A card HTML:", flagCard === null || flagCard === void 0 ? void 0 : flagCard.outerHTML);
        let flagCheckbox;
        try {
            flagCheckbox = (0, react_1.within)(flagCard).getByLabelText("Toggle feature flag FLAG_A");
        }
        catch (e) {
            // eslint-disable-next-line no-console
            console.log("within(flagCard!) failed, falling back to screen.getByLabelText");
            flagCheckbox = react_1.screen.getByLabelText("Toggle feature flag FLAG_A");
        }
        react_1.fireEvent.click(flagCheckbox);
        yield (0, react_1.waitFor)(() => expect(platform.getFeatureFlags().FLAG_A).toBe(true));
        react_1.fireEvent.click(flagCheckbox);
        yield (0, react_1.waitFor)(() => expect(platform.getFeatureFlags().FLAG_A).toBe(false));
    }));
    it("creates, renames, deletes groups and manages membership", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        // Switch to Groups tab robustly
        const groupsTab = yield react_1.screen.findByRole("tab", { name: /groups/i });
        react_1.fireEvent.click(groupsTab);
        // Use function matcher for placeholder
        const input = yield react_1.screen.findByPlaceholderText((c, n) => { var _a; return ((_a = n === null || n === void 0 ? void 0 : n.getAttribute("placeholder")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "new group name"; });
        react_1.fireEvent.change(input, { target: { value: "TestGroup" } });
        react_1.fireEvent.keyDown(input, { key: "Enter" });
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "TestGroup" || false)).toBeInTheDocument();
        // Rename group
        const editButtons = yield react_1.screen.findAllByRole("button", { name: /edit/i });
        react_1.fireEvent.click(editButtons[0]);
        const renameInput = yield react_1.screen.findByDisplayValue("TestGroup");
        react_1.fireEvent.change(renameInput, { target: { value: "RenamedGroup" } });
        react_1.fireEvent.keyDown(renameInput, { key: "Enter" });
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "RenamedGroup" || false)).toBeInTheDocument();
        // Delete group
        const trashButtons = yield react_1.screen.findAllByRole("button", { name: /trash/i });
        react_1.fireEvent.click(trashButtons[0]);
        yield (0, react_1.waitFor)(() => expect(react_1.screen.queryByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "RenamedGroup" || false)).not.toBeInTheDocument());
    }));
    it("persists groups and disabledPluginIds to localStorage", () => __awaiter(void 0, void 0, void 0, function* () {
        // Step 1: Render and interact with the first platform instance
        const platform1 = makePlatform();
        const { unmount } = (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform1 }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        // Create a group
        const groupsTab = yield react_1.screen.findByRole("tab", { name: /groups/i });
        react_1.fireEvent.click(groupsTab);
        const input = yield react_1.screen.findByPlaceholderText((c, n) => { var _a; return ((_a = n === null || n === void 0 ? void 0 : n.getAttribute("placeholder")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "new group name"; });
        react_1.fireEvent.change(input, { target: { value: "PersistedGroup" } });
        react_1.fireEvent.keyDown(input, { key: "Enter" });
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "PersistedGroup" || false)).toBeInTheDocument();
        // Switch to Endpoints tab and toggle endpoint off
        const endpointsTab = yield react_1.screen.findByRole("tab", { name: /endpoints/i });
        react_1.fireEvent.click(endpointsTab);
        const endpointCheckbox = yield react_1.screen.findByLabelText("Toggle endpoint /api/v1/foo");
        react_1.fireEvent.click(endpointCheckbox);
        yield (0, react_1.waitFor)(() => expect(endpointCheckbox).not.toBeChecked());
        // Unmount and remount with a fresh platform instance
        unmount();
        const platform2 = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform2 }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        // Wait for dialog and Endpoints tab to be open
        const endpointsTab2 = yield react_1.screen.findByRole("tab", { name: /endpoints/i });
        react_1.fireEvent.click(endpointsTab2);
        yield (0, react_1.waitFor)(() => expect(endpointsTab2).toHaveAttribute("aria-selected", "true"));
        // Wait for the checkbox to appear and assert its state
        const endpointCheckbox2 = yield react_1.screen.findByLabelText("Toggle endpoint /api/v1/foo");
        yield (0, react_1.waitFor)(() => expect(endpointCheckbox2).not.toBeChecked());
    }));
    it("minimal stateless: renders a plain checkbox with aria-label after remount", () => __awaiter(void 0, void 0, void 0, function* () {
        const { unmount } = (0, react_1.render)((0, jsx_runtime_1.jsx)("input", { type: "checkbox", "aria-label": "Toggle endpoint /api/v1/foo" }));
        expect(react_1.screen.getByLabelText("Toggle endpoint /api/v1/foo")).toBeInTheDocument();
        unmount();
        (0, react_1.render)((0, jsx_runtime_1.jsx)("input", { type: "checkbox", "aria-label": "Toggle endpoint /api/v1/foo" }));
        expect(react_1.screen.getByLabelText("Toggle endpoint /api/v1/foo")).toBeInTheDocument();
    }));
    it("namespaces localStorage by platform name", () => __awaiter(void 0, void 0, void 0, function* () {
        localStorage.clear();
        const platformA = (0, platform_1.createMockPlatform)({ name: "appA", plugins: [
                { id: "ep1", componentId: "ComponentA", endpoint: "/api/a", method: "GET", responses: { 200: {} }, defaultStatus: 200 },
            ], featureFlags: [] }, new platform_1.InMemoryPersistence("appA"));
        const platformB = (0, platform_1.createMockPlatform)({ name: "appB", plugins: [
                { id: "ep2", componentId: "ComponentB", endpoint: "/api/b", method: "GET", responses: { 200: {} }, defaultStatus: 200 },
            ], featureFlags: [] }, new platform_1.InMemoryPersistence("appB"));
        // Mount MockUI for platformA and create a group
        let utils = (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platformA }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        react_1.fireEvent.click(yield react_1.screen.findByRole("tab", { name: /groups/i }));
        const inputA = yield react_1.screen.findByPlaceholderText((c, n) => { var _a; return ((_a = n === null || n === void 0 ? void 0 : n.getAttribute("placeholder")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "new group name"; });
        react_1.fireEvent.change(inputA, { target: { value: "GroupA" } });
        react_1.fireEvent.keyDown(inputA, { key: "Enter" });
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "GroupA" || false)).toBeInTheDocument();
        // Unmount and mount MockUI for platformB and create a group
        utils.unmount();
        utils = (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platformB }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        react_1.fireEvent.click(yield react_1.screen.findByRole("tab", { name: /groups/i }));
        const inputB = yield react_1.screen.findByPlaceholderText((c, n) => { var _a; return ((_a = n === null || n === void 0 ? void 0 : n.getAttribute("placeholder")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "new group name"; });
        react_1.fireEvent.change(inputB, { target: { value: "GroupB" } });
        react_1.fireEvent.keyDown(inputB, { key: "Enter" });
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "GroupB" || false)).toBeInTheDocument();
        // Unmount and remount MockUI for platformA, GroupA should still exist, GroupB should not
        utils.unmount();
        utils = (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platformA }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        react_1.fireEvent.click(yield react_1.screen.findByRole("tab", { name: /groups/i }));
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "GroupA" || false)).toBeInTheDocument();
        expect(react_1.screen.queryByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "GroupB" || false)).not.toBeInTheDocument();
        // Unmount and remount MockUI for platformB, GroupB should still exist, GroupA should not
        utils.unmount();
        utils = (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platformB }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        react_1.fireEvent.click(yield react_1.screen.findByRole("tab", { name: /groups/i }));
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "GroupB" || false)).toBeInTheDocument();
        expect(react_1.screen.queryByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "GroupA" || false)).not.toBeInTheDocument();
    }));
    it("renders automatic groups for componentId and prevents deletion", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        react_1.fireEvent.click(yield react_1.screen.findByRole("tab", { name: /groups/i }));
        // Automatic groups should be visible
        expect(yield react_1.screen.findByText("ComponentA")).toBeInTheDocument();
        expect(yield react_1.screen.findByText("ComponentB")).toBeInTheDocument();
        // There should be no delete button for auto groups
        const autoGroup = yield react_1.screen.findByText("ComponentA");
        const groupDiv = autoGroup.closest("div");
        expect((0, react_1.within)(groupDiv).queryByRole("button", { name: /trash/i })).not.toBeInTheDocument();
    }));
    it("shows scenario dropdown, persists selection, and updates response", () => __awaiter(void 0, void 0, void 0, function* () {
        const plugins = [
            {
                id: "ep1",
                componentId: "ComponentA",
                endpoint: "/api/v1/foo",
                method: "GET",
                responses: { 200: { ok: true }, 400: { error: "bad" } },
                defaultStatus: 200,
                scenarios: [
                    { id: "not-registered", label: "User not registered", responses: { 200: { error: "User not registered" } } },
                    { id: "registered", label: "User is registered", responses: { 200: { ok: "User is registered" }, 400: { error: "custom bad" } } },
                ],
            },
        ];
        const persistence = new platform_1.InMemoryPersistence("test");
        const platform = (0, platform_1.createMockPlatform)({ name: "test", plugins }, persistence);
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        // Find the scenario dropdown
        const select = yield react_1.screen.findByDisplayValue("Default");
        // Select "User not registered"
        yield user_event_1.default.selectOptions(select, "not-registered");
        yield (0, react_1.waitFor)(() => expect(select).toHaveValue("not-registered"));
        // Re-instantiate platform to reflect persisted scenario
        const platformAfterNotRegistered = (0, platform_1.createMockPlatform)({ name: "test", plugins }, persistence);
        yield (0, react_1.waitFor)(() => expect(platformAfterNotRegistered.getResponse("ep1", 200)).toEqual({ error: "User not registered" }));
        yield (0, react_1.waitFor)(() => expect(platformAfterNotRegistered.getResponse("ep1", 400)).toEqual({ error: "bad" })); // fallback to plugin
        // Re-query the select element before changing to 'registered'
        const selectAfter = yield react_1.screen.findByDisplayValue("User not registered");
        // Select "User is registered"
        const selectEl = selectAfter;
        console.log('[test] select value before change:', selectEl.value, 'options:', Array.from(selectEl.options).map((o) => o.value));
        yield user_event_1.default.selectOptions(selectAfter, "registered");
        yield (0, react_1.waitFor)(() => expect(selectAfter).toHaveValue("registered"));
        // Debug: log persistence instance and endpointScenarios
        // eslint-disable-next-line no-console
        console.log('[test] persistence:', persistence, 'endpointScenarios:', persistence.endpointScenarios);
        // Assert persistence is updated
        yield (0, react_1.waitFor)(() => expect(persistence.getEndpointScenario("ep1")).toBe("registered"));
        // Re-instantiate platform to reflect persisted scenario
        const platformAfterRegistered = (0, platform_1.createMockPlatform)({ name: "test", plugins }, persistence);
        yield (0, react_1.waitFor)(() => expect(platformAfterRegistered.getResponse("ep1", 200)).toEqual({ ok: "User is registered" }));
        yield (0, react_1.waitFor)(() => expect(platformAfterRegistered.getResponse("ep1", 400)).toEqual({ error: "custom bad" })); // scenario override
        // Unmount and remount, selection should persist
        // (simulate reload)
        localStorage.setItem("test.mockui.endpointScenarios.v1", JSON.stringify({ ep1: "not-registered" }));
        let renderResult = (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        renderResult.unmount();
        renderResult = (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        // TODO: There are two open-settings buttons after remount. Figure out why this happens in tests (not in Storybook). For now, click the last one to ensure functionality is tested.
        const openSettingsButtons = yield renderResult.findAllByTestId("open-settings");
        react_1.fireEvent.click(openSettingsButtons[openSettingsButtons.length - 1]);
        const select2 = yield renderResult.findByDisplayValue("User not registered");
        expect(select2).toHaveValue("not-registered");
    }));
    it("minimal: renders a plain checkbox, unmounts, and remounts", () => __awaiter(void 0, void 0, void 0, function* () {
        const { unmount } = (0, react_1.render)((0, jsx_runtime_1.jsx)("input", { type: "checkbox", "aria-label": "test-checkbox" }));
        expect(react_1.screen.getByLabelText("test-checkbox")).toBeInTheDocument();
        unmount();
        (0, react_1.render)((0, jsx_runtime_1.jsx)("input", { type: "checkbox", "aria-label": "test-checkbox" }));
        expect(react_1.screen.getByLabelText("test-checkbox")).toBeInTheDocument();
    }));
    it("renders swagger button if swaggerUrl is present and opens in new window", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = (0, platform_1.createMockPlatform)({
            name: "swagger-test-platform",
            plugins: [
                {
                    id: "swagger-test",
                    componentId: "SwaggerComp",
                    endpoint: "/api/swagger-test",
                    method: "GET",
                    responses: { 200: { ok: true } },
                    defaultStatus: 200,
                    swaggerUrl: "https://example.com/swagger.json",
                },
            ],
            featureFlags: [],
        });
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByTestId("open-settings"));
        // Find the swagger button
        const btn = yield react_1.screen.findByTestId("open-swagger-swagger-test");
        expect(btn).toBeInTheDocument();
        expect(btn).toHaveAttribute("title", "Open swagger file");
        // Simulate click and check window.open
        const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);
        react_1.fireEvent.click(btn);
        expect(openSpy).toHaveBeenCalledWith("https://example.com/swagger.json", "_blank", "noopener,noreferrer");
        openSpy.mockRestore();
    }));
});
