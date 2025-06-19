import type { WebEvents, ScriptEvents } from "@/utils/bx-event-bus";
import type { PatchArray, PatchName } from "./patcher";

export class PatcherUtils {
    static indexOf(txt: string, searchString: string, startIndex: number, maxRange=0, after=false): number {
        if (startIndex < 0) {
            return -1;
        }

        const index = txt.indexOf(searchString, startIndex);
        if (index < 0 || (maxRange && index - startIndex > maxRange)) {
            return -1;
        }

        return after ? index + searchString.length : index;
    }

    static lastIndexOf(txt: string, searchString: string, startIndex: number, maxRange=0, after=false): number {
        if (startIndex < 0) {
            return -1;
        }

        const index = txt.lastIndexOf(searchString, startIndex);
        if (index < 0 || (maxRange && startIndex - index > maxRange)) {
            return -1;
        }

        return after ? index + searchString.length : index;
    }

    static insertAt(txt: string, index: number, insertString: string): string {
        return txt.substring(0, index) + insertString + txt.substring(index);
    }

    static replaceWith(txt: string, index: number, fromString: string, toString: string): string {
        return txt.substring(0, index) + toString + txt.substring(index + fromString.length);
    }

    static replaceAfterIndex(txt: string, search: string, replaceWith: string, index: number) {
        const before = txt.slice(0, index);
        const after = txt.slice(index).replace(search, replaceWith);
        return before + after;
    }

    static filterPatches(patches: Array<PatchName | false>): PatchArray {
        return patches.filter((item): item is PatchName => !!item);
    }

    private static isVarCharacter(char: string) {
        const code = char.charCodeAt(0);

        // Check for uppercase letters (A-Z)
        const isUppercase = code >= 65 && code <= 90;

        // Check for lowercase letters (a-z)
        const isLowercase = code >= 97 && code <= 122;

        // Check for digits (0-9)
        const isDigit = code >= 48 && code <= 57;

        // Check for special characters '_' and '$'
        const isSpecial = char === '_' || char === '$';

        return isUppercase || isLowercase || isDigit || isSpecial;
    }

    static getVariableNameBefore(str: string, index: number) {
        if (index < 0) {
            return null;
        }

        const end = index;
        let start = end - 1;
        while (PatcherUtils.isVarCharacter(str[start])) {
            start -= 1;
        }

        return str.substring(start + 1, end);
    }

    static getVariableNameAfter(str: string, index: number) {
        if (index < 0) {
            return null;
        }

        const start = index;
        let end = start + 1;
        while (PatcherUtils.isVarCharacter(str[end])) {
            end += 1;
        }

        return str.substring(start, end);
    }

    static injectUseEffect<T extends 'Web' | 'Script'>(str: string, index: number, group: T, eventName: T extends 'Web' ? keyof WebEvents : keyof ScriptEvents, separator: string = ';') {
        const newCode = `window.BX_EXPOSED.reactUseEffect(() => window.BxEventBus.${group}.emit('${eventName}', {}), [])${separator}`;
        str = PatcherUtils.insertAt(str, index, newCode);

        return str;
    }

    static findAndParseParams(str: string, index: number, maxRange: number) {
        const substr = str.substring(index, index + maxRange);
        let startIndex = substr.indexOf('({');
        if (startIndex < 0) {
            return false;
        }
        startIndex += 1;

        let endIndex = substr.indexOf('})', startIndex);
        if (endIndex < 0) {
            return false;
        }
        endIndex += 1;

        try {
            const input = substr.substring(startIndex, endIndex);
            return PatcherUtils.parseObjectVariables(input);
        } catch {
            return null;
        }
    }

    static parseObjectVariables(input: string) {
        try {
            const pairs = [...input.matchAll(/(\w+)\s*:\s*([a-zA-Z_$][\w$]*)/g)];

            const result: Record<string, string> = {};
            for (const [_, key, value] of pairs) {
                result[key] = value;
            }

            return result;
        } catch {
            return null;
        }
    }
}
