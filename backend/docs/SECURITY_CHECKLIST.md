# Before production — mandatory checklist

- [ ] Use HTTPS and managed secrets; rotate JWT secret.
- [ ] Select a supported session/token strategy and test logout/revocation.
- [ ] Add MFA for administrators and audit all admin actions.
- [ ] Add verified email/phone OTP provider if required; no mock OTP claims.
- [ ] Integrate identity verification only through an authorized provider; review current Indian legal/provider requirements.
- [ ] Add CSRF/session controls if cookie-based authentication is selected.
- [ ] Review CORS origins and rate limits for deployed topology.
- [ ] Add request size limits, validation, abuse controls and monitoring.
- [ ] Add report/comment moderation, user reporting and deletion/retention workflows.
- [ ] Protect precise location and emergency-contact data; never expose contacts publicly.
- [ ] Add secure private evidence storage before photo uploads.
- [ ] Add automated integration tests and restore-tested backups.
- [ ] Review dataset licenses, source notes, spatial coverage and freshness.
- [ ] Validate hotspot method, test bias and false positives, document uncertainty, require human review.
- [ ] Do not claim police integration, emergency dispatch, or incidents prevented unless real and measured.
