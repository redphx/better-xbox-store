import type { BxExposed } from "@/utils/bx-exposed";
import type { GlobalPref } from "@/enums/pref-keys";
import type { StreamSettings, type StreamSettingsData } from "@/utils/stream-settings";
import type { BxEvent } from "@/utils/bx-event";
import type { BxEventBus } from "@/utils/bx-event-bus";
import type { BxLogger } from "@/utils/bx-logger";
import type { NormalizedFilters } from "@/utils/filter";

export {};

declare global {
    interface Window {
        AppInterface: any;
        BX_FLAGS?: BxFlags;
        BX_CE: (elmName: string, props: { [index: string]: any }={}) => HTMLElement;
        BX_FETCH: typeof window['fetch'];
        BX_LIST_FILTERS: NormalizedFilters | null;

        BxEvent: typeof BxEvent;
        BxEventBus: typeof BxEventBus;
        BxLogger: typeof BxLogger;
        localRedirect: (path: stringn) => void;

        chrome?: any;

        BX_EXPOSED: typeof BxExposed & Partial<{
        }>;
    }
}
