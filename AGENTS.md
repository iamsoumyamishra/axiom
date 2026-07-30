# AI Bookmark Intelligence Platform

## Mission

Build a browser extension and backend that transforms anything a user finds on the web into structured knowledge.

The goal is **not** to build another bookmark manager.

The goal is to build an AI-powered second brain that automatically understands, categorizes, relates, and organizes everything the user saves with minimal interaction.

The user should never need to think about folders.

---

# Core Principle

The only action a user should perform is:

> Analyze & Save

Everything else is determined by AI.

The system should infer:

- what the resource is
- why it is valuable
- how important it is
- where it belongs
- what projects it relates to
- whether it already exists
- how it connects with previous knowledge

---

# Product Philosophy

Traditional bookmarking:

Bookmark
→ Folder
→ Forget forever

Desired workflow:

Discover
→ Right Click
→ Analyze
→ AI Organizes
→ Search naturally later

The system should feel like an external memory rather than a file manager.

---

# Supported Resource Types

The platform must support any publicly accessible resource.

Examples include:

- Web pages
- Articles
- Blog posts
- Documentation
- GitHub repositories
- YouTube videos
- Research papers
- PDFs
- Products
- Tweets/X posts
- Reddit discussions
- Stack Overflow answers
- Images
- Designs
- Figma links
- LinkedIn posts
- News
- Podcasts
- Entire websites
- Individual hyperlinks
- Selected text
- Code snippets

Design everything around extensibility.

Never hardcode resource types.

---

# Browser Extension

The browser extension should provide:

- Right-click context menu
- Save current page
- Save selected link
- Save highlighted text
- Save image
- Save code block
- Save PDF
- Save video

Future support:

- Keyboard shortcut
- Omnibox search
- Side panel
- Floating action button
- Mobile browser support

---

# Context Menu

Preferred actions:

Analyze & Save

Optional:

Quick Save
Save to Project
Save without AI

---

# Extension Responsibilities

Collect:

- URL
- Page title
- Selected text
- HTML
- Markdown
- Readability content
- Meta tags
- OpenGraph metadata
- Images
- Screenshot
- Favicon
- Author
- Publish date
- Timestamp
- Language

The extension should do lightweight extraction only.

Heavy processing belongs to the backend.

---

# Backend Responsibilities

Responsible for:

- Authentication
- Queueing
- AI analysis
- Deduplication
- Embeddings
- Storage
- Knowledge graph
- Search
- Recommendations
- Project linking

The backend should be stateless wherever possible.

---

# AI Responsibilities

The LLM decides:

Category

Subcategory

Importance

Tags

Summary

Topics

Key concepts

Named entities

Related resources

Suggested project

Difficulty

Reading time

Quality score

Novelty score

Duplicate confidence

Action items (if applicable)

The AI should always explain its reasoning internally but only expose concise results to users.

---

# Knowledge Model

Everything becomes a Resource.

A Resource may contain:

- metadata
- extracted content
- AI analysis
- embeddings
- relationships
- snapshots
- attachments

Resources should never depend on UI representation.

---

# Relationships

The knowledge graph is first-class.

Resources may relate through:

- Similar
- References
- Contradicts
- Continues
- Prerequisite
- Alternative
- Same topic
- Same author
- Same project
- Duplicate
- Version update

Relationships should be generated automatically whenever confidence is sufficiently high.

---

# Search Philosophy

Users should never have to remember titles.

Search should support:

Natural language

Examples:

"What did I save about transformers?"

"Show articles explaining Docker."

"Find that Redis article."

"What projects mention Stripe?"

Use semantic search before keyword search.

---

# AI Memory

Every saved resource improves future organization.

When new resources are analyzed, compare them against:

- existing resources
- existing projects
- existing topics
- existing tags
- knowledge graph

The AI should continuously refine organization.

---

# Collections

Collections should emerge automatically.

Examples:

Artificial Intelligence

Machine Learning

LLMs

Distributed Systems

Design Inspiration

Recipes

Photography

Travel

Finance

Programming

Users should rarely create collections manually.

---

# Projects

Projects are independent from collections.

One resource may belong to multiple projects.

Examples:

Personal Website

Masters Research

Startup Idea

E-commerce App

Sentiment Analysis

Projects represent work.

Collections represent knowledge.

---

# Deduplication

Detect duplicates using:

- canonical URL
- embeddings
- extracted content
- title similarity
- metadata
- hashes

Never create duplicates when confidence is high.

Offer merge suggestions when confidence is moderate.

---

# Content Extraction

Preferred order:

1. Readability
2. Metadata
3. Structured data
4. OpenGraph
5. HTML parsing
6. OCR (future)

Avoid storing unnecessary HTML.

Prefer clean Markdown for searchable content.

---

# AI Pipeline

Extraction

↓

Cleaning

↓

Chunking

↓

Classification

↓

Summarization

↓

Tag generation

↓

Entity extraction

↓

Embedding generation

↓

Relationship discovery

↓

Deduplication

↓

Storage

---

# Storage

Store separately:

Original URL

Raw HTML

Extracted Markdown

Clean text

Metadata

AI analysis

Embeddings

Screenshots

Snapshots

Relationships

Audit history

---

# Performance

Extension interactions should feel instant.

Target:

Context click

↓

Immediate confirmation

↓

Background upload

↓

Background AI analysis

↓

Notification when completed

Never block the user while waiting for AI.

---

# Privacy

User data belongs to the user.

Support:

- Local-only mode
- Cloud mode
- End-to-end encryption (future)
- Data export
- Data deletion
- Offline search (future)

Never analyze private pages without explicit permission.

---

# API Philosophy

REST or tRPC for client communication.

Processing should be asynchronous.

Large AI jobs should always use queues.

All operations should be idempotent.

---

# Database

Prefer PostgreSQL.

Use pgvector for embeddings.

Suggested entities:

User

Resource

Project

Collection

Relationship

Embedding

Snapshot

Tag

Entity

Job

AuditLog

---

# Tech Stack

Frontend:
- React
- TypeScript
- Tailwind CSS

Extension:
- Manifest V3
- React
- TypeScript

Backend:
- Node.js
- Next.js
- Prisma

Database:
- PostgreSQL
- pgvector

Queue:
- BullMQ

Storage:
- S3-compatible object storage

Search:
- PostgreSQL Full Text
- Vector Search

AI:
- LLM
- Embedding model

---

# Coding Standards

- Strict TypeScript
- Functional programming where appropriate
- Modular architecture
- Dependency injection where beneficial
- No business logic inside UI
- Prefer composition over inheritance
- Avoid premature optimization
- Favor readability over cleverness

---

# Folder Philosophy

Every module should own one responsibility.

Avoid "utils" dumping grounds.

Prefer feature-based organization.

Example:

features/
    resources/
    ai/
    projects/
    search/
    graph/
    auth/
    extension/

---

# Testing

Prioritize:

- Unit tests
- Integration tests
- End-to-end tests

Critical AI pipelines should have regression datasets.

---

# Future Vision

The platform should evolve from a bookmark manager into a lifelong knowledge companion.

Future capabilities may include:

- AI chat over personal knowledge
- Automatic research reports
- Daily learning summaries
- Knowledge graph visualization
- Project recommendations
- Reading prioritization
- Duplicate cleanup
- Topic evolution over time
- AI-assisted writing from saved resources
- Multi-device synchronization
- Team knowledge spaces
- Voice capture
- Email ingestion
- PDF annotation
- Local AI inference

---

# Non-Goals

Do not build:

- Another folder-based bookmark app
- A simple link database
- A notes clone
- A browser history replacement

Always optimize for knowledge retrieval, understanding, and long-term usefulness rather than storage alone.

---

# Guiding Principle

Every engineering decision should answer one question:

> "Does this make it easier for users to remember, rediscover, and build upon what they have learned?"

If the answer is no, reconsider the design.

---

# Implementation Notes

## Env & Config (2026-07-30)
- `.env.local` is loaded in `apps/api/src/main.ts` via `dotenv.config()` before `bootstrap()`.
  - The path is relative (cwd is `apps/api/`), so it reads `../../.env.local` (monorepo root).
  - ESM entry point used `import.meta.dirname` to resolve to the root.
- `app.module.ts` Redis connection parses `REDIS_URL` with `new URL()` as fallback (prefers `REDIS_HOST`/`REDIS_PORT` when set).
- All config values go through NestJS `ConfigModule` from `.env.local`.

## Provider Registry & Local AI (2026-07-30)
- `NullEmbeddingProvider`/`NullLlmProvider` allow empty `apiKey` when `baseUrl` points to `localhost`/`127.0.0.1`/`0.0.0.0`.
  - This enables Ollama/n8n local AI without requiring an API key.
- Pattern: `provider-registry.ts` checks `isLocalUrl(baseUrl)` before validating `apiKey`.

## Embeddings (2026-07-30)
- `openai-compatible.provider.ts` only sends `dimensions` body field when value > 0 (Ollama rejects this param).
- `embeddings.module.ts` parses `EMBEDDING_DIMENSIONS` with `parseInt()` (ConfigService returns string).
- `embeddings.service.ts` truncates text to 8000 chars before embedding (nomic-embed-text 8192-token context).
- Schema dimension: `vector(768)` for nomic-embed-text.
- HNSW index: `idx_embedding_hnsw` on `vector` using `vector_cosine_ops` with `m=16, ef_construction=200`.

## Search (2026-07-30)
- Hybrid: vector search (pgvector `<->`) with text-only fallback.
- Text fallback: `to_tsvector('english')` + `ILIKE` on title.
- **Important**: The search controller must use `@CurrentUser() user: { sub: string }` (not `@Req() req.user.userId`). JWT strategy returns `{ sub, email }` — `sub` is the user ID.

## Pipeline Status (2026-07-30)
**FULLY FUNCTIONAL** end-to-end:
1. POST `/api/v1/resources` (save URL)
2. BullMQ queue → `ExtractionProcessor` (fetch + parse HTML)
3. BullMQ queue → `AiAnalysisProcessor` (Groq llama-3.3-70b → category, summary, tags, importance)
4. BullMQ queue → `EmbeddingsProcessor` (Ollama nomic-embed-text → 768-dim vector)
5. GET `/api/v1/search?q=...` (semantic vector search returns ranked results)

Curl integration test confirms: save → extract (3s) → AI analyze (2s) → embed (26s) → search (1s).
