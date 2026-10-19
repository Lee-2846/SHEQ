# SHEQ frontend integration plan

## Protect the current frontend
- Keep all changes on `leena`; no branch switching, commit, push, or merge without explicit approval.
- Keep existing layout, branding, responsive styling, anonymous-report toggle, and user flows.
- Existing `src/services/authService.js` and `src/services/reportService.js` use mock waits/data. They should be updated incrementally, not wholesale replaced.
- Do not store a backend secret in `VITE_*`; frontend variables are public.

## Suggested sequence
1. Configure backend `.env`, connect a test database, and check `GET /api/health`.
2. Test signup/login and report APIs with a disposable account/database.
3. Add `VITE_API_BASE_URL=http://localhost:4000/api` to a local frontend `.env` (never commit it).
4. Add a shared API client that attaches the bearer token. Decide safe token persistence with the frontend's AuthContext; for production, prefer an appropriately secured session design.
5. Connect auth service first, then report list/create, comments and confirmations, saved places, and admin services.
6. Map API report schema to existing frontend mock-data shape in a small adapter to avoid redesigning page components.
7. Preserve existing SOS flow as clearly simulated until emergency-provider/legal requirements are addressed.
8. Run frontend `npm.cmd run build`; test login, protected routes, anonymous toggle, report submission, incident detail/comments, map, SOS, saved places, and admin route restrictions.
9. Inspect `git diff` and confirm no accidental UI changes. Do not commit/push/merge automatically.

## Frontend API shape
- Base URL: `import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"`
- Login request: `POST /auth/login` with `{ identifier, password }`
- Report create expects numeric `longitude` and `latitude` plus category, description, optional location label/date and `isAnonymousPublicly`.
- All protected routes require `Authorization: Bearer <token>`.
