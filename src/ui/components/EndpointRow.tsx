import React from 'react';
import Button from './Button';
import Checkbox from './Checkbox';
import Label from './Label';
import StatusBadge from './StatusBadge';
import ModernToggle from './ModernToggle';
import { Plus, FileText } from './Icon';
import { useResponsive } from '../hooks/useResponsive';
import { getMethodColor, theme } from '../theme';
import type { Plugin } from '../../types';
import type { MockPlatformCore } from '../../classes/MockPlatformCore';
import Modal from './Modal';

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
	const badges = platform?.getEndpointBadges?.(plugin) || [];

	const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const scenarioId = e.target.value;
		onScenarioChange(plugin.id, scenarioId);
	};

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
			{/* Row 1: Mock Toggle */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'flex-end',
					marginBottom: '16px',
				}}
			>
				<ModernToggle
					aria-label={`Toggle endpoint ${plugin.endpoint}`}
					checked={isMocked}
					onChange={() => onToggleMocked(plugin.id)}
					label="Mock"
				/>
			</div>

			{/* Row 2: HTTP Method + Endpoint URL */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					marginBottom: '12px',
					flexWrap: 'wrap',
				}}
			>
				{/* Method Badge - inline with endpoint */}
				<div
					style={{
						padding: '4px 8px',
						borderRadius: theme.borderRadius.sm,
						fontSize: '10px',
						fontWeight: 'bold',
						background: `${getMethodColor(plugin.method)}15`,
						color: getMethodColor(plugin.method),
						border: `1px solid ${getMethodColor(plugin.method)}40`,
						textAlign: 'center',
						letterSpacing: '0.5px',
						textTransform: 'uppercase',
						flexShrink: 0,
					}}
				>
					{plugin.method}
				</div>

				{/* Endpoint URL */}
				<div
					style={{
						fontFamily: 'monospace',
						fontSize: isMobile ? '13px' : '14px',
						fontWeight: 'bold',
						color: theme.colors.gray[800],
						wordBreak: 'break-word',
						lineHeight: '1.4',
						flex: 1,
					}}
				>
					{plugin.endpoint}
				</div>
			</div>

			{/* Row 3: Query Parameter Variants (if any) */}
			{plugin.queryResponses && Object.keys(plugin.queryResponses).length > 0 && (
				<div
					style={{
						marginBottom: '16px',
					}}
				>
					<div
						style={{
							fontSize: '11px',
							color: theme.colors.gray[500],
							marginBottom: '8px',
							fontWeight: '500',
						}}
					>
						Query Parameter Variants:
					</div>
					<div
						style={{
							display: 'flex',
							flexWrap: 'wrap',
							gap: '6px',
						}}
					>
						{Object.keys(plugin.queryResponses).map((queryParams, index) => (
							<div
								key={index}
								style={{
									fontFamily: 'monospace',
									fontSize: '11px',
									color: theme.colors.gray[600],
									padding: '4px 8px',
									background: theme.colors.gray[50],
									border: `1px solid ${theme.colors.gray[200]}`,
									borderRadius: theme.borderRadius.sm,
									wordBreak: 'break-all',
								}}
							>
								?{queryParams}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Row 4: Status Badges */}
			<div
				style={{
					display: 'flex',
					gap: '8px',
					flexWrap: 'wrap',
					alignItems: 'center',
					marginBottom: '16px',
				}}
			>
				<span
					style={{
						fontSize: '12px',
						color: theme.colors.gray[600],
						fontWeight: '500',
						marginRight: '4px',
					}}
				>
					Status:
				</span>
				{getStatusCodes(plugin).map(code => (
					<StatusBadge key={code} code={code} isActive={getStatus(plugin) === code} onClick={() => onUpdateStatusCode(plugin.id, code)} />
				))}
			</div>

			{/* Row 5: Scenario Dropdown (if any) */}
			{scenarioList && scenarioList.length > 0 && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						marginBottom: '16px',
					}}
				>
					<span
						style={{
							fontSize: '12px',
							color: theme.colors.gray[600],
							fontWeight: '500',
							minWidth: '60px',
						}}
					>
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
							flex: isMobile ? 1 : 'none',
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

			{/* Row 6: Delay, Groups, and Swagger */}
			<div
				style={{
					display: 'flex',
					flexDirection: isMobile ? 'column' : 'row',
					gap: isMobile ? '12px' : '16px',
					alignItems: isMobile ? 'stretch' : 'center',
					justifyContent: 'space-between',
					paddingTop: '12px',
					borderTop: `1px solid ${theme.colors.gray[100]}`,
					marginBottom: '16px',
				}}
			>
				{/* Left side: Delay Control */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<span
						style={{
							fontSize: '12px',
							color: theme.colors.gray[600],
							fontWeight: '500',
						}}
					>
						Delay:
					</span>
					<input
						type="number"
						min="0"
						max="10000"
						step="50"
						value={getDelay(plugin.id)}
						onChange={e => onUpdateDelay(plugin.id, Number.parseInt(e.target.value) || 0)}
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
					<span
						style={{
							fontSize: '12px',
							color: theme.colors.gray[500],
						}}
					>
						ms
					</span>
				</div>

				{/* Right side: Groups and Swagger */}
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<span
						style={{
							fontSize: '12px',
							color: theme.colors.gray[600],
							fontWeight: '500',
						}}
					>
						Groups
					</span>

					<Modal
						trigger={
							<Button
								style={{
									padding: isMobile ? '4px 6px' : '6px 8px',
									fontSize: isMobile ? '11px' : '12px',
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
								<Plus style={{ width: isMobile ? 12 : 14, height: isMobile ? 12 : 14 }} />
								Groups
							</Button>
						}
						title="Add to Groups"
					>
						<div style={{ padding: '8px 0' }}>
							{groups.length === 0 && (
								<div style={{ color: theme.colors.gray[500], fontSize: '14px', textAlign: 'center', padding: '20px' }}>
									No groups available yet
								</div>
							)}
							{groups.map(group => {
								const checked = group.endpointIds.includes(plugin.id);
								return (
									<div
										key={group.id}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: '12px',
											padding: '8px 0',
											borderBottom: `1px solid ${theme.colors.gray[100]}`,
										}}
									>
										<Checkbox
											id={`addtogroup-${plugin.id}-${group.id}`}
											checked={checked}
											onChange={() => {
												if (checked) onRemoveFromGroup(plugin.id, group.id);
												else onAddToGroup(plugin.id, group.id);
											}}
											aria-label={`Add ${plugin.endpoint} to group ${group.name}`}
										/>
										<Label htmlFor={`addtogroup-${plugin.id}-${group.id}`} style={{ fontSize: '14px', flex: 1 }}>
											{group.name}
										</Label>
									</div>
								);
							})}
						</div>
					</Modal>

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
							onMouseEnter={e => {
								e.currentTarget.style.background = theme.colors.gray[100];
								e.currentTarget.style.color = theme.colors.gray[700];
							}}
							onMouseLeave={e => {
								e.currentTarget.style.background = 'none';
								e.currentTarget.style.color = theme.colors.gray[500];
							}}
						>
							<FileText style={{ width: 16, height: 16 }} />
						</button>
					)}
				</div>
			</div>

			{/* Row 7: Group and Badge Display */}
			{(groups.filter(group => group.endpointIds.includes(plugin.id)).length > 0 || badges.length > 0) && (
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: '6px',
						paddingTop: '12px',
						borderTop: `1px solid ${theme.colors.gray[100]}`,
						marginBottom: '12px',
					}}
				>
					{/* Component Badge - now with other badges */}
					<span
						style={{
							padding: '4px 8px',
							borderRadius: theme.borderRadius.sm,
							fontSize: '11px',
							background: theme.colors.gray[100],
							color: theme.colors.gray[600],
							border: `1px solid ${theme.colors.gray[200]}`,
							fontWeight: '500',
						}}
					>
						{plugin.componentId}
					</span>

					{/* User group badges */}
					{groups
						.filter(group => group.endpointIds.includes(plugin.id))
						.map(group => (
							<span
								key={group.id}
								style={{
									padding: '4px 8px',
									borderRadius: theme.borderRadius.sm,
									fontSize: '11px',
									background: theme.colors.primary,
									color: 'white',
									fontWeight: '500',
								}}
							>
								{group.name}
							</span>
						))}

					{/* Dynamic badges */}
					{badges.map(badge => (
						<span
							key={badge.id}
							style={{
								padding: '4px 8px',
								borderRadius: theme.borderRadius.sm,
								fontSize: '11px',
								background: theme.colors.info,
								color: 'white',
								fontWeight: '500',
							}}
						>
							{badge.text}
						</span>
					))}
				</div>
			)}

			{/* Always show component badge even if no other badges */}
			{!(groups.filter(group => group.endpointIds.includes(plugin.id)).length > 0 || badges.length > 0) && (
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: '6px',
						paddingTop: '12px',
						borderTop: `1px solid ${theme.colors.gray[100]}`,
						marginBottom: '12px',
					}}
				>
					<span
						style={{
							padding: '4px 8px',
							borderRadius: theme.borderRadius.sm,
							fontSize: '11px',
							background: theme.colors.gray[100],
							color: theme.colors.gray[600],
							border: `1px solid ${theme.colors.gray[200]}`,
							fontWeight: '500',
						}}
					>
						{plugin.componentId}
					</span>
				</div>
			)}

			{/* Passthrough Notice */}
			{!isMocked && (
				<div
					style={{
						padding: '8px 12px',
						borderRadius: theme.borderRadius.sm,
						background: theme.colors.gray[50],
						border: `1px solid ${theme.colors.gray[200]}`,
					}}
				>
					<p
						style={{
							fontSize: '12px',
							color: theme.colors.gray[600],
							fontStyle: 'italic',
							margin: 0,
						}}
					>
						🔄 Endpoint will passthrough (not mocked)
					</p>
				</div>
			)}
		</div>
	);
};

export default EndpointRow;
