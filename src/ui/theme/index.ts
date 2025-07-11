export const theme = {
	colors: {
		primary: '#3b82f6',
		success: '#10b981',
		warning: '#f59e0b',
		danger: '#ef4444',
		info: '#06b6d4',
		gray: {
			50: '#f9fafb',
			100: '#f3f4f6',
			200: '#e5e7eb',
			300: '#d1d5db',
			400: '#9ca3af',
			500: '#6b7280',
			600: '#4b5563',
			700: '#374151',
			800: '#1f2937',
			900: '#111827',
		},
		status: {
			200: '#10b981',
			201: '#10b981',
			300: '#06b6d4',
			400: '#f59e0b',
			401: '#f97316',
			403: '#f97316',
			404: '#f97316',
			500: '#ef4444',
			502: '#ef4444',
			503: '#8b5cf6',
		}
	},
	breakpoints: {
		mobile: 768,
		tablet: 1024,
	},
	borderRadius: {
		sm: '6px',
		md: '8px',
		lg: '12px',
		xl: '16px',
		full: '9999px',
	},
	shadows: {
		sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
		md: '0 4px 6px rgba(0, 0, 0, 0.07)',
		lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
		xl: '0 25px 50px rgba(0, 0, 0, 0.25)',
	}
};

export const getMethodColor = (method: string): string => {
	switch (method.toUpperCase()) {
		case 'GET':
			return theme.colors.success;
		case 'POST':
			return theme.colors.primary;
		case 'PUT':
			return theme.colors.warning;
		case 'PATCH':
			return theme.colors.info;
		case 'DELETE':
			return theme.colors.danger;
		default:
			return theme.colors.gray[500];
	}
};

export const getStatusColor = (status: number): string => {
	return theme.colors.status[status as keyof typeof theme.colors.status] || theme.colors.gray[500];
};