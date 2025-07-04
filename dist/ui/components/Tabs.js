"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabPanel = exports.Tab = exports.TabList = exports.Tabs = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const TabsContext = (0, react_1.createContext)(undefined);
const Tabs = ({ defaultValue, children }) => {
    const [value, setValue] = (0, react_1.useState)(defaultValue);
    return ((0, jsx_runtime_1.jsx)(TabsContext.Provider, { value: { value, setValue }, children: children }));
};
exports.Tabs = Tabs;
const TabList = ({ children, style }) => ((0, jsx_runtime_1.jsx)("div", { style: Object.assign({ display: "flex", borderBottom: "1px solid #eee" }, style), children: children }));
exports.TabList = TabList;
const Tab = ({ value, children }) => {
    const ctx = (0, react_1.useContext)(TabsContext);
    if (!ctx)
        throw new Error("Tab must be used within Tabs");
    const selected = ctx.value === value;
    return ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => ctx.setValue(value), style: {
            padding: "8px 16px",
            border: "none",
            borderBottom: selected ? "2px solid #0070f3" : "2px solid transparent",
            background: "none",
            cursor: "pointer",
            fontWeight: selected ? "bold" : "normal",
        }, "aria-selected": selected, role: "tab", children: children }));
};
exports.Tab = Tab;
const TabPanel = ({ value, children }) => {
    const ctx = (0, react_1.useContext)(TabsContext);
    if (!ctx)
        throw new Error("TabPanel must be used within Tabs");
    if (ctx.value !== value)
        return null;
    return (0, jsx_runtime_1.jsx)("div", { role: "tabpanel", style: { padding: 16 }, children: children });
};
exports.TabPanel = TabPanel;
