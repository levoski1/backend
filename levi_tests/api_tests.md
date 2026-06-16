# Auth API — Manual Test Cases

**Base URL:** `http://localhost:4000/api/v1/auth`

---

## 1. Register

**Endpoint:** `POST /register`

### TC-1.1 — Success
```
Body (JSON):
{
  "fullName": "Levi Test",
  "email": "levi_test@example.com",
  "password": "TestPass123"
}

Expected: 201
Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "fullName": "Levi Test",
      "email": "levi_test@example.com"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### TC-1.2 — Duplicate email
```
Same body as TC-1.1

Expected: 409
{
  "success": false,
  "error": { "code": "CONFLICT", "message": "A user with this email already exists" }
}
```

### TC-1.3 — Missing fields
```
{ "email": "only@email.com" }
Expected: 400
```

### TC-1.4 — Invalid email
```
{ "fullName": "Levi", "email": "notanemail", "password": "TestPass123" }
Expected: 400
```

### TC-1.5 — Short password (< 8 chars)
```
{ "fullName": "Levi", "email": "levi2@test.com", "password": "Ab1" }
Expected: 400
```

---

## 2. Login

**Endpoint:** `POST /login`

### TC-2.1 — Success
```
Body:
{
  "email": "levi_test@example.com",
  "password": "TestPass123"
}

Expected: 200
{
  "success": true,
  "data": {
    "user": { "email": "levi_test@example.com" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### TC-2.2 — Wrong email
```
{ "email": "noone@example.com", "password": "TestPass123" }
Expected: 401
```

### TC-2.3 — Wrong password
```
{ "email": "levi_test@example.com", "password": "WrongPass999" }
Expected: 401
```

### TC-2.4 — Missing email
```
{ "password": "TestPass123" }
Expected: 400
```

---

## 3. Refresh Token

**Endpoint:** `POST /refresh`

### TC-3.1 — Success
```
Take refreshToken from TC-1.1 or TC-2.1 response.

Body:
{
  "refreshToken": "eyJ... (the refresh token)"
}

Expected: 200
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "eyJ... (new)",
    "refreshToken": "eyJ... (new)"
  }
}
```

### TC-3.2 — Missing token
```
{ }
Expected: 400
```

### TC-3.3 — Invalid/expired token
```
{ "refreshToken": "some.garbage.token" }
Expected: 401
```

---

## 4. Logout

**Endpoint:** `POST /logout`

### TC-4.1 — Success
```
Body:
{
  "refreshToken": "eyJ... (the refresh token to revoke)"
}

Expected: 200
{ "success": true, "data": null }
```

### TC-4.2 — No token (still succeeds)
```
{ }
Expected: 200
```

### TC-4.3 — Verify token revoked
```
Call TC-3.1 with the same refreshToken from TC-4.1.
Expected: 401 (token revoked)
```

---

## 5. Health Check

**Endpoint:** `GET /api/v1/health`

### TC-5.1 — Server + DB healthy
```
Expected: 200
{ "success": true, "data": { "status": "healthy", "database": "connected" } }
```

---

## Quick Test Flow (copy-paste order)

```
1. Health   → GET  /api/v1/health
2. Register → POST /api/v1/auth/register    { "fullName":"Levi","email":"levi_test@example.com","password":"TestPass123" }
3. Login    → POST /api/v1/auth/login       { "email":"levi_test@example.com","password":"TestPass123" }
4. Refresh  → POST /api/v1/auth/refresh     { "refreshToken":"<from step 2 or 3>" }
5. Logout   → POST /api/v1/auth/logout      { "refreshToken":"<from step 2 or 3>" }
6. Refresh  → POST /api/v1/auth/refresh     { "refreshToken":"<same token>" }  ← expect 401
```

> Full response schemas include `meta` with `requestId` and `timestamp` on every response.
