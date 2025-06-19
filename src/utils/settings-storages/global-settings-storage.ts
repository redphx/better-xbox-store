import { GlobalPref, StorageKey } from "@/enums/pref-keys";
import { BaseSettingsStorage } from "./base-settings-storage";

export class GlobalSettingsStorage extends BaseSettingsStorage<GlobalPref> {
    private static readonly DEFINITIONS: SettingDefinitions<GlobalPref> = {
        [GlobalPref.VERSION_LAST_CHECK]: {
            default: 0,
        },
        [GlobalPref.VERSION_LATEST]: {
            default: '',
        },
        [GlobalPref.VERSION_CURRENT]: {
            default: '',
        },
    };

    constructor() {
        super(StorageKey.GLOBAL, GlobalSettingsStorage.DEFINITIONS);
    }
}
