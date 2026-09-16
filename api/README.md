# CarCare API

Backend foundation for the CarCare mobile app: a NestJS service that verifies
Supabase-issued access tokens and exposes the authenticated identity to
application modules.

This repository currently contains **only the foundation** — configuration,
database wiring, authentication and a health check. Vehicles, maintenance,
expenses, reminders and the rest of the domain are not implemented yet.

## Architecture

Normal request flow:

```
Controller -> Service -> Prisma -> PostgreSQL
```

Authentication flow:

```
Flutter client -> Supabase Auth -> access token (ES256 JWT)
                                        |
                                        v
                   NestJS AuthGuard (verifies against cached JWKS)
                                        |
                                        v
                        AuthUser -> protected controller
```

Supabase Auth owns sign-up, sign-in, OAuth, refresh tokens, password reset and
email verification. This service never sees or stores credentials. It only
verifies the signature, expiry, issuer and audience of the token the client
sends, and trusts the `sub` claim as the user id.

Supabase signs access tokens with rotating **ES256** keys and publishes the
public half as a JWKS. The backend therefore needs **no secret at all** — it
fetches the public key set once, caches it, and verifies tokens in-process. A
refetch only happens when a token presents a key id that is not cached.

All of this lives in `src/auth`, so the verification strategy can change
without touching business modules.

## Folder structure

```
src/
├── main.ts                 bootstrap: prefix, CORS, pipes, filters, Swagger
├── app.module.ts           root module
├── config/                 env schema (zod) + typed configuration
├── common/filters/         global exception filter
├── database/               PrismaModule + PrismaService (global)
├── auth/                   guard, token verification, CurrentUser decorator
├── users/                  GET /users/me
└── health/                 GET /health

prisma/
├── schema.prisma           User model keyed by the Supabase Auth user id
├── migrations/
└── seed.ts

test/
├── auth/                   unit + HTTP auth tests
├── health/
└── support/                test token helpers
```

## Environment variables

Copy `.env.example` to `.env` and fill it in. `.env` is the only place real
values live: it is gitignored, excluded from the Docker build context, and read
by the app, the Prisma CLI and `docker compose`. `.env.example` is committed and
must only ever hold placeholders.

| Variable            | Used by            | Description                                        |
| ------------------- | ------------------ | -------------------------------------------------- |
| `NODE_ENV`          | app                | `development`, `test` or `production`              |
| `PORT`              | app                | HTTP port (defaults to `3030`)                     |
| `DATABASE_URL`      | app, seed          | PostgreSQL connection string for runtime queries   |
| `DIRECT_URL`        | Prisma CLI         | Connection string for migrations                   |
| `SUPABASE_URL`      | app                | Supabase project URL                               |
| `SUPABASE_ANON_KEY` | app                | Anon/public key, used by the login endpoint        |
| `POSTGRES_USER`     | `docker compose`   | Local database user                                |
| `POSTGRES_PASSWORD` | `docker compose`   | Local database password                            |
| `POSTGRES_DB`       | `docker compose`   | Local database name                                |
| `POSTGRES_PORT`     | `docker compose`   | Host port for the local database (default `5432`)  |

The token issuer (`<SUPABASE_URL>/auth/v1`) and the JWKS endpoint
(`<SUPABASE_URL>/auth/v1/.well-known/jwks.json`) are both derived from
`SUPABASE_URL`. No signing secret belongs in this service.

Startup fails immediately with a readable error if any of these are missing or
malformed.

### Creating the Supabase project

1. Create a project at <https://supabase.com/dashboard>.
2. `SUPABASE_URL` — **Project Settings → Data API → Project URL**.
3. `SUPABASE_ANON_KEY` — **Project Settings → Data API → anon public**.

The **secret (service-role) key** should never be committed, shipped in the
app, or used by this service.

If a project is ever moved back to legacy HS256 shared-secret signing, the
`algorithms` option and key resolver in `src/auth/` are the only things that
change.

### DATABASE_URL

For the bundled Postgres container, build the URL from the `POSTGRES_*` values
in the same `.env`:

```
DATABASE_URL=postgresql://<POSTGRES_USER>:<POSTGRES_PASSWORD>@localhost:<POSTGRES_PORT>/<POSTGRES_DB>?schema=public
```

To use the database inside your Supabase project instead, take the connection
strings from **Project Settings → Database → Connection string** — the
transaction pooler for `DATABASE_URL`, the session pooler for `DIRECT_URL`.
URL-encode any special characters in the password (`@` → `%40`, `!` → `%21`).

### Docker

The image contains no configuration; pass it at runtime:

```bash
docker build -t carcare-api .
docker run --env-file .env -p 3030:3030 carcare-api
```

On Render, set the same variables in the service's environment settings.

## Running it

```bash
npm install

# 1. start PostgreSQL
npm run db:up

# 2. generate the Prisma client and apply migrations
npm run prisma:generate
npm run prisma:migrate

# 3. run the API
npm run start:dev
```

The API listens on `http://localhost:3030/api/v1` and Swagger UI is served at
`http://localhost:3030/api/docs`.

Stop the database with `npm run db:down`.

### Other commands

| Command                   | Purpose                                     |
| ------------------------- | ------------------------------------------- |
| `npm run build`           | Compile to `dist/`                          |
| `npm run lint`            | oxlint over `src/` and `test/`              |
| `npm test`                | Unit tests                                  |
| `npm run test:e2e`        | HTTP-level tests                            |
| `npm run prisma:studio`   | Browse the database                         |
| `npm run db:seed`         | Seed (set `SEED_USER_ID` to a Supabase uid) |

## Endpoints

| Method | Route              | Auth     |
| ------ | ------------------ | -------- |
| GET    | `/api/v1/health`   | public   |
| GET    | `/api/v1/users/me` | required |

### Health

```bash
curl http://localhost:3030/api/v1/health
```

```json
{ "status": "ok", "database": "up", "timestamp": "2026-01-01T00:00:00.000Z" }
```

Returns `503` with `"database": "down"` when PostgreSQL is unreachable.

### Authenticated request

Obtain an access token from Supabase on the client (for example via
`supabase.auth.signInWithPassword`), then send it as a bearer token:

```bash
curl http://localhost:3030/api/v1/users/me \
  -H "Authorization: Bearer <supabase-access-token>"
```

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "email": "driver@example.com",
  "role": "authenticated"
}
```

The response is derived entirely from the verified token. A user id supplied in
the query string or body is ignored, so a caller cannot read another user's
profile.

Every authentication failure — missing header, wrong scheme, malformed token,
bad signature, expired token — returns `401`:

```bash
curl -i http://localhost:3030/api/v1/users/me
# HTTP/1.1 401 Unauthorized
```

## Database model

`User` holds application-side data for a Supabase identity. Its primary key is
the Supabase Auth user id (`sub`). No passwords or credentials are stored here.
