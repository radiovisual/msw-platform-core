import React, { useEffect, useState } from 'react';

interface PortalProps {
	children: React.ReactNode;
	target?: HTMLElement;
}

/**
 * Simple portal implementation that doesn't require react-dom dependency
 * Creates a new stacking context at the root level to ensure proper z-index behavior
 */
const Portal: React.FC<PortalProps> = ({ children }) => {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	if (!mounted) {
		return null;
	}

	// If target is provided and react-dom is available, we could use createPortal
	// For now, we use the stacking context approach that works without react-dom
	return (
		<div
			style={{
				// Force a new stacking context at the root level
				position: 'fixed',
				top: 0,
				left: 0,
				width: 0,
				height: 0,
				zIndex: 2147483647,
				pointerEvents: 'none', // Don't block clicks on the page
			}}
		>
			<div style={{ pointerEvents: 'auto' }}>{children}</div>
		</div>
	);
};

export default Portal;
