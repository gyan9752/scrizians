# Frontend <-> Express integration notes

## How to run
1. `cd backend && npm install && npm start` (port 5001)
2. `cd frontend && npm install && npm run dev` (port 3000) – `NEXT_PUBLIC_EXPRESS_API_URL` in `frontend/.env.local`

## What changed
- `src/lib/expressApi.ts`: fixed wrong paths (articles mine/admin, pricing, companies, engagements, case-studies, editorial comments); added public portfolio, case-study admin, review endpoints.
- `src/lib/adapters.ts` (new): maps backend shapes -> UI shapes (talent, jobs, articles, portfolios, leads).
- `src/utils/dataSync.ts`: syncs from Express only; `addInboundLead` now POSTs `/leads` and returns the API result.
- Public pages (home, talent, talent/[id], hire-talent, jobs, jobs/[id], portfolio, insights) read from Express.
- Forms: LeadModal, contact, become-a-scrizian -> `POST /leads` with real success/error handling. Job apply -> `POST /jobs/:slug/apply` (needs candidate login).
- Dashboards: client (shortlists, company), contributor (author profile, articles create+submit), admin (reads + talent approve, article publish/workflow), notifications bell (backend).
- Removed: Next `app/api/*` routes, `src/models`, `lib/mongodb.ts`, `scripts/`, mongoose/bcryptjs deps (backend owns the database now). `sitemap.ts` reads from Express.

## Backend gaps (frontend UI exists, endpoint does not)
- Jobs: no create/update/status endpoint (admin job editor is local-only)
- Talent: no admin create/edit endpoint (only approve)
- Portfolios: no admin create/delete/NDA toggle (only review)
- Articles: no admin create (contributors create)
- Users: no list/update-profile/role endpoint (admin Users tab empty; candidate/admin profile edits stay in session)
- Candidate: no "my applications" endpoint (applications tab still shows sample data)
- Client dashboard: requirements/interviews/engagements tabs still sample UI; APIs already exist in `expressApi.ts` (requirementApi, interviewApi, engagementApi) for the next pass

## Admin login, 2FA and session fixes
- **Real 2FA (authenticator app / TOTP)** for `admin` and `scriza_staff` (and any user who enabled it). The old OTP check accepted any 4+ character code - removed.
  - `POST /auth/login` returns `requiresTwoFactor` + a 5-minute `challengeToken` (no access token yet).
  - First time: `POST /auth/2fa/setup` returns a QR code + manual key; the first valid code in `POST /auth/verify-2fa` turns 2FA on.
  - Later logins: only the 6-digit code is asked. Codes cannot be replayed; wrong codes count toward the 5-attempt lockout.
  - TOTP secrets are stored AES-256-GCM encrypted (`TWO_FACTOR_ENCRYPTION_KEY`, falls back to `JWT_SECRET`).
  - Lost phone: `cd backend && npm run reset-2fa -- admin@scrizians.com`.
- **Refresh token race fixed**: frontend refreshes once (single-flight) and the backend rotates atomically with a 30s grace window, so multiple tabs / parallel API calls no longer revoke the session (this caused the `401 refresh` storm).
- If the session is really gone, dashboards now redirect to `/login?session=expired` instead of showing an empty panel.
- `authMiddleware` no longer lets an unknown user through just because the token says `admin`.
- Demo credentials on the login page are pre-filled only when `NODE_ENV !== 'production'`.
- After pulling this: `cd backend && npm install` (new dependency: `qrcode`).

### 2FA modes (`backend/.env`)
- `TWO_FACTOR_MODE=static` (current): admin/staff enter the fixed 6-digit `TWO_FACTOR_STATIC_OTP` (default `123456`). No SMTP, no app. Still needs the password first, and wrong OTPs count toward the lockout.
- `TWO_FACTOR_MODE=totp`: authenticator-app flow with QR code (see above). Email OTP via nodemailer can be added later as a third mode.
- Change `TWO_FACTOR_STATIC_OTP` before any public deployment.
