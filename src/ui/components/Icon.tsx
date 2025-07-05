import React from 'react';

interface IconProps {
	size?: number;
	style?: React.CSSProperties;
	className?: string;
	onClick?: () => void;
}

const IconWrapper: React.FC<IconProps & { children: React.ReactNode }> = ({ size = 24, style, className, onClick, children }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		style={style}
		className={className}
		onClick={onClick}
	>
		{children}
	</svg>
);

export const Users: React.FC<IconProps> = props => (
	<IconWrapper {...props}>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<path d="M16 3.128a4 4 0 0 1 0 7.744" />
		<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
		<circle cx="9" cy="7" r="4" />
	</IconWrapper>
);

export const Plus: React.FC<IconProps> = props => (
	<IconWrapper {...props}>
		<path d="M5 12h14" />
		<path d="M12 5v14" />
	</IconWrapper>
);

export const FileText: React.FC<IconProps> = props => (
	<IconWrapper {...props}>
		<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
		<path d="M14 2v4a2 2 0 0 0 2 2h4" />
		<path d="M10 9H8" />
		<path d="M16 13H8" />
		<path d="M16 17H8" />
	</IconWrapper>
);

export const Settings: React.FC<IconProps> = props => (
	<IconWrapper {...props}>
		<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
		<circle cx="12" cy="12" r="3" />
	</IconWrapper>
);

export const X: React.FC<IconProps> = props => (
	<IconWrapper {...props}>
		<path d="M18 6 6 18" />
		<path d="m6 6 12 12" />
	</IconWrapper>
);

export const ChevronDown: React.FC<IconProps> = props => (
	<IconWrapper {...props}>
		<path d="m6 9 6 6 6-6" />
	</IconWrapper>
);

export const Edit2: React.FC<IconProps> = props => (
	<IconWrapper {...props}>
		<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
	</IconWrapper>
);

export const Trash2: React.FC<IconProps> = props => (
	<IconWrapper {...props}>
		<path d="M3 6h18" />
		<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
		<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
		<line x1="10" x2="10" y1="11" y2="17" />
		<line x1="14" x2="14" y1="11" y2="17" />
	</IconWrapper>
);

export default {
	Users,
	Plus,
	FileText,
	Settings,
	X,
	ChevronDown,
	Edit2,
	Trash2,
};
