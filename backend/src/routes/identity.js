// Identity provider adapter intentionally separated from auth routes.
// Do not implement Aadhaar OTP collection/storage here. Add only the authorized provider's hosted session/redirect API.
export const identityIntegrationStatus = () => ({
  enabled: false,
  provider: "not-configured",
  message: "Real identity verification requires an authorized provider, documented API, credentials, consent flow, and legal/security review."
});
