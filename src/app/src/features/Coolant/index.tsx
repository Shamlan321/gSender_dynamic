import { connect } from 'react-redux';
import get from 'lodash/get';
import { FaOilCan } from 'react-icons/fa';

import { startMist, stopCoolant } from 'app/features/Coolant/utils/actions';
import {
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    GRBLHAL,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import { ActiveStateButton } from 'app/components/ActiveStateButton';
import { useCallback } from 'react';
import { useTypedSelector } from 'app/hooks/useTypedSelector';

export interface OilingProps {
    oilActive: boolean;
}

export function Oiling({ oilActive }: OilingProps) {
    const { workflow, isConnected, controllerState, controllerType } =
        useTypedSelector((state) => ({
            workflow: state.controller.workflow,
            isConnected: state.connection.isConnected ?? false,
            controllerState: state.controller.state ?? {},
            controllerType: state.controller.type ?? 'grbl',
        }));

    const canClick = useCallback((): boolean => {
        if (!isConnected) return false;
        if (workflow.state === WORKFLOW_STATE_RUNNING) return false;
        if (![GRBL, GRBLHAL].includes(controllerType)) return false;

        const activeState = controllerState?.status?.activeState;
        return activeState === GRBL_ACTIVE_STATE_IDLE;
    }, [
        isConnected,
        workflow.state,
        controllerType,
        controllerState?.status?.activeState,
    ]);

    return (
        <div className="flex flex-col justify-around items-center h-full">
            <div className="flex flex-row justify-around w-full gap-2">
                <ActiveStateButton
                    text={oilActive ? 'Stop Oiling' : 'Release Oil'}
                    icon={<FaOilCan />}
                    onClick={oilActive ? stopCoolant : startMist}
                    size="lg"
                    className="w-full h-16"
                    active={oilActive}
                    disabled={!canClick()}
                    tooltip={{ content: oilActive ? 'Press to stop oiling' : 'Press once to start releasing oil' }}
                />
            </div>
        </div>
    );
}

export default connect((state) => {
    const coolantModal: string = get(state, 'controller.modal.coolant', 'M9');
    const oilActive = coolantModal.split(',').some(mode => mode.trim().toUpperCase() === 'M7');
    return {
        oilActive,
    };
})(Oiling);
