import React from 'react';
import { theme } from '../theme';

interface ModernToggleProps {
	checked: boolean;
	onChange: () => void;
	label: string;
	ariaLabel?: string;
}

const ModernToggle: React.FC<ModernToggleProps> = ({ checked, onChange, label, ariaLabel = label }) => {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: label ? '8px' : '0' }}>
			<button
				onClick={onChange}
				aria-label={ariaLabel}
				style={{
					width: '44px',
					height: '24px',
					borderRadius: '12px',
					border: 'none',
					background: checked ? theme.colors.success : theme.colors.gray[300],
					position: 'relative',
					cursor: 'pointer',
					transition: 'all 0.2s ease',
				}}
			>
				<div
					style={{
						width: '20px',
						height: '20px',
						borderRadius: '50%',
						background: 'white',
						position: 'absolute',
						top: '2px',
						left: checked ? '22px' : '2px',
						transition: 'all 0.2s ease',
						boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
					}}
				/>
			</button>
			{label && <span style={{ fontSize: '12px', color: theme.colors.gray[600], fontWeight: '500' }}>{label}</span>}
		</div>
	);
};

export default ModernToggle;
