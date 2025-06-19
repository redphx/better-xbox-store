import { BxLogger } from "./bx-logger";
import { FeatureGates } from "./feature-gates";
import { filterPreloadProductDetails, shouldAllowProduct } from "./filter";

export type XboxProduct = {
    developerName?: string;
    publisherName: string;
    productId: string;
};

export const BxExposed = {
    modifyPreloadedState: ((state: any) => {
        let LOG_TAG = 'PreloadState';

        // Filter "People aslso like" channel
        try {
            filterPreloadProductDetails(state.core2);
        } catch (e) {
            BxLogger.error(LOG_TAG, e);
        }

        // Override feature gates
        try {
            for (const exp in FeatureGates) {
                state.experiments.overrideFeatureGates[exp.toLocaleLowerCase()] = FeatureGates[exp];
            }
        } catch (e) {
            BxLogger.error(LOG_TAG, e);
        }

        return state;
    }),

    shouldAllowProduct: shouldAllowProduct,
};
