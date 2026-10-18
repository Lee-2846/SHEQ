# SHEQ Backend

A separate Express + MongoDB backend designed to integrate with the existing React/Vite SHEQ frontend without replacing its UI.

## Four mandatory requirements

1. **Aadhaar / identity verification:** a provider integration boundary is included, but real verification is disabled until an authorized, compliant provider is selected and its documented hosted-session/redirect flow is implemented. This backend does not collect or store Aadhaar numbers or Aadhaar OTPs.
2. **Frontend/backend connection:** REST APIs and a documented service integration plan are included. The existing frontend is not modified by this package; integrate service-by-service after local API testing.
3. **Hotspot provisional areas:** transparent report-activity scoring, persisted candidate review, admin designation/dismissal/deactivation, and an algorithm-version field are included. It is explicitly a baseline, not a validated ML model or danger prediction. Synthetic records are excluded.
4. **Database/dataset infrastructure:** MongoDB models for users, reports, comments, unique confirmations, saved places, hotspots, internal escalations, and imported GeoJSON infrastructure are included. Database-derived admin analytics and a GeoJSON import script are included.

## Local setup

Requires Node.js 20+ and MongoDB Atlas or local MongoDB.

1. In this folder, copy `.env.example` to `.env`.
2. Set `MONGODB_URI` and `JWT_SECRET` (32+ random characters).
3. Keep `IDENTITY_VERIFICATION_ENABLED=false`.
4. Run:

```bash
npm install
npm run check
npm test
npm run dev
```

Health check: `http://localhost:4000/api/health`. The API intentionally fails startup if MongoDB is not configured/reachable, rather than pretending persistence is working.

### Create an administrator
After the database is configured, run `npm run seed:admin` and follow the prompts. Do not grant admin through public signup. Use a test database first and protect the account.

### Import a reviewed GeoJSON dataset
Set `GEOJSON_IMPORT_PATH` in `.env` to the absolute path of a GeoJSON FeatureCollection, then run `npm run import:geojson`. This import upserts features; use only files you have reviewed. Dataset coverage and completeness vary. Do not infer lamp functionality, police response, or current service coverage from map features.

## API routes

- `GET /api/health`
- `POST /api/auth/signup` — creates user role only
- `POST /api/auth/login` — body `{ "identifier": "email-or-phone", "password": "..." }`
- `GET /api/auth/me` — bearer token
- `POST /api/auth/identity/start` — disabled until authorized provider adapter is completed
- `GET /api/reports` — authenticated; supports `status`, `category`, `limit`, optional `nearLon`, `nearLat`, `maxDistance`
- `POST /api/reports` — authenticated
- `GET /api/reports/:id/comments`
- `POST /api/reports/:id/comments`
- `POST /api/reports/:id/confirm` — one confirmation per user/report
- `PATCH /api/reports/:id/moderation` — admin only
- `GET /api/places`, `POST /api/places`, `DELETE /api/places/:id`, `GET /api/places/:id/insights`
- `GET /api/hotspots` — designated hotspots only
- `GET /api/hotspots/candidates` — admin only, transparent baseline
- `POST /api/hotspots/candidates/save` — admin only, persists a reviewed candidate
- `PATCH /api/hotspots/:id/review` — admin only, designate/dismiss/deactivate
- `GET /api/escalations`, `POST /api/escalations`, `PATCH /api/escalations/:id` — admin only
- `GET /api/analytics/admin` — admin only, database-derived counts

All protected routes require `Authorization: Bearer <token>`.

## Privacy, safety, and production limits

- Publicly anonymous reports hide the reporter from returned report objects, but the server keeps a private account association. This is not an untraceable report.
- No automatic police/emergency dispatch, SMS/email OTP, background location tracking, image uploads, or hardware SOS integration is included.
- Confirmation uniqueness is enforced by a compound database index. Ensure indexes have finished building before accepting traffic.
- Admin creation is a one-off CLI script; production should add MFA, audit logging, strong access controls and an operational recovery process.
- Real identity verification requires an authorized provider, consent, provider-specific API adapter, legal review, security assessment and credentials.
- Hotspot scoring is a transparent baseline, not a trained/validated ML model. Use quality-controlled real reports, evaluate bias/coverage, and have human review before any public designation.
- GeoJSON may be incomplete or stale. Imported features are context only, not proof that a streetlight works or a police station responds.
- Production requires automated integration tests, backups, monitoring, retention/deletion policies, abuse prevention, secrets management, deployment hardening and a privacy/security review.

## Frontend integration strategy

See `INTEGRATION_PLAN.md`. Existing frontend service signatures and pages should be preserved. Add a small API client, configure `VITE_API_BASE_URL`, and switch one service at a time only after API checks. Never put backend secrets in Vite variables.
