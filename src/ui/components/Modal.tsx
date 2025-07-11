import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { theme } from '../theme';

interface ModalProps {
	trigger: React.ReactNode;
	children: React.ReactNode;
	title?: string;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

const Modal: React.FC<ModalProps> = ({ trigger, children, title, open: controlledOpen, onOpenChange }) => {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
	const setOpen = onOpenChange || setUncontrolledOpen;
	const modalRef = useRef<HTMLDivElement>(null);

	// Close on escape key
	useEffect(() => {
		if (!open) return;
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setOpen(false);
			}
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	}, [open, setOpen]);

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [open]);

	// Close on backdrop click
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			setOpen(false);
		}
	};

	return (
		<>
			<span onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
				{trigger}
			</span>

			{open && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 10000,
						padding: '20px',
					}}
					onClick={handleBackdropClick}
				>
					<div
						ref={modalRef}
						style={{
							backgroundColor: 'white',
							borderRadius: theme.borderRadius.lg,
							boxShadow: theme.shadows.xl,
							maxWidth: '500px',
							width: '100%',
							maxHeight: '80vh',
							overflow: 'auto',
							position: 'relative',
						}}
					>
						{/* Header */}
						<div
							style={{
								padding: '20px 24px 16px',
								borderBottom: `1px solid ${theme.colors.gray[200]}`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							{title && (
								<h2
									style={{
										fontSize: '18px',
										fontWeight: '600',
										color: theme.colors.gray[800],
										margin: 0,
									}}
								>
									{title}
								</h2>
							)}
							<button
								onClick={() => setOpen(false)}
								style={{
									background: 'none',
									border: 'none',
									fontSize: '24px',
									cursor: 'pointer',
									color: theme.colors.gray[500],
									padding: '4px',
									borderRadius: theme.borderRadius.sm,
									marginLeft: 'auto',
								}}
								aria-label="Close modal"
							>
								×
							</button>
						</div>

						{/* Content */}
						<div
							style={{
								padding: '20px 24px',
							}}
						>
							{children}
						</div>

						{/* Footer */}
						<div
							style={{
								padding: '16px 24px 20px',
								borderTop: `1px solid ${theme.colors.gray[200]}`,
								display: 'flex',
								justifyContent: 'flex-end',
								gap: '12px',
							}}
						>
							<button
								onClick={() => setOpen(false)}
								style={{
									padding: '8px 16px',
									border: `1px solid ${theme.colors.gray[300]}`,
									borderRadius: theme.borderRadius.sm,
									background: 'white',
									color: theme.colors.gray[700],
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
								}}
							>
								Done
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default Modal;
