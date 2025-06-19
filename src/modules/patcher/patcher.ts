import { BxLogger } from "@/utils/bx-logger";
import { PatcherUtils } from "./patcher-utils";
import { BX_FLAGS } from "@/utils/bx-flags";
import { hashCode, renderString } from "@/utils/utils";
import { StorageKey } from "@/enums/pref-keys";
import { SCRIPT_VERSION } from "@/utils/global";

import codeFilterGames from "./patches/filter-games.js" with { type: "text" };

export type PatchName = keyof typeof PATCHES;
export type PatchArray = PatchName[];
type PatchFunction = (str: string) => string | false;

const LOG_TAG = 'Patcher';

const PATCHES = {
    filterGames(str: string) {
        let index = str.indexOf('("productCardAltText",{');
        (index >= 0) && (index = PatcherUtils.lastIndexOf(str, 'productSummaryInfo:', index, 1000, true));
        if (index < 0) {
            return false;
        }

        // Find variable name of `productSummaryInfo`
        const productSummaryInfoVar = PatcherUtils.getVariableNameAfter(str, index);
        if (!productSummaryInfoVar) {
            return false;
        }

        // Find the next `;` symbol
        index = PatcherUtils.indexOf(str, ';', index, 300, true);
        if (index < 0) {
            return false;
        }

        let newCode = renderString(codeFilterGames, {
            productSummaryInfoVar,
        });
        str = PatcherUtils.insertAt(str, index, newCode + ';');

        return str;
    },

    filterGamesProductCard(str: string) {
        let index = str.indexOf('.createElement("li",{key:`productCard-');
        (index >= 0) && (index = PatcherUtils.lastIndexOf(str, '.map(', index, 30));
        if (index < 0) {
            return false;
        }

        // Find variable name of products list
        const productsVar = PatcherUtils.getVariableNameBefore(str, index);
        if (!productsVar) {
            return false;
        }

        index -= productsVar.length;

        let newCode = `(${productsVar} = ${productsVar}.filter(item => window.BX_EXPOSED.shouldAllowProduct(item.product)), true) && `;
        str = PatcherUtils.insertAt(str, index, newCode);
        return str;
    },

    modifyPreloadedState(str: string) {
        let text = '=window.__PRELOADED_STATE__;';
        if (!str.includes(text)) {
            return false;
        }

        str = str.replace(text, '=window.BX_EXPOSED.modifyPreloadedState(window.__PRELOADED_STATE__);');
        return str;
    },

    detailedReleaseDate(str: string) {
        let index = str.indexOf('"descriptionReleaseDateTitle"');
        if (index < 0) {
            return false;
        }

        // Find toLocaleDateString()
        index = PatcherUtils.indexOf(str, '.toLocaleDateString(', index, 1000, true);
        // Find ','
        (index > -1) && (index = PatcherUtils.indexOf(str, ',', index, 10, true));
        if (index < 0) {
            return false;
        }

        // Insert new date options
        const options = JSON.stringify({
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZoneName: 'short',
        });
        str = PatcherUtils.insertAt(str, index, options + ',');

        return str;
    },

} as const satisfies { [key: string]: PatchFunction };

let PATCH_ORDERS = PatcherUtils.filterPatches([
    'filterGames',
    'filterGamesProductCard',
    'modifyPreloadedState',
    'detailedReleaseDate',
]);

const ALL_PATCHES = [...PATCH_ORDERS];

export class Patcher {
    private static patchNativeBind() {
        const nativeBind = Function.prototype.bind;
        Function.prototype.bind = function() {
            let valid = false;

            // Looking for these criteria:
            // - Variable name <= 2 characters
            // - Has 2 params:
            //     - The first one is null
            //     - The second one is either 0 or a function
            if (this.name.length <= 2 && arguments.length === 2 && arguments[0] === null) {
                if (arguments[1] === 0 || (typeof arguments[1] === 'function')) {
                    valid = true;
                }
            }

            if (!valid) {
                // @ts-ignore
                return nativeBind.apply(this, arguments);
            }

            if (typeof arguments[1] === 'function') {
                BxLogger.info(LOG_TAG, 'Restored Function.prototype.bind()');
                Function.prototype.bind = nativeBind;
            }

            const orgFunc = this;
            const newFunc = (a: any, item: any) => {
                Patcher.checkChunks(item);
                orgFunc(a, item);
            }

            // @ts-ignore
            return nativeBind.apply(newFunc, arguments);
        };
    }

    static checkChunks(item: [[number], { [key: string]: () => {} }]) {
        // !!! Use "caches" as variable name will break touch controller???
        // console.log('patch', '-----');
        let patchesToCheck: PatchArray;
        let appliedPatches: PatchArray;

        const chunkData = item[1];
        const patchesMap: Record<string, PatchArray> = {};
        const patcherCache = PatcherCache.getInstance();

        for (const chunkId in chunkData) {
            appliedPatches = [];

            const cachedPatches = patcherCache.getPatches(chunkId);
            if (cachedPatches) {
                // clone cachedPatches
                patchesToCheck = cachedPatches.slice(0);
                patchesToCheck.push(...PATCH_ORDERS);
            } else {
                patchesToCheck = PATCH_ORDERS.slice(0);
            }

            // Empty patch list
            if (!patchesToCheck.length) {
                continue;
            }

            const func = chunkData[chunkId];
            const funcStr = func.toString();
            let patchedFuncStr = funcStr;

            let modified = false;
            const chunkAppliedPatches: any[] = [];

            for (let patchIndex = 0; patchIndex < patchesToCheck.length; patchIndex++) {
                const patchName = patchesToCheck[patchIndex];
                if (appliedPatches.indexOf(patchName) > -1) {
                    continue;
                }

                if (!PATCHES[patchName]) {
                    continue;
                }

                // Check function against patch
                const tmpStr = PATCHES[patchName].call(null, patchedFuncStr);

                // Not patched
                if (!tmpStr) {
                    continue;
                }

                modified = true;
                patchedFuncStr = tmpStr;

                appliedPatches.push(patchName);
                chunkAppliedPatches.push(patchName);

                // Remove patch
                patchesToCheck.splice(patchIndex, 1);
                patchIndex--;
                PATCH_ORDERS = PATCH_ORDERS.filter(item => item != patchName);
            }

            // Apply patched functions
            if (modified) {
                BxLogger.info(LOG_TAG, `✅ [${chunkId}] ${chunkAppliedPatches.join(', ')}`);
                PATCH_ORDERS.length && BxLogger.info(LOG_TAG, 'Remaining patches', PATCH_ORDERS);

                BX_FLAGS.Debug && console.time(LOG_TAG);
                try {
                    chunkData[chunkId] = eval(patchedFuncStr);
                } catch (e: unknown) {
                    if (e instanceof Error) {
                        BxLogger.error(LOG_TAG, 'Error', appliedPatches, e.message, patchedFuncStr);
                    }
                }
                BX_FLAGS.Debug && console.timeEnd(LOG_TAG);
            }

            // Save to cache
            if (appliedPatches.length) {
                patchesMap[chunkId] = appliedPatches;
            }
        }

        if (Object.keys(patchesMap).length) {
            patcherCache.saveToCache(patchesMap);
        }
    }

    static init() {
        Patcher.patchNativeBind();
    }
}

export class PatcherCache {
    private static instance: PatcherCache;
    public static getInstance = () => PatcherCache.instance ?? (PatcherCache.instance = new PatcherCache());

    private readonly KEY_CACHE = StorageKey.PATCHES_CACHE;
    private readonly KEY_SIGNATURE = StorageKey.PATCHES_SIGNATURE;

    private CACHE!: { [key: string]: PatchArray };

    private constructor() {
        this.checkSignature();

        // Read cache from storage
        this.CACHE = JSON.parse(window.localStorage.getItem(this.KEY_CACHE) || '{}');
        BxLogger.info(LOG_TAG, 'Cache', this.CACHE);

        // Remove cached patches from PATCH_ORDERS & PLAYING_PATCH_ORDERS
        PATCH_ORDERS = this.cleanupPatches(PATCH_ORDERS);

        BxLogger.info(LOG_TAG, 'PATCH_ORDERS', PATCH_ORDERS.slice(0));
    }

    /**
     * Get patch's signature
     */
    private getSignature(): string {
        const scriptVersion = SCRIPT_VERSION;
        const patches = JSON.stringify(ALL_PATCHES);

        // Get client.js's hash
        let clientHash = '';
        const $link = document.querySelector<HTMLLinkElement>('link[data-chunk="client"][as="script"][href*="/client."]');
        if ($link) {
            const match = /\/client\.([^\.]+)\.js/.exec($link.href);
            match && (clientHash = match[1]);
        }

        // Calculate signature
        const sig = `${scriptVersion}:${clientHash}:${hashCode(patches)}`;
        return sig;
    }

    clear() {
        // Clear cache
        window.localStorage.removeItem(this.KEY_CACHE);
        this.CACHE = {};
    }

    private checkSignature() {
        const storedSig = window.localStorage.getItem(this.KEY_SIGNATURE) || 0;
        const currentSig = this.getSignature();

        if (currentSig !== storedSig) {
            // Save new signature
            BxLogger.warning(LOG_TAG, 'Signature changed');
            window.localStorage.setItem(this.KEY_SIGNATURE, currentSig.toString());

            this.clear();
        } else {
            BxLogger.info(LOG_TAG, 'Signature unchanged');
        }
    }

    private cleanupPatches(patches: PatchArray): PatchArray {
        return patches.filter(item => {
            for (const id in this.CACHE) {
                const cached = this.CACHE[id];

                if (cached.includes(item)) {
                    return false;
                }
            }

            return true;
        });
    }

    getPatches(id: string): PatchArray {
        return this.CACHE[id];
    }

    saveToCache(subCache: Record<string, PatchArray>) {
        for (const id in subCache) {
            const patchNames = subCache[id];

            let data = this.CACHE[id];
            if (!data) {
                this.CACHE[id] = patchNames;
            } else {
                for (const patchName of patchNames) {
                    if (!data.includes(patchName)) {
                        data.push(patchName);
                    }
                }
            }
        }

        // Save to storage
        window.localStorage.setItem(this.KEY_CACHE, JSON.stringify(this.CACHE));
    }
}
