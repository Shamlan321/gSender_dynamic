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

import { useState, useCallback } from 'react';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import {
    GRBL,
    GRBL_ACTIVE_STATE_IDLE,
    GRBLHAL,
    WORKFLOW_STATE_RUNNING,
} from 'app/constants';
import { ActiveStateButton } from 'app/components/ActiveStateButton';
import { useTypedSelector } from 'app/hooks/useTypedSelector';
import controller from 'app/lib/controller';
import { Input } from 'app/components/shadcn/Input';
import { Label } from 'app/components/shadcn/Label';

export function Tool() {
    const [toolDown, setToolDown] = useState(false);
    const [distance, setDistance] = useState('0');

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

    const handleToolToggle = useCallback(() => {
        if (!canClick()) return;

        const distanceValue = parseFloat(distance) || 0;

        if (toolDown) {
            // Move tool up
            if (distanceValue > 0) {
                controller.command('gcode', 'G90'); // Absolute positioning
                controller.command('gcode', 'G0 Z0');
            }
            controller.command('gcode', 'M05'); // Pneumatic Cylinder Up
            setToolDown(false);
        } else {
            // Move tool down
            controller.command('gcode', 'M03'); // Pneumatic Cylinder Down
            if (distanceValue > 0) {
                controller.command('gcode', 'G91'); // Relative positioning
                controller.command('gcode', `G0 Z-${distanceValue}`);
                controller.command('gcode', 'G90'); // Back to absolute
            }
            setToolDown(true);
        }
    }, [toolDown, distance, canClick]);

    return (
        <div className="flex flex-col justify-around items-center h-full gap-4 p-4">
            <div className="flex flex-col w-full gap-2">
                <Label htmlFor="tool-distance" className="text-sm">
                    Distance (mm)
                </Label>
                <Input
                    id="tool-distance"
                    type="number"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    min="0"
                    step="0.1"
                    className="w-full"
                    disabled={!canClick()}
                />
            </div>
            <div className="flex flex-row justify-center w-full">
                <ActiveStateButton
                    text={toolDown ? 'Tool Up' : 'Tool Down'}
                    icon={toolDown ? <FaArrowUp /> : <FaArrowDown />}
                    onClick={handleToolToggle}
                    size="lg"
                    className="w-full h-16"
                    active={toolDown}
                    disabled={!canClick()}
                    tooltip={{
                        content: toolDown
                            ? `Raise tool to Z0`
                            : `Lower tool by ${distance}mm`,
                    }}
                />
            </div>
        </div>
    );
}

export default Tool;
