import { StorageKey } from "@/enums/pref-keys";
import { BxEventBus } from "./bx-event-bus";
import { NATIVE_FETCH } from "./bx-flags";
import { BxLogger } from "./bx-logger";
import { normalizeFiltersList, type NormalizedFilters } from "./filter";

export class GhPagesUtils {
    static fetchLatestCommit() {
        const url = 'https://api.github.com/repos/redphx/better-xbox-store/branches/gh-pages';
        const currentHash = window.localStorage.getItem(StorageKey.GH_PAGES_COMMIT_HASH) || '';

        // Get current filters
        window.BX_LIST_FILTERS = GhPagesUtils.getFiltersList();

        NATIVE_FETCH(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            },
        })
            .then(response => response.json())
            .then(data => {
                const latestCommitHash = data.commit.sha;
                if (latestCommitHash !== currentHash) {
                    window.localStorage.setItem(StorageKey.GH_PAGES_COMMIT_HASH, latestCommitHash);
                    // Update filters
                    window.BX_LIST_FILTERS = GhPagesUtils.getFiltersList(true, true);
                }
            }).catch(error => {
                BxLogger.error('GhPagesUtils', 'Error fetching the latest commit:', error);
            });
    }

    static getUrl(path: string): string {
        if (path[0] === '/') {
            alert('`path` must not starts with "/"');
        }

        const prefix = 'https://raw.githubusercontent.com/redphx/better-xbox-store';
        const latestCommitHash = window.localStorage.getItem(StorageKey.GH_PAGES_COMMIT_HASH);
        if (latestCommitHash) {
            return `${prefix}/${latestCommitHash}/${path}`;
        } else {
            return `${prefix}/refs/heads/gh-pages/${path}`;
        }
    }

    static getFiltersList(update=false, refresh=false): NormalizedFilters | null {
        const key = StorageKey.LIST_FILTTERS;

        // Update IDs in the background
        update && NATIVE_FETCH(GhPagesUtils.getUrl('filters.json'))
            .then(response => response.json())
            .then((json: FiltersResponse) => {
                const normalized = normalizeFiltersList(json);

                if (normalized) {
                    // Save to storage
                    window.localStorage.setItem(key, JSON.stringify(json));
                    BxEventBus.Script.emit('list.filters.updated', {
                        data: normalized,
                    });
                } else {
                    window.localStorage.removeItem(key);
                }

                if (refresh) {
                    window.location.reload();
                }
            });

        const resp = JSON.parse(window.localStorage.getItem(key) || '{}');
        const normalized = normalizeFiltersList(resp);
        if (!normalized) {
            // Delete storage;
            window.localStorage.removeItem(key);
            return null;
        }

        return normalized;
    }
}
