# nexus-worker

> Background job processor for the [Nexus](https://github.com/Prajwal-Thite/nexus-infra) platform. Consumes jobs from Redis queues using BullMQ and processes them asynchronously against PostgreSQL.

Part of a three-repository platform:

| Repository | Role |
|---|---|
| [nexus-api](https://github.com/Prajwal-Thite/nexus-api) | GraphQL API — Apollo Server v5, Prisma ORM, PostgreSQL |
| **nexus-worker** (this repo) | Background job processor — BullMQ, outbox pattern |
| [nexus-infra](https://github.com/Prajwal-Thite/nexus-infra) | Orchestration — Docker Compose, Grafana Alloy |

---

## What it does

The worker runs alongside the API and processes jobs that should not block the request/response cycle. It listens on three queues:

| Queue | Responsibility |
|---|---|
| `post-queue` | Processes post-related background jobs |
| `user-queue` | Processes user-related background jobs |
| `comment-queue` | Processes comment-related background jobs |

### Outbox pattern

Jobs are written to PostgreSQL first (the outbox) before being enqueued in Redis. If the worker crashes and restarts, no jobs are lost — the outbox acts as the source of truth.

### Observability

Exposes two Prometheus metrics endpoints. Grafana Alloy (running in the Docker network) scrapes the internal endpoint every 15s and forwards metrics to Grafana Cloud. Logs are shipped to Grafana Loki via `winston-loki`.

---

## Tech stack

- **Runtime:** Node.js (ESM), TypeScript
- **Queue:** BullMQ backed by Redis
- **Database:** PostgreSQL via Prisma ORM
- **Metrics:** `prom-client`
- **Logging:** `winston` + `winston-loki` (Grafana Loki)

---

## Running locally

This service is designed to run as part of the full stack via Docker Compose. See [nexus-infra](https://github.com/Prajwal-Thite/nexus-infra) for full setup instructions.

> **When running via Docker Compose**, environment variables are injected by the compose file from the root `.env` in `nexus-infra` — no `.env` file is needed inside this repo.

To run this service **standalone** for development (outside Docker):

```bash
cp .env.example .env   # only needed for standalone local development
npm install
npx prisma generate
npm run dev
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start with `tsx watch` (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled output |

---

## Environment variables

> Only required when running standalone locally. Docker Compose injects these automatically from the `nexus-infra` root `.env`.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` | Redis hostname (default: `localhost`) |
| `METRICS_TOKEN` | Bearer token for the public metrics endpoint |
| `LOKI_URL` | Grafana Loki push URL |
| `LOKI_USERNAME` | Loki basic auth username |
| `LOKI_PASSWORD` | Loki basic auth password |

---

## Ports

| Port | Visibility | Description |
|---|---|---|
| `9466` | Internal (Docker network only) | Prometheus metrics — scraped by Grafana Alloy |
| `9467` | Public | Prometheus metrics — bearer token protected |

---

## AI-assisted development with Graphify

This project uses [**Graphify**](https://github.com/safishamsi/graphify) to generate a semantic knowledge graph of the codebase.

Graphify analyses the source code and produces an interactive graph that connects files, functions, and modules by meaning and structure — not just by file path. This graph is fed to AI coding assistants (like Claude Code) instead of raw source files, which dramatically reduces token usage while giving the AI a richer understanding of how the codebase fits together.

### Why it matters

- A flat file dump gives an AI syntax. A knowledge graph gives it context.
- Related concepts are clustered together, so the AI reasons about the domain rather than hunting through files.
- Token costs drop significantly on large codebases — the graph carries more signal per token than raw source.

### How to use it

Graphify is a Python CLI tool — make sure Python and pip are installed before proceeding.

```bash
# 1. Install graphify
pip install graphify
graphify install

# 2. Run from the project root
graphify

# Output lands in graphify-out/ (gitignored — run it yourself)
# Open graphify-out/graph.html in a browser for the interactive view
```

Alternatively, if you use [Claude Code](https://claude.ai/code), graphify is available as a built-in skill — just type `/graphify` inside a Claude Code session and it runs automatically without any manual installation.

See the [Graphify repository](https://github.com/safishamsi/graphify) for full usage instructions and configuration options.
