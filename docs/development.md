# Development Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

## Getting Started

### 1. Clone and Install

```bash
git clone <repo-url> axiom
cd axiom
pnpm install
```

### 2. Start Infrastructure

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts:
- PostgreSQL 17 with pgvector on port 5432
- Redis 7 on port 6379
- MinIO (S3-compatible) on ports 9000 (API) and 9001 (Console)

### 3. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your settings
```

### 4. Run Database Migrations

```bash
pnpm db:generate
pnpm db:migrate
```

### 5. Start Development

```bash
pnpm dev
```

This starts all apps in development mode:
- API: http://localhost:4000
- Swagger Docs: http://localhost:4000/api/docs
- Web: http://localhost:3000 (future)

---

## Project Scripts

```bash
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all packages and apps
pnpm lint             # Lint all packages and apps
pnpm typecheck        # Type-check all packages and apps
pnpm format           # Format code with Prettier
pnpm clean            # Clean all build artifacts

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema changes (dev only)
pnpm db:studio        # Open Prisma Studio
```

---

## Package Development

### Adding a New Package

1. Create directory under `packages/`
2. Add `package.json` with `name: "@axiom/<name>"`
3. Add `tsconfig.json` extending the base
4. Export from `src/index.ts`
5. Add to dependencies in `apps/api/package.json` (or wherever needed)

### Package Dependencies

```bash
# Add dependency from one package to another
pnpm --filter @axiom/api add @axiom/shared@workspace:*
```

---

## Code Style

- **Strict TypeScript** — `strict: true`, `noUncheckedIndexedAccess`
- **No `any`** — Use `unknown` and type guards
- **Functional where appropriate** — Pure functions, immutable data
- **No business logic in UI** — All logic in packages/services
- **Feature-based organization** — Modules own their domain
- **Small modules** — Single responsibility per file

---

## Testing

```bash
# Run all tests
pnpm --filter <package> test

# Run tests in watch mode
pnpm --filter <package> test:watch
```

**Testing strategy:**
- Unit tests for domain logic (packages)
- Integration tests for API endpoints (apps/api)
- E2E tests for critical flows

---

## Working with Prisma

### Schema Changes

1. Edit `packages/data/prisma/schema.prisma`
2. Run `pnpm db:migrate --name <description>`
3. Run `pnpm db:generate`

### Using Prisma Client

```typescript
import { getPrisma } from '@axiom/data';

const prisma = getPrisma();
const users = await prisma.user.findMany();
```

---

## Docker

### Production Build

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up -d
```

### Individual Service Build

```bash
docker build -t axiom-api -f docker/Dockerfile.api .
docker build -t axiom-worker -f docker/Dockerfile.worker .
docker build -t axiom-web -f docker/Dockerfile.web .
```
