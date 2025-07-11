import React, { useState, createContext, useContext } from 'react';

type TabsContextType = {
	value: string;
	setValue: (v: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export const Tabs: React.FC<{ defaultValue: string; children: React.ReactNode }> = ({ defaultValue, children }) => {
	const [value, setValue] = useState(defaultValue);
	return <TabsContext.Provider value={{ value, setValue }}>{children}</TabsContext.Provider>;
};

export const TabList: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
	<div style={{ display: 'flex', borderBottom: '1px solid #eee', ...style }}>{children}</div>
);

export const Tab: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
	const ctx = useContext(TabsContext);
	if (!ctx) throw new Error('Tab must be used within Tabs');
	const selected = ctx.value === value;
	return (
		<button
			type="button"
			onClick={() => ctx.setValue(value)}
			style={{
				padding: '8px 16px',
				border: 'none',
				borderBottom: selected ? '2px solid #0070f3' : '2px solid transparent',
				background: 'none',
				cursor: 'pointer',
				fontWeight: selected ? 'bold' : 'normal',
			}}
			aria-selected={selected}
			role="tab"
		>
			{children}
		</button>
	);
};

export const TabPanel: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => {
	const ctx = useContext(TabsContext);
	if (!ctx) throw new Error('TabPanel must be used within Tabs');
	if (ctx.value !== value) return null;
	return (
		<div role="tabpanel" style={{ padding: 8 }}>
			{children}
		</div>
	);
};
