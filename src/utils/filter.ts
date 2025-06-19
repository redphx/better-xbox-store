import type { XboxProduct } from "./bx-exposed";

export type NormalizedFilters = {
    allow: {
        developers: Set<string>;
        ids: Set<string>;
        publishers: Set<string>;
    };

    block: {
        developers: Set<string>;
        ids: Set<string>;
        publishers: Set<string>;
    };
};

export function normalizeFiltersList(resp: FiltersResponse): NormalizedFilters | null {
    const supportedSchema = 1;

    // Unsupported schema
    if (resp.$schemaVersion !== supportedSchema) {
        return null;
    }

    const data = resp.data;
    const normalized: NormalizedFilters = {
        allow: {
            developers: new Set(),
            ids: new Set(),
            publishers: new Set(),
        },

        block: {
            developers: new Set(),
            ids: new Set(),
            publishers: new Set(),
        },
    };

    const types = Object.keys(normalized.allow) as (keyof NormalizedFilters['allow'])[];
    for (const key in data) {
        let normalizedTarget = key === '_exception' ? normalized.allow : normalized.block;

        let field: keyof NormalizedFilters['allow'];
        for (field of types) {
            data[key][field].forEach(item => normalizedTarget[field].add(item.trim().toLocaleLowerCase()));
        }
    }

    return normalized;
}

export function shouldAllowProduct(product: XboxProduct) {
    const filters = window.BX_LIST_FILTERS;
    if (!filters || !product) {
        return true;
    }

    const id = product.productId.toLowerCase();
    const publisherName = (product.publisherName || '').trim().toLocaleLowerCase();
    const developerName = (product.developerName || '').trim().toLocaleLowerCase();

    // Allow
    if (filters.allow.ids.has(id)) {
        return true;
    }

    if (publisherName) {
        for (const name of filters.allow.publishers) {
            if (publisherName.includes(name)) {
                return true;
            }
        }
    }

    if (developerName) {
        for (const name of filters.allow.developers) {
            if (developerName.includes(name)) {
                return true;
            }
        }
    }

    // Block
    if (filters.block.ids.has(id)) {
        return false;
    }

    if (publisherName) {
        for (const name of filters.block.publishers) {
            if (publisherName.includes(name)) {
                return false;
            }
        }
    }

    if (developerName) {
        for (const name of filters.block.developers) {
            if (developerName.includes(name)) {
                return false;
            }
        }
    }

    return true;
}


export function filterPreloadProductDetails(data: any) {
    try {
        const channelData = data.channels.channelData;
        for (const key in channelData) {
            if (!key.startsWith('MORELIKE_')) {
                continue;
            }

            const productSummaries = data.products.productSummaries;
            channelData[key].data.products = channelData[key].data.products.filter((item: any) => {
                if (item.productId in productSummaries) {
                    return shouldAllowProduct(productSummaries[item.productId]);
                }

                return true;
            });
        }
    } catch (e) {}

    return data;
}


export function filterNetworkProductDetails(data: any) {
    try {
        const channelData = data.channels;
        for (const key in channelData) {
            if (!key.startsWith('MoreLike_')) {
                continue;
            }

            const productSummaries: any[] = data.productSummaries;
            channelData[key].products = channelData[key].products.filter((item: any) => {
                const product = productSummaries.find(p => item.productId === p.productId);
                if (product) {
                    return shouldAllowProduct(product);
                }

                return true;
            });
        }
    } catch (e) {}

    return data;
}
