import React from 'react';
import { getStatusColor, theme } from '../theme';

interface StatusBadgeProps {
	code: number;
	isActive: boolean;
	onClick: () => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ code, isActive, onClick }) => {
	const baseColor = getStatusColor(code);
	
	return (
		<button
			onClick={onClick}
			style={{
				padding: '6px 12px',
				borderRadius: theme.borderRadius.full,
				border: 'none',
				fontSize: '12px',
				fontWeight: 'bold',
				cursor: 'pointer',
				transition: 'all 0.2s ease',
				background: isActive ? baseColor : theme.colors.gray[100],
				color: isActive ? 'white' : theme.colors.gray[600],
				transform: isActive ? 'scale(1.05)' : 'scale(1)',
				boxShadow: isActive ? `0 2px 8px ${baseColor}40` : 'none',
				minWidth: '40px',
				outline: 'none',
			}}
			onMouseEnter={(e) => {
				if (!isActive) {
					e.currentTarget.style.background = theme.colors.gray[200];
					e.currentTarget.style.transform = 'scale(1.02)';
				}
			}}
			onMouseLeave={(e) => {
				if (!isActive) {
					e.currentTarget.style.background = theme.colors.gray[100];
					e.currentTarget.style.transform = 'scale(1)';
				}
			}}
		>
			{code}
		</button>
	);
};

export default StatusBadge;