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
import { useSelector } from 'react-redux';
import controller from 'app/lib/controller';

export interface ConnectionHealthData {
    status: 'connected' | 'degraded' | 'lost' | 'reconnecting' | 'failed' | 'disconnected';
    port: string | null;
    reason?: string;
    attempt?: number;
    maxAttempts?: number;
    nextRetryIn?: number;
    reconnected?: boolean;
    userInitiated?: boolean;
}

/**
 * Custom hook to monitor connection health in real-time
 * @returns Connection health data and helper functions
 */
export const useConnectionHealth = () => {
    // Get initial state from Redux
    const isConnectedRedux = useSelector((state: any) => state.connection?.isConnected);
    const portRedux = useSelector((state: any) => state.connection?.port);

    const [connectionHealth, setConnectionHealth] = useState<ConnectionHealthData>(() => ({
        status: isConnectedRedux ? 'connected' : 'disconnected',
        port: portRedux || null,
    }));

    useEffect(() => {
        // Update state if Redux changes (e.g. initial connection)
        if (isConnectedRedux && connectionHealth.status === 'disconnected') {
            setConnectionHealth(prev => ({ ...prev, status: 'connected', port: portRedux }));
        } else if (!isConnectedRedux && connectionHealth.status === 'connected') {
            setConnectionHealth(prev => ({ ...prev, status: 'disconnected' }));
        }
    }, [isConnectedRedux, portRedux]);

    useEffect(() => {
        const handleConnectionHealth = (data: ConnectionHealthData) => {
            setConnectionHealth(data);
        };

        controller.addListener('connection:health', handleConnectionHealth);

        return () => {
            controller.removeListener('connection:health', handleConnectionHealth);
        };
    }, []);

    const isConnected = connectionHealth.status === 'connected';
    const isDegraded = connectionHealth.status === 'degraded';
    const isLost = connectionHealth.status === 'lost' || connectionHealth.status === 'failed';
    const isReconnecting = connectionHealth.status === 'reconnecting';
    const isDisconnected = connectionHealth.status === 'disconnected';

    // Controls should be disabled if connection is lost, failed, or reconnecting
    const shouldDisableControls = isLost || isReconnecting;

    // Show warning if degraded
    const shouldShowWarning = isDegraded;

    return {
        connectionHealth,
        isConnected,
        isDegraded,
        isLost,
        isReconnecting,
        isDisconnected,
        shouldDisableControls,
        shouldShowWarning,
    };
};

export default useConnectionHealth;
