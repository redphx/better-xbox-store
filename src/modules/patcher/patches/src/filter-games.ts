declare const $productSummaryInfoVar$: any;

try {
    const productSummaryInfo = $productSummaryInfoVar$;
    const product = productSummaryInfo.product;
    if (!window.BX_EXPOSED.shouldAllowProduct(product)) {
        // @ts-ignore
        return null;
    }
} catch (e) {}
