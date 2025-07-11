import React from 'react';
import { useState, useRef, useEffect } from 'react';

type PopoverProps = {
	trigger: React.ReactNode;
	children: React.ReactNode | ((close: () => void) => React.ReactNode);
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	placement?: 'left' | 'right';
};

const Popover: React.FC<PopoverProps> = ({ trigger, children, open: controlledOpen, onOpenChange, placement = 'left' }) => {
	const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
	const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
	const setOpen = onOpenChange || setUncontrolledOpen;
	const popoverRef = useRef<HTMLDivElement>(null);

	// Position the popover
	useEffect(() => {
		if (!open || !popoverRef.current) return;

		const popover = popoverRef.current;
		const triggerElement = popover.parentElement?.querySelector('span') as HTMLElement;

		if (triggerElement) {
			const triggerRect = triggerElement.getBoundingClientRect();
			const popoverRect = popover.getBoundingClientRect();

			let top = triggerRect.bottom + 4;
			let left = placement === 'right' ? triggerRect.right - popoverRect.width : triggerRect.left;

			// Ensure popover stays within viewport
			if (left + popoverRect.width > window.innerWidth) {
				left = window.innerWidth - popoverRect.width - 8;
			}
			if (left < 8) {
				left = 8;
			}
			if (top + popoverRect.height > window.innerHeight) {
				top = triggerRect.top - popoverRect.height - 4;
			}

			popover.style.top = `${top}px`;
			popover.style.left = `${left}px`;
		}
	}, [open, placement]);

	// Close on outside click
	useEffect(() => {
		if (!open) return;
		function handle(e: MouseEvent) {
			const refCurrent = popoverRef.current;
			if (refCurrent && e?.target && !refCurrent.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', handle);
		return () => document.removeEventListener('mousedown', handle);
	}, [open, setOpen]);

	const close = () => setOpen(false);

	return (
		<span style={{ position: 'relative', display: 'inline-block' }}>
			<span onClick={() => setOpen(!open)} style={{ cursor: 'pointer' }}>
				{trigger}
			</span>
			{open && (
				<div
					ref={popoverRef}
					style={{
						position: 'fixed',
						zIndex: 9999,
						background: '#fff',
						border: '1px solid #ccc',
						borderRadius: 4,
						boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
						padding: 8,
						minWidth: 160,
					}}
				>
					{typeof children === 'function' ? children(close) : children}
				</div>
			)}
		</span>
	);
};

export default Popover;
