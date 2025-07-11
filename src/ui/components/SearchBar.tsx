import React from 'react';
import { theme } from '../theme';

// Simple Search icon since we don't have it in the existing Icon component
const Search = ({ style }: { style?: React.CSSProperties }) => (
	<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={style} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="11" cy="11" r="8" />
		<path d="m21 21-4.35-4.35" />
	</svg>
);

interface SearchBarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	style?: React.CSSProperties;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder, style }) => {
	return (
		<div style={{ position: 'relative', ...style }}>
			<Search
				style={{
					position: 'absolute',
					left: '12px',
					top: '50%',
					transform: 'translateY(-50%)',
					width: '16px',
					height: '16px',
					color: theme.colors.gray[400],
				}}
			/>
			<input
				type="text"
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				style={{
					width: '100%',
					padding: '12px 12px 12px 40px',
					borderRadius: theme.borderRadius.lg,
					border: `1px solid ${theme.colors.gray[200]}`,
					fontSize: '14px',
					outline: 'none',
					transition: 'all 0.2s ease',
					background: 'white',
					boxSizing: 'border-box',
				}}
				onFocus={e => {
					e.target.style.borderColor = theme.colors.primary;
					e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary}20`;
				}}
				onBlur={e => {
					e.target.style.borderColor = theme.colors.gray[200];
					e.target.style.boxShadow = 'none';
				}}
			/>
		</div>
	);
};

export default SearchBar;
