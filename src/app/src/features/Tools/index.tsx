import { useState } from 'react';
import { FaBars } from 'react-icons/fa';
import { Widget } from '../../components/Widget';
import { Tabs } from '../../components/Tabs';
import Console from '../Console';
import Tool from '../Tool';
import Spindle from '../Spindle';
import Oiling from '../Coolant';
import Rotary from '../Rotary';
import Macros from '../Macros';
import { useWidgetState } from 'app/hooks/useWidgetState';
import { useWorkspaceState } from 'app/hooks/useWorkspaceState';

interface TabItem {
    label: string;
    content: React.ComponentType<{ isActive: boolean }>;
}

const tabs = [
    {
        label: 'Tool',
        content: Tool,
    },
    {
        label: 'Macros',
        content: Macros,
    },
    {
        label: 'Spindle/Laser',
        content: Spindle,
    },
    {
        label: 'OILING',
        content: Oiling,
    },
    {
        label: 'Rotary',
        content: Rotary,
    },
    {
        label: 'Console',
        content: Console,
    },
];

const primaryLabels = ['Tool', 'OILING'];

const Tools = () => {
    const [showExtras, setShowExtras] = useState(false);
    const rotary = useWidgetState('rotary');
    const { spindleFunctions, coolantFunctions } = useWorkspaceState();

    const filteredTabs = tabs.filter((tab) => {
        if (tab.label === 'Rotary' && !rotary.tab.show) {
            return false;
        }

        if (tab.label === 'Spindle/Laser' && !spindleFunctions) {
            return false;
        }

        if (tab.label === 'OILING' && !coolantFunctions) {
            return false;
        }

        if (!showExtras && !primaryLabels.includes(tab.label)) {
            return false;
        }

        return true;
    });

    const menuButton = (
        <button
            onClick={() => setShowExtras(!showExtras)}
            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-lighter transition-colors ${showExtras ? 'text-blue-500' : 'text-gray-400'
                }`}
            title={showExtras ? 'Hide extra tabs' : 'Show extra tabs'}
        >
            <FaBars className="w-5 h-5" />
        </button>
    );

    return (
        <Widget>
            <Widget.Content>
                <Tabs
                    items={filteredTabs as TabItem[]}
                    actions={menuButton}
                />
            </Widget.Content>
        </Widget>
    );
};

export default Tools;
