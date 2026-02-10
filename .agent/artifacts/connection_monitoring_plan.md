# Connection Monitoring Enhancement Implementation Plan

## Problem
When a CNC controller connected via WiFi/Ethernet (e.g., 192.168.0.1) disconnects, gSender does not detect the connection loss in real-time. The UI continues to show the controller as connected, and users must manually disconnect and reconnect.

## Root Cause
The current implementation in `SerialConnection.js` uses `net.Socket` for TCP connections but lacks:
1. TCP keepalive configuration
2. Periodic health checks (heartbeat/ping mechanism)
3. Connection state monitoring
4. Automatic reconnection handling

## Solution Components

### 1. Server-Side Changes (`src/server/lib/SerialConnection.js`)

#### A. TCP Keepalive Configuration
- Enable TCP keepalive on the socket
- Set keepalive interval to 10 seconds
- Set keepalive probes to 3
- Set initial delay to 10 seconds

#### B. Heartbeat Mechanism
- Implement periodic status requests (every 5 seconds)
- Track response times
- Detect missed responses (timeout after 3 consecutive misses = 15 seconds)
- Emit connection health events

#### C. Enhanced Error Handling
- Detect ETIMEDOUT, ECONNRESET, EPIPE errors
- Emit 'connectionLost' event
- Clean up resources properly

### 2. Connection Manager Changes (`src/server/lib/Connection.js`)

#### A. Connection Health Monitoring
- Listen for connection health events
- Track connection state (connected, degraded, disconnected)
- Emit state changes to all connected sockets

#### B. Auto-Reconnect Logic
- Implement exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Maximum retry attempts: 10
- User notification on each retry
- Stop retries if user manually disconnects

### 3. Frontend Changes

#### A. Connection Status Component (`src/app/src/features/Connection/ConnectionStatus.tsx`)
- Display real-time connection health
- Show connection quality indicator (good/degraded/lost)
- Display reconnection attempts
- Allow manual reconnect/cancel

#### B. Redux State Updates
- Add `connectionHealth` to controller state
- Add `reconnecting` flag
- Add `reconnectAttempts` counter

#### C. UI Behavior
- Disable all controls when connection is lost
- Show prominent connection lost banner
- Display reconnection progress
- Re-enable controls when connection restored

### 4. Implementation Steps

1. **Phase 1: Server-Side Monitoring**
   - Update SerialConnection.js with TCP keepalive
   - Implement heartbeat mechanism
   - Add connection health events

2. **Phase 2: Connection Manager**
   - Update Connection.js to handle health events
   - Implement auto-reconnect logic
   - Add retry backoff

3. **Phase 3: Frontend Integration**
   - Create ConnectionStatus component
   - Update Redux store
   - Add connection health indicators
   - Implement control disabling logic

4. **Phase 4: Testing**
   - Test with actual WiFi disconnect
   - Test with network cable unplug
   - Test with controller power off
   - Test auto-reconnect scenarios
   - Test manual disconnect during auto-reconnect

## Technical Details

### Heartbeat Protocol
```
Every 5 seconds:
  - Send: "?" (status query)
  - Expect: Response within 2 seconds
  - Track: Consecutive missed responses
  - Action: If 3 misses (15s total), mark as disconnected
```

### Connection States
```
CONNECTED: Normal operation, all responses received
DEGRADED: 1-2 missed responses, show warning
DISCONNECTED: 3+ missed responses, disable controls
RECONNECTING: Attempting to restore connection
```

### Auto-Reconnect Backoff
```
Attempt 1: 1 second
Attempt 2: 2 seconds
Attempt 3: 4 seconds
Attempt 4: 8 seconds
Attempt 5+: 30 seconds (max)
Max attempts: 10
```

## Files to Modify

1. `/home/op/Dev/gsender/src/server/lib/SerialConnection.js`
2. `/home/op/Dev/gsender/src/server/lib/Connection.js`
3. `/home/op/Dev/gsender/src/app/src/features/Connection/ConnectionStatus.tsx` (new)
4. `/home/op/Dev/gsender/src/app/src/store/controller/index.ts`
5. `/home/op/Dev/gsender/src/app/src/workspace/index.tsx`

## Expected Behavior After Implementation

1. **Normal Operation**: Green indicator, all controls enabled
2. **Network Degradation**: Yellow indicator, warning message
3. **Connection Lost**: Red indicator, all controls disabled, auto-reconnect starts
4. **Reconnecting**: Blue indicator, shows attempt count, cancel button available
5. **Reconnected**: Green indicator, controls re-enabled, success message
6. **Failed Reconnect**: Red indicator, manual reconnect button, error message
