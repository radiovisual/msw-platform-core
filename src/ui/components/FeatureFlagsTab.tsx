import React, { useState, useMemo } from 'react';
import Checkbox from './Checkbox';

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

	return (
		<div>
			<h3 style={{ fontSize: 18, fontWeight: 500 }}>Feature Flags</h3>

			{/* Search input */}
			<div style={{ marginTop: 16, marginBottom: 16 }}>
				<input
					type="text"
					placeholder="Search feature flags..."
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					style={{
						width: '100%',
						padding: '8px 12px',
						border: '1px solid #ddd',
						borderRadius: 6,
						fontSize: 14,
						boxSizing: 'border-box',
					}}
				/>
			</div>

			{/* Results count */}
			{searchTerm && (
				<div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
					{filteredFlags.length} of {Object.keys(featureFlags).length} feature flags
				</div>
			)}

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
				{filteredFlags.map(([flag, enabled]) => {
					const metadata = featureFlagMetadata[flag];
					const description = metadata?.description;

					return (
						<div
							key={flag}
							onClick={() => handleCardClick(flag, enabled)}
							style={{
								border: '1px solid #eee',
								borderRadius: 8,
								padding: 16,
								background: enabled ? '#f6fff6' : '#fff6f6',
								transition: 'background-color 0.2s ease, transform 0.1s ease',
								cursor: 'pointer',
								userSelect: 'none',
							}}
							onMouseEnter={e => {
								e.currentTarget.style.transform = 'translateY(-1px)';
								e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
							}}
							onMouseLeave={e => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = 'none';
							}}
							role="button"
							tabIndex={0}
							aria-label={`Toggle feature flag ${flag} (currently ${enabled ? 'enabled' : 'disabled'})`}
							onKeyDown={e => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									handleCardClick(flag, enabled);
								}
							}}
						>
							<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
								<div style={{ flex: 1 }}>
									<span style={{ fontSize: 14, fontWeight: 500, display: 'block', marginBottom: 4 }}>{flag}</span>
									{description && (
										<p
											style={{
												fontSize: 12,
												color: '#666',
												margin: 0,
												lineHeight: 1.4,
												marginBottom: 8,
											}}
										>
											{description}
										</p>
									)}
									<span
										style={{
											fontSize: 11,
											color: enabled ? '#22c55e' : '#ef4444',
											fontWeight: 500,
											textTransform: 'uppercase',
											letterSpacing: '0.5px',
										}}
									>
										{enabled ? 'Enabled' : 'Disabled'}
									</span>
								</div>
								<Checkbox
									checked={!!enabled}
									onChange={() => handleCardClick(flag, enabled)}
									id={flag}
									aria-label={`Toggle feature flag ${flag}`}
									onClick={e => e.stopPropagation()}
								/>
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
						color: '#666',
						fontSize: 14,
					}}
				>
					No feature flags match &quot;{searchTerm}&quot;
				</div>
			)}
		</div>
	);
};

export default FeatureFlagsTab;
