import React from 'react';
import Checkbox from './Checkbox';

interface FeatureFlagsTabProps {
	featureFlags: { [key: string]: boolean };
	onToggleFeatureFlag: (flag: string, value: boolean) => void;
}

const FeatureFlagsTab: React.FC<FeatureFlagsTabProps> = ({ featureFlags, onToggleFeatureFlag }) => {
	return (
		<div>
			<h3 style={{ fontSize: 18, fontWeight: 500 }}>Feature Flags</h3>
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
				{Object.entries(featureFlags).map(([flag, enabled]) => (
					<div key={flag} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
						<div>
							<span style={{ fontSize: 14, fontWeight: 500 }}>{flag}</span>
							<p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
								{enabled ? 'Currently enabled' : 'Currently disabled'}
							</p>
						</div>
						<Checkbox
							checked={!!enabled}
							onChange={() => onToggleFeatureFlag(flag, !enabled)}
							id={flag}
							aria-label={`Toggle feature flag ${flag}`}
						/>
					</div>
				))}
			</div>
		</div>
	);
};



export default FeatureFlagsTab;