# Integration Guide: Connection Health Monitoring

## Overview
This guide shows how to integrate connection health monitoring into your components to disable controls when the connection is lost or degraded.

## Using the useConnectionHealth Hook

### Basic Usage

```typescript
import { useConnectionHealth } from 'app/features/Connection/useConnectionHealth';

function MyComponent() {
    const { shouldDisableControls, connectionHealth, isConnected } = useConnectionHealth();

    return (
        <button disabled={shouldDisableControls || !isConnected}>
            Send Command
        </button>
    );
}
```

### Available Properties

```typescript
const {
    connectionHealth,        // Full connection health object
    isConnected,            // true if status === 'connected'
    isDegraded,             // true if status === 'degraded'
    isLost,                 // true if status === 'lost' or 'failed'
    isReconnecting,         // true if status === 'reconnecting'
    isDisconnected,         // true if status === 'disconnected'
    shouldDisableControls,  // true if lost, failed, or reconnecting
    shouldShowWarning,      // true if degraded
} = useConnectionHealth();
```

## Integration Examples

### 1. Jogging Controls

The Jogging component already has connection checking. To add connection health:

```typescript
// In src/app/src/features/Jogging/index.tsx

import { useConnectionHealth } from 'app/features/Connection/useConnectionHealth';

export function Jogging() {
    const { shouldDisableControls } = useConnectionHealth();
    
    // Existing code...
    const isConnected = useSelector(
        (state: RootState) => state.connection.isConnected,
    );

    const canClick = useCallback((): boolean => {
        if (!isConnected || shouldDisableControls) return false;
        if (workflowState === WORKFLOW_STATE_RUNNING) return false;

        const states = [GRBL_ACTIVE_STATE_IDLE, GRBL_ACTIVE_STATE_JOG];
        return includes(states, activeState);
    }, [isConnected, shouldDisableControls, workflowState, activeState])();

    // Rest of component...
}
```

### 2. Job Control Buttons

```typescript
// In src/app/src/features/JobControl/ControlButton.tsx

import { useConnectionHealth } from 'app/features/Connection/useConnectionHealth';

export const ControlButton = () => {
    const { shouldDisableControls, isDegraded } = useConnectionHealth();
    
    const handleClick = () => {
        if (shouldDisableControls) {
            toast.error('Cannot execute command: Connection lost');
            return;
        }
        
        if (isDegraded) {
            toast.warning('Connection quality degraded - command may be delayed');
        }
        
        // Execute command...
    };

    return (
        <button 
            disabled={shouldDisableControls}
            className={isDegraded ? 'warning' : ''}
            onClick={handleClick}
        >
            Start Job
        </button>
    );
};
```

### 3. Console/Terminal

```typescript
// In src/app/src/features/Console/Terminal.tsx

import { useConnectionHealth } from 'app/features/Connection/useConnectionHealth';

export const Terminal = () => {
    const { shouldDisableControls, connectionHealth } = useConnectionHealth();
    
    const handleCommandSubmit = (command: string) => {
        if (shouldDisableControls) {
            console.error('Cannot send command: Connection not available');
            return;
        }
        
        controller.command('gcode', command);
    };

    return (
        <div>
            <input 
                disabled={shouldDisableControls}
                placeholder={
                    shouldDisableControls 
                        ? `Connection ${connectionHealth.status}...` 
                        : 'Enter command'
                }
                onSubmit={handleCommandSubmit}
            />
            {shouldDisableControls && (
                <div className="connection-warning">
                    ⚠️ Commands disabled: {connectionHealth.reason}
                </div>
            )}
        </div>
    );
};
```

### 4. Probe Controls

```typescript
// In src/app/src/features/Probe/RunProbe.tsx

import { useConnectionHealth } from 'app/features/Connection/useConnectionHealth';

export const RunProbe = () => {
    const { shouldDisableControls, isConnected } = useConnectionHealth();
    
    const canRunProbe = isConnected && !shouldDisableControls;

    const handleProbe = () => {
        if (!canRunProbe) {
            toast.error('Cannot run probe: Connection unavailable');
            return;
        }
        
        // Run probe sequence...
    };

    return (
        <button 
            disabled={!canRunProbe}
            onClick={handleProbe}
        >
            Run Probe
        </button>
    );
};
```

### 5. Spindle Controls

```typescript
// In src/app/src/features/Spindle/index.tsx

import { useConnectionHealth } from 'app/features/Connection/useConnectionHealth';

export const Spindle = () => {
    const { shouldDisableControls, isDegraded } = useConnectionHealth();
    
    const handleSpindleToggle = () => {
        if (shouldDisableControls) {
            toast.error('Spindle control unavailable: Connection lost');
            return;
        }
        
        // Toggle spindle...
    };

    return (
        <div>
            <button 
                disabled={shouldDisableControls}
                onClick={handleSpindleToggle}
            >
                Toggle Spindle
            </button>
            {isDegraded && (
                <span className="warning-badge">
                    ⚠️ Connection Degraded
                </span>
            )}
        </div>
    );
};
```

## Visual Feedback Patterns

### 1. Disabled State with Tooltip

```typescript
const { shouldDisableControls, connectionHealth } = useConnectionHealth();

<Tooltip 
    content={
        shouldDisableControls 
            ? `Disabled: ${connectionHealth.reason}` 
            : 'Click to execute'
    }
>
    <button disabled={shouldDisableControls}>
        Execute
    </button>
</Tooltip>
```

### 2. Warning Badge

```typescript
const { isDegraded } = useConnectionHealth();

<div className="control-panel">
    {isDegraded && (
        <div className="warning-badge">
            ⚠️ Connection Quality Degraded
        </div>
    )}
    <button>Control</button>
</div>
```

### 3. Overlay for Entire Panel

```typescript
const { shouldDisableControls } = useConnectionHealth();

<div className="control-panel" style={{ position: 'relative' }}>
    {shouldDisableControls && (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div style={{ color: 'white', textAlign: 'center' }}>
                <h3>Connection Lost</h3>
                <p>Controls disabled until connection is restored</p>
            </div>
        </div>
    )}
    {/* Your controls here */}
</div>
```

## Best Practices

### 1. Always Check Before Sending Commands

```typescript
const { shouldDisableControls } = useConnectionHealth();

const sendCommand = (cmd: string) => {
    // Guard clause
    if (shouldDisableControls) {
        console.error('Command blocked: Connection unavailable');
        return;
    }
    
    controller.command('gcode', cmd);
};
```

### 2. Provide User Feedback

```typescript
const { shouldDisableControls, connectionHealth } = useConnectionHealth();

const handleAction = () => {
    if (shouldDisableControls) {
        toast.error(
            `Action unavailable: ${connectionHealth.reason}`,
            { duration: 5000 }
        );
        return;
    }
    
    // Perform action...
};
```

### 3. Differentiate Between Connection States

```typescript
const { isConnected, isDegraded, isLost, isReconnecting } = useConnectionHealth();

const getButtonState = () => {
    if (!isConnected) return { disabled: true, text: 'Not Connected' };
    if (isLost) return { disabled: true, text: 'Connection Lost' };
    if (isReconnecting) return { disabled: true, text: 'Reconnecting...' };
    if (isDegraded) return { disabled: false, text: 'Execute (Degraded)' };
    return { disabled: false, text: 'Execute' };
};

const buttonState = getButtonState();

<button disabled={buttonState.disabled}>
    {buttonState.text}
</button>
```

## Components That Should Use Connection Health

### Critical (Must Implement)
- ✅ Jogging controls
- ✅ Job control (start/stop/pause)
- ✅ Console/Terminal
- ✅ Probe controls
- ✅ Spindle controls
- ✅ Macro execution
- ✅ File upload/send

### Important (Should Implement)
- ⚠️ DRO (Digital Readout) - show warning
- ⚠️ Visualizer controls
- ⚠️ Firmware settings
- ⚠️ Homing controls

### Optional (Nice to Have)
- 📝 Statistics display - show warning
- 📝 Configuration panels - show warning
- 📝 Help/documentation - no change needed

## Testing Your Integration

### 1. Test Connection Loss

```typescript
// Simulate connection loss in browser console
controller.emit('connection:health', {
    status: 'lost',
    reason: 'Test: Simulated connection loss',
    port: '192.168.0.1'
});
```

### 2. Test Reconnecting State

```typescript
controller.emit('connection:health', {
    status: 'reconnecting',
    attempt: 3,
    maxAttempts: 10,
    nextRetryIn: 4000,
    port: '192.168.0.1'
});
```

### 3. Test Degraded State

```typescript
controller.emit('connection:health', {
    status: 'degraded',
    reason: 'Test: Simulated packet loss',
    port: '192.168.0.1'
});
```

### 4. Test Connection Restored

```typescript
controller.emit('connection:health', {
    status: 'connected',
    reconnected: true,
    port: '192.168.0.1'
});
```

## Migration Checklist

For each component with CNC controls:

- [ ] Import `useConnectionHealth` hook
- [ ] Destructure needed properties (`shouldDisableControls`, etc.)
- [ ] Add connection check to button/control disabled state
- [ ] Add connection check to command execution functions
- [ ] Add visual feedback (tooltips, badges, overlays)
- [ ] Test with simulated connection events
- [ ] Verify user experience is clear and helpful

## Example: Complete Component Integration

```typescript
import { useConnectionHealth } from 'app/features/Connection/useConnectionHealth';
import { toast } from 'app/lib/toaster';
import controller from 'app/lib/controller';

export const MyControlComponent = () => {
    const { 
        shouldDisableControls, 
        isDegraded, 
        connectionHealth 
    } = useConnectionHealth();

    const handleExecute = () => {
        // Guard: Check connection
        if (shouldDisableControls) {
            toast.error(
                `Cannot execute: ${connectionHealth.reason || 'Connection unavailable'}`,
                { duration: 5000 }
            );
            return;
        }

        // Warning: Degraded connection
        if (isDegraded) {
            toast.warning(
                'Connection quality degraded - command may be delayed',
                { duration: 3000 }
            );
        }

        // Execute command
        controller.command('gcode', 'G0 X10 Y10');
    };

    return (
        <div className="control-panel">
            {/* Visual indicator */}
            {isDegraded && (
                <div className="warning-badge">
                    ⚠️ Connection Degraded
                </div>
            )}

            {/* Control button */}
            <button 
                disabled={shouldDisableControls}
                onClick={handleExecute}
                className={isDegraded ? 'warning' : ''}
            >
                Execute Command
            </button>

            {/* Status text */}
            {shouldDisableControls && (
                <p className="error-text">
                    Controls disabled: {connectionHealth.status}
                </p>
            )}
        </div>
    );
};
```

## Conclusion

By integrating the `useConnectionHealth` hook into your components, you ensure:

1. ✅ **Safety**: Commands cannot be sent when connection is lost
2. ✅ **User Experience**: Clear feedback about connection state
3. ✅ **Reliability**: Prevents command queue buildup during outages
4. ✅ **Professionalism**: Industrial-grade behavior expected in production

The hook is designed to be simple to use while providing comprehensive connection state information.
