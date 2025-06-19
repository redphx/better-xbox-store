import { GlobalPref, StorageKey } from "@/enums/pref-keys";
import { BX_FLAGS } from "./bx-flags";
import { BxLogger } from "./bx-logger";
import type { NormalizedFilters } from "./filter";

type EventCallback<T = any> = (payload: T) => void;

export type ScriptEvents = {
    'dialog.shown': {};
    'dialog.dismissed': {};

    'setting.changed': {
        storageKey: StorageKey;
        settingKey: GlobalPref;
        // settingValue: any;
    };

    // GH pages
    'list.filters.updated': {
        data: NormalizedFilters | null;
    };
};

export type WebEvents = {};

export class BxEventBus<TEvents extends Record<string, any>> {
    private listeners: Map<keyof TEvents, Set<EventCallback<any>>> = new Map();
    private group: string;

    static readonly Script = new BxEventBus<ScriptEvents>('script', {
        'dialog.shown': 'onDialogShown',
        'dialog.dismissed': 'onDialogDismissed',
    });
    static readonly Stream = new BxEventBus<WebEvents>('web', {
    });

    constructor(group: string, appJsInterfaces: { [key in keyof TEvents]?: string }) {
        this.group = group;
    }

    on<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        BX_FLAGS.Debug && BxLogger.warning('EventBus', 'on', event, callback);
    }

    once<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]>): void {
        const wrapper = (...args: any[]) => {
            // @ts-ignore
            callback(...args);
            this.off(event, wrapper);
        };

        this.on(event, wrapper);
    }

    off<K extends keyof TEvents>(event: K, callback: EventCallback<TEvents[K]> | null): void {
        BX_FLAGS.Debug && BxLogger.warning('EventBus', 'off', event, callback);

        if (!callback) {
            // Remove all listener callbacks
            this.listeners.delete(event);
            return;
        }

        const callbacks = this.listeners.get(event);
        if (!callbacks) {
            return;
        }

        callbacks.delete(callback);
        if (callbacks.size === 0) {
            this.listeners.delete(event);
        }
    }

    offAll(): void {
        this.listeners.clear();
    }

    emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
        const callbacks = this.listeners.get(event) || [];
        for (const callback of callbacks) {
            callback(payload);
        }

        BX_FLAGS.Debug && BxLogger.warning('EventBus', 'emit', `${this.group}.${event as string}`, payload);
    }
}

window.BxEventBus = BxEventBus;
