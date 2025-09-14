# Neighbourhood Green Map – Sydney

*A personal, end‑to‑end full‑stack project showcasing geospatial search, user‑generated content, and thoughtful UX — rooted in lived experience in Sydney, Australia.*

---

## Table of Contents

1. Project Summary
2. Goals & Non‑Goals
3. Personas & User Stories
4. Core Features & Scope
5. System Architecture
6. Tech Stack & Rationale
7. Data Model (ERD) & Database Schema
8. API Design (OpenAPI excerpt)
9. Frontend Architecture & UX
10. Map & Geospatial Behaviour
11. Data Sources (Sydney‑specific)
12. Security, Privacy & Legal
13. Accessibility (WCAG 2.2)
14. Performance & Caching Strategy
15. Analytics & Telemetry (Privacy‑first)
16. Dev Setup & Local Environment
17. Environments, Config & Secrets
18. CI/CD & Quality Gates
19. Testing Strategy
20. Observability, Logging & Alerts
21. SEO & Content Strategy
22. Backups & Disaster Recovery
23. Roadmap & Milestones
24. Risks & Mitigations
25. Architecture Decision Records (ADRs)
27. Appendix: Sample SQL & Queries
28. Appendix: Wireframes (text) & Component Inventory
29. Appendix: Sample Seed Data (Sydney spots)

---

## 1) Project Summary

**Neighbourhood Green Map – Sydney** is a web app that helps people discover, save, and share green spaces around Sydney — from pocket parks and coastal walks to community gardens and shady lunch spots. It blends **official open data** with **personal curation** and **user submissions**, anchored by an interactive map and geospatial search.

> Personal angle: The app is seeded with places I actually go (e.g., post‑work quiet spots near Central, weekend harbourside walks). Entries include my short notes and original photos, giving the project an unmistakably personal fingerprint.

---

## 2) Goals & Non‑Goals

**Goals**

* Delightful map‑first UX for discovering and saving green spots in Sydney.
* Robust API with geospatial search (radius, bounding box), filters, pagination.
* Clean, secure auth (email+password, optional magic link) with JWT.
* Image upload pipeline with S3‑compatible storage and presigned URLs.
* Moderation workflow for community submissions.
* Production‑grade deployment: HTTPS, CI/CD, logging, metrics.

**Non‑Goals (v1)**

* Cross‑country coverage (Sydney only initially).
* Real‑time chat or social feed.
* Heavy gamification or badges.
* Complex offline sync (basic PWA caching is enough).

---

## 3) Personas & User Stories

**Persona A — Local Weekday Walker (AEST/AEDT)**

* *As a local*, I want to find a quiet, shady spot near Central Station to read at lunch.
* *As a dog owner in Inner West*, I want to see off‑leash parks with water taps.

**Persona B — Weekend Explorer**

* *As someone visiting friends in Manly*, I want a short coastal walk with lookouts.
* *As a family in Parramatta*, I want pram‑friendly paths and playgrounds.

**Persona C — Contributor / Steward**

* *As a community gardener*, I want to showcase our plot and opening hours.
* *As a user*, I want to report incorrect info or unsafe areas.

**Acceptance criteria examples**

* Given my location, when I search within 2km for “picnic + toilets”, I see relevant spots sorted by distance; each has photos, details, and directions.
* When I submit a spot, it is pending until approved; I can edit or delete my own pending submission.

---

## 4) Core Features & Scope

* **Map Explorer:** cluster markers, category filters, search by name/tag, current‑location.
* **Spot Details:** description, facilities (toilets, water, BBQ), accessibility notes, opening hours, personal notes & photos.
* **User Accounts:** register/login, email verification, password reset, profile, favourites.
* **Create & Curate:** submit new spots, upload images, suggest edits, create shareable “Green Walks” (routes of multiple spots).
* **Moderation:** queue for new/edited spots, flag/report content, version history, audit log.
* **Sydney Data Import:** bootstrap from open datasets (parks, cycleways), then enrich manually.
* **PWA:** installable, works offline for last‑viewed map tiles and saved spots.

Out‑of‑Scope (v1): comments, realtime chat, social graph, multi‑city.

---

## 5) System Architecture

**Pattern:** Frontend (Next.js App Router) + Backend API (Fastify + TypeScript) + PostgreSQL/PostGIS + Object Storage + CDN.

**High‑level data flow**

1. Browser loads Next.js app (static assets via CDN). Auth token in httpOnly, SameSite cookie.
2. App fetches from the API (Fastify) hosted on a Node server. CORS locked to allowed origins.
3. API reads/writes to PostgreSQL (with PostGIS). Heavy geo queries use SQL.
4. Image uploads use **presigned URLs** to S3‑compatible storage (e.g., Cloudflare R2, MinIO in dev).
5. Background tasks (image resizing, thumbnailing) run via a lightweight queue (BullMQ/Redis) — optional in v1.

**Deploy options**

* Frontend: Vercel.
* Backend: Fly.io/Render/AWS (containerized). Reverse proxy with HTTPS.
* DB: Managed Postgres with PostGIS (e.g., Supabase Postgres).
* Storage: Cloudflare R2 (S3 API) or Supabase Storage.
* CDN: Vercel/Cloudflare.

---

## 6) Tech Stack & Rationale

* **Frontend:** Next.js 14 (App Router), React 18, TypeScript, TailwindCSS, TanStack Query, Mapbox GL JS (or Leaflet + OSM tiles).

  * *Why:* SEO‑friendly, file‑based routing, streaming/SSR for fast initial load.
* **Backend:** Fastify + TypeScript + Zod schemas, fastify‑swagger for OpenAPI.

  * *Why:* High‑performance Node server with strong typing and simple plugins.
* **Database:** PostgreSQL + PostGIS.

  * *Why:* First‑class geospatial support and mature indexing.
* **ORM:** Prisma (with raw SQL for PostGIS functions where needed).
* **Auth:** JWT (RS256), httpOnly cookies, refresh tokens, email verification.
* **Storage:** S3‑compatible object storage, presigned PUT for uploads.
* **Queue (optional):** BullMQ + Redis for thumbnails and email.
* **Testing:** Vitest/Jest, Supertest, Playwright for E2E.
* **Lint/Format:** ESLint, Prettier, TypeScript strict.

---

## 7) Data Model (ERD) & Database Schema

**Entities**

* `users` (id, email, display\_name, avatar\_url, bio, created\_at)
* `auth_identities` (user\_id, provider, hash, email\_verified\_at)
* `spots` (id, owner\_id, name, description, personal\_note, facilities, category, is\_published, location: `geometry(Point, 4326)`, address, suburb, lga, created\_at, updated\_at)
* `spot_photos` (id, spot\_id, storage\_key, url, caption, taken\_at, created\_at)
* `tags` (id, slug, label)
* `spot_tags` (spot\_id, tag\_id)
* `votes` (user\_id, spot\_id, value, created\_at)
* `routes` (id, owner\_id, name, description, distance\_km, path: `geometry(LineString, 4326)`, is\_published, created\_at)
* `route_spots` (route\_id, spot\_id, order\_index)
* `reports` (id, reporter\_id, target\_type, target\_id, reason, status, created\_at)
* `audit_logs` (id, actor\_id, action, target\_type, target\_id, diff\_json, created\_at)

**Indexes & Constraints**

* `GIST` index on `spots.location` and `routes.path` for fast geo queries.
* Unique `tags.slug`.
* FK constraints with `ON DELETE CASCADE` for child tables.

**Example DDL (PostgreSQL + PostGIS)**

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_identities (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'password',
  password_hash TEXT,
  email_verified_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, provider)
);

CREATE TABLE spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  personal_note TEXT,
  facilities JSONB NOT NULL DEFAULT '{}',
  category TEXT CHECK (category IN ('park','garden','walk','lookout','playground','beach','other')),
  is_published BOOLEAN NOT NULL DEFAULT false,
  location geometry(Point, 4326) NOT NULL,
  address TEXT,
  suburb TEXT,
  lga TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_spots_location ON spots USING GIST (location);
CREATE INDEX idx_spots_published ON spots (is_published);
CREATE INDEX idx_spots_suburb ON spots (suburb);

CREATE TABLE spot_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID REFERENCES spots(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  taken_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL
);
CREATE TABLE spot_tags (
  spot_id UUID REFERENCES spots(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (spot_id, tag_id)
);

CREATE TABLE votes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  spot_id UUID REFERENCES spots(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (1, -1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, spot_id)
);

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  distance_km NUMERIC(5,2),
  path geometry(LineString, 4326) NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_routes_path ON routes USING GIST (path);

CREATE TABLE route_spots (
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
  spot_id UUID REFERENCES spots(id) ON DELETE CASCADE,
  order_index INT NOT NULL,
  PRIMARY KEY (route_id, spot_id)
);

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT CHECK (target_type IN ('spot','photo','route')) NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  diff_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 8) API Design (OpenAPI excerpt)

**Base URL:** `/api/v1`

```yaml
openapi: 3.0.3
info:
  title: Neighbourhood Green Map – Sydney API
  version: 1.0.0
servers:
  - url: https://api.greenmap.sydney/api/v1
paths:
  /auth/register:
    post:
      summary: Register new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email: { type: string, format: email }
                password: { type: string, minLength: 8 }
                displayName: { type: string }
      responses:
        '201': { description: Created }
  /auth/login:
    post:
      summary: Email/password login (JWT)
      responses:
        '200': { description: OK }
  /spots:
    get:
      summary: List spots
      parameters:
        - in: query
          name: q
          schema: { type: string }
        - in: query
          name: tags
          schema: { type: string, description: comma-separated }
        - in: query
          name: bbox
          schema: { type: string, example: "minLng,minLat,maxLng,maxLat" }
        - in: query
          name: radius
          schema: { type: number, example: 2000 }
        - in: query
          name: center
          schema: { type: string, example: "151.2093,-33.8688" }
        - in: query
          name: sort
          schema: { type: string, enum: [distance, newest, votes] }
        - in: query
          name: page
          schema: { type: integer, minimum: 1 }
        - in: query
          name: pageSize
          schema: { type: integer, default: 20 }
      responses:
        '200': { description: OK }
    post:
      summary: Create spot
      security: [ { bearerAuth: [] } ]
      responses:
        '201': { description: Created }
  /spots/{id}:
    get:
      summary: Get a spot by id
    patch:
      summary: Update (owner or admin)
      security: [ { bearerAuth: [] } ]
    delete:
      summary: Delete (owner or admin)
      security: [ { bearerAuth: [] } ]
  /spots/{id}/vote:
    post:
      summary: Upvote or downvote a spot
      security: [ { bearerAuth: [] } ]
  /uploads/presign:
    post:
      summary: Get presigned URL for image upload
      security: [ { bearerAuth: [] } ]
  /routes:
    get: { summary: List published routes }
    post:
      summary: Create a new route
      security: [ { bearerAuth: [] } ]
```

**Response shape (Spot)**

```json
{
  "id": "uuid",
  "name": "Wendy Whiteley’s Secret Garden",
  "description": "Tiered harbourside garden with winding paths and shade.",
  "personalNote": "Go early on a sunny Saturday; quiet corners near the lower terrace.",
  "facilities": { "toilets": true, "water": true, "bbq": false, "dogFriendly": true },
  "category": "garden",
  "coordinates": { "lat": -33.8477, "lng": 151.2149 },
  "address": "Lavender St, Lavender Bay NSW",
  "suburb": "Lavender Bay",
  "lga": "North Sydney",
  "photos": [{ "url": "https://...", "caption": "Shady seating" }],
  "tags": ["shady", "quiet", "harbour"],
  "score": 23,
  "createdAt": "2025-08-12T02:10:00Z"
}
```

---

## 9) Frontend Architecture & UX

**Routing (Next.js App Router)**

* `/` – Map Explorer (default)
* `/spots/[id]` – Spot details
* `/routes/[id]` – Route details
* `/submit` – Submit a spot
* `/me` – Profile & favourites
* `/moderation` – (role‑gated) Moderation queue

**State management**

* Server Components for static data where possible; Client Components for interactive map.
* TanStack Query for API caching, optimistic updates for votes/favourites.

**Design system**

* TailwindCSS utilities, Radix primitives/shadcn UI for accessible components.

**Key UI interactions**

* Marker clustering and hover tooltips.
* Drawer/panel on mobile to reveal list + details.
* Filters: category, facilities, tags, distance.
* Shareable links for routes.

**Responsive behaviour**

* Desktop: map left, list right.
* Mobile: list first; map in a collapsible panel.

---

## 10) Map & Geospatial Behaviour

* **Tiles:** Mapbox Streets (or OSM tiles via MapTiler). Local Sydney look & feel with custom style.
* **Current location** with browser geolocation (permission‑gated).
* **Search modes:**

  * *Nearby:* `ST_DWithin(location::geography, point::geography, radius_m)`
  * *Viewport:* `ST_Within(location, ST_MakeEnvelope(..., 4326))`
  * *Sorting by distance:* `ORDER BY ST_Distance(location::geography, point::geography)`
* **Clustering:** client‑side supercluster (v1) with server aggregation later.
* **Directions:** deep link to Google/Apple Maps with coordinates.

---

## 11) Data Sources (Sydney‑specific)

* City of Sydney / NSW Open Data portals (parks, toilets, drinking fountains, cycleways) for initial bootstrap.
* Manual enrichment from personal exploration and user submissions.
* Attributions included and licensed appropriately (OSM/CC BY terms where required).

---

## 12) Security, Privacy & Legal

**Auth & Session**

* Passwords hashed with Argon2id.
* JWT access tokens (15m) + refresh tokens (7d) stored in httpOnly, SameSite=strict cookies.
* Email verification on signup; password reset via signed, time‑limited token.

**API Security**

* Rate limiting (e.g., 100 req/10m/IP; stricter on auth endpoints).
* Input validation via Zod; output serialization.
* CORS restricted to known origins; HTTPS only; HSTS.
* Uploads only via presigned URLs; validate mime/size; run EXIF strip & generate thumbnails server‑side.

**Privacy (Australian Privacy Principles)**

* Data collected: email, display name, your submitted content, favourites.
* Purpose: operate app; never sold. Opt‑out for analytics. Data export & deletion available.
* Data residency: hosted in AU region where possible; otherwise disclosed in policy.

**Content & Moderation**

* Report/flag flow; admins can unpublish & record reason in audit log.
* Prohibit PII in descriptions; filter obvious profanity.

---

## 13) Accessibility (WCAG 2.2 AA)

* Keyboard: all interactive elements focusable; visible focus rings.
* Map: provide equivalent list view for screen readers; ARIA labels for markers; skip‑map link.
* Colour contrast ≥ 4.5:1; do not rely on colour alone for state.
* Tap targets ≥ 44px; logical heading order.
* Alt text mandatory for photos; form errors announced.

---

## 14) Performance & Caching Strategy

* **Frontend**: SSR/ISR for landing & spot pages; code‑split map bundle; lazy‑load images with `<img loading="lazy">`.
* **API**: paginate results; cache hot list queries in Redis for 60s; ETag/Last‑Modified.
* **DB**: GIST indexes; `EXPLAIN ANALYZE` budget ≤ 50ms for top queries.
* **CDN**: cache static assets; set long‑lived immutable headers.

---

## 15) Analytics & Telemetry (Privacy‑first)

* Self‑hosted Plausible/Umami with IP anonymization.
* Track events: Map pan/zoom, filter apply, spot view, upload success, route share.
* Error tracking: Sentry for FE/BE.

---

## 16) Dev Setup & Local Environment

**Requirements**: Node 20+, Docker, pnpm, OpenSSL.

**Services (Docker Compose)**

* `postgres:15-postgis` (DB)
* `minio` (S3 dev)
* `redis` (rate limit / queue)

**Quickstart**

```bash
# 1) Install deps
pnpm i

# 2) Start infra
docker compose up -d

# 3) Env
cp .env.example .env
# Fill in values (see section 17)

# 4) DB migrate & seed
pnpm prisma migrate dev
pnpm ts-node scripts/seed.ts

# 5) Run API & Web
pnpm --filter api dev
pnpm --filter web dev
```

**Repo layout (monorepo)**

```
/ (pnpm workspace)
  /api (Fastify + Prisma)
  /web (Next.js 14)
  /packages/
    /ui (shared components)
    /config (eslint, tsconfig)
    /types (OpenAPI types)
  /infra (docker, terraform optional)
```

---

## 17) Environments, Config & Secrets

**Environment variables** (excerpt)

* `NODE_ENV`, `PORT`
* `DATABASE_URL` (Postgres)
* `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (PEM)
* `NEXT_PUBLIC_API_URL` (frontend base URL for the API)
* `COOKIE_DOMAIN`, `COOKIE_SECURE=true`
* `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
* `MAPBOX_TOKEN`
* `RATE_LIMIT_WINDOW=600000`, `RATE_LIMIT_MAX=100`
* `EMAIL_SMTP_URL` (for verification/reset)
* `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`

**Key management**

* Dev keys via `.env` (git‑ignored). Prod via cloud secret manager.

---

## 18) CI/CD & Quality Gates

* **GitHub Actions**

  * Lint + typecheck + unit tests on PRs.
  * Build Docker images; push to registry.
  * Run DB migrations on deploy.
* **Quality gates**

  * 0 critical lint errors; 90% unit coverage for utils; E2E smoke suite green.
  * Lighthouse PWA score ≥ 85.

---

## 19) Testing Strategy

* **Unit**: utilities, schema validators, auth logic (Vitest).
* **Integration**: API routes with Supertest against ephemeral Postgres.
* **E2E**: Playwright — create account, submit spot, approve in moderation, view on map, create route.
* **Performance**: k6/Gatling for list & nearby endpoints (P95 < 250ms at 50 RPS).
* **Security**: ZAP/Burp passive scan in CI; dependency audit.

---

## 20) Observability, Logging & Alerts

* Structured logs (pino) with request id; shipped to Logtail/ELK.
* Metrics: /metrics Prometheus exporter; dashboards for RPS, latency, error rate.
* Alerts: high 5xx, DB connection pool saturation, storage failures.

---

## 21) SEO & Content Strategy

* Next.js metadata API for titles/OG; sitemap.xml & robots.txt.
* Human, place‑based copy (“Shady lunch spot near Town Hall”).
* Canonical URLs for spots and routes; OpenGraph preview with hero photo.

---

## 22) Backups & Disaster Recovery

* Nightly DB backups with 7‑day retention; point‑in‑time restore enabled.
* Weekly storage snapshot of image bucket (versioning on).
* Run restore drill quarterly.

---

## 23) Roadmap & Milestones

**Milestone 1 — Foundations (1–2 weeks)**

* Repo, CI, Docker infra, DB schema, auth flows, minimal map with seeded spots.

**Milestone 2 — UGC + Photos (1–2 weeks)**

* Submissions, presigned uploads, moderation queue, spot details page.

**Milestone 3 — Routes & Sharing (1 week)**

* Create “Green Walks”, shareable links, OpenGraph cards.

**Milestone 4 — Polish & PWA (1 week)**

* A11y pass, Lighthouse, offline tiles for last viewed area.

**Milestone 5 — Analytics & Showcase (ongoing)**

* Event tracking, blog post, demo video, seed more personal entries.

---

## 24) Risks & Mitigations

* **Tile/API limits** → Cache tiles; respect provider T\&Cs; consider self‑hosting.
* **Location privacy** → Round displayed coordinates; avoid exposing secluded personal spots at exact precision.
* **Moderation load** → Rate limits; throttle new users; add minimal trust levels.
* **PostGIS complexity** → Start with simple nearby queries; grow to polygons later.

---

## 27) Appendix: Sample SQL & Queries

**Nearby (radius)**

```sql
-- :pointLng, :pointLat, :radiusMeters
SELECT id, name,
  ST_Y(location) AS lat,
  ST_X(location) AS lng,
  ST_Distance(location::geography, ST_SetSRID(ST_MakePoint(:pointLng,:pointLat),4326)::geography) AS meters
FROM spots
WHERE is_published = true
  AND ST_DWithin(location::geography,
                 ST_SetSRID(ST_MakePoint(:pointLng,:pointLat),4326)::geography,
                 :radiusMeters)
ORDER BY meters
LIMIT :limit OFFSET :offset;
```

**Viewport (bbox)**

```sql
-- bbox: minLng, minLat, maxLng, maxLat
SELECT id, name, ST_Y(location) AS lat, ST_X(location) AS lng
FROM spots
WHERE is_published = true
  AND ST_Within(
    location,
    ST_MakeEnvelope(:minLng,:minLat,:maxLng,:maxLat,4326)
  );
```

**Route length (km)**

```sql
SELECT id, ST_Length(path::geography) / 1000 AS distance_km
FROM routes
WHERE id = $1;
```

---

## 28) Appendix: Wireframes (text) & Component Inventory

**Home / Map**

* Header: logo, search bar (tags + text), login/profile.
* Left: filter panel (category, facilities, distance slider, tags chips).
* Right: map with clusters; hovering a list item highlights marker.
* Mobile: bottom sheet with list; expand to full screen.

**Spot Details**

* Hero photo, title, suburb; vote/favourite buttons.
* Facilities icons with text; accessibility notes; my personal note.
* Gallery, map preview, share link.

**Submit Spot**

* Map picker (drop a pin or search address); photo uploader with previews.
* Required fields: name, category, 1 photo, facility checklist.
* Validation hints; save as draft; submit to moderation.

**Components**

* `Map` (with clustering) • `SpotCard` • `FilterBar` • `PhotoUploader` • `FacilityChips` • `VoteButton` • `FavouriteToggle` • `RouteBuilder` • `ModerationTable` • `AuthForms`

---

## 29) Appendix: Sample Seed Data (Sydney spots)

> These are examples; you’ll replace/add with personal photos & notes.

1. **Prince Alfred Park (Surry Hills)**

   * *Note:* Shady benches along the western edge; good for a quick read after lunch.
   * Facilities: toilets ✅, water ✅, BBQ ❌, dog‑friendly ✅
   * Tags: shady, central, lunch

2. **Wendy Whiteley’s Secret Garden (Lavender Bay)**

   * *Note:* Quiet corners near lower terrace; best early morning on weekends.
   * Facilities: toilets ❌ (nearby), water ✅
   * Tags: harbour, quiet, garden

3. **Barangaroo Reserve (Millers Point)**

   * *Note:* Sunset views; windy on southerlies — bring a jacket.
   * Facilities: toilets ✅, water ✅, BBQ ✅, dog‑friendly ✅
   * Tags: sunset, harbour, picnic

4. **Hen and Chicken Bay Foreshore (Five Dock)**

   * *Note:* Flat, pram‑friendly path for easy weekend strolls.
   * Facilities: toilets ✅, water ✅
   * Tags: pram‑friendly, bay, walk

5. **Callan Park (Lilyfield)**

   * *Note:* Expansive lawns; off‑leash areas popular in late arvo.
   * Facilities: toilets ✅, water ✅, dog‑friendly ✅
   * Tags: dog, spacious, heritage

