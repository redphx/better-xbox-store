export const SCRIPT_VERSION = Bun.env.SCRIPT_VERSION!;

export function deepClone(obj: any): typeof obj | {} {
    if (!obj) {
        return {};
    }

    if ('structuredClone' in window) {
        return structuredClone(obj);
    }

    return JSON.parse(JSON.stringify(obj));
}
