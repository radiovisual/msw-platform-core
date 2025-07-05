import React from 'react';
import { Users } from './Icon';
import type { Plugin } from '../../types';
import PropTypes from 'prop-types';

interface AutoGroup {
	id: string;
	name: string;
	endpointIds: string[];
	auto: boolean;
}

interface AutoGroupRowProps {
	group: AutoGroup;
	plugins: Plugin[];
}

const AutoGroupRow: React.FC<AutoGroupRowProps> = ({ group, plugins }) => {
	return (
		<div
			key={group.id}
			style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, background: '#f8f8f8', opacity: 0.7 }}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
				<Users style={{ height: 16, width: 16 }} />
				<span>{group.name}</span>
				<span style={{ borderRadius: 6, padding: '4px 8px', fontSize: 12, background: '#f0f0f0' }}>
					{plugins.filter(p => p.componentId === group.name).length}
				</span>
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
				{plugins
					.filter(p => p.componentId === group.name)
					.map(plugin => (
						<div
							key={plugin.id}
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								padding: 12,
								borderRadius: 6,
								border: '1px solid #eee',
							}}
						>
							<span
								style={{
									padding: '4px 8px',
									borderRadius: 4,
									fontSize: 12,
									fontWeight: 600,
									background: '#e6f7ff',
									color: '#0070f3',
								}}
							>
								{plugin.method}
							</span>
							<span style={{ fontFamily: 'monospace', fontSize: 14 }}>{plugin.endpoint}</span>
						</div>
					))}
				{plugins.filter(p => p.componentId === group.name).length === 0 && (
					<div style={{ textAlign: 'center', padding: '24px 0', fontSize: 12, color: '#888' }}>
						No endpoints in this group yet.
					</div>
				)}
			</div>
		</div>
	);
};

AutoGroupRow.propTypes = {
	group: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		endpointIds: PropTypes.arrayOf(PropTypes.string).isRequired,
		auto: PropTypes.bool.isRequired,
	}).isRequired,
	plugins: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		method: PropTypes.string.isRequired,
		endpoint: PropTypes.string.isRequired,
		componentId: PropTypes.string.isRequired,
	})).isRequired,
};

export default AutoGroupRow;