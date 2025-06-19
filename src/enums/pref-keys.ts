import type { BaseSettingsStorage } from "@/utils/settings-storages/base-settings-storage";

export const enum StorageKey {
    GLOBAL = 'BetterXboxStore',

    LOCALE = 'BetterXboxStore.Locale',
    LOCALE_TRANSLATIONS = 'BetterXboxStore.Locale.Translations',
    PATCHES_CACHE = 'BetterXboxStore.Patches.Cache',
    PATCHES_SIGNATURE = 'BetterXboxStore.Patches.Cache.Signature',

    GH_PAGES_COMMIT_HASH = 'BetterXboxStore.GhPages.CommitHash',

    LIST_FILTTERS = 'BetterXboxStore.GhPages.Filters',
}


export const enum GlobalPref {
    VERSION_LAST_CHECK = 'version.lastCheck',
    VERSION_LATEST = 'version.latest',
    VERSION_CURRENT = 'version.current',
}

export type GlobalPrefTypeMap = {
    [GlobalPref.VERSION_CURRENT]: string;
    [GlobalPref.VERSION_LAST_CHECK]: number;
    [GlobalPref.VERSION_LATEST]: string;
}

export const ALL_PREFS: {
    global: GlobalPref[],
} = {
    global: [
        GlobalPref.VERSION_CURRENT,
        GlobalPref.VERSION_LAST_CHECK,
        GlobalPref.VERSION_LATEST,
    ],
}

export type AnySettingsStorage = BaseSettingsStorage<GlobalPref>;
export type AnyPref = GlobalPref;

export type PrefTypeMap<Key> = Key extends GlobalPref
  ? GlobalPrefTypeMap
  : never;
