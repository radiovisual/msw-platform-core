import React, { useRef, useEffect } from 'react';
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
	const inputRef = useRef<HTMLInputElement>(null);
	const wasFocusedRef = useRef(false);

	// Track if input was focused before re-render
	useEffect(() => {
		const input = inputRef.current;
		if (input && document.activeElement === input) {
			wasFocusedRef.current = true;
		}
	});

	// Restore focus after re-render if it was previously focused
	useEffect(() => {
		const input = inputRef.current;
		if (input && wasFocusedRef.current && document.activeElement !== input) {
			input.focus();
			wasFocusedRef.current = false;
		}
	});

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
					pointerEvents: 'none',
				}}
			/>
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
				autoComplete="off"
				spellCheck="false"
				style={{
					width: '100%',
					padding: '12px 12px 12px 40px',
					borderRadius: theme.borderRadius.lg,
					border: `1px solid ${theme.colors.gray[200]}`,
					fontSize: '14px',
					outline: 'none',
					background: 'white',
					boxSizing: 'border-box',
					transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
				}}
				onFocus={() => {
					if (inputRef.current) {
						inputRef.current.style.borderColor = theme.colors.primary;
						inputRef.current.style.boxShadow = `0 0 0 3px ${theme.colors.primary}20`;
					}
				}}
				onBlur={() => {
					if (inputRef.current) {
						inputRef.current.style.borderColor = theme.colors.gray[200];
						inputRef.current.style.boxShadow = 'none';
					}
					wasFocusedRef.current = false;
				}}
			/>
		</div>
	);
};

export default SearchBar;
