/* eslint-disable no-console */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Button from './components/Button';
import { Settings } from './components/Icon';
import type { MockPlatformCore } from '../classes/MockPlatformCore';

interface PopupMockUIProps {
	platform: MockPlatformCore;
	onStateChange?: (opts: { disabledPluginIds: string[] }) => void;
	groupStorageKey?: string;
	disabledPluginIdsStorageKey?: string;
}

export default function PopupMockUI({ platform, onStateChange, groupStorageKey, disabledPluginIdsStorageKey }: PopupMockUIProps) {
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
				setIsOpen(prev => prev ? false : prev); // Only close if currently open
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, []); // Empty dependency array - listener stays stable

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

		const width = 900;
		const height = 700;
		const left = (window.screen.width - width) / 2;
		const top = (window.screen.height - height) / 2;

		const popup = window.open(
			'',
			'MockUI',
			`width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
		);

		if (!popup) {
			console.warn('Failed to open MockUI popup. Please check popup blocker settings.');
			setIsOpen(false);
			return;
		}

		popupRef.current = popup;

		// Set up the popup window
		setupPopupWindow(popup);
	}, [platform, onStateChange, groupStorageKey, disabledPluginIdsStorageKey]);

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

	const setupPopupWindow = useCallback((popup: Window) => {
		// Set the title
		popup.document.title = 'MockUI - Endpoint Manager';

		// Add basic HTML structure
		popup.document.head.innerHTML = `
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1">
			<title>MockUI - Endpoint Manager</title>
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
			</style>
		`;

		popup.document.body.innerHTML = '<div id="mockui-root"></div>';

		// Import React and render the MockUI
		const script = popup.document.createElement('script');
		script.textContent = `
			// Signal that this window is ready
			window.mockUIReady = true;
		`;
		popup.document.head.appendChild(script);

		// Render the MockUI content in the popup
		renderMockUIInPopup(popup);
	}, [platform]);

	const renderMockUIInPopup = useCallback((popup: Window) => {
		const root = popup.document.getElementById('mockui-root');
		if (!root) return;

		// For now, we'll render a simple HTML version
		// In a full implementation, we'd need to properly render React components
		root.innerHTML = `
			<div style="padding: 24px; height: 100%; overflow-y: auto;">
				<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
					<h1 style="font-size: 24px; font-weight: 600; color: #1f2937;">MockUI - Endpoint Manager</h1>
					<button onclick="window.close()" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;">
						Close
					</button>
				</div>
				
				<div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #374151;">Platform Status</h2>
					<div style="margin-bottom: 16px;">
						<strong>Platform Name:</strong> ${platform.getName() || 'Unknown'}
					</div>
					<div style="margin-bottom: 16px;">
						<strong>Total Plugins:</strong> ${platform.getPlugins().length}
					</div>
					<div style="margin-bottom: 16px;">
						<strong>Disabled Plugins:</strong> ${platform.getDisabledPluginIds().length}
					</div>
					<div style="margin-bottom: 24px;">
						<strong>Feature Flags:</strong> ${Object.keys(platform.getFeatureFlags()).length}
					</div>
					
					<h3 style="font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #374151;">Endpoints</h3>
					<div style="space-y: 8px;">
						${platform.getPlugins().map(plugin => `
							<div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 8px;">
								<div>
									<span style="font-weight: 500; color: #1f2937;">${plugin.method}</span>
									<span style="margin-left: 8px; color: #6b7280;">${plugin.endpoint}</span>
								</div>
								<div>
									<button 
										onclick="toggleEndpoint('${plugin.id}')"
										style="padding: 4px 12px; border-radius: 4px; border: 1px solid #d1d5db; background: ${platform.getDisabledPluginIds().includes(plugin.id) ? '#fca5a5' : '#86efac'}; cursor: pointer; font-size: 12px;"
									>
										${platform.getDisabledPluginIds().includes(plugin.id) ? 'Disabled' : 'Enabled'}
									</button>
								</div>
							</div>
						`).join('')}
					</div>
					
					<div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
						<p><strong>Note:</strong> This is a simplified popup version of MockUI.</p>
						<p>Full React component rendering in popup windows requires additional setup.</p>
						<p>Close this window to return to the main application.</p>
					</div>
				</div>
			</div>
		`;

		// Add toggle functionality
		(popup as any).toggleEndpoint = (pluginId: string) => {
			const currentDisabled = platform.getDisabledPluginIds();
			if (currentDisabled.includes(pluginId)) {
				platform.setDisabledPluginIds(currentDisabled.filter(id => id !== pluginId));
			} else {
				platform.setDisabledPluginIds([...currentDisabled, pluginId]);
			}
			
			// Trigger state change callback
			onStateChange?.({ disabledPluginIds: platform.getDisabledPluginIds() });
			
			// Re-render the popup content
			renderMockUIInPopup(popup);
		};
	}, [platform, onStateChange]);

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