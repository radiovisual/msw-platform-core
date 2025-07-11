/* eslint-disable no-console */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from './components/Button';
import { Settings } from './components/Icon';
import type { MockPlatformCore } from '../classes/MockPlatformCore';

interface PopupMockUIAdvancedProps {
	platform: MockPlatformCore;
	onStateChange?: (opts: { disabledPluginIds: string[] }) => void;
	groupStorageKey?: string;
	disabledPluginIdsStorageKey?: string;
}

export default function PopupMockUIAdvanced({ 
	platform, 
	onStateChange, 
	groupStorageKey, 
	disabledPluginIdsStorageKey 
}: PopupMockUIAdvancedProps) {
	const [isOpen, setIsOpen] = useState(false);
	const popupRef = useRef<Window | null>(null);
	const intervalRef = useRef<number | null>(null);

	// Keyboard shortcuts: Ctrl+M to toggle MockUI visibility, Escape to close
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.key.toLowerCase() === 'm') {
				event.preventDefault();
				setIsOpen(prev => !prev);
			} else if (event.key === 'Escape') {
				event.preventDefault();
				setIsOpen(prev => prev ? false : prev);
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, []);

	// Handle popup window open/close
	useEffect(() => {
		if (isOpen && !popupRef.current) {
			openPopup();
		} else if (!isOpen && popupRef.current) {
			closePopup();
		}
	}, [isOpen]);

	// Monitor popup window state
	useEffect(() => {
		if (isOpen && popupRef.current) {
			intervalRef.current = setInterval(() => {
				if (popupRef.current?.closed) {
					setIsOpen(false);
					popupRef.current = null;
					if (intervalRef.current) {
						clearInterval(intervalRef.current);
						intervalRef.current = null;
					}
				}
			}, 500);
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isOpen]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (popupRef.current && !popupRef.current.closed) {
				popupRef.current.close();
			}
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	const openPopup = useCallback(() => {
		if (typeof window === 'undefined') return;

		const width = 1000;
		const height = 800;
		const left = (window.screen.width - width) / 2;
		const top = (window.screen.height - height) / 2;

		const popup = window.open(
			'',
			'MockUI_Advanced',
			`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
		);

		if (!popup) {
			console.warn('Failed to open MockUI popup. Please check popup blocker settings.');
			setIsOpen(false);
			return;
		}

		popupRef.current = popup;
		setupAdvancedPopupWindow(popup);
	}, [platform, onStateChange]);

	const closePopup = useCallback(() => {
		if (popupRef.current && !popupRef.current.closed) {
			popupRef.current.close();
		}
		popupRef.current = null;
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	const setupAdvancedPopupWindow = useCallback((popup: Window) => {
		popup.document.title = 'MockUI - Advanced Endpoint Manager';

		// Create the HTML structure
		popup.document.head.innerHTML = `
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>MockUI - Advanced Endpoint Manager</title>
			<style>
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}
				body {
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
					background: #f8f9fa;
					height: 100vh;
					overflow: hidden;
				}
				#mockui-root {
					height: 100vh;
					display: flex;
					flex-direction: column;
				}
				.header {
					background: white;
					border-bottom: 1px solid #e5e7eb;
					padding: 16px 24px;
					display: flex;
					align-items: center;
					justify-content: space-between;
				}
				.content {
					flex: 1;
					overflow-y: auto;
					padding: 24px;
				}
				.card {
					background: white;
					border-radius: 8px;
					padding: 24px;
					box-shadow: 0 1px 3px rgba(0,0,0,0.1);
					margin-bottom: 16px;
				}
				.endpoint-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 12px;
					background: #f9fafb;
					border-radius: 6px;
					margin-bottom: 8px;
					border: 1px solid #e5e7eb;
				}
				.endpoint-info {
					display: flex;
					align-items: center;
					gap: 12px;
				}
				.method-badge {
					padding: 2px 8px;
					border-radius: 4px;
					font-size: 12px;
					font-weight: 600;
					color: white;
				}
				.method-get { background: #10b981; }
				.method-post { background: #3b82f6; }
				.method-put { background: #f59e0b; }
				.method-delete { background: #ef4444; }
				.method-patch { background: #8b5cf6; }
				.toggle-btn {
					padding: 6px 12px;
					border-radius: 4px;
					border: none;
					cursor: pointer;
					font-size: 12px;
					font-weight: 500;
					transition: all 0.2s;
				}
				.toggle-btn.enabled {
					background: #10b981;
					color: white;
				}
				.toggle-btn.disabled {
					background: #ef4444;
					color: white;
				}
				.toggle-btn:hover {
					opacity: 0.8;
				}
				.feature-flag-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 8px 0;
					border-bottom: 1px solid #f3f4f6;
				}
				.feature-flag-row:last-child {
					border-bottom: none;
				}
				.switch {
					position: relative;
					width: 44px;
					height: 24px;
					background: #d1d5db;
					border-radius: 12px;
					cursor: pointer;
					transition: background 0.3s;
				}
				.switch.active {
					background: #10b981;
				}
				.switch-handle {
					position: absolute;
					top: 2px;
					left: 2px;
					width: 20px;
					height: 20px;
					background: white;
					border-radius: 50%;
					transition: transform 0.3s;
					box-shadow: 0 1px 3px rgba(0,0,0,0.2);
				}
				.switch.active .switch-handle {
					transform: translateX(20px);
				}
				.tab-list {
					display: flex;
					border-bottom: 1px solid #e5e7eb;
					margin-bottom: 24px;
				}
				.tab {
					padding: 12px 24px;
					background: none;
					border: none;
					cursor: pointer;
					font-size: 14px;
					font-weight: 500;
					color: #6b7280;
					border-bottom: 2px solid transparent;
				}
				.tab.active {
					color: #3b82f6;
					border-bottom-color: #3b82f6;
				}
				.tab-content {
					display: none;
				}
				.tab-content.active {
					display: block;
				}
			</style>
		`;

		popup.document.body.innerHTML = `
			<div id="mockui-root">
				<div class="header">
					<h1 style="font-size: 24px; font-weight: 600; color: #1f2937;">MockUI - Endpoint Manager</h1>
					<button onclick="window.close()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
						Close Window
					</button>
				</div>
				<div class="content">
					<div class="tab-list">
						<button class="tab active" onclick="showTab('endpoints')">Endpoints</button>
						<button class="tab" onclick="showTab('features')">Feature Flags</button>
						<button class="tab" onclick="showTab('settings')">Settings</button>
					</div>
					
					<div id="endpoints-tab" class="tab-content active">
						<div class="card">
							<h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #374151;">Endpoints</h2>
							<div id="endpoints-list"></div>
						</div>
					</div>
					
					<div id="features-tab" class="tab-content">
						<div class="card">
							<h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #374151;">Feature Flags</h2>
							<div id="features-list"></div>
						</div>
					</div>
					
					<div id="settings-tab" class="tab-content">
						<div class="card">
							<h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #374151;">Platform Settings</h2>
							<div style="margin-bottom: 16px;">
								<strong>Platform Name:</strong> ${platform.getName() || 'Unknown'}
							</div>
							<div style="margin-bottom: 16px;">
								<strong>Total Plugins:</strong> ${platform.getPlugins().length}
							</div>
							<div style="margin-bottom: 16px;">
								<strong>Feature Flags:</strong> ${Object.keys(platform.getFeatureFlags()).length}
							</div>
						</div>
					</div>
				</div>
			</div>
		`;

		// Add JavaScript functionality
		const script = popup.document.createElement('script');
		script.textContent = `
			function showTab(tabName) {
				// Hide all tabs
				document.querySelectorAll('.tab-content').forEach(tab => {
					tab.classList.remove('active');
				});
				document.querySelectorAll('.tab').forEach(tab => {
					tab.classList.remove('active');
				});
				
				// Show selected tab
				document.getElementById(tabName + '-tab').classList.add('active');
				event.target.classList.add('active');
			}
			
			function toggleEndpoint(pluginId) {
				window.parentMockUI.toggleEndpoint(pluginId);
			}
			
			function toggleFeatureFlag(flagName) {
				window.parentMockUI.toggleFeatureFlag(flagName);
			}
		`;
		popup.document.head.appendChild(script);

		// Set up communication bridge
		(popup as any).parentMockUI = {
			toggleEndpoint: (pluginId: string) => {
				const currentDisabled = platform.getDisabledPluginIds();
				if (currentDisabled.includes(pluginId)) {
					platform.setDisabledPluginIds(currentDisabled.filter(id => id !== pluginId));
				} else {
					platform.setDisabledPluginIds([...currentDisabled, pluginId]);
				}
				onStateChange?.({ disabledPluginIds: platform.getDisabledPluginIds() });
				renderEndpoints(popup);
			},
			toggleFeatureFlag: (flagName: string) => {
				const currentValue = platform.getFeatureFlags()[flagName];
				platform.setFeatureFlag(flagName, !currentValue);
				onStateChange?.({ disabledPluginIds: platform.getDisabledPluginIds() });
				renderFeatureFlags(popup);
			}
		};

		// Initial render
		renderEndpoints(popup);
		renderFeatureFlags(popup);
	}, [platform, onStateChange]);

	const renderEndpoints = useCallback((popup: Window) => {
		const endpointsList = popup.document.getElementById('endpoints-list');
		if (!endpointsList) return;

		const disabledIds = platform.getDisabledPluginIds();
		endpointsList.innerHTML = platform.getPlugins().map(plugin => {
			const isDisabled = disabledIds.includes(plugin.id);
			const methodClass = `method-${plugin.method.toLowerCase()}`;
			
			return `
				<div class="endpoint-row">
					<div class="endpoint-info">
						<span class="method-badge ${methodClass}">${plugin.method}</span>
						<span style="color: #374151; font-weight: 500;">${plugin.endpoint}</span>
						<span style="color: #6b7280; font-size: 14px;">${plugin.componentId}</span>
					</div>
					<button 
						class="toggle-btn ${isDisabled ? 'disabled' : 'enabled'}"
						onclick="toggleEndpoint('${plugin.id}')"
					>
						${isDisabled ? 'Disabled' : 'Enabled'}
					</button>
				</div>
			`;
		}).join('');
	}, [platform]);

	const renderFeatureFlags = useCallback((popup: Window) => {
		const featuresList = popup.document.getElementById('features-list');
		if (!featuresList) return;

		const flags = platform.getFeatureFlags();
		featuresList.innerHTML = Object.entries(flags).map(([flagName, isEnabled]) => `
			<div class="feature-flag-row">
				<div>
					<div style="font-weight: 500; color: #374151;">${flagName}</div>
					<div style="font-size: 12px; color: #6b7280;">
						Status: ${isEnabled ? 'Enabled' : 'Disabled'}
					</div>
				</div>
				<div 
					class="switch ${isEnabled ? 'active' : ''}" 
					onclick="toggleFeatureFlag('${flagName}')"
				>
					<div class="switch-handle"></div>
				</div>
			</div>
		`).join('');
	}, [platform]);

	return (
		<div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
			<Button
				onClick={() => setIsOpen(prev => !prev)}
				style={{
					borderRadius: '50%',
					height: 56,
					width: 56,
					boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					border: '1px solid #ccc',
					backgroundColor: isOpen ? '#3b82f6' : 'white',
					color: isOpen ? 'white' : '#374151',
				}}
				data-testid="open-settings"
				title={isOpen ? 'Close MockUI Popup (Ctrl+M)' : 'Open MockUI Popup (Ctrl+M)'}
			>
				<Settings style={{ height: 24, width: 24 }} />
			</Button>
		</div>
	);
}