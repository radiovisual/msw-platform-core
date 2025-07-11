import React, { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import ModernToggle from './ModernToggle';
import { useResponsive } from '../hooks/useResponsive';
import { theme } from '../theme';

interface FeatureFlagsTabProps {
	featureFlags: { [key: string]: boolean };
	featureFlagMetadata?: { [key: string]: { description?: string; default?: boolean } };
	onToggleFeatureFlag: (flag: string, value: boolean) => void;
}

const FeatureFlagsTab: React.FC<FeatureFlagsTabProps> = ({ featureFlags, featureFlagMetadata = {}, onToggleFeatureFlag }) => {
	const [searchTerm, setSearchTerm] = useState('');

	const filteredFlags = useMemo(() => {
		const entries = Object.entries(featureFlags);
		if (!searchTerm.trim()) return entries;

		const searchLower = searchTerm.toLowerCase();
		return entries.filter(([flag, _enabled]) => {
			const metadata = featureFlagMetadata[flag];
			const description = metadata?.description || '';
			return flag.toLowerCase().includes(searchLower) || description.toLowerCase().includes(searchLower);
		});
	}, [featureFlags, featureFlagMetadata, searchTerm]);

	const handleCardClick = (flag: string, currentValue: boolean) => {
		onToggleFeatureFlag(flag, !currentValue);
	};

	const screenSize = useResponsive();
	const isMobile = screenSize === 'mobile';

	return (
		<div style={{ padding: isMobile ? '16px' : '24px' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '20px',
					flexWrap: isMobile ? 'wrap' : 'nowrap',
					gap: isMobile ? '12px' : '0',
				}}
			>
				<h3
					style={{
						fontSize: isMobile ? '16px' : '18px',
						fontWeight: '600',
						margin: 0,
						color: theme.colors.gray[800],
					}}
				>
					Feature Flags
				</h3>
				<div
					style={{
						padding: '6px 12px',
						borderRadius: theme.borderRadius.full,
						fontSize: '12px',
						background: theme.colors.success,
						color: 'white',
						fontWeight: '500',
						boxShadow: theme.shadows.sm,
					}}
				>
					{Object.values(featureFlags).filter(Boolean).length} / {Object.keys(featureFlags).length} enabled
				</div>
			</div>

			{/* Search input */}
			<div style={{ marginBottom: '20px' }}>
				<SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search feature flags..." />
			</div>

			{/* Results count */}
			{searchTerm && (
				<div
					style={{
						fontSize: '12px',
						color: theme.colors.gray[600],
						marginBottom: '16px',
						padding: '8px 12px',
						background: theme.colors.gray[50],
						borderRadius: theme.borderRadius.sm,
						border: `1px solid ${theme.colors.gray[200]}`,
					}}
				>
					{filteredFlags.length} of {Object.keys(featureFlags).length} feature flags
				</div>
			)}

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : screenSize === 'tablet' ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(280px, 1fr))',
					gap: isMobile ? '12px' : '16px',
				}}
			>
				{filteredFlags.map(([flag, enabled]) => {
					const metadata = featureFlagMetadata[flag];
					const description = metadata?.description;

					return (
						<div
							key={flag}
							onClick={() => handleCardClick(flag, enabled)}
							style={{
								border: `1px solid ${theme.colors.gray[200]}`,
								borderRadius: theme.borderRadius.lg,
								padding: isMobile ? '16px' : '20px',
								background: 'white',
								transition: 'all 0.2s ease',
								cursor: 'pointer',
								userSelect: 'none',
								boxShadow: theme.shadows.sm,
								opacity: enabled ? 1 : 0.8,
							}}
							onMouseEnter={e => {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = theme.shadows.md;
								e.currentTarget.style.borderColor = theme.colors.primary;
							}}
							onMouseLeave={e => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = theme.shadows.sm;
								e.currentTarget.style.borderColor = theme.colors.gray[200];
							}}
							role="checkbox"
							aria-checked={enabled}
							tabIndex={0}
							aria-label={`Toggle feature flag ${flag}`}
							onKeyDown={e => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleCardClick(flag, enabled);
								}
							}}
						>
							<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
								<div style={{ flex: 1 }}>
									<h4
										style={{
											fontSize: '14px',
											fontWeight: '600',
											display: 'block',
											marginBottom: '8px',
											color: theme.colors.gray[800],
											margin: 0,
										}}
									>
										{flag}
									</h4>
									{description && (
										<p
											style={{
												fontSize: '12px',
												color: theme.colors.gray[600],
												margin: 0,
												lineHeight: 1.4,
												marginBottom: '8px',
											}}
										>
											{description}
										</p>
									)}
									<span
										style={{
											fontSize: '11px',
											color: enabled ? theme.colors.success : theme.colors.danger,
											fontWeight: '500',
											textTransform: 'uppercase',
											letterSpacing: '0.5px',
										}}
									>
										{enabled ? 'Enabled' : 'Disabled'}
									</span>
								</div>
								<div onClick={e => e.stopPropagation()}>
									<ModernToggle checked={!!enabled} onChange={() => handleCardClick(flag, enabled)} label="" />
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* No results message */}
			{searchTerm && filteredFlags.length === 0 && (
				<div
					style={{
						textAlign: 'center',
						padding: '32px 16px',
						color: theme.colors.gray[600],
						fontSize: '14px',
					}}
				>
					No feature flags match &quot;{searchTerm}&quot;
				</div>
			)}
		</div>
	);
};

export default FeatureFlagsTab;
