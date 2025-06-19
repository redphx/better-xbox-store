import { NATIVE_FETCH } from "./bx-flags";
import { FeatureGates } from "./feature-gates";
import { filterNetworkProductDetails } from "./filter";

export function interceptHttpRequests() {
    // @ts-ignore
    window.BX_FETCH = window.fetch = async (request: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let url = (typeof request === 'string') ? request : (request as Request).url;

        // Override experimentals
        if (url.startsWith('https://emerald.xboxservices.com/xboxcomfd/experimentation')) {
            try {
                const response = await NATIVE_FETCH(request, init);
                const json = await response.json();

                if (json && json.exp && json.exp.treatments) {
                    for (const key in FeatureGates) {
                        json.exp.treatments[key] = FeatureGates[key]
                    }
                }

                response.json = () => Promise.resolve(json);
                return response;
            } catch (e) {
                console.log(e);
                return NATIVE_FETCH(request, init);
            }
        }

        // Product detail page
        if (url.startsWith('https://emerald.xboxservices.com/xboxcomfd/productDetails/')) {
            try {
                const response = await NATIVE_FETCH(request, init);
                let json = await response.clone().json();
                json = filterNetworkProductDetails(json);

                response.json = () => Promise.resolve(json);
                response.text = () => Promise.resolve(JSON.stringify(json));
                return response;

            } catch (e) {
                console.log(e);
                return NATIVE_FETCH(request, init);
            }
        }

        return NATIVE_FETCH(request, init);
    }
}
