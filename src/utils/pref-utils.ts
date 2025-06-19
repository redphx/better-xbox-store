import { ALL_PREFS, type AnyPref, type GlobalPref } from "@/enums/pref-keys";
import { GlobalSettingsStorage } from "./settings-storages/global-settings-storage";

// Migrate Stream settings in Global storage to Stream storage
export const STORAGE = {
    Global: new GlobalSettingsStorage(),
};

const globalSettingsStorage = STORAGE.Global;
export const getGlobalPrefDefinition = globalSettingsStorage.getDefinition.bind(globalSettingsStorage);
export const getGlobalPref = globalSettingsStorage.getSetting.bind(globalSettingsStorage);
export const setGlobalPref = globalSettingsStorage.setSetting.bind(globalSettingsStorage);


export function isGlobalPref(prefKey: AnyPref): prefKey is GlobalPref {
    return ALL_PREFS.global.includes(prefKey as GlobalPref);
}

export function getPrefInfo(prefKey: AnyPref): PrefInfo {
    if (isGlobalPref(prefKey)) {
        return {
            storage: STORAGE.Global,
            definition: getGlobalPrefDefinition(prefKey as GlobalPref),
            // value: getGlobalPref(prefKey as GlobalPref),
        }
    }

    alert('Missing pref definition: ' + prefKey);
    return {} as PrefInfo;
}

export function setPref(prefKey: AnyPref, value: any, origin: SettingActionOrigin) {
    if (isGlobalPref(prefKey)) {
        setGlobalPref(prefKey as GlobalPref, value, origin);
    }
}
