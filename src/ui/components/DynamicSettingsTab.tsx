import React from 'react';
import { MockPlatformCore } from '../../classes/MockPlatformCore';
import ModernToggle from './ModernToggle';
import { useResponsive } from '../hooks/useResponsive';
import { theme } from '../theme';

interface DynamicSettingsTabProps {
	platform: MockPlatformCore;
	onSettingChange: (key: string, value: any) => void;
	onGlobalDisableChange?: () => void;
	globalDisable: boolean;
}

export function DynamicSettingsTab({ platform, onSettingChange, onGlobalDisableChange, globalDisable }: DynamicSettingsTabProps) {
	const settings = platform.getRegisteredSettings();
	const screenSize = useResponsive();
	const isMobile = screenSize === 'mobile';

	return (
		<div style={{ padding: isMobile ? '16px' : '24px' }}>
			{/* Global Disable Control */}
			<div style={{ marginBottom: '32px' }}>
				<h3
					style={{
						fontSize: isMobile ? '16px' : '18px',
						fontWeight: '600',
						marginBottom: '16px',
						margin: 0,
						color: theme.colors.gray[800],
					}}
				>
					Global Settings
				</h3>
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
						boxSizing: 'border-box',
						width: '100%',
						padding: isMobile ? '16px' : '20px',
						border: `1px solid ${theme.colors.gray[200]}`,
						borderRadius: theme.borderRadius.lg,
						background: theme.colors.gray[50],
						boxShadow: theme.shadows.sm,
						flexDirection: isMobile ? 'column' : 'row',
						gap: isMobile ? '12px' : '16px',
					}}
				>
					<div style={{ flex: 1 }}>
						<label
							htmlFor="global-disable"
							style={{
								fontWeight: '600',
								fontSize: '14px',
								display: 'block',
								marginBottom: '4px',
								color: theme.colors.gray[800],
							}}
						>
							Disable All Endpoints
						</label>
						<div
							style={{
								color: theme.colors.gray[600],
								fontSize: '12px',
								lineHeight: 1.4,
							}}
						>
							When enabled, all endpoints will passthrough to the real API, bypassing all mocks regardless of individual endpoint settings.
						</div>
					</div>
					<div style={{ minWidth: isMobile ? 'auto' : '120px' }}>
						<ModernToggle
							checked={globalDisable}
							onChange={() => {
								platform.setGlobalDisable(!globalDisable);
								onGlobalDisableChange?.();
							}}
							label=""
						/>
					</div>
				</div>
			</div>

			{/* Middleware Settings */}
			{settings.length > 0 && (
				<>
					<h3
						style={{
							fontSize: isMobile ? '16px' : '18px',
							fontWeight: '600',
							margin: 0,
							marginBottom: '16px',
							color: theme.colors.gray[800],
						}}
					>
						Middleware Settings
					</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{settings.map(setting => (
							<div
								key={setting.key}
								style={{
									display: 'flex',
									alignItems: 'flex-start',
									justifyContent: 'space-between',
									boxSizing: 'border-box',
									width: '100%',
									padding: isMobile ? '16px' : '20px',
									border: `1px solid ${theme.colors.gray[200]}`,
									borderRadius: theme.borderRadius.lg,
									background: theme.colors.gray[50],
									boxShadow: theme.shadows.sm,
									flexDirection: isMobile ? 'column' : 'row',
									gap: isMobile ? '12px' : '16px',
								}}
							>
								<div style={{ flex: 1 }}>
									<label
										htmlFor={`setting-${setting.key}`}
										style={{
											fontWeight: '600',
											fontSize: '14px',
											display: 'block',
											marginBottom: '4px',
											color: theme.colors.gray[800],
										}}
									>
										{setting.label}
									</label>
									{setting.description && (
										<div
											style={{
												color: theme.colors.gray[600],
												fontSize: '12px',
												lineHeight: 1.4,
											}}
										>
											{setting.description}
										</div>
									)}
								</div>
								<div style={{ minWidth: isMobile ? 'auto' : '120px', width: isMobile ? '100%' : 'auto' }}>
									{setting.type === 'SELECT' && setting.options ? (
										<select
											id={`setting-${setting.key}`}
											value={platform.getMiddlewareSetting(setting.key) || setting.defaultValue || ''}
											onChange={e => onSettingChange(setting.key, e.target.value)}
											style={{
												borderRadius: theme.borderRadius.md,
												padding: '8px 12px',
												fontSize: '14px',
												border: `1px solid ${theme.colors.gray[300]}`,
												width: '100%',
												outline: 'none',
												transition: 'border-color 0.2s ease',
											}}
										>
											{setting.options.map(option => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									) : setting.type === 'TEXT' ? (
										<input
											id={`setting-${setting.key}`}
											type="text"
											value={platform.getMiddlewareSetting(setting.key) || setting.defaultValue || ''}
											onChange={e => onSettingChange(setting.key, e.target.value)}
											style={{
												borderRadius: theme.borderRadius.md,
												padding: '8px 12px',
												fontSize: '14px',
												border: `1px solid ${theme.colors.gray[300]}`,
												width: '100%',
												outline: 'none',
												transition: 'border-color 0.2s ease',
											}}
										/>
									) : setting.type === 'NUMBER' ? (
										<input
											id={`setting-${setting.key}`}
											type="number"
											value={platform.getMiddlewareSetting(setting.key) || setting.defaultValue || ''}
											onChange={e => onSettingChange(setting.key, Number(e.target.value))}
											style={{
												borderRadius: theme.borderRadius.md,
												padding: '8px 12px',
												fontSize: '14px',
												border: `1px solid ${theme.colors.gray[300]}`,
												width: '100%',
												outline: 'none',
												transition: 'border-color 0.2s ease',
											}}
										/>
									) : setting.type === 'BOOLEAN' ? (
										<ModernToggle
											checked={platform.getMiddlewareSetting(setting.key) ?? setting.defaultValue ?? false}
											onChange={() =>
												onSettingChange(setting.key, !(platform.getMiddlewareSetting(setting.key) ?? setting.defaultValue ?? false))
											}
											label=""
										/>
									) : null}
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
