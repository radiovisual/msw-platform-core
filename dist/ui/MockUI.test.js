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
function makePlatform(overrides = []) {
    const plugins = [
        {
            id: "ep1",
            endpoint: "/api/v1/foo",
            method: "GET",
            responses: { 200: { ok: true }, 400: { error: true } },
            defaultStatus: 200,
        },
        {
            id: "ep2",
            endpoint: "/api/v1/bar",
            method: "POST",
            responses: { 201: { created: true }, 422: { error: true } },
            defaultStatus: 201,
        },
        ...overrides,
    ];
    return (0, platform_1.createMockPlatform)({ plugins, featureFlags: ["FLAG_A", "FLAG_B"] }, new platform_1.InMemoryPersistence());
}
describe("MockUI", () => {
    beforeEach(() => {
        localStorage.clear();
    });
    it("renders endpoints and feature flags from platform", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByRole("button"));
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
        let lastDisabled = [];
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform, onStateChange: ({ disabledPluginIds }) => {
                lastDisabled = disabledPluginIds;
            } }));
        react_1.fireEvent.click(yield react_1.screen.findByRole("button"));
        // Endpoints tab is default
        const checkboxes = yield react_1.screen.findAllByRole("checkbox");
        react_1.fireEvent.click(checkboxes[0]);
        yield (0, react_1.waitFor)(() => expect(lastDisabled).toContain("ep1"));
        react_1.fireEvent.click(checkboxes[0]);
        // Wait for state to settle after toggling
        yield (0, react_1.waitFor)(() => expect(lastDisabled).not.toContain("ep1"));
    }));
    it("changes status code and updates platform", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByRole("button"));
        // Endpoints tab is default
        const radio = yield react_1.screen.findByLabelText("400");
        react_1.fireEvent.click(radio);
        yield (0, react_1.waitFor)(() => expect(platform.getStatusOverride("ep1")).toBe(400));
    }));
    it("toggles feature flag and updates platform", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByRole("button"));
        // Switch to Feature Flags tab robustly
        const featureFlagsTab = yield react_1.screen.findByRole("tab", { name: /feature flags/i });
        react_1.fireEvent.click(featureFlagsTab);
        // Find the card or row containing FLAG_A
        const flagA = yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "FLAG_A" || false);
        expect(flagA).toBeInTheDocument();
        const flagCard = flagA.closest("div");
        expect(flagCard).toBeInTheDocument();
        const checkbox = (0, react_1.within)(flagCard).getByRole("checkbox");
        react_1.fireEvent.click(checkbox);
        yield (0, react_1.waitFor)(() => expect(platform.getFeatureFlags().FLAG_A).toBe(true));
        react_1.fireEvent.click(checkbox);
        yield (0, react_1.waitFor)(() => expect(platform.getFeatureFlags().FLAG_A).toBe(false));
    }));
    it("creates, renames, deletes groups and manages membership", () => __awaiter(void 0, void 0, void 0, function* () {
        const platform = makePlatform();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByRole("button"));
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
        const platform = makePlatform();
        const { unmount } = (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByRole("button"));
        // Switch to Groups tab robustly
        const groupsTab = yield react_1.screen.findByRole("tab", { name: /groups/i });
        react_1.fireEvent.click(groupsTab);
        const input = yield react_1.screen.findByPlaceholderText((c, n) => { var _a; return ((_a = n === null || n === void 0 ? void 0 : n.getAttribute("placeholder")) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === "new group name"; });
        react_1.fireEvent.change(input, { target: { value: "PersistedGroup" } });
        react_1.fireEvent.keyDown(input, { key: "Enter" });
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "PersistedGroup" || false)).toBeInTheDocument();
        // Toggle endpoint off
        const checkboxes = yield react_1.screen.findAllByRole("checkbox");
        react_1.fireEvent.click(checkboxes[0]);
        yield (0, react_1.waitFor)(() => expect((react_1.screen.getAllByRole("checkbox"))[0]).not.toBeChecked());
        // Unmount and remount
        unmount();
        (0, react_1.render)((0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform }));
        react_1.fireEvent.click(yield react_1.screen.findByRole("button"));
        const groupsTab2 = yield react_1.screen.findByRole("tab", { name: /groups/i });
        react_1.fireEvent.click(groupsTab2);
        expect(yield react_1.screen.findByText((c, n) => (n === null || n === void 0 ? void 0 : n.textContent) === "PersistedGroup" || false)).toBeInTheDocument();
        // The endpoint should still be passthrough (unchecked)
        yield (0, react_1.waitFor)(() => expect((react_1.screen.getAllByRole("checkbox"))[0]).not.toBeChecked());
    }));
});
