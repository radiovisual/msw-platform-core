import React from 'react';
import { theme } from '../theme';

interface ModernToggleProps {
	checked: boolean;
	onChange: () => void;
	label: string;
	disabled?: boolean;
}

const ModernToggle: React.FC<ModernToggleProps> = ({ checked, onChange, label, disabled = false }) => {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
			<div
				onClick={disabled ? undefined : onChange}
				style={{
					width: '48px',
					height: '28px',
					borderRadius: '14px',
					background: disabled 
						? theme.colors.gray[200] 
						: checked 
							? theme.colors.success 
							: theme.colors.gray[300],
					position: 'relative',
					cursor: disabled ? 'not-allowed' : 'pointer',
					transition: 'all 0.2s ease',
					boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
					opacity: disabled ? 0.5 : 1,
				}}
			>
				<div style={{
					width: '24px',
					height: '24px',
					borderRadius: '50%',
					background: 'white',
					position: 'absolute',
					top: '2px',
					left: checked ? '22px' : '2px',
					transition: 'all 0.2s ease',
					boxShadow: theme.shadows.md,
				}} />
			</div>
			<span style={{ 
				fontSize: '14px', 
				fontWeight: '500',
				color: disabled ? theme.colors.gray[400] : theme.colors.gray[700]
			}}>
				{label}
			</span>
		</div>
	);
};

export default ModernToggle;