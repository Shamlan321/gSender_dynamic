import { EEPROM } from 'app/definitions/firmware';

const UNIFIED_AXES_MAP: Record<string, string> = {
    // Steps per mm
    '$100': '$/axes/x/steps_per_mm',
    '$101': '$/axes/y/steps_per_mm',
    '$102': '$/axes/z/steps_per_mm',
    '$103': '$/axes/a/steps_per_mm',
    '$104': '$/axes/b/steps_per_mm',
    '$105': '$/axes/c/steps_per_mm',
    // Max Rate (mm/min)
    '$110': '$/axes/x/max_rate_mm_per_min',
    '$111': '$/axes/y/max_rate_mm_per_min',
    '$112': '$/axes/z/max_rate_mm_per_min',
    '$113': '$/axes/a/max_rate_mm_per_min',
    '$114': '$/axes/b/max_rate_mm_per_min',
    '$115': '$/axes/c/max_rate_mm_per_min',
    // Acceleration (mm/sec^2)
    '$120': '$/axes/x/acceleration_mm_per_sec2',
    '$121': '$/axes/y/acceleration_mm_per_sec2',
    '$122': '$/axes/z/acceleration_mm_per_sec2',
    '$123': '$/axes/a/acceleration_mm_per_sec2',
    '$124': '$/axes/b/acceleration_mm_per_sec2',
    '$125': '$/axes/c/acceleration_mm_per_sec2',
    // FluidNC compatibilty
    '$Grbl/Resolution/X': '$/axes/x/steps_per_mm',
    '$Grbl/Resolution/Y': '$/axes/y/steps_per_mm',
    '$Grbl/Resolution/Z': '$/axes/z/steps_per_mm',
};

export const formatEEPROMCommand = (key: string | EEPROM, value: any): string => {
    if (UNIFIED_AXES_MAP[key]) {
        return `${UNIFIED_AXES_MAP[key]}=${value}`;
    }
    return `${key}=${value}`;
};
