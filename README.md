# QueueCare

QueueCare is a responsive hospital operations workspace for staff-managed patient records, clinician schedules, appointments, token queues, and emergency triage. The frontend is React + Vite with plain CSS; the API is Express + MongoDB/Mongoose with JWT staff authentication.

## Requirements

- Node.js 18 or newer
- MongoDB running locally or a MongoDB connection string

## Run locally

1. Install packages: `npm install`
2. Copy `.env.example` to `.env`. Set `MONGODB_URI`, a private random `JWT_SECRET` of at least 32 characters, and a private `ADMIN_PASSWORD` of at least 8 characters. Keep `.env` out of source control.
3. Create/update the admin account and starter records: `npm run seed`. The seed script hashes `ADMIN_PASSWORD` with bcrypt before storing it.
4. Start the frontend and API together: `npm run dev`
5. Open `http://localhost:5173` and sign in with the configured `ADMIN_EMAIL` (defaults to `swetamehra790@gmail.com`) and the password you set in `.env`.

The seed script requires an explicitly configured admin password; it has no built-in password fallback. Re-running it updates the existing QueueCare admin account to the configured email and password. Staff account registration is intentionally not public; staff access is provisioned by an administrator.

## Patient portal

Open `http://localhost:5173/portal/register` to create a patient account, or use `/portal/login` to sign in. Patient registration creates a patient profile linked to a role-limited account. Patients can browse every clinician saved in the database, book weekday 30-minute slots between 9 AM and 5 PM, receive a daily queue token, and track appointment status and queue position. Appointment status refreshes automatically while the appointments page is open.

Patient registration sends a welcome email, and bookings send an appointment confirmation to the email address on the patient's registered profile. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `MAIL_FROM` in `.env` to enable delivery. For Gmail, use a Google App Password for `SMTP_PASSWORD` rather than your regular account password. If email delivery is unavailable, account creation and booking still succeed, and the portal reports that the email could not be sent.

Patient authentication uses separate `patient`-role credentials and the portal API only returns appointments for the signed-in patient profile. Existing staff/admin sign-in and workspace routes remain available as before. Patient profiles created independently by staff are not automatically linked to a portal account; this avoids granting access to a medical record based only on an unverified email address.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run Vite and the Express API with reload |
| `npm run build` | Create the optimized frontend build |
| `npm start` | Run the API (and serve `dist/` when `NODE_ENV=production`) |
| `npm run seed` | Create the demo admin and starter records when the database is empty |

## API overview

All endpoints except health and sign-in require `Authorization: Bearer <JWT>`.

- `GET /api/health`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/auth/patient/register`, `POST /api/auth/patient/login`
- `GET /api/portal/doctors`, `GET /api/portal/slots`, `GET|POST /api/portal/appointments`, `POST /api/portal/appointments/:id/cancel`
- `GET|POST /api/patients`, `PUT|DELETE /api/patients/:id`
- `GET|POST /api/doctors`, `PUT|DELETE /api/doctors/:id`
- `GET|POST /api/appointments`, `PUT|DELETE /api/appointments/:id`, `PATCH /api/appointments/:id/status`
- `GET|POST /api/emergencies`, `PATCH /api/emergencies/:id/status`, `DELETE /api/emergencies/:id`
- `GET /api/dashboard`

Patient and clinician deletion is guarded when appointment history or active visits depend on the record. Moving an appointment into the waiting or consultation state assigns the next daily token.

## Secure production setup

Set these variables on Render and Vercel as appropriate:

- Render API: `MONGODB_URI`, `JWT_SECRET` (32+ random characters), `JWT_EXPIRES_IN`, `CLIENT_ORIGIN` (comma-separated Vercel origins if needed), SMTP variables, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (12+ characters).
- Vercel frontend: `VITE_API_URL=https://your-render-service.onrender.com/api`.
- Run `npm run seed` once against the Render database after setting the admin variables. The seed script requires an explicit admin email/password and never ships with a default password.

### Administrator password reset

Use **Forgot password?** on `/login`. QueueCare sends a single-use reset link valid for 30 minutes only when SMTP is configured and only if the submitted email belongs to an administrator. Reset links are stored as hashes, never in plaintext. Authenticated administrators can also change passwords through `/api/auth/password/change`.

### Gmail appointment emails

1. Enable 2-Step Verification in the Gmail account.
2. Create a Google App Password for **Mail**.
3. Set locally or on Render:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_SECURE=false`
   - `SMTP_USER=your-full-gmail-address@gmail.com`
   - `SMTP_PASSWORD=the-16-character-app-password`
   - `MAIL_FROM=your-full-gmail-address@gmail.com`
4. Restart the API. Test delivery with an authenticated admin request: `POST /api/email/test` and body `{ "to": "recipient@example.com" }`.

Do not use the normal Gmail password or store the app password in source control.
