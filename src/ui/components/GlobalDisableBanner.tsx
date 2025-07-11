import React from 'react';
import Button from './Button';
import { X } from './Icon';
import { theme } from '../theme';

// Simple AlertTriangle icon since we don't have it in the existing Icon component
const AlertTriangle = ({ style }: { style?: React.CSSProperties }) => (
	<svg 
		fill="none" 
		stroke="currentColor" 
		viewBox="0 0 24 24" 
		style={style}
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
		<line x1="12" y1="9" x2="12" y2="13" />
		<line x1="12" y1="17" x2="12.01" y2="17" />
	</svg>
);

interface GlobalDisableBannerProps {
	isGloballyDisabled: boolean;
	disabledCount: number;
	totalCount: number;
	onEnableAll: () => void;
	onDismiss?: () => void;
}

const GlobalDisableBanner: React.FC<GlobalDisableBannerProps> = ({
	isGloballyDisabled,
	disabledCount,
	totalCount,
	onEnableAll,
	onDismiss
}) => {
	const shouldShow = isGloballyDisabled || disabledCount === totalCount;
	
	if (!shouldShow) return null;

	return (
		<div style={{
			position: 'sticky',
			top: 0,
			zIndex: 100,
			background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
			color: 'white',
			padding: '16px 24px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			borderRadius: '0 0 8px 8px',
			boxShadow: theme.shadows.lg,
			animation: 'slideDown 0.3s ease-out'
		}}>
			<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
				<AlertTriangle style={{ width: 24, height: 24 }} />
				<div>
					<div style={{ fontWeight: 'bold', fontSize: '16px' }}>
						{isGloballyDisabled ? 'All Endpoints Disabled' : `${disabledCount}/${totalCount} Endpoints Disabled`}
					</div>
					<div style={{ fontSize: '14px', opacity: 0.9 }}>
						Your mock endpoints are not responding to requests
					</div>
				</div>
			</div>
			<div style={{ display: 'flex', gap: '8px' }}>
				<Button
					onClick={onEnableAll}
					style={{
						background: 'rgba(255,255,255,0.2)',
						color: 'white',
						border: '1px solid rgba(255,255,255,0.3)',
						padding: '8px 16px',
						borderRadius: theme.borderRadius.md,
						fontWeight: 'bold',
						cursor: 'pointer',
						transition: 'all 0.2s ease',
					}}
				>
					Enable All
				</Button>
				{onDismiss && (
					<Button 
						onClick={onDismiss} 
						style={{ 
							background: 'transparent', 
							border: 'none', 
							color: 'white',
							cursor: 'pointer',
							padding: '8px',
							borderRadius: theme.borderRadius.md
						}}
					>
						<X style={{ width: 20, height: 20 }} />
					</Button>
				)}
			</div>
		</div>
	);
};

export default GlobalDisableBanner;