# API Reference

## Overview

The Axiom API follows REST conventions. All endpoints return JSON with a consistent response envelope.

**Base URL:** `http://localhost:4000/api/v1`

**Response Envelope:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Envelope:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": { ... }
  }
}
```

**Authentication:** Bearer JWT token in `Authorization` header.

---

## Auth Endpoints

### POST /auth/register
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "User Name",
    "createdAt": "2026-07-30T00:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

### POST /auth/login
Authenticate with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "tokens": { ... }
}
```

### POST /auth/refresh
Refresh an expired access token.

**Request:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### GET /auth/profile
Get the current user's profile. Requires authentication.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "clx...",
  "email": "user@example.com",
  "name": "User Name",
  "createdAt": "2026-07-30T00:00:00.000Z"
}
```

---

## Health Endpoint

### GET /health
Health check for monitoring.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-07-30T00:00:00.000Z",
  "version": "0.1.0"
}
```

---

## Planned Endpoints (Future Phases)

### Ingestion
- `POST /ingestion/save` — Save a URL/resource
- `POST /ingestion/save-text` — Save selected text or code
- `POST /ingestion/save-image` — Save an image

### Resources
- `GET /resources` — List resources (paginated, filterable)
- `GET /resources/:id` — Get resource detail
- `PATCH /resources/:id` — Update resource metadata
- `DELETE /resources/:id` — Soft delete

### Search
- `GET /search?q=...` — Semantic + keyword search
- `GET /search/suggestions?q=...` — Autocomplete

### Projects
- `GET /projects` — List projects
- `POST /projects` — Create project
- `GET /projects/:id` — Get project with resources
- `PATCH /projects/:id` — Update project
- `DELETE /projects/:id` — Delete project
- `POST /projects/:id/resources` — Add resource to project

### Collections
- `GET /collections` — List collections (auto + manual)
- `GET /collections/:id` — Get collection with resources

### Knowledge Graph
- `GET /graph/resources/:id/related` — Get related resources
- `GET /graph/relationships` — Query relationships

### User
- `GET /me/stats` — Dashboard statistics
