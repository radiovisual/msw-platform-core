import React from 'react';
import Button from './Button';
import Checkbox from './Checkbox';
import Radio from './Radio';
import Popover from './Popover';
import Label from './Label';
import StatusBadge from './StatusBadge';
import ModernToggle from './ModernToggle';
import { Plus, FileText } from './Icon';
import { useResponsive } from '../hooks/useResponsive';
import { getMethodColor, theme } from '../theme';
import type { Plugin } from '../../types';
import type { MockPlatformCore } from '../../classes/MockPlatformCore';

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
	platform: MockPlatformCore;
	onUpdateDelay: (pluginId: string, delay: number) => void;
	getDelay: (pluginId: string) => number;
}

// Helper function to format endpoint display with query parameters
function getEndpointDisplayVariants(plugin: Plugin): string[] {
	if (!plugin.queryResponses || Object.keys(plugin.queryResponses).length === 0) {
		return [plugin.endpoint];
	}
	const queryPatterns = Object.keys(plugin.queryResponses);
	return queryPatterns.map(q => `${plugin.endpoint}?${q}`);
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
	platform,
	onUpdateDelay,
	getDelay,
}) => {
	const screenSize = useResponsive();
	const scenarioList = plugin.scenarios;
	const activeScenarioId = endpointScenarios[plugin.id];
	const isMobile = screenSize === 'mobile';

	// Get dynamic badges from platform
	const badges = platform.getEndpointBadges(plugin);

	const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const scenarioId = e.target.value;
		onScenarioChange(plugin.id, scenarioId);
	};

	const endpointVariants = getEndpointDisplayVariants(plugin);

	return (
		<div
			style={{
				background: 'white',
				borderRadius: theme.borderRadius.lg,
				padding: isMobile ? '16px' : '20px',
				marginBottom: '12px',
				boxShadow: theme.shadows.sm,
				border: `1px solid ${theme.colors.gray[200]}`,
				transition: 'all 0.2s ease',
				opacity: isMocked ? 1 : 0.7,
				transform: isMocked ? 'scale(1)' : 'scale(0.98)',
			}}
		>
			{/* Main Content Section */}
			<div style={{
				display: 'flex',
				alignItems: 'center',
				gap: '12px',
				marginBottom: '16px',
				flexWrap: isMobile ? 'wrap' : 'nowrap'
			}}>
				{/* Method Badge */}
				<div style={{
					padding: '8px 16px',
					borderRadius: theme.borderRadius.full,
					fontSize: '12px',
					fontWeight: 'bold',
					background: getMethodColor(plugin.method),
					color: 'white',
					minWidth: '60px',
					textAlign: 'center',
					boxShadow: theme.shadows.sm,
				}}>
					{plugin.method}
				</div>
				
				{/* Endpoint Information */}
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{
						fontFamily: 'monospace',
						fontSize: '14px',
						fontWeight: 'bold',
						color: theme.colors.gray[800],
						wordBreak: 'break-all'
					}}>
						{plugin.endpoint}
					</div>
					{plugin.queryResponses && Object.keys(plugin.queryResponses).length > 0 && (
						<div style={{
							fontSize: '12px',
							color: theme.colors.gray[500],
							marginTop: '4px'
						}}>
							{Object.keys(plugin.queryResponses).length} query variants
						</div>
					)}
				</div>
				
				{/* Component Badge */}
				<div style={{
					padding: '4px 8px',
					borderRadius: theme.borderRadius.sm,
					fontSize: '11px',
					background: theme.colors.gray[100],
					color: theme.colors.gray[600],
					border: `1px solid ${theme.colors.gray[200]}`,
				}}>
					{plugin.componentId}
				</div>

				{/* Toggle */}
				<ModernToggle
					checked={isMocked}
					onChange={() => onToggleMocked(plugin.id)}
					label="Mock"
				/>
			</div>

			{/* Controls Section */}
			<div style={{
				display: 'flex',
				flexDirection: isMobile ? 'column' : 'row',
				gap: isMobile ? '12px' : '16px',
				alignItems: isMobile ? 'stretch' : 'center',
				marginBottom: '16px',
			}}>
				{/* Status Badges */}
				<div style={{
					display: 'flex',
					gap: '8px',
					flexWrap: 'wrap',
					alignItems: 'center'
				}}>
					<span style={{
						fontSize: '12px',
						color: theme.colors.gray[600],
						fontWeight: '500',
						marginRight: '4px'
					}}>
						Status:
					</span>
					{getStatusCodes(plugin).map(code => (
						<StatusBadge
							key={code}
							code={code}
							isActive={getStatus(plugin) === code}
							onClick={() => onUpdateStatusCode(plugin.id, code)}
						/>
					))}
				</div>
			</div>

			{/* Additional Controls Row */}
			<div style={{
				display: 'flex',
				flexDirection: isMobile ? 'column' : 'row',
				gap: isMobile ? '12px' : '16px',
				alignItems: isMobile ? 'stretch' : 'center',
				paddingTop: '12px',
				borderTop: `1px solid ${theme.colors.gray[100]}`,
				width: '100%',
			}}>
				{/* Delay Control */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
					<span style={{
						fontSize: '12px',
						color: theme.colors.gray[600],
						fontWeight: '500',
						minWidth: '60px'
					}}>
						Delay:
					</span>
					<input
						type="number"
						min="0"
						max="10000"
						step="50"
						value={getDelay(plugin.id)}
						onChange={e => onUpdateDelay(plugin.id, parseInt(e.target.value) || 0)}
						style={{
							width: '80px',
							padding: '6px 8px',
							border: `1px solid ${theme.colors.gray[300]}`,
							borderRadius: theme.borderRadius.sm,
							fontSize: '12px',
							outline: 'none',
							transition: 'border-color 0.2s ease',
						}}
					/>
					<span style={{
						fontSize: '12px',
						color: theme.colors.gray[500]
					}}>
						ms
					</span>
				</div>

				{/* Scenario Dropdown */}
				{scenarioList && scenarioList.length > 0 && (
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{
							fontSize: '12px',
							color: theme.colors.gray[600],
							fontWeight: '500',
							minWidth: '60px'
						}}>
							Scenario:
						</span>
						<select
							value={activeScenarioId || ''}
							onChange={handleScenarioChange}
							style={{
								padding: '6px 8px',
								border: `1px solid ${theme.colors.gray[300]}`,
								borderRadius: theme.borderRadius.sm,
								fontSize: '12px',
								outline: 'none',
								minWidth: '120px',
							}}
						>
							<option value="">Default</option>
							{scenarioList.map(scenario => (
								<option key={scenario.id} value={scenario.id}>
									{scenario.label}
								</option>
							))}
						</select>
					</div>
				)}

				{/* Action Buttons */}
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
					{/* Group Management */}
					<Popover
						trigger={
							<Button
								style={{
									padding: '6px 8px',
									fontSize: '12px',
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									border: `1px solid ${theme.colors.gray[300]}`,
									borderRadius: theme.borderRadius.sm,
									background: theme.colors.gray[50],
									color: theme.colors.gray[600],
									cursor: 'pointer',
								}}
							>
								<Plus style={{ width: 14, height: 14 }} />
								Groups
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
									padding: 12,
									position: 'absolute',
									top: '100%',
									zIndex: 1000,
									background: 'white',
									boxShadow: theme.shadows.lg,
									borderRadius: theme.borderRadius.md,
									border: `1px solid ${theme.colors.gray[200]}`,
								}}
							>
								<div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '8px', color: theme.colors.gray[700] }}>
									Add to Groups
								</div>
								{groups.length === 0 && (
									<div style={{ color: theme.colors.gray[500], fontSize: '12px' }}>
										No groups yet
									</div>
								)}
								{groups.map(group => {
									const checked = group.endpointIds.includes(plugin.id);
									return (
										<div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
											<Checkbox
												id={`addtogroup-${plugin.id}-${group.id}`}
												checked={checked}
												onChange={() => {
													if (checked) onRemoveFromGroup(plugin.id, group.id);
													else onAddToGroup(plugin.id, group.id);
												}}
												aria-label={`Add ${plugin.endpoint} to group ${group.name}`}
											/>
											<Label htmlFor={`addtogroup-${plugin.id}-${group.id}`} style={{ fontSize: '12px' }}>
												{group.name}
											</Label>
										</div>
									);
								})}
							</div>
						)}
					</Popover>

					{/* Swagger Button */}
					{plugin.swaggerUrl && (
						<button
							style={{
								border: 'none',
								background: 'none',
								cursor: 'pointer',
								padding: '6px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								borderRadius: theme.borderRadius.sm,
								color: theme.colors.gray[500],
								transition: 'all 0.2s ease',
							}}
							title="Open swagger file"
							aria-label="Open swagger file"
							onClick={() => {
								window.open(plugin.swaggerUrl, '_blank', 'noopener,noreferrer');
							}}
							data-testid={`open-swagger-${plugin.id}`}
							onMouseEnter={(e) => {
								e.currentTarget.style.background = theme.colors.gray[100];
								e.currentTarget.style.color = theme.colors.gray[700];
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.background = 'none';
								e.currentTarget.style.color = theme.colors.gray[500];
							}}
						>
							<FileText style={{ width: 16, height: 16 }} />
						</button>
					)}
				</div>
			</div>

			{/* Group and Badge Display */}
			{(groups.filter(group => group.endpointIds.includes(plugin.id)).length > 0 || badges.length > 0) && (
				<div style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: '6px',
					paddingTop: '12px',
					borderTop: `1px solid ${theme.colors.gray[100]}`,
				}}>
					{/* User group badges */}
					{groups
						.filter(group => group.endpointIds.includes(plugin.id))
						.map(group => (
							<span key={group.id} style={{
								padding: '4px 8px',
								borderRadius: theme.borderRadius.sm,
								fontSize: '11px',
								background: theme.colors.primary,
								color: 'white',
								fontWeight: '500',
							}}>
								{group.name}
							</span>
						))}
					
					{/* Dynamic badges */}
					{badges.map(badge => (
						<span key={badge.id} style={{
							padding: '4px 8px',
							borderRadius: theme.borderRadius.sm,
							fontSize: '11px',
							background: theme.colors.info,
							color: 'white',
							fontWeight: '500',
						}}>
							{badge.text}
						</span>
					))}
				</div>
			)}

			{/* Passthrough Notice */}
			{!isMocked && (
				<div style={{
					padding: '8px 12px',
					borderRadius: theme.borderRadius.sm,
					background: theme.colors.gray[50],
					border: `1px solid ${theme.colors.gray[200]}`,
					marginTop: '12px',
				}}>
					<p style={{
						fontSize: '12px',
						color: theme.colors.gray[600],
						fontStyle: 'italic',
						margin: 0,
					}}>
						🔄 Endpoint will passthrough (not mocked)
					</p>
				</div>
			)}
		</div>
	);
};

export default EndpointRow;