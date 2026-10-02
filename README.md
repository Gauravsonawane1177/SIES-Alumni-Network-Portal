# SIES Alumni Network Portal

Full-stack academic platform connecting **students**, **alumni**, and **administrators** at SIES for networking, mentorship, jobs, events, messaging, and fundraising.

## 1. Project overview

The portal is a React + Express + PostgreSQL application. Alumni accounts start as `PENDING` until an administrator approves them. Students are active immediately. Jobs and alumni-created events are moderated. Donations use Razorpay **test/sandbox** keys with server-side signature verification and PDF receipts.

## 2. Features

- JWT authentication in httpOnly cookies
- Role-based access: ADMIN, ALUMNI, STUDENT
- Profiles, searchable directory, mentors
- Connection requests
- Real-time messaging (Socket.IO + PostgreSQL)
- Jobs, applications, events, RSVP with capacity
- Donation campaigns, Razorpay sandbox, PDF receipts
- Notifications and optional SMTP email
- Admin dashboard, verification, moderation, analytics (Recharts + live SQL)

## 3. Tech stack

**Frontend:** React, Vite, Tailwind CSS, React Router, Axios, Socket.IO Client, Recharts  
**Backend:** Node.js, Express, PostgreSQL (`pg`), JWT, bcrypt, Socket.IO, Zod, Nodemailer, Razorpay SDK, PDFKit, CORS, cookie-parser  
**Deploy:** Vercel (frontend), Render (API + PostgreSQL)

## 4. Architecture

```
React (Vite) --HTTPS/JSON cookies--> Express REST API --> PostgreSQL
React --Socket.IO credentials-----> Socket.IO server --> PostgreSQL messages
React --Razorpay Checkout---------> Express verify HMAC --> donations + PDF
```

## 5. Folder structure

```
client/                 React SPA
server/src/             Express API
  config/ middleware/ controllers/ routes/ models/
  services/ socket/ validators/ utils/ db/
postman/                Postman collection
docker-compose.yml      Local PostgreSQL
render.yaml             Render blueprint
TESTING.md              QA checklist
```

## 6. Database schema

UUID primary keys. Tables: `users`, `profiles`, `connections`, `messages`, `jobs`, `job_applications`, `events`, `event_rsvps`, `donation_campaigns`, `donations`, `notifications`, `password_resets`.

See `server/src/db/schema.sql` for columns, foreign keys, enums, and indexes.

## 7. Environment variables

Copy examples (do not commit real `.env` files):

**`server/.env`**

| Name | Purpose |
| --- | --- |
| PORT | API port (5000) |
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Signing secret |
| CLIENT_URL | Frontend origin for CORS and cookies |
| COOKIE_SECURE | `true` in production HTTPS |
| RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET | Test mode keys |
| SMTP_* | Optional email |

**`client/.env`**

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Razorpay secrets are **never** placed in Vite env vars.

## 8. PostgreSQL setup

Create database `alumni_portal` on localhost:

```sql
CREATE DATABASE alumni_portal;
```

Example `DATABASE_URL` (change the password to yours; do not hard-code production passwords):

```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/alumni_portal
```

Or run Docker:

```bash
docker compose up -d
```

The compose file starts PostgreSQL 16 on port 5432 with database `alumni_portal` (user/password `postgres`/`postgres` for local development only).

## 9. Installation

```bash
cd server
copy .env.example .env   # Windows
npm install

cd ../client
copy .env.example .env
npm install
```

## 10. Running frontend

```bash
cd client
npm run dev
```

Opens http://localhost:5173

## 11. Running backend

```bash
cd server
npm run migrate
npm run seed
npm run dev
```

API: http://localhost:5000  
Health: `GET http://localhost:5000/api/health`

## 12. Seed script

```bash
cd server
npm run seed
```

Applies schema, truncates tables, and inserts demo users/jobs/events/campaigns. Safe to re-run in development (it wipes portal tables).

## 13. Demo credentials (development only)

These are **not** production credentials.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@siesgst.ac.in | DemoPass123! |
| Alumni | alumni@siesgst.ac.in | DemoPass123! |
| Student | student@siesgst.ac.in | DemoPass123! |

Pending alumni for verification UI: `pending.alumni@siesgst.ac.in` / `DemoPass123!` (cannot fully log in until approved).

## 14. API documentation

Consistent JSON: `{ "success": true|false, "message": "...", "data": {} }`

Cookie: `access_token` (httpOnly). Postman: enable cookie jar, or send `Authorization: Bearer <token>` after inspecting the cookie.

| Method | Path | Auth |
| --- | --- | --- |
| GET | /api/health | public |
| POST | /api/auth/register | public |
| POST | /api/auth/login | public |
| POST | /api/auth/logout | public |
| GET | /api/auth/me | cookie |
| POST | /api/auth/forgot-password | public |
| POST | /api/auth/reset-password | public |
| GET | /api/users | active user, directory filters |
| GET/PUT | /api/users/me/profile | user |
| GET | /api/users/:id | active user |
| POST/GET | /api/connections | active |
| PUT | /api/connections/:id/accept\|reject | addressee |
| GET | /api/messages/conversations | active |
| GET | /api/messages/:userId | connected |
| GET/POST | /api/jobs | list; POST alumni only |
| POST | /api/jobs/:id/apply | student |
| GET | /api/jobs/:id/applications | owner/admin |
| GET | /api/jobs/mine/applications | applicant |
| GET/POST | /api/events | POST alumni/admin |
| POST/DELETE | /api/events/:id/rsvp | active |
| GET | /api/donations/campaigns | active |
| POST | /api/donations/orders | active |
| POST | /api/donations/verify | active |
| GET | /api/donations/:id/receipt | donor/admin |
| GET | /api/notifications | user |
| PUT | /api/notifications/:id/read | user |
| PUT | /api/notifications/read-all | user |
| GET | /api/admin/dashboard\|analytics\|users\|verification\|jobs\|events\|donations | admin |
| PUT | /api/admin/verification/:id/approve\|reject | admin |
| PUT | /api/admin/jobs/:id/moderate | admin |
| PUT | /api/admin/events/:id/moderate | admin |
| POST | /api/admin/campaigns | admin |

Import `postman/SIES-Alumni-Portal.postman_collection.json`.

## 15. Socket.IO architecture

- Client connects to `VITE_SOCKET_URL` with `withCredentials: true`
- Server authenticates JWT from cookie or `auth.token`
- Rooms: user id
- Events: `send_message`, `receive_message`, `presence`, `typing`
- Every chat line is inserted into `messages` before emit

## 16. Razorpay sandbox setup

1. Create a Razorpay **test** account.
2. Put test Key ID and Key Secret in `server/.env` only.
3. Use Razorpay test cards from their documentation.
4. Flow: amount → `POST /donations/orders` → Checkout → `POST /donations/verify` (HMAC) → increment `collected_amount` → PDF.

If keys are missing, unrelated portal features still work; donation checkout returns 503.

## 17. Email configuration

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`. If they are absent, the API logs that email was skipped and continues.

Used for: alumni approve/reject, connection notice, job application, RSVP, donation receipt.

## 18. Testing

```bash
cd server
npm test
```

Manual coverage: see `TESTING.md`.

## 19. Deployment

**Database (Render PostgreSQL):** create a database, copy the external URL into `DATABASE_URL`, run `npm run migrate` and optionally `npm run seed` on a one-off job (do not seed production with demo passwords).

**Backend (Render):** `render.yaml` or Web Service, root `server`, start `npm start`, health `/api/health`. Set `CLIENT_URL` to the Vercel origin and `COOKIE_SECURE=true`.

**Frontend (Vercel):** root `client`, build `npm run build`, output `dist`. `vercel.json` rewrites SPA routes to `index.html`. Set `VITE_API_URL` and `VITE_SOCKET_URL` to the Render API origin (API URL without forgetting `/api` for Vite API).

## 20. Troubleshooting

| Symptom | Check |
| --- | --- |
| `DATABASE_URL is missing` | Copy `server/.env.example` |
| CORS / cookies blocked | `CLIENT_URL` must match the SPA origin exactly; credentials on |
| Alumni cannot log in | Status is PENDING until admin approval |
| Razorpay 503 | Test keys not set |
| Email silent | SMTP not configured (expected) |
| SPA 404 on refresh | Use `vercel.json` rewrites |

## Scripts

**Client:** `npm run dev` · `npm run build` · `npm run preview`  
**Server:** `npm run dev` · `npm start` · `npm run migrate` · `npm run seed` · `npm test`
