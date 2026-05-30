# Shelter API

Faith-based mental health backend.

## Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js 4 + TypeScript 5
- **DB:** PostgreSQL 16 (via Supabase)
- **Cache:** Redis 7 (via Render Redis)
- **Auth:** JWT access/refresh tokens with rotation

---

## Local Setup

### Prerequisites

- Node.js 20
- PostgreSQL 16
- Redis 7 (or Docker)

### Install

```bash
git clone https://github.com/levoski1/Backend.git
cd Backend
cp .env.example .env
npm install
```

### Environment Variables

Edit `.env` with your values:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | no | `development` / `production` / `test` |
| `PORT` | no | Default `4000` |
| `JWT_ACCESS_SECRET` | **yes** | ≥32 chars |
| `JWT_REFRESH_SECRET` | **yes** | ≥32 chars |
| `DB_HOST` | **yes** | Supabase host |
| `DB_PORT` | **yes** | `6543` (transaction pooler) |
| `DB_NAME` | **yes** | `postgres` |
| `DB_USER` | **yes** | `postgres.<ref>` |
| `DB_PASSWORD` | **yes** | Supabase password |
| `REDIS_URL` | no | Single-URI Redis (Render). Falls back to REDIS_HOST/PORT |

Full list in `.env.example`.

### Run

```bash
npm run dev           # hot-reload
npm run build         # build
npm start             # production (after build)
```

### Migrations

```bash
npm run db:migrate    # latest
npm run db:seed       # seed data
npm run db:rollback   # revert last batch
```

### Tests

```bash
npm test              # all
npm run test:unit     # unit only
npm run test:cov      # with coverage
```

---

## Auth Endpoints

All under `/api/v1/auth`.

### `POST /register`

```
Body: { "fullName": "Levi Test", "email": "levi@test.com", "password": "TestPass123" }
201: {
  "success": true,
  "data": {
    "user": { "id": "...", "fullName": "...", "email": "..." },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### `POST /login`

```
Body: { "email": "levi@test.com", "password": "TestPass123" }
200: { "success": true, "data": { "user": {...}, "accessToken": "eyJ...", "refreshToken": "eyJ..." } }
401: { "success": false, "error": { "code": "AUTHENTICATION_ERROR", "message": "Invalid email or password" } }
```

### `POST /refresh`

```
Body: { "refreshToken": "eyJ..." }
200: { "success": true, "data": { "user": {...}, "accessToken": "eyJ... (new)", "refreshToken": "eyJ... (new)" } }
401: revoked or expired token
```

### `POST /logout`

```
Body: { "refreshToken": "eyJ..." }
200: { "success": true, "data": null }
```

### `GET /health`

```
200: { "success": true, "data": { "status": "healthy", "database": "connected" } }
```

---

## Deploy (Render)

### Web Service

1. Connect your GitHub repo
2. **Build:** `npm install; npm run build`
3. **Start:** `npm start`
4. Set all env vars from `.env.example` in Render dashboard

### Redis

1. Create Redis instance in Render dashboard
2. Copy connection string → set as `REDIS_URL` env var on your Web Service
3. Example: `redis://red-xxxxxxxxxxxxx:6379`

### Manual Test Flow

```bash
curl -X POST https://backend-vxbe.onrender.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Levi Test","email":"levi@test.com","password":"TestPass123"}'
```

Full manual test cases in [`levi_tests/api_tests.md`](levi_tests/api_tests.md).

---

## Project Structure

```
src/
├── application/    # business logic (auth, profile, etc.)
├── domain/         # entities, value objects
├── infrastructure/ # DB, cache, external services
├── interfaces/     # HTTP routes, controllers, middleware
├── shared/         # errors, logging, utils
└── config/         # env validation (zod)
tests/
├── unit/
├── integration/
└── e2e/
```

---

## Key Scripts

| Script | What |
|--------|------|
| `npm run dev` | Dev with hot-reload |
| `npm run build` | TypeScript compile |
| `npm start` | Run compiled app |
| `npm test` | Full test suite |
| `npm run lint` | ESLint |
| `npm run test:cov` | Coverage |

---

## License

MIT
