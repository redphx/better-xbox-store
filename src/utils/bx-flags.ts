// Setup flags
const DEFAULT_FLAGS: BxFlags = {
    Debug: true,
    CheckForUpdate: true,
    FeatureGates: null,
}

export const BX_FLAGS: BxFlags = Object.assign(DEFAULT_FLAGS, window.BX_FLAGS || {});
try {
    delete window.BX_FLAGS;
} catch (e) {}

export const NATIVE_FETCH = window.fetch;
