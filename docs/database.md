# Database Schema

## Overview

Axiom uses PostgreSQL 17 with the `pgvector` extension for vector embeddings. The schema is designed around the `Resource` as the universal entity type.

## Entity Relationship Diagram

```
User (1) ──── (N) Resource (1) ──── (1) ResourceContent
                            │
                            ├── (1) AIAnalysis
                            │
                            ├── (1) Embedding (vector(1536))
                            │
                            ├── (N) ResourceProject (N) ──── Project
                            │
                            ├── (N) ResourceCollection (N) ── Collection
                            │
                            ├── (N) ResourceTag (N) ──────── Tag
                            │
                            ├── (N) ResourceEntity (N) ───── Entity
                            │
                            ├── (N) Relationship (Source)
                            │       (N) Relationship (Target)
                            │
                            └── (N) Snapshot
```

---

## Core Tables

### User
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| email | String (unique) | User email |
| password | String | bcrypt hash |
| name | String? | Display name |
| image | String? | Avatar URL |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Resource
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| url | String? | Nullable for text-only resources |
| title | String? | Page title or user-provided |
| description | String? | Auto-generated or user-provided |
| resourceType | String | Extensible: "article", "video", "tweet", ... |
| metadata | JSONB | Author, publishDate, language, ogImage, ... |
| status | Enum | PENDING → PROCESSING → COMPLETED / FAILED / DUPLICATE |
| userId | FK → User | Owner |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| savedAt | DateTime | When user saved it |

**Design rationale:**
- `url` is nullable — not all resources have URLs (code snippets, text selections)
- `resourceType` is a string — new types don't require migrations
- `metadata` is JSONB — each resource type stores different fields

### ResourceContent
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| resourceId | FK (unique) | One-to-one with Resource |
| rawHtml | String? | Original HTML (stripped) |
| markdown | String? | Converted via Turndown |
| cleanText | String? | Extractable text for AI/embeddings |
| extractedAt | DateTime? | When extraction completed |

**Design rationale:**
Separated from Resource to keep the main table lightweight. Content is loaded on demand.

### AIAnalysis
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| resourceId | FK (unique) | One-to-one with Resource |
| category | String? | High-level category |
| subcategory | String? | Refined category |
| summary | String? | AI-generated summary |
| importance | Int? | 1-10 scale |
| qualityScore | Float? | 0-1 quality estimate |
| noveltyScore | Float? | 0-1 novelty estimate |
| difficulty | String? | beginner / intermediate / advanced |
| readingTime | Int? | Estimated minutes |
| tags | String[] | AI-generated tags |
| topics | String[] | Identified topics |
| keyConcepts | String[] | Key concepts extracted |
| entities | JSONB | Structured entities: {people, orgs, places, ...} |
| model | String? | LLM model used |
| confidence | Float? | Overall confidence |
| reasoning | String? | Internal AI reasoning (not user-facing) |
| duplicateOf | String? | Resource ID if duplicate |
| duplicateConfidence | Float? | Confidence of duplication |

### Embedding
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| resourceId | FK (unique) | One-to-one with Resource |
| vector | vector(1536) | OpenAI text-embedding-3-small dimension |

**Design rationale:**
Pgvector enables similarity search directly in PostgreSQL — no separate vector database needed.

---

## Relationship Tables (Knowledge Graph)

### Relationship
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| sourceId | FK → Resource | Source resource |
| targetId | FK → Resource | Target resource |
| type | String | See RelationshipType enum |
| confidence | Float? | 0-1 confidence |
| createdAt | DateTime | |
| UNIQUE(sourceId, targetId, type) | | Prevents duplicate edges |

### Relationship Types
- `similar` — Topically similar
- `references` — One references the other
- `contradicts` — Contradictory information
- `continues` — Continues the discussion
- `prerequisite` — One is prerequisite for the other
- `alternative` — Alternative approach/solution
- `same_topic` — Same topic coverage
- `same_author` — Same author/creator
- `same_project` — Same project
- `duplicate` — Duplicate content
- `version_update` — Updated version

---

## Categorization Tables

### Tag
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| name | String | Tag name |
| userId | FK → User | Owner |
| UNIQUE(name, userId) | | Per-user unique |

### ResourceTag (many-to-many)

### Entity
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| name | String | Entity name |
| type | String | person, organization, place, concept, ... |
| userId | FK → User | Owner |
| UNIQUE(name, type, userId) | | Per-user unique |

### ResourceEntity (many-to-many)

---

## Project & Collection Tables

### Project
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| name | String | Project name |
| description | String? | |
| color | String? | UI color |
| userId | FK → User | Owner |

### ResourceProject (many-to-many, composite PK)

### Collection
| Column | Type | Notes |
|--------|------|-------|
| id | String (CUID) | Primary key |
| name | String | Collection name |
| description | String? | |
| isAuto | Boolean | Auto-generated by AI |
| userId | FK → User | Owner |

### ResourceCollection (many-to-many, composite PK)

---

## Auxiliary Tables

### Snapshot
Version history of a resource. Stores content + screenshot at time of save.

### AuditLog
Immutable audit trail for all operations.

### Job
Tracks queue jobs and their status.

---

## Indexing Strategy

```sql
-- Primary indexes are on FKs and unique constraints (automatic)

-- Vector similarity search (requires pgvector extension)
CREATE INDEX embedding_vector_idx ON "Embedding"
  USING ivfflat (vector vector_cosine_ops)
  WITH (lists = 100);

-- Full-text search
CREATE INDEX resource_fulltext_idx ON "Resource"
  USING gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Time-based queries
CREATE INDEX resource_saved_at_idx ON "Resource" ("savedAt" DESC);
CREATE INDEX resource_status_idx ON "Resource" ("status");

-- Relationship graph queries
CREATE INDEX relationship_source_idx ON "Relationship" ("sourceId");
CREATE INDEX relationship_target_idx ON "Relationship" ("targetId");
```
