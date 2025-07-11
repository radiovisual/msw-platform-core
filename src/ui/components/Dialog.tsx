import React, { useEffect } from 'react';
import { useResponsive, getResponsiveStyles } from '../hooks/useResponsive';
import { theme } from '../theme';
import { injectAnimations } from '../utils/animations';

type DialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
};

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
	const screenSize = useResponsive();
	const responsiveStyles = getResponsiveStyles(screenSize);
	
	useEffect(() => {
		injectAnimations();
	}, []);

	if (!open) return null;

	return (
		<div
			style={{
				position: 'fixed',
				inset: 0,
				zIndex: 1000,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'rgba(0, 0, 0, 0.6)',
				backdropFilter: 'blur(4px)',
				padding: responsiveStyles.dialog.padding,
				animation: 'fadeIn 0.3s ease-out'
			}}
			onClick={() => onOpenChange(false)}
		>
			<div
				style={{
					background: 'white',
					borderRadius: responsiveStyles.dialog.borderRadius,
					boxShadow: theme.shadows.xl,
					width: '100%',
					maxWidth: responsiveStyles.dialog.maxWidth,
					maxHeight: responsiveStyles.modalContent.maxHeight,
					overflow: 'hidden',
					animation: 'slideUp 0.3s ease-out'
				}}
				onClick={e => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	);
};

export default Dialog;
