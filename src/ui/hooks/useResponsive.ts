import { useState, useEffect } from 'react';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

export const useResponsive = () => {
	const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');

	useEffect(() => {
		const updateScreenSize = () => {
			const width = window.innerWidth;
			if (width < 768) {
				setScreenSize('mobile');
			} else if (width < 1024) {
				setScreenSize('tablet');
			} else {
				setScreenSize('desktop');
			}
		};

		updateScreenSize();
		window.addEventListener('resize', updateScreenSize);
		return () => window.removeEventListener('resize', updateScreenSize);
	}, []);

	return screenSize;
};

export const getResponsiveStyles = (screenSize: ScreenSize) => ({
	container: {
		padding: screenSize === 'mobile' ? '12px' : '24px',
		maxWidth: screenSize === 'mobile' ? '100%' : '1200px',
	},
	grid: {
		display: 'grid',
		gridTemplateColumns: screenSize === 'mobile' 
			? '1fr' 
			: screenSize === 'tablet' 
				? 'repeat(2, 1fr)' 
				: 'repeat(3, 1fr)',
		gap: screenSize === 'mobile' ? '8px' : '16px',
	},
	dialog: {
		padding: screenSize === 'mobile' ? '20px' : '40px',
		maxWidth: screenSize === 'mobile' ? '100%' : '900px',
		borderRadius: screenSize === 'mobile' ? '12px' : '16px',
	},
	modalContent: {
		maxHeight: screenSize === 'mobile' ? '80vh' : '90vh',
		overflow: 'auto',
	}
});