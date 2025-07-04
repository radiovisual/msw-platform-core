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
exports.WithFlagEnabled = exports.Default = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const MockUI_1 = __importDefault(require("./MockUI"));
const platform_1 = require("../platform");
const msw_1 = require("../adapters/msw");
// Create a mock platform instance
const platform = (0, platform_1.createMockPlatform)({
    name: "storybook-demo",
    plugins: [
        {
            id: "hello",
            componentId: "Greeting",
            endpoint: "/api/hello",
            method: "GET",
            responses: {
                200: { message: "Hello, world!" },
                404: { error: "Not found" },
            },
            swaggerUrl: "https://jsonplaceholder.typicode.com/users/1",
            defaultStatus: 200,
            featureFlags: ["EXPERIMENTAL_HELLO"],
            transform: (response, flags) => {
                if (flags.EXPERIMENTAL_HELLO) {
                    return Object.assign(Object.assign({}, response), { message: "Hello, experimental world!" });
                }
                return response;
            },
        },
        {
            id: "goodbye",
            componentId: "Farewell",
            endpoint: "/api/goodbye",
            method: "GET",
            responses: {
                200: { message: "Goodbye!" },
                404: { error: "Not found" },
            },
            defaultStatus: 200,
        },
        {
            id: "user",
            componentId: "User",
            endpoint: "/api/user",
            method: "GET",
            responses: {
                200: { message: "User is Michael!" },
                404: { error: "Not found" },
            },
            defaultStatus: 200,
            queryResponses: {
                "type=admin": { 200: { message: "User is Admin!" } },
                "type=guest": { 200: { message: "User is Guest!" } },
            },
        },
        {
            id: "user-status",
            componentId: "User",
            endpoint: "/api/user-status",
            method: "GET",
            responses: {
                200: { status: "unknown" },
                404: { error: "Not found" },
            },
            defaultStatus: 200,
            scenarios: [
                { id: "guest", label: "Guest User", responses: { 200: { status: "guest" } } },
                { id: "member", label: "Member User", responses: { 200: { status: "member" } } },
                { id: "admin", label: "Admin User", responses: { 200: { status: "admin" } } },
            ],
        },
        {
            id: "external-user",
            componentId: "External",
            endpoint: "https://jsonplaceholder.typicode.com/users/1",
            method: "GET",
            responses: {
                200: { name: "Mocked User", email: "mock@example.com" },
            },
            defaultStatus: 200,
        },
    ],
    featureFlags: ["EXPERIMENTAL_HELLO"],
});
// Demo component that fetches from the endpoint
function DemoApp() {
    const [result, setResult] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchHello = () => __awaiter(this, void 0, void 0, function* () {
        setError(null);
        setResult(null);
        try {
            const res = yield fetch("/api/hello");
            const data = yield res.json();
            setResult(data);
        }
        catch (e) {
            setError(String(e));
        }
    });
    const fetchGoodbye = () => __awaiter(this, void 0, void 0, function* () {
        setError(null);
        setResult(null);
        try {
            const res = yield fetch("/api/goodbye");
            const data = yield res.json();
            setResult(data);
        }
        catch (e) {
            setError(String(e));
        }
    });
    const fetchUser = () => __awaiter(this, void 0, void 0, function* () {
        setError(null);
        setResult(null);
        try {
            const res = yield fetch("/api/user");
            const data = yield res.json();
            setResult(data);
        }
        catch (e) {
            setError(String(e));
        }
    });
    const fetchUserStatus = () => __awaiter(this, void 0, void 0, function* () {
        setError(null);
        setResult(null);
        try {
            const res = yield fetch("/api/user-status");
            const data = yield res.json();
            setResult(data);
        }
        catch (e) {
            setError(String(e));
        }
    });
    const fetchExternalUser = () => __awaiter(this, void 0, void 0, function* () {
        setError(null);
        setResult(null);
        try {
            const res = yield fetch("https://jsonplaceholder.typicode.com/users/1");
            const data = yield res.json();
            setResult(data);
        }
        catch (e) {
            setError(String(e));
        }
    });
    const fetchUserAdmin = () => __awaiter(this, void 0, void 0, function* () {
        setError(null);
        setResult(null);
        try {
            const res = yield fetch("/api/user?type=admin");
            const data = yield res.json();
            setResult(data);
        }
        catch (e) {
            setError(String(e));
        }
    });
    const fetchUserGuest = () => __awaiter(this, void 0, void 0, function* () {
        setError(null);
        setResult(null);
        try {
            const res = yield fetch("/api/user?type=guest");
            const data = yield res.json();
            setResult(data);
        }
        catch (e) {
            setError(String(e));
        }
    });
    return ((0, jsx_runtime_1.jsxs)("div", { style: { padding: 32 }, children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-bold mb-4", children: "Demo: /api/hello & /api/goodbye" }), (0, jsx_runtime_1.jsx)("button", { className: "border rounded px-4 py-2 mb-4", onClick: fetchHello, children: "Fetch /api/hello" }), (0, jsx_runtime_1.jsx)("button", { className: "border rounded px-4 py-2 mb-4", onClick: fetchGoodbye, style: { marginLeft: 8 }, children: "Fetch /api/goodbye" }), (0, jsx_runtime_1.jsx)("button", { className: "border rounded px-4 py-2 mb-4", onClick: fetchUser, style: { marginLeft: 8 }, children: "Fetch /api/user" }), (0, jsx_runtime_1.jsx)("button", { className: "border rounded px-4 py-2 mb-4", onClick: fetchUserAdmin, style: { marginLeft: 8 }, children: "Fetch /api/user?type=admin" }), (0, jsx_runtime_1.jsx)("button", { className: "border rounded px-4 py-2 mb-4", onClick: fetchUserGuest, style: { marginLeft: 8 }, children: "Fetch /api/user?type=guest" }), (0, jsx_runtime_1.jsx)("button", { className: "border rounded px-4 py-2 mb-4", onClick: fetchUserStatus, style: { marginLeft: 8 }, children: "Fetch /api/user-status" }), (0, jsx_runtime_1.jsx)("button", { className: "border rounded px-4 py-2 mb-4", onClick: fetchExternalUser, style: { marginLeft: 8 }, children: "Fetch https://jsonplaceholder.typicode.com/users/1" }), (0, jsx_runtime_1.jsx)("pre", { className: "bg-gray-100 p-2 rounded", children: result ? JSON.stringify(result, null, 2) : error ? error : "No data yet" }), (0, jsx_runtime_1.jsx)(MockUI_1.default, { platform: platform })] }));
}
const meta = {
    title: "MockUI/Popup",
    component: DemoApp,
};
exports.default = meta;
exports.Default = {
    parameters: {
        msw: {
            handlers: (0, msw_1.mswHandlersFromPlatform)(platform),
        },
    },
};
exports.WithFlagEnabled = {
    parameters: {
        msw: {
            handlers: (0, msw_1.mswHandlersFromPlatform)(platform),
        },
    },
    render: () => {
        // Enable the feature flag before rendering
        platform.setFeatureFlag("EXPERIMENTAL_HELLO", true);
        return (0, jsx_runtime_1.jsx)(DemoApp, {});
    },
};
