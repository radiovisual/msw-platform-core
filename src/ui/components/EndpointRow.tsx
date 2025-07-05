import React from 'react';
import Button from './Button';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Popover from './Popover';
import Label from './Label';
import { Plus, FileText } from 'lucide-react';
import type { Plugin } from '../../types';
import PropTypes from 'prop-types';

interface EndpointRowProps {
	plugin: Plugin;
	isMocked: boolean;
	onToggleMocked: (pluginId: string) => void;
	onUpdateStatusCode: (pluginId: string, statusCode: number) => void;
	onAddToGroup: (pluginId: string, groupId: string) => void;
	onRemoveFromGroup: (pluginId: string, groupId: string) => void;
	getStatus: (plugin: Plugin) => number;
	getStatusCodes: (plugin: Plugin) => number[];
	groups: Array<{ id: string; name: string; endpointIds: string[] }>;
	endpointScenarios: { [key: string]: string };
	onScenarioChange: (pluginId: string, scenarioId: string) => void;
}

const EndpointRow: React.FC<EndpointRowProps> = ({
	plugin,
	isMocked,
	onToggleMocked,
	onUpdateStatusCode,
	onAddToGroup,
	onRemoveFromGroup,
	getStatus,
	getStatusCodes,
	groups,
	endpointScenarios,
	onScenarioChange,
}) => {
	const scenarioList = plugin.scenarios;
	const activeScenarioId = endpointScenarios[plugin.id];

	const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const scenarioId = e.target.value;
		onScenarioChange(plugin.id, scenarioId);
	};

	return (
		<div
			style={{
				border: '1px solid #eee',
				borderRadius: 8,
				padding: 16,
				marginBottom: 12,
				background: isMocked ? '#f6fff6' : '#fff6f6',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<Checkbox
							checked={isMocked}
							onChange={() => onToggleMocked(plugin.id)}
							id={`mocked-${plugin.id}`}
							aria-label={`Toggle endpoint ${plugin.endpoint}`}
						/>
						<Label htmlFor={`mocked-${plugin.id}`}>mocked?</Label>
					</div>
					<span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, background: '#e6f7ff', color: '#0070f3' }}>
						{plugin.method}
					</span>
					<span style={{ fontFamily: 'monospace', fontSize: 14 }}>{plugin.endpoint}</span>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
						{/* Auto group badge */}
						<span
							style={{ border: '1px solid #eee', padding: '0 4px', borderRadius: 4, fontSize: 12, background: '#f0f0f0', opacity: 0.7 }}
						>
							{plugin.componentId}
						</span>
						{/* User group badges */}
						{groups
							.filter((group) => group.endpointIds.includes(plugin.id))
							.map((group) => (
								<span key={group.id} style={{ border: '1px solid #eee', padding: '0 4px', borderRadius: 4, fontSize: 12 }}>
									{group.name}
								</span>
							))}
						{/* Scenario dropdown */}
						{scenarioList && scenarioList.length > 0 && (
							<select
								value={activeScenarioId || ''}
								onChange={handleScenarioChange}
								style={{ marginLeft: 8, borderRadius: 4, padding: '2px 8px', fontSize: 12 }}
							>
								<option value="">Default</option>
								{scenarioList.map(scenario => (
									<option key={scenario.id} value={scenario.id}>
										{scenario.label}
									</option>
								))}
							</select>
						)}
					</div>
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: 'auto' }}>
					<div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
						<Popover
							placement="right"
							trigger={
								<Button
									style={{
										border: 'none',
										background: 'none',
										cursor: 'pointer',
										padding: 2,
										display: 'inline-flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: 16,
									}}
									title="Add to group"
									aria-label="Add to group"
									data-testid={`add-to-group-${plugin.id}`}
								>
									<Plus style={{ width: 16, height: 16 }} />
								</Button>
							}
						>
							{() => (
								<div
									style={{
										minWidth: 180,
										maxWidth: '90vw',
										left: 'auto',
										right: 0,
										padding: 8,
										position: 'absolute',
										top: '100%',
										zIndex: 1000,
										background: '#fff',
										boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
										borderRadius: 6,
									}}
								>
									<div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Add to Groups</div>
									{groups.length === 0 && <div style={{ color: '#888', fontSize: 12 }}>No groups yet</div>}
									{groups.map((group) => {
										const checked = group.endpointIds.includes(plugin.id);
										return (
											<div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
												<Checkbox
													id={`addtogroup-${plugin.id}-${group.id}`}
													checked={checked}
													onChange={() => {
														if (checked) onRemoveFromGroup(plugin.id, group.id);
														else onAddToGroup(plugin.id, group.id);
													}}
													aria-label={`Add ${plugin.endpoint} to group ${group.name}`}
												/>
												<Label htmlFor={`addtogroup-${plugin.id}-${group.id}`}>{group.name}</Label>
											</div>
										);
									})}
								</div>
							)}
						</Popover>
						{plugin.swaggerUrl && (
							<button
								style={{
									border: 'none',
									background: 'none',
									cursor: 'pointer',
									marginLeft: 4,
									padding: 2,
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontSize: 16,
								}}
								title="Open swagger file"
								aria-label="Open swagger file"
								onClick={() => {
									window.open(plugin.swaggerUrl, '_blank', 'noopener,noreferrer');
								}}
								data-testid={`open-swagger-${plugin.id}`}
							>
								<FileText style={{ width: 16, height: 16 }} />
							</button>
						)}
					</div>
				</div>
			</div>
			<div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
				{getStatusCodes(plugin).map((code: number) => (
					<div key={code} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
						<Radio
							name={`status-${plugin.id}`}
							value={code}
							checked={getStatus(plugin) === code}
							onChange={() => onUpdateStatusCode(plugin.id, code)}
							id={`${plugin.id}-${code}`}
						/>
						<Label htmlFor={`${plugin.id}-${code}`}>{code}</Label>
					</div>
				))}
			</div>
			{!isMocked && (
				<p style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>endpoint will passthrough to localhost:4711</p>
			)}
		</div>
	);
};

EndpointRow.propTypes = {
	plugin: PropTypes.shape({
		id: PropTypes.string.isRequired,
		method: PropTypes.string.isRequired,
		endpoint: PropTypes.string.isRequired,
		componentId: PropTypes.string.isRequired,
		scenarios: PropTypes.arrayOf(PropTypes.shape({
			id: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired,
		})),
		swaggerUrl: PropTypes.string,
	}).isRequired,
	isMocked: PropTypes.bool.isRequired,
	onToggleMocked: PropTypes.func.isRequired,
	onUpdateStatusCode: PropTypes.func.isRequired,
	onAddToGroup: PropTypes.func.isRequired,
	onRemoveFromGroup: PropTypes.func.isRequired,
	getStatus: PropTypes.func.isRequired,
	getStatusCodes: PropTypes.func.isRequired,
	groups: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		endpointIds: PropTypes.arrayOf(PropTypes.string).isRequired,
	})).isRequired,
	endpointScenarios: PropTypes.object.isRequired,
	onScenarioChange: PropTypes.func.isRequired,
};

export default EndpointRow; 