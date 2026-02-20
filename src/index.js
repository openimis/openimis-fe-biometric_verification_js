import BiometricVerifyPage from "./pages/BiometricVerifyPage.jsx";

// Contribution key used by openimis-fe-core's App.js to build the
// unauthenticated (public) router — no login required to reach this route.
const UNAUTHENTICATED_ROUTER_KEY = "core.UnauthenticatedRouter";

const DEFAULT_CONFIG = {
  [UNAUTHENTICATED_ROUTER_KEY]: [
    {
      path: "biometric/verify/:uuid?",
      component: BiometricVerifyPage,
    },
  ],
};

// Standard openIMIS module export — receives optional config overrides.
export const BiometricVerificationModule = (cfg = {}) => ({
  ...DEFAULT_CONFIG,
  ...cfg,
});

export { BiometricVerifyPage };
