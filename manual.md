# Render Deployment — Manual Setup

## 1. Create Redis Service

1. Render Dashboard → **New + → Redis**
2. Name: `shelter-redis`, Plan: **Free**, click **Create**
3. After creation, copy the **Connection String** from the dashboard

## 2. Create Web Service

1. Render Dashboard → **New + → Web Service**
2. Connect your GitHub repo (`shelterfaithapps/Backend`)
3. Configure:
   - **Name**: `shelter-api`
   - **Runtime**: **Docker**
   - **Dockerfile Path**: `docker/Dockerfile`
   - **Health Check Path**: `/api/v1/health`
   - **Plan**: **Free**

## 3. Environment Variables

After creating the Web Service, go to **Environment** and add each variable below. Do **not** paste these into source control — set them directly in the Render dashboard.

```plaintext
NODE_ENV=production
PORT=4000
API_PREFIX=/api/v1
HOST=0.0.0.0
REQUEST_TIMEOUT_MS=30000
CORS_ORIGINS=https://your-frontend.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
JWT_ACCESS_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_REFRESH_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
DB_HOST=<supabase-pooler-host>
DB_PORT=6543
DB_NAME=postgres
DB_USER=<supabase-db-user>
DB_PASSWORD=<supabase-db-password>
DB_POOL_MIN=2
DB_POOL_MAX=20
REDIS_URL=<redis-connection-string-from-render-dashboard>
LOG_LEVEL=info
LOG_FORMAT=json
```

Only **`CORS_ORIGINS`** needs updating when you have a frontend URL. All secret values must be sourced from your Supabase and Render dashboards.

## 4. Deploy

1. **Save** the environment variables
2. Click **Manual Deploy → Deploy Latest Commit**
3. Watch logs — build takes ~2-3 minutes
4. Verify: `https://shelter-api.onrender.com/api/v1/health`

## 5. Run Migrations

```bash
npm run db:migrate
```

## 6. Troubleshooting

| Problem | Fix |
|---------|-----|
| Health returns `database: disconnected` | Check `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` in env vars |
| Redis connection errors | Verify `REDIS_URL` is the full connection string from shelter-redis dashboard |
| 401 on login/register | Passport strategy not loaded — verify build succeeded without errors |
