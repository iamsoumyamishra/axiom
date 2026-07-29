# Axiom Architecture

## System Overview

Axiom is an AI-powered knowledge platform that automatically understands, organizes, connects, and retrieves everything a user finds on the web. It transforms bookmarks into a structured, searchable second brain.

### Core Principle

The only user action is: **Analyze & Save**. Everything else is determined by AI.

### Workflow

```
Discover → Right Click → Analyze → AI Organizes → Retrieve Naturally Later
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Browser Extension                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Context   │  │ Content   │  │ Screenshot│  │ Popup    │  │ API Client   │ │
│  │ Menu      │  │ Extractor │  │ Capture   │  │ UI       │  │ (fetch)      │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────┬───────┘ │
└──────────────────────────────────────────────────────────────────┼─────────┘
                                                                   │
                                                          HTTPS (REST)
                                                                   │
┌──────────────────────────────────────────────────────────────────┼─────────┐
│                           Backend (NestJS + Fastify)            │         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐▼───────┐ │
│  │ Auth     │  │Ingestion │  │ Resources│  │ Search           │ Proxy  │ │
│  │ Module   │  │ Module   │  │ Module   │  │ Module           │ Routes │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────────────┘        │ │
│       │              │              │                                    │ │
│  ┌────▼──────────────▼──────────────▼──────────────────────────────────┐ │ │
│  │                    Internal Libraries (packages)                     │ │ │
│  │  ┌────────┐ ┌──────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌──────┐ │ │ │
│  │  │ Shared │ │   Data   │ │  Auth  │ │  AI   │ │ Search │ │Graph │ │ │ │
│  │  │(types) │ │ (Prisma) │ │ (JWT)  │ │ (LLM) │ │(Vector)│ │(KG)  │ │ │ │
│  │  └────────┘ └──────────┘ └────────┘ └───────┘ └────────┘ └──────┘ │ │ │
│  └─────────────────────────────────────────────────────────────────────┘ │ │
│                                                                          │ │
│  ┌─────────────────────────────────────────────────────────────────┐     │ │
│  │                    BullMQ Queue Layer                           │     │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │     │ │
│  │  │Ingestion │  │ Analysis │  │Embedding │  │Relationship  │   │     │ │
│  │  │ Queue    │  │ Queue    │  │ Queue    │  │ Queue        │   │     │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │     │ │
│  └─────────────────────────────────────────────────────────────────┘     │ │
└───────────────────────────────────────────────────────────────────────────┘
                                                                   │
                                                          Redis Pub/Sub
                                                                   │
┌───────────────────────────────────────────────────────────────────────────┐
│                          Worker Process                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Content      │  │ AI Analysis  │  │ Embedding    │  │ Relationship │  │
│  │ Extraction   │  │ Pipeline     │  │ Generation   │  │ Discovery    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
                                                                   │
                   ┌────────────────────────────────────────────────┼───────┐
                   │              Data Stores                      │       │
                   │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │       │
                   │  │PostgreSQL│  │  Redis   │  │  S3/Minio│    │       │
                   │  │+ pgvector│  │ (Queues) │  │ (Assets) │    │       │
                   │  └──────────┘  └──────────┘  └──────────┘    │       │
                   └──────────────────────────────────────────────┘       │
┌───────────────────────────────────────────────────────────────────────────┐
│                          Web Frontend (Next.js)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Dashboard│  │ Search   │  │ Resources│  │ Projects │  │ Graph    │  │
│  │          │  │          │  │          │  │          │  │ Visual   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Backend Framework | **NestJS 11** | Modular, DI, guards, interceptors, pipes. Built for complex backends. |
| HTTP Adapter | **Fastify** | Higher throughput than Express. Lower latency. |
| API Documentation | **Swagger/OpenAPI** | Auto-generated from decorators. Extension uses plain fetch. |
| ORM | **Prisma 6 + pgvector** | Schema-first, generated types, migration pipeline. |
| Database | **PostgreSQL 17 + pgvector** | Relational + vector search. No separate vector DB needed. |
| Queue | **BullMQ + Redis** | Reliable job processing, retries, delayed jobs, rate limiting. |
| Storage | **S3-compatible (MinIO)** | Screenshots, raw HTML, snapshots. |
| AI Providers | **Abstraction layer** | OpenAI, Anthropic, etc. Swappable via interface. |
| Monorepo | **Turborepo + pnpm** | Fast builds, caching, workspace management. |

---

## Monorepo Structure

```
axiom/
├── apps/
│   ├── api/                    # NestJS HTTP API server
│   ├── worker/                 # NestJS background worker
│   ├── web/                    # Next.js frontend
│   └── extension/              # Browser extension (Vite + React)
├── packages/
│   ├── shared/                 # DTOs, types, constants, validation schemas
│   ├── data/                   # Prisma schema, client, migrations
│   ├── auth/                   # JWT signing, password hashing (framework-agnostic)
│   ├── resources/              # Resource domain logic (future)
│   ├── ingestion/              # Content extraction pipeline (future)
│   ├── ai/                     # AI provider abstraction (future)
│   ├── search/                 # Search services (future)
│   ├── graph/                  # Knowledge graph logic (future)
│   ├── projects/               # Project domain logic (future)
│   ├── collections/            # Collection logic (future)
│   ├── dedup/                  # Deduplication logic (future)
│   └── storage/                # S3 abstraction (future)
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   ├── Dockerfile.web
│   └── docker-compose.yml
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   ├── development.md
│   └── extension.md
└── (root config files)
```

### Package Dependency Rules

```
shared (zero deps)
  ← data (depends on shared)
  ← auth (depends on shared)
  ← resources (depends on data, shared)
  ← ingestion (depends on shared)
  ← ai (depends on shared)
  ← search (depends on data, shared, ai)
  ← graph (depends on data, shared, ai)
  ← projects (depends on data, shared)
  ← collections (depends on data, shared)
  ← dedup (depends on data, shared, ai)
  ← storage (depends on shared)

apps/api  ← imports from all packages
apps/worker ← imports from ai, ingestion, dedup, graph, data, storage
apps/web  ← imports from shared (types only)
apps/extension ← imports from shared (types only)
```

---

## Bounded Contexts

| Context | Responsibility | Key Entities |
|---------|---------------|--------------|
| **Auth** | User registration, login, token management | User |
| **Resources** | Resource CRUD, metadata management | Resource, ResourceContent |
| **Ingestion** | Content reception, extraction pipeline | Job, Resource |
| **AI Pipeline** | Classification, summarization, tagging, entities | AIAnalysis |
| **Embedding** | Vector embedding generation and storage | Embedding |
| **Knowledge Graph** | Relationship discovery, graph queries | Relationship |
| **Search** | Semantic + keyword search, autocomplete | — |
| **Projects** | Project management, resource grouping | Project, ResourceProject |
| **Collections** | Auto-generated + manual collections | Collection, ResourceCollection |
| **Deduplication** | Duplicate detection, merge suggestions | AIAnalysis.duplicateOf |
| **Storage** | S3 file management, presigned URLs | Snapshot |

---

## Key Design Decisions

### 1. Why NestJS over Next.js API Routes
Next.js API routes lack built-in support for queues, background workers, WebSockets, and DI. Building an AI pipeline with BullMQ requires all of these. NestJS provides them natively. The frontend (Next.js) and backend (NestJS) communicate via REST — keeping them loosely coupled.

### 2. Why REST over tRPC
The browser extension needs a lightweight client. REST with OpenAPI allows the extension to use plain `fetch`. The web frontend can consume the same OpenAPI docs for type safety. This keeps the API boundary explicit and framework-independent.

### 3. Why Separate Worker Process
AI processing can take 10-30 seconds per resource. Running it in the API process would block the event loop. A separate worker process (NestJS standalone app) consumes BullMQ jobs independently and can be scaled horizontally.

### 4. Why resourceType is a String
Resource types like "article", "video", "tweet" should not require database migrations when new types emerge. Using a string field with metadata JSONB allows extensibility without schema changes.

### 5. Why Provider-Agnostic AI Layer
LLM providers evolve rapidly. Abstracting the AI layer behind interfaces (LlmsProvider, EmbeddingProvider) allows swapping providers without changing business logic. Configuration determines which provider to use.

---

## Communication Flows

### Extension Save Flow
```
Extension                API                     Worker
   │                      │                        │
   │── POST /ingestion ──►│                        │
   │    (URL, HTML, meta) │                        │
   │◄── 202 { jobId } ────│                        │
   │                      │── queue('ingestion') ──►│
   │                      │                        │── Extract content
   │                      │                        │── Queue analysis
   │                      │                        │── Store results
   │                      │◄── job complete ───────│
   │◄── notification ─────│                        │
```

### Search Flow
```
Client                   API                     PostgreSQL
   │                      │                        │
   │── GET /search ──────►│                        │
   │   ?q=natural+query   │                        │
   │                      │── vector similarity ──►│
   │                      │◄── results ───────────│
   │                      │── full-text search ───►│
   │                      │◄── results ───────────│
   │                      │── merge + rank ───────►│
   │◄── ranked results ───│                        │
```

---

## Security Model

1. **JWT-based authentication** with access + refresh tokens
2. **Tokens stored** in chrome.storage.local (extension) or httpOnly cookies (web)
3. **Resource ownership** — all resources scoped to user ID
4. **Input validation** — Zod schemas on all public endpoints
5. **Rate limiting** — per-user, per-IP
6. **CORS** — whitelist extension origins
7. **No HTML storage** — clean markdown preferred; HTML snapshots in S3
