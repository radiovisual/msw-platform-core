import React from 'react';

type DialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
};

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
	if (!open) return null;
	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				background: 'rgba(0,0,0,0.2)',
				zIndex: 1000,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
			onClick={() => onOpenChange(false)}
		>
			<div
				style={{
					background: '#fff',
					borderRadius: 8,
					boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
					minWidth: 400,
					minHeight: 300,
					maxWidth: '90vw',
					maxHeight: '80vh',
					overflow: 'auto',
					padding: 1,
				}}
				onClick={e => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	);
};

export default Dialog;
