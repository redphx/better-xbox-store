import { BX_FLAGS } from "./bx-flags";

export let FeatureGates: { [key: string]: boolean } = {
    EnableFranchisePageLink: true,
};

if (BX_FLAGS.FeatureGates) {
    FeatureGates = Object.assign(BX_FLAGS.FeatureGates, FeatureGates);
}
