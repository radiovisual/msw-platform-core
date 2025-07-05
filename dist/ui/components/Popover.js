'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const jsx_runtime_1 = require('react/jsx-runtime');
const react_1 = require('react');
const Popover = ({ trigger, children, open: controlledOpen, onOpenChange, placement = 'left' }) => {
	const [uncontrolledOpen, setUncontrolledOpen] = (0, react_1.useState)(false);
	const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
	const setOpen = onOpenChange || setUncontrolledOpen;
	const popoverRef = (0, react_1.useRef)(null);
	// Close on outside click
	(0, react_1.useEffect)(() => {
		if (!open) return;
		function handle(e) {
			if (popoverRef.current && !popoverRef.current.contains(e.target)) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', handle);
		return () => document.removeEventListener('mousedown', handle);
	}, [open, setOpen]);
	const close = () => setOpen(false);
	return (0, jsx_runtime_1.jsxs)('span', {
		style: { position: 'relative', display: 'inline-block' },
		children: [
			(0, jsx_runtime_1.jsx)('span', { onClick: () => setOpen(!open), style: { cursor: 'pointer' }, children: trigger }),
			open &&
				(0, jsx_runtime_1.jsx)('div', {
					ref: popoverRef,
					style: {
						position: 'absolute',
						top: '100%',
						left: placement === 'right' ? 'auto' : 0,
						right: placement === 'right' ? 0 : 'auto',
						background: '#fff',
						border: '1px solid #ccc',
						borderRadius: 4,
						boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
						padding: 8,
						zIndex: 100,
						minWidth: 160,
					},
					children: typeof children === 'function' ? children(close) : children,
				}),
		],
	});
};
exports.default = Popover;
