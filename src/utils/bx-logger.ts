import { BX_FLAGS } from "./bx-flags";

const enum TextColor {
    INFO = '#008746',
    WARNING = '#c1a404',
    ERROR = '#c10404',
}

export class BxLogger {
    static info = (tag: string, ...args: any[]) => BX_FLAGS.Debug && BxLogger.log(TextColor.INFO, tag, ...args);
    static warning = (tag: string, ...args: any[]) => BX_FLAGS.Debug && BxLogger.log(TextColor.WARNING, tag, ...args);
    static error = (tag: string, ...args: any[]) => BxLogger.log(TextColor.ERROR, tag, ...args);

    private static log(color: string, tag: string, ...args: any) {
        console.log(`%c[BxC]`, `color:${color};font-weight:bold;`, tag, '//', ...args);
    }
}

window.BxLogger = BxLogger;
