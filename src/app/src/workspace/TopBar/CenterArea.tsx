import MachineInfo from 'app/features/MachineInfo';
import MachineStatus from 'app/features/MachineStatus/MachineStatus';
import ConnectionStatus from 'app/features/Connection/ConnectionStatus';

import NotificationsArea from '../../features/NotificationsArea';

const CenterArea = () => {
    return (
        <div className="flex items-center gap-4 h-full pointer-events-auto">
            <ConnectionStatus />

            <div className="flex items-center gap-4 overflow-visible">
                <NotificationsArea />
                <MachineInfo />
            </div>

            <div className="min-w-[100px]">
                <MachineStatus />
            </div>
        </div>
    );
};

export default CenterArea;
