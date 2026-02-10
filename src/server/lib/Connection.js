import { EventEmitter } from 'events';
import SerialConnection from './SerialConnection';
import {
    GRBLHAL,
    GRBLHAL_REALTIME_COMMANDS,
} from '../controllers/Grblhal/constants';
import { GRBL, GRBL_REALTIME_COMMANDS } from '../controllers/Grbl/constants';
import logger from './logger';
import { noop, includes } from 'lodash';
import { WRITE_SOURCE_CLIENT } from '../controllers/constants';

const log = logger('connection');

class Connection extends EventEmitter {
    sockets = {};

    controller = null;

    controllerType = null;

    options = {};

    connection = null;

    engine = null;

    timeout = null;

    count = 0;

    connectionEventListener = {
        data: (data) => {
            this.emit('data', data);
            log.silly(`< ${data}`);
            if (this.controllerType === null) {
                data = ('' + data).replace(/\s+$/, '');
                if (!data) {
                    log.warn(
                        'Empty result parsed from Connection Class Parser',
                    );
                    return;
                }

                // Note - Do we need two grblHAL clauses if we're using i insensitive flag? - ie grblHAL|GrblHAL
                // https://regex101.com/r/oPVkkF/1
                const grblR = data.match(/.*(grbl|fluidnc).*/i);
                const grblHalR = data.match(/.*(grblhal).*/i);

                if (grblHalR) {
                    this.controllerType = GRBLHAL;
                    this.emit(
                        'firmwareFound',
                        GRBLHAL,
                        this.options,
                        this.callback,
                    );
                    clearInterval(this.timeout);
                } else if (grblR) {
                    this.controllerType = GRBL;
                    this.emit(
                        'firmwareFound',
                        GRBL,
                        this.options,
                        this.callback,
                    );
                    clearInterval(this.timeout);
                }
            } // we dont handle the runner
        },
        close: (err) => {
            this.emit('close', err);

            if (err) {
                log.warn(
                    `Disconnected from serial port "${this.options.port}":`,
                    err,
                );
            }

            // Only call internal close if it's not a background failure we're trying to recover from
            const isIntentional = !this.userDisconnected && this.connectionHealth !== 'lost' && this.connectionHealth !== 'reconnecting';
            if (isIntentional) {
                this.close(err, true);
            }
        },
        error: (err) => {
            this.emit('error', err);
            if (this.controllerType === null) {
                if (err) {
                    log.error(
                        `Unexpected error while reading/writing serial port "${this.options.port}":`,
                        err,
                    );
                }
            }
        },
        connectionDegraded: (reason) => {
            log.warn(`Connection degraded: ${reason}`);
            this.connectionHealth = 'degraded';
            this.emitToSockets('connection:health', {
                status: 'degraded',
                reason: reason,
                port: this.options.port,
            });
        },
        connectionLost: (reason) => {
            log.error(`Connection lost: ${reason}`);
            this.connectionHealth = 'lost';
            this.emitToSockets('connection:health', {
                status: 'lost',
                reason: reason,
                port: this.options.port,
            });

            // Start auto-reconnect for network connections
            if (this.options.network || this.isNetworkConnection()) {
                this.startAutoReconnect();
            }
        },
        connectionRestored: () => {
            log.info('Connection restored');
            this.connectionHealth = 'connected';
            this.reconnectAttempts = 0;
            this.stopAutoReconnect();
            this.emitToSockets('connection:health', {
                status: 'connected',
                port: this.options.port,
            });
        },
    };

    // Connection health tracking
    connectionHealth = 'disconnected'; // disconnected, connected, degraded, lost, reconnecting

    reconnectAttempts = 0;

    maxReconnectAttempts = 10;

    reconnectTimer = null;

    userDisconnected = false;

    constructor(engine, port, options, callback) {
        super();
        const { baudrate, rtscts, network, defaultFirmware } = { ...options };
        this.options = {
            ...this.options,
            port: port,
            baudrate: baudrate,
            rtscts: !!rtscts,
            defaultFirmware,
            network,
        };
        this.callback = callback;
        this.engine = engine;

        this.connection = new SerialConnection({
            path: port,
            baudRate: baudrate,
            rtscts: !!rtscts,
            network,
            writeFilter: (data) => {
                const line = data.trim();

                if (!line) {
                    return data;
                }
                return data;
            },
        });
    }

    isOpen = () => {
        return this.connection && this.connection.isOpen;
    };

    isClose() {
        return !this.isOpen();
    }

    addConnection = (socket) => {
        if (!socket) {
            log.error('The socket parameter is not specified');
            return;
        }

        log.debug(`Add socket connection: id=${socket.id}`);
        this.sockets[socket.id] = socket;
    };

    removeConnection(socket) {
        if (!socket) {
            log.error('The socket parameter is not specified');
            return;
        }

        log.debug(`Remove socket connection: id=${socket.id}`);
        this.sockets[socket.id] = undefined;
        delete this.sockets[socket.id];
    }

    open = (callback = noop) => {
        const { port, network = false } = this.options;

        // Assertion check
        if (this.isOpen()) {
            log.error(`Cannot open serial port "${port}"`);
            return;
        }

        // Reset user disconnect flag
        this.userDisconnected = false;
        this.reconnectAttempts = 0;

        this.connection.on('data', this.connectionEventListener.data);
        this.connection.on('close', this.connectionEventListener.close);
        this.connection.on('error', this.connectionEventListener.error);
        this.connection.on('connectionDegraded', this.connectionEventListener.connectionDegraded);
        this.connection.on('connectionLost', this.connectionEventListener.connectionLost);
        this.connection.on('connectionRestored', this.connectionEventListener.connectionRestored);

        this.connection.open((err) => {
            if (err) {
                log.error(`Error opening serial port "${port}":`, err);
                this.emit('serialport:error', { err: err, port: port });
                callback(err); // notify error
                return;
            }

            // Set connection health to connected
            this.connectionHealth = 'connected';
            this.emitToSockets('connection:health', {
                status: 'connected',
                port: port,
            });

            // Emit a change event to all connected sockets
            if (this.engine.io) {
                this.engine.io.emit('serialport:change', {
                    port: port,
                    inuse: true,
                });
            }

            log.debug(`Connected to serial port "${port}"`);
            if (!this.controllerType && network) {
                this.controllerType = GRBLHAL;
                this.emit(
                    'firmwareFound',
                    GRBLHAL,
                    this.options,
                    this.callback,
                );
            } else if (!this.controllerType) {
                this.connection.writeImmediate('$I\n');
                this.timeout = setInterval(() => {
                    if (this.count >= 5) {
                        this.controllerType = this.options.defaultFirmware;
                        this.emit(
                            'firmwareFound',
                            this.options.defaultFirmware,
                            this.options,
                            this.callback,
                        );
                        clearInterval(this.timeout);
                        return;
                    }
                    this.connection.writeImmediate('\x18');
                    this.count++;
                }, 800);
            }
        });
    };

    close(err, isUserInitiated = true) {
        const { port } = this.options;

        if (isUserInitiated) {
            // Mark as user-initiated disconnect to prevent auto-reconnect
            this.userDisconnected = true;
            this.stopAutoReconnect();
        }

        this.connectionHealth = 'disconnected';

        // Assertion check
        if (!this.connection) {
            const err = `Serial port "${port}" is not available`;
            log.error(err);
            this.callback(err);
            return;
        }

        this.emit('serialport:close', {
            port: port,
            inuse: false,
        });

        // Emit a change event to all connected sockets
        if (this.engine.io) {
            this.engine.io.emit('serialport:change', {
                port: port,
                inuse: false,
            });
        }

        // Notify clients of disconnect
        this.emitToSockets('connection:health', {
            status: 'disconnected',
            port: port,
            userInitiated: isUserInitiated,
        });

        if (this.isClose()) {
            this.destroy();
            this.callback(err);
            return;
        }

        this.connection.close();
        this.destroy();
        this.callback(err);
    }

    addController = (controller) => {
        this.controller = controller;

        this.emit('serialport:open', {
            port: this.options.port,
            baudrate: this.options.baudrate,
            controllerType: this.controllerType,
            inuse: true,
        });
    };

    write(data, context = { source: WRITE_SOURCE_CLIENT }) {
        // Assertion check
        if (this.isClose()) {
            log.error(`Serial port "${this.options.port}" is not accessible`);
            return;
        }
        if (!context) {
            context = { source: WRITE_SOURCE_CLIENT };
        }
        this.connection.write(data, context);
        log.silly(`> ${data}`);
    }

    writeln(data, context = {}) {
        if (
            includes(GRBLHAL_REALTIME_COMMANDS, data) ||
            includes(GRBL_REALTIME_COMMANDS, data)
        ) {
            this.write(data, context);
        } else {
            this.write(data + '\n', context);
        }
    }

    writeImmediate(data) {
        this.connection.writeImmediate(data);
    }

    getSockets() {
        return this.sockets;
    }

    setWriteFilter(writeFilter) {
        this.connection.setWriteFilter(writeFilter);
    }

    emitToSockets(eventName, ...args) {
        Object.keys(this.sockets).forEach((id) => {
            const socket = this.sockets[id];
            socket.emit(eventName, ...args);
        });
    }

    updateOptions(options) {
        this.options = {
            ...this.options,
            options
        };
    }

    isNetworkConnection() {
        const { port } = this.options;
        const ip = '(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';
        const expr = new RegExp(`^${ip}\\.${ip}\\.${ip}\\.${ip}$`);
        return port && expr.test(port);
    }

    startAutoReconnect() {
        if (this.userDisconnected) {
            log.info('User initiated disconnect - skipping auto-reconnect');
            return;
        }

        // Don't start another reconnect if we're already waiting to retry
        if (this.reconnectTimer) {
            log.debug('Auto-reconnect already in progress');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.getReconnectDelay(this.reconnectAttempts);

        log.info(`Attempting reconnect (attempt ${this.reconnectAttempts}) in ${delay}ms`);
        this.connectionHealth = 'reconnecting';
        this.emitToSockets('connection:health', {
            status: 'reconnecting',
            port: this.options.port,
            attempt: this.reconnectAttempts,
            nextRetryIn: delay,
        });

        this.reconnectTimer = setTimeout(() => {
            log.info(`Reconnect attempt ${this.reconnectAttempts} starting...`);

            // Clean up old connection
            if (this.connection) {
                try {
                    this.connection.removeListener('data', this.connectionEventListener.data);
                    this.connection.removeListener('close', this.connectionEventListener.close);
                    this.connection.removeListener('error', this.connectionEventListener.error);
                    this.connection.removeListener('connectionDegraded', this.connectionEventListener.connectionDegraded);
                    this.connection.removeListener('connectionLost', this.connectionEventListener.connectionLost);
                    this.connection.removeListener('connectionRestored', this.connectionEventListener.connectionRestored);
                } catch (err) {
                    log.warn('Error removing listeners during reconnect:', err);
                }
            }

            // Create new connection
            const { port, baudrate, rtscts, network } = this.options;
            this.connection = new SerialConnection({
                path: port,
                baudRate: baudrate,
                rtscts: !!rtscts,
                network,
                writeFilter: (data) => {
                    const line = data.trim();
                    if (!line) {
                        return data;
                    }
                    return data;
                },
            });

            // Attach all event listeners
            this.connection.on('data', this.connectionEventListener.data);
            this.connection.on('close', this.connectionEventListener.close);
            this.connection.on('error', this.connectionEventListener.error);
            this.connection.on('connectionDegraded', this.connectionEventListener.connectionDegraded);
            this.connection.on('connectionLost', this.connectionEventListener.connectionLost);
            this.connection.on('connectionRestored', this.connectionEventListener.connectionRestored);

            // Attempt to open
            this.connection.open((err) => {
                // Clear the timer reference so next attempt can be scheduled if needed
                this.reconnectTimer = null;

                if (err) {
                    log.error(`Reconnect attempt ${this.reconnectAttempts} failed:`, err);
                    // Try again
                    this.startAutoReconnect();
                } else {
                    log.info(`Reconnect attempt ${this.reconnectAttempts} succeeded!`);
                    this.connectionHealth = 'connected';
                    this.reconnectAttempts = 0;

                    // Emit success
                    this.emitToSockets('connection:health', {
                        status: 'connected',
                        port: this.options.port,
                        reconnected: true,
                    });

                    // Emit serialport change
                    if (this.engine.io) {
                        this.engine.io.emit('serialport:change', {
                            port: port,
                            inuse: true,
                        });
                    }

                    // Re-initialize controller if needed
                    if (!this.controllerType && network) {
                        this.controllerType = GRBLHAL;
                        this.emit('firmwareFound', GRBLHAL, this.options, this.callback);
                    }
                }
            });
        }, delay);
    }

    stopAutoReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    getReconnectDelay(attempt) {
        // More aggressive retry for industrial use:
        // 500ms, 1s, 2s, 5s, 5s, 10s...
        if (attempt === 1) {
            return 500;
        }
        if (attempt === 2) {
            return 1000;
        }
        if (attempt === 3) {
            return 2000;
        }
        if (attempt === 4) {
            return 5000;
        }
        return 10000; // Max 10s delay for subsequent attempts
    }

    refresh() {
        log.debug('connection refresh');
        this.emit('firmwareFound',
            this.controllerType,
            this.options,
            this.callback,
            true);
    }

    destroy() {
        clearInterval(this.timeout);

        if (this.controller) {
            this.controller = null;
        }

        this.sockets = {};

        if (this.connection) {
            this.connection = null;
        }

        if (this.controllerType) {
            this.controllerType = null;
        }

        if (this.timeout) {
            this.timeout = null;
        }
    }
}

export default Connection;
