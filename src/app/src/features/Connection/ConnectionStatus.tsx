/*
 * Copyright (C) 2021 Sienci Labs Inc.
 *
 * This file is part of gSender.
 *
 * gSender is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, under version 3 of the License.
 *
 * gSender is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with gSender.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Contact for information regarding this program and its license
 * can be sent through gSender@sienci.com or mailed to the main office
 * of Sienci Labs Inc. in Waterloo, Ontario, Canada.
 *
 */

import { useEffect, useState } from 'react';
import controller from 'app/lib/controller';
import { useConnectionHealth } from './useConnectionHealth';

const getStatusStyles = (status: string) => {
    const baseStyles = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 500,
        transition: 'all 0.3s ease',
    };

    switch (status) {
        case 'connected':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                color: '#4CAF50',
                border: '1px solid rgba(76, 175, 80, 0.3)',
            };
        case 'degraded':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                color: '#FF9800',
                border: '1px solid rgba(255, 152, 0, 0.3)',
            };
        case 'lost':
        case 'failed':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                color: '#F44336',
                border: '1px solid rgba(244, 67, 54, 0.3)',
            };
        case 'reconnecting':
            return {
                ...baseStyles,
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                color: '#2196F3',
                border: '1px solid rgba(33, 150, 243, 0.3)',
            };
        default:
            return {
                ...baseStyles,
                backgroundColor: 'rgba(158, 158, 158, 0.1)',
                color: '#9E9E9E',
                border: '1px solid rgba(158, 158, 158, 0.3)',
            };
    }
};

const getBannerStyles = (type: string) => {
    const baseStyles = {
        position: 'fixed' as const,
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: 500,
        minWidth: '400px',
        animation: 'slideDown 0.3s ease-out',
    };

    switch (type) {
        case 'error':
            return { ...baseStyles, backgroundColor: '#F44336', color: 'white' };
        case 'warning':
            return { ...baseStyles, backgroundColor: '#FF9800', color: 'white' };
        case 'success':
            return { ...baseStyles, backgroundColor: '#4CAF50', color: 'white' };
        case 'info':
            return { ...baseStyles, backgroundColor: '#2196F3', color: 'white' };
        default:
            return { ...baseStyles, backgroundColor: '#9E9E9E', color: 'white' };
    }
};

export const ConnectionStatus = () => {
    const {
        connectionHealth,
        isConnected,
        connectionHealth: { port, attempt, reconnected, reason }
    } = useConnectionHealth();

    const [showBanner, setShowBanner] = useState(false);
    const [bannerMessage, setBannerMessage] = useState('');
    const [bannerType, setBannerType] = useState<'info' | 'error' | 'success' | 'warning'>('info');

    useEffect(() => {
        const { status } = connectionHealth;

        // Show banner for important status changes
        if (status === 'lost') {
            setBannerMessage(`Connection lost: ${reason || 'Unknown error'}. Auto-reconnecting...`);
            setBannerType('error');
            setShowBanner(true);
        } else if (status === 'reconnecting') {
            setBannerMessage(`Reconnecting... Attempt ${attempt}`);
            setBannerType('info');
            setShowBanner(true);
        } else if (status === 'connected' && reconnected) {
            setBannerMessage('Connection restored successfully!');
            setBannerType('success');
            setShowBanner(true);
            const timer = setTimeout(() => setShowBanner(false), 5000);
            return () => clearTimeout(timer);
        } else if (status === 'failed') {
            setBannerMessage(`Connection failed: ${reason}. Please reconnect manually.`);
            setBannerType('error');
            setShowBanner(true);
        } else if (status === 'degraded') {
            setBannerMessage(`Connection quality degraded: ${reason}`);
            setBannerType('warning');
            setShowBanner(true);
            const timer = setTimeout(() => setShowBanner(false), 5000);
            return () => clearTimeout(timer);
        } else if (status === 'connected') {
            // If we are connected and no specific reconnected flag, hide banner
            // (unless it's the success banner being shown)
            if (bannerType !== 'success') {
                setShowBanner(false);
            }
        }
    }, [connectionHealth.status, reason, attempt]);

    const getStatusText = () => {
        switch (connectionHealth.status) {
            case 'connected':
                return 'Connected';
            case 'degraded':
                return 'Connection Degraded';
            case 'lost':
                return 'Connection Lost';
            case 'reconnecting':
                return `Reconnecting (Attempt ${attempt})`;
            case 'failed':
                return 'Connection Failed';
            case 'disconnected':
                return 'Disconnected';
            default:
                return 'Unknown';
        }
    };

    const handleCancelReconnect = () => {
        // Send command to stop auto-reconnect
        controller.command('connection:cancelReconnect');
        setShowBanner(false);
    };

    const handleManualReconnect = () => {
        // Trigger manual reconnect
        if (port) {
            controller.command('connection:reconnect', { port });
        }
        setShowBanner(false);
    };

    if (!isConnected && connectionHealth.status === 'disconnected') {
        return null;
    }

    const pulse = connectionHealth.status === 'reconnecting' || connectionHealth.status === 'degraded';

    return (
        <>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `}</style>

            <div style={getStatusStyles(connectionHealth.status)}>
                <div
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'currentColor',
                        animation: pulse ? 'pulse 2s ease-in-out infinite' : 'none',
                    }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {getStatusText()}
                    {connectionHealth.status === 'reconnecting' && connectionHealth.nextRetryIn && connectionHealth.nextRetryIn > 0 && (
                        <span style={{ fontSize: '11px', opacity: 0.8 }}>
                            (Next attempt in {Math.ceil(connectionHealth.nextRetryIn / 1000)}s)
                        </span>
                    )}
                </span>
            </div>

            {showBanner && (
                <div style={getBannerStyles(bannerType)}>
                    <div style={{ flex: 1 }}>{bannerMessage}</div>
                    {connectionHealth.status === 'reconnecting' && (
                        <button
                            onClick={handleCancelReconnect}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Cancel
                        </button>
                    )}
                    {connectionHealth.status === 'failed' && (
                        <button
                            onClick={handleManualReconnect}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Reconnect
                        </button>
                    )}
                    {(connectionHealth.status === 'degraded' || (connectionHealth.status === 'connected' && connectionHealth.reconnected)) && (
                        <button
                            onClick={() => setShowBanner(false)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            )}
        </>
    );
};

export default ConnectionStatus;
