import React from 'react';
import { getStatusColor, theme } from '../theme';

interface StatusBadgeProps {
	code: number;
	isActive: boolean;
	onClick: () => void;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ code, isActive, onClick }) => {
	const color = getStatusColor(code);

	return (
		<button
			onClick={onClick}
			style={{
				padding: '4px 8px',
				borderRadius: theme.borderRadius.sm,
				fontSize: '12px',
				fontWeight: 'bold',
				border: `1px solid ${color}`,
				background: isActive ? color : 'transparent',
				color: isActive ? 'white' : color,
				cursor: 'pointer',
				transition: 'all 0.2s ease',
			}}
		>
			{code}
		</button>
	);
};

export default StatusBadge;
