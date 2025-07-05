import { MockPlatformCore } from '../../platform';

interface DynamicSettingsTabProps {
	platform: MockPlatformCore;
	onSettingChange: (key: string, value: any) => void;
}

export function DynamicSettingsTab({ platform, onSettingChange }: DynamicSettingsTabProps) {
	const settings = platform.getRegisteredSettings();

	if (settings.length === 0) {
		return null;
	}

	return (
		<div style={{ marginBottom: 24 }}>
			<h3 style={{ fontSize: 18, fontWeight: 500 }}>Middleware Settings</h3>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
				{settings.map(setting => (
					<div
						key={setting.key}
						style={{
							display: 'flex',
							alignItems: 'flex-start',
							justifyContent: 'space-between',
							boxSizing: 'border-box',
							width: '100%',
							padding: '16px',
							border: '1px solid #eee',
							borderRadius: 8,
							background: '#fafafa',
						}}
					>
						<div style={{ flex: 1, marginRight: 16 }}>
							<label
								htmlFor={`setting-${setting.key}`}
								style={{
									fontWeight: 600,
									fontSize: 14,
									display: 'block',
									marginBottom: 4,
								}}
							>
								{setting.label}
							</label>
							{setting.description && <div style={{ color: '#666', fontSize: 12, lineHeight: 1.4 }}>{setting.description}</div>}
						</div>
						<div style={{ minWidth: 120 }}>
							{setting.type === 'select' && setting.options ? (
								<select
									id={`setting-${setting.key}`}
									value={platform.getMiddlewareSetting(setting.key) || setting.defaultValue || ''}
									onChange={e => onSettingChange(setting.key, e.target.value)}
									style={{
										borderRadius: 6,
										padding: '8px 12px',
										fontSize: 14,
										border: '1px solid #ccc',
										width: '100%',
									}}
								>
									{setting.options.map(option => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							) : setting.type === 'text' ? (
								<input
									id={`setting-${setting.key}`}
									type="text"
									value={platform.getMiddlewareSetting(setting.key) || setting.defaultValue || ''}
									onChange={e => onSettingChange(setting.key, e.target.value)}
									style={{
										borderRadius: 6,
										padding: '8px 12px',
										fontSize: 14,
										border: '1px solid #ccc',
										width: '100%',
									}}
								/>
							) : setting.type === 'number' ? (
								<input
									id={`setting-${setting.key}`}
									type="number"
									value={platform.getMiddlewareSetting(setting.key) || setting.defaultValue || ''}
									onChange={e => onSettingChange(setting.key, Number(e.target.value))}
									style={{
										borderRadius: 6,
										padding: '8px 12px',
										fontSize: 14,
										border: '1px solid #ccc',
										width: '100%',
									}}
								/>
							) : setting.type === 'boolean' ? (
								<input
									id={`setting-${setting.key}`}
									type="checkbox"
									checked={platform.getMiddlewareSetting(setting.key) ?? setting.defaultValue ?? false}
									onChange={e => onSettingChange(setting.key, e.target.checked)}
									style={{
										width: 20,
										height: 20,
										cursor: 'pointer',
									}}
								/>
							) : null}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
