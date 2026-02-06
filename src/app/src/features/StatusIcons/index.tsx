import { useEffect, useState } from 'react';
import cx from 'classnames';
import { Link } from 'react-router';
import { LuGamepad2 } from 'react-icons/lu';
import { FaRegKeyboard } from 'react-icons/fa6';

import { RemoteModeDialog } from 'app/features/RemoteMode';
import actions, {
    HeadlessSettings,
} from 'app/features/RemoteMode/apiActions.ts';
import RemoteIndicator from 'app/features/RemoteMode/components/RemoteIndicator.tsx';
import Tooltip from 'app/components/Tooltip';

const StatusIcons = () => {
    const [gamepadConnected, setGamePadConnected] = useState(false);
    const [headlessSettings, setHeadlessSettings] = useState<HeadlessSettings>({
        ip: '',
        port: 0,
        headlessStatus: false,
    });
    const [showRemoteDialog, setShowRemoteDialog] = useState(false);

    function toggleRemoteModeDialog(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        setShowRemoteDialog(!showRemoteDialog);
    }

    useEffect(() => {
        actions.fetchSettings(setHeadlessSettings);

        const gameConnectHandler = () => {
            const gamepads = navigator.getGamepads();
            const hasGamepad = gamepads.some((gamepad) => gamepad !== null);

            setGamePadConnected(hasGamepad);
        };

        const gameDisconnectHandler = () => {
            const gamepads = navigator.getGamepads();
            const hasGamepad = gamepads.some((gamepad) => gamepad !== null);

            setGamePadConnected(hasGamepad);
        };

        window.addEventListener('gamepadconnected', gameConnectHandler);
        window.addEventListener('gamepaddisconnected', gameDisconnectHandler);

        return () => {
            window.removeEventListener('gamepadconnected', gameConnectHandler);
            window.removeEventListener(
                'gamepaddisconnected',
                gameDisconnectHandler,
            );
        };
    }, []);

    return null;
};

export default StatusIcons;
