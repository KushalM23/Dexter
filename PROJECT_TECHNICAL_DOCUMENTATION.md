# Dexter (DexE) — Full Technical Documentation

## 1) Project Identity

- **Repository:** `KushalM23/Dexter`
- **App name:** `dexe` (package name)
- **Product concept:** Mobile-first wildlife identification and collection game where users capture real animals, receive species cards, earn XP, complete challenges, and appear on leaderboards.

---

## 2) Technology Stack

### Runtime and framework
- **Next.js:** `16.2.6` (App Router)
- **React / React DOM:** `19.2.4`
- **TypeScript:** strict mode enabled

### Backend/data/auth
- **Supabase:**
  - `@supabase/supabase-js` for DB/auth/storage/admin usage
  - `@supabase/ssr` for server/browser session handling
- **PostgreSQL schema** in `/home/runner/work/Dexter/Dexter/supabase/schema.sql`

### AI/media
- **Gemini API** for species identification
- **GBIF API** for taxonomy/occurrence/common names
- **iNaturalist API** for photos
- **Wikipedia REST API** for photos/lore fallback
- **fal.ai FLUX LoRA** (optional) for pixel-art generation
- **sharp** for image compression before Gemini calls

### UI/styling/motion
- **Tailwind CSS v4**
- **Framer Motion**
- **Lucide React** icons

### Utilities
- **date-fns**
- **zod** request validation
- **clsx + tailwind-merge** (`cn` helper)

---

## 3) Scripts and Build

`package.json` scripts:
- `npm run dev` → Next dev server
- `npm run build` → production build
- `npm run start` → production server
- `npm run lint` → ESLint

Linting config: `eslint.config.mjs` using `eslint-config-next` (`core-web-vitals` + `typescript`).

---

## 4) Environment Configuration

From `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- Optional pixel-art:
  - `FAL_KEY`
  - `FAL_PIXEL_ART_LORA_URL`
  - `FAL_PIXEL_ART_TRIGGER_WORD`
  - `FAL_PIXEL_ART_MODEL_ID` (default `fal-ai/flux-lora`)
  - `FAL_PIXEL_ART_LORA_SCALE`

Supabase public env is required for server/browser clients. Service role key is required for admin data operations used across domain logic.

---

## 5) Repository Structure (Core)

- `/home/runner/work/Dexter/Dexter/src/app` — Next.js app routes/pages/API handlers/server actions
- `/home/runner/work/Dexter/Dexter/src/features` — tab/screen feature implementations
- `/home/runner/work/Dexter/Dexter/src/components` — UI/layout/cards shared components
- `/home/runner/work/Dexter/Dexter/src/lib` — domain logic, Supabase clients, constants, challenge systems
- `/home/runner/work/Dexter/Dexter/supabase/schema.sql` — DB schema
- `/home/runner/work/Dexter/Dexter/public` — static assets (`dexter-eyes.svg`, `sw.js`)
- `/home/runner/work/Dexter/Dexter/prd.md` — product requirements
- `/home/runner/work/Dexter/Dexter/ui_design_reference.md` — UI design system/spec
- `/home/runner/work/Dexter/Dexter/lora_pixel_art_guide.md` — LoRA training/generation guidance

---

## 6) Application Routing and Navigation

## Primary pages
- `/` → redirects based on auth/onboarding state
- `/auth` → login screen (Google OAuth)
- `/auth/callback` → OAuth code exchange + user setup
- `/onboarding` → onboarding screen
- `/home` → primary shell with tabbed application screens

## Redirect alias routes
- `/dexe` → `/home?tab=dexe`
- `/challenges` → `/home?tab=challenges`
- `/leaderboard` → `/home?tab=leaderboard`
- `/profile` → `/home?tab=profile`

## Navigation shell
- `BinderShell` renders left vertical rail tabs:
  - `profile`, `challenges`, `leaderboard`, `dexe`, `home`
- Active tab theme comes from `tabThemeConfig`.

---

## 7) Session, Auth, and User Bootstrapping

## Session middleware
- `/home/runner/work/Dexter/Dexter/src/proxy.ts` refreshes Supabase auth session on requests.
- Matcher excludes static assets and internals.

## Page-level auth helpers (`/home/runner/work/Dexter/Dexter/src/lib/session.ts`)
- `getCurrentUser()` -> reads Supabase auth user, then calls `ensureUserSetup`
- `requireUser()` -> redirects to `/auth` if not authenticated
- `requireOnboardedUser()` -> redirects to `/onboarding` if incomplete

## OAuth callback (`/auth/callback`)
1. Reads `code`, `next`, and OAuth error params.
2. Exchanges code for session.
3. Fetches authenticated user.
4. Calls `ensureUserSetup(authUser, { ensureChallenges: false })`.
5. Redirects to `next` (if safe), else `/home` or `/onboarding`.

## User setup behavior
- Creates user row if missing (with generated friend code).
- Initializes defaults: avatar, xp=0, environment=`urban`, onboarding flag false.
- Ensures challenges unless explicitly disabled.

---

## 8) API Endpoints

All handlers use App Router route handlers under `/home/runner/work/Dexter/Dexter/src/app/api`.

- `POST /api/capture`
  - body: `{ imageData, lat?, lng? }`
  - validates with Zod
  - calls `processCapture(userId, payload)`

- `POST /api/location`
  - body: `{ lat?, lng? }`
  - calls `updateUserEnvironment`

- `POST /api/profile`
  - body: `{ displayName, avatarId }`
  - calls `updateProfile`

- `GET /api/challenges`
  - returns challenge data from `getChallengesData`

- `POST /api/onboarding`
  - body: `{ displayName, avatarId }`
  - calls `completeOnboarding`

---

## 9) Server Actions

`/home/runner/work/Dexter/Dexter/src/app/actions.ts` exposes tab data loaders used by client shell:
- `fetchHomeDataAction`
- `fetchCollectionDataAction`
- `fetchChallengesDataAction`
- `fetchLeaderboardDataAction`
- `fetchProfileDataAction`

All actions require onboarded user via `requireOnboardedUser()`.

---

## 10) Domain Layer (`/home/runner/work/Dexter/Dexter/src/lib/domain.ts`)

This is the core backend logic layer.

## Key responsibilities
- Data mapping between DB rows and TS records
- User setup and onboarding completion
- Challenge template seeding and challenge assignment lifecycle
- Capture pipeline orchestration (AI + external APIs + DB + storage + XP)
- Home/collection/challenge/leaderboard/profile aggregation

## Important constants/logic
- Catchable kingdom hard check: `Animalia`
- Rarity thresholds (`getRarityFromOccurrence`):
  - `>100000 => common`
  - `>10000 => uncommon`
  - `>1000 => rare`
  - `>100 => epic`
  - else `legendary`
- Always-common species override list includes humans, domestic dog/cat, etc.
- Level formula: `Math.floor(totalXp / 500) + 1`

## Location inference
- `inferLocation(lat,lng)` maps coordinates to curated regions (Bengaluru, Delhi, London, Yellowstone) and fallback region labels.
- Also determines country code and environment (`urban`/`rural`).

## Challenge lifecycle overview
- Seeds challenge templates from static `challengeCatalog`.
- Uses generated tailored challenges for daily/weekly windows.
- Maintains backlog windows:
  - 28 daily windows
  - 4 weekly windows
- Deduplicates and merges challenge progress rows.
- Removes stale/unmatched progress entries.
- Awards XP on newly completed challenges/achievements.

## Capture pipeline (`processCapture`)
1. Identify candidate species via Gemini (`identifyWithGemini`).
2. Reject invalid/non-animal/low-confidence captures.
3. Infer location and country.
4. Look up existing species in DB.
5. If not found, resolve species from external APIs:
   - GBIF taxonomic match
   - GBIF occurrence count
   - GBIF vernacular name
   - Photo fallback chain (iNaturalist -> GBIF -> Wikipedia -> silhouette)
   - Wikipedia lore
6. Upsert or reuse species card (`ensureSpeciesCard`).
7. Save uploaded image to Supabase storage bucket `captures`.
8. Duplicate check (`user_collections` by `gbif_taxon_key`).
9. Determine rarity/xp for this user capture (regional occurrence preferred).
10. Insert `user_collections` row.
11. Award capture XP via `xp_events` + users total_xp update.
12. Apply and recompute challenge progress, award challenge XP.

## Gemini fallback chain
- `gemini-2.5-flash`
- `gemini-2.0-flash`
- `gemini-2.0-flash-lite`
- `gemini-1.5-flash-8b`

Fallback continues on quota/rate-limit style failures.

---

## 11) Challenge Systems

There are **two challenge definition sources**:

1. `challenge-catalog.ts`
   - Large static list of concrete challenge records.
   - Deterministic UUIDs from slug hashes.

2. `challenge-templates.ts` + `challenge-generator.ts`
   - Parameterized templates (daily/weekly), categories, cooldowns, weighted generation, user-level/environment targeting.

Generator highlights:
- Weighted template selection
- Cooldown checks against `user_challenge_cooldowns`
- Environment filtering (`any`, `urban`, `rural`)
- Level brackets (`early`, `mid`, `late`) for target/reward scaling
- Instantiation of condition types (`capture_class:*`, `capture_rarity_min:*`, `capture_kingdom:*`, etc.)

---

## 12) Database Design (`/home/runner/work/Dexter/Dexter/supabase/schema.sql`)

## Enums
- `environment_type`: urban/rural
- `environment_scope`: urban/rural/any
- `rarity`: common/uncommon/rare/epic/legendary
- `challenge_type`: daily/weekly/achievement
- `photo_source`: inaturalist/gbif/wikipedia/silhouette
- `xp_event_source`: capture/challenge/achievement

## Tables
- `users`
- `species_cards` (global species records by GBIF key)
- `user_collections` (unique user+species capture inventory)
- `challenges`
- `user_challenge_progress`
- `xp_events`
- optional `sessions`
- `user_challenge_cooldowns`

## Storage
- Public storage bucket: `captures`

## Important constraints/indexes
- `user_collections` unique `(user_id, gbif_taxon_key)` prevents duplicates
- challenge and activity indexes for query performance

---

## 13) Frontend Architecture

## App shell
- `AppShellClient` handles:
  - active tab state
  - lazy tab loading with server actions
  - background prefetching
  - data refresh via custom events (`check-challenges`, `refetch-all-tabs`)

## Feature screens
- `auth` — Google OAuth entry
- `onboarding` — 2-step setup (name/avatar + friend code)
- `home` — camera/capture/result/idle orchestration
- `collection` — DexE binder list with rarity filtering
- `challenges` — segmented challenge view + completion effects
- `leaderboard` — weekly/monthly/all-time rankings and podium
- `profile` — profile stats/editing/sign-out

## Home capture UX states
- `idle`
- `camera`
- `preview`
- `processing`
- `result`

Camera implementation includes:
- progressive resolution preset probing
- native zoom support detection and constraints
- digital fallback zoom crop capture
- geolocation sync to `/api/location`

---

## 14) Card System

`/home/runner/work/Dexter/Dexter/src/components/cards/species-card.tsx` provides:
- compact and full card renderings
- front/back flippable card with taxonomy/lore metadata
- modal viewer via portal
- rarity styling through `rarityColors` + `rarityCardThemes`
- cinematic reveal system by rarity tiers:
  - suspense phase
  - flash phase
  - reveal phase with particle/ring/ray effects

Card props include taxonomy, rarity, XP, media/lore, location/time, and GBIF key.

---

## 15) Styling and Theme System

`/home/runner/work/Dexter/Dexter/src/app/globals.css` defines:
- base design tokens (`--background`, `--foreground`, surface/border/ink vars)
- theme vars (`--theme-accent`, `--theme-soft`, etc.)
- reusable component classes (`solid-action`, `ghost-action`, `capture-trigger`, etc.)
- rail/tab shell styles, loader animations, slider styling

`/home/runner/work/Dexter/Dexter/src/lib/constants.ts` defines per-tab theme palettes and rarity maps.
`/home/runner/work/Dexter/Dexter/src/lib/theme.ts` converts tab theme config to CSS custom properties.

---

## 16) Supabase Client Separation

- `createSupabaseBrowserClient()` — client-side OAuth/session usage
- `createSupabaseServerClient()` — server component/action context
- `createSupabaseRouteHandlerClient()` — route handlers (cookie writes)
- `createSupabaseAdminClient()` — service role key for trusted domain ops

---

## 17) Error Handling and Resilience Patterns

- Auth failures degrade to redirects rather than crashes.
- Capture/API handlers return structured fallback errors.
- External API failures usually degrade to null/fallback data.
- Gemini has multi-model fallback under quota pressure.
- Challenge progress dedupe/merge guards against duplicate data rows.

---

## 18) Existing Product/Design Documentation in Repo

- `/home/runner/work/Dexter/Dexter/prd.md` — Technical Product Requirements (flow specs, systems, integrations)
- `/home/runner/work/Dexter/Dexter/ui_design_reference.md` — Visual language, motion, spacing, component behavior
- `/home/runner/work/Dexter/Dexter/lora_pixel_art_guide.md` — LoRA dataset/training/prompt/provider notes

This file complements those docs by mapping the **implemented codebase** and runtime behavior.

---

## 19) Operational Notes and Current Gaps

- `/home/runner/work/Dexter/Dexter/public/sw.js` is intentionally no-op to satisfy service worker requests.
- Capture pipeline has explicit TODO note about re-enabling screen detection prompt behavior before production.
- Some components contain advanced animation-heavy logic; behavior is optimized for rich mobile UX.

---

## 20) Quick End-to-End Data Flow Summary

1. User signs in with Google via Supabase OAuth.
2. Callback exchanges code and ensures user row exists.
3. Onboarding collects display name/avatar and marks onboarding complete.
4. Home tab opens camera -> capture -> `/api/capture`.
5. Domain pipeline identifies species, enriches metadata, stores capture, awards XP, updates challenge progress.
6. Tabs read aggregated data via server actions (`home`, `collection`, `challenges`, `leaderboard`, `profile`).
7. Theme and UI layers render each tab with isolated accent system and motion behaviors.

---

## 21) File-Level Index of Critical Implementation Units

- **Core domain logic:** `/home/runner/work/Dexter/Dexter/src/lib/domain.ts`
- **Challenge generator:** `/home/runner/work/Dexter/Dexter/src/lib/challenge-generator.ts`
- **Challenge templates:** `/home/runner/work/Dexter/Dexter/src/lib/challenge-templates.ts`
- **Challenge catalog:** `/home/runner/work/Dexter/Dexter/src/lib/challenge-catalog.ts`
- **Auth/session helpers:** `/home/runner/work/Dexter/Dexter/src/lib/session.ts`, `/home/runner/work/Dexter/Dexter/src/lib/api-session.ts`
- **Supabase clients:** `/home/runner/work/Dexter/Dexter/src/lib/supabase/*`
- **Capture UI:** `/home/runner/work/Dexter/Dexter/src/features/home/*`
- **Card system:** `/home/runner/work/Dexter/Dexter/src/components/cards/species-card.tsx`
- **App shell:** `/home/runner/work/Dexter/Dexter/src/components/layout/app-shell-client.tsx`
- **Theme tokens:** `/home/runner/work/Dexter/Dexter/src/lib/constants.ts`, `/home/runner/work/Dexter/Dexter/src/app/globals.css`
- **DB schema:** `/home/runner/work/Dexter/Dexter/supabase/schema.sql`


---

## 22) Dependency Inventory (Exact)

### Dependencies
- `@supabase/ssr@^0.6.1`
- `@supabase/supabase-js@^2.49.0`
- `clsx@^2.1.1`
- `date-fns@^4.1.0`
- `framer-motion@^12.38.0`
- `lucide-react@^1.14.0`
- `next@16.2.6`
- `react@19.2.4`
- `react-dom@19.2.4`
- `sharp@^0.34.5`
- `tailwind-merge@^3.6.0`
- `zod@^4.4.3`

### Dev Dependencies
- `@tailwindcss/postcss@^4`
- `@types/node@^20`
- `@types/react@^19`
- `@types/react-dom@^19`
- `babel-plugin-react-compiler@1.0.0`
- `eslint@^9`
- `eslint-config-next@16.2.6`
- `tailwindcss@^4`
- `typescript@^5`

---

## 23) File-to-Responsibility Map (App Layer)

- `/home/runner/work/Dexter/Dexter/src/app/layout.tsx` — global fonts + HTML/body shell + metadata
- `/home/runner/work/Dexter/Dexter/src/app/page.tsx` — root redirect controller
- `/home/runner/work/Dexter/Dexter/src/app/auth/page.tsx` — auth gate page
- `/home/runner/work/Dexter/Dexter/src/app/auth/callback/route.ts` — OAuth callback handler
- `/home/runner/work/Dexter/Dexter/src/app/onboarding/page.tsx` — onboarding gate
- `/home/runner/work/Dexter/Dexter/src/app/home/page.tsx` — tab bootstrap + initial server preloading
- `/home/runner/work/Dexter/Dexter/src/app/actions.ts` — server actions for tab data
- `/home/runner/work/Dexter/Dexter/src/app/error.tsx` — global route error fallback
- `/home/runner/work/Dexter/Dexter/src/app/api/capture/route.ts` — capture endpoint
- `/home/runner/work/Dexter/Dexter/src/app/api/location/route.ts` — location/environment endpoint
- `/home/runner/work/Dexter/Dexter/src/app/api/profile/route.ts` — profile update endpoint
- `/home/runner/work/Dexter/Dexter/src/app/api/challenges/route.ts` — challenge fetch endpoint
- `/home/runner/work/Dexter/Dexter/src/app/api/onboarding/route.ts` — onboarding completion endpoint

---

## 24) API Contracts (Request/Response Behavior)

### `POST /api/capture`
- Request schema:
  - `imageData: string (min length 20)`
  - `lat?: number`
  - `lng?: number`
- Success result union:
  - `kind: "new" | "duplicate"`
  - card and collection payloads included depending on kind
- Failure result union:
  - `kind: "low_confidence" | "invalid" | "error"`
  - invalid may include `reason`:
    - `photo_of_screen`
    - `illustration`
    - `non_animal`
    - `no_organism`
    - `toy_or_statue`

### `POST /api/location`
- Request: `{ lat?: number, lng?: number }`
- Response: inferred location object with environment and label.

### `POST /api/profile`
- Request schema:
  - `displayName: string (2..24)`
  - `avatarId: string (min 3)`
- Response: `{ ok: true }`

### `GET /api/challenges`
- Response:
  - `daily[]`, `weekly[]`, `achievements[]`
  - each entry contains `challenge` + `progress`

### `POST /api/onboarding`
- Request schema:
  - `displayName: string (2..24)`
  - `avatarId: string (min 3)`
- Response: `{ ok: true }`

---

## 25) Challenge Condition Semantics (Implemented)

Condition types currently interpreted by `progressMatchesChallenge`:
- `capture_any`
- `capture_distinct_class`
- `capture_class:<class>`
- `capture_species:<scientific_name>`
- `capture_rarity_min:<rarity>`
- `capture_rarity_exact:<rarity>`
- `collect_all_rarities`
- `reach_level:<N>`

Progress rules are computed against either:
- full collection (achievements), or
- window-filtered collections (daily/weekly)

---

## 26) External API Integrations (Detailed)

### Gemini (Google Generative Language API)
- Endpoint pattern:  
  `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=...`
- Input includes JPEG `inline_data` base64 and strict JSON prompt
- Output parsed from `candidates[0].content.parts[0].text`

### GBIF
- Species match: `/v1/species/match?name=...&verbose=true`
- Occurrence count: `/v1/occurrence/count?taxonKey=...&country=...`
- Vernacular names: `/v1/species/{taxonKey}/vernacularNames?limit=100`
- Fallback photo search: `/v1/occurrence/search?scientificName=...&mediaType=StillImage&limit=1`

### iNaturalist
- Taxa search: `/v1/taxa?q=...&per_page=1`

### Wikipedia REST
- Summary endpoint: `/api/rest_v1/page/summary/{title}`

### fal.ai (optional pixel art)
- Endpoint: `https://fal.run/{modelId}`
- Request body includes prompt and LoRA parameters

---

## 27) Database Tables — Column-Level Technical Notes

### `users`
- PK `id` references `auth.users(id)` with cascade delete
- Includes identity fields (`email`, `google_name`, `display_name`, `avatar_id`)
- Progress fields (`total_xp`, `environment_type`, `onboarding_complete`)
- `friend_code` unique

### `species_cards`
- Global species record keyed uniquely by `gbif_taxon_key`
- Stores taxonomy hierarchy + rarity + xp + media + lore + occurrence count

### `user_collections`
- Per-user capture records
- `UNIQUE (user_id, gbif_taxon_key)` enforces no duplicate species captures
- Includes capture metadata: image URL, timestamp, location/country, rarity/xp awarded

### `challenges`
- Stores instantiated and/or seeded challenge definitions
- Includes title/description/type/environment scope/reward/target/condition

### `user_challenge_progress`
- Tracks user progress state per assigned challenge occurrence
- Supports assigned and expiry windows

### `xp_events`
- Immutable event log for XP contributions with source and label

### `user_challenge_cooldowns`
- Template/category cooldown tracking for challenge generation

---

## 28) Frontend Component Highlights

- `Tabs` system (`/home/runner/work/Dexter/Dexter/src/components/ui/tabs.tsx`) contains custom animated highlight primitives and context-driven tab mechanics.
- `ChallengeNotificationProvider` polls and reacts to completed challenges, persisting seen IDs in `localStorage`.
- `SpeciesCard` includes both static card rendering and cinematic reveal wrappers with rarity-specific motion profiles.
- `ProfileCard` (`/home/runner/work/Dexter/Dexter/src/components/cards/profile-card.tsx`) is a separate interactive holographic tilt card engine.

---

## 29) Runtime Browser Features Used

- `navigator.mediaDevices.getUserMedia` (camera)
- `MediaStreamTrack.getCapabilities/getSettings/applyConstraints` (zoom + diagnostics)
- `navigator.geolocation.getCurrentPosition`
- `navigator.clipboard.writeText`
- `localStorage` for challenge completion persistence
- Portal rendering via `createPortal`

---

## 30) Security and Data Handling Notes

- Authenticated API endpoints verify current user with Supabase auth.
- Admin DB access uses service-role key in server-only contexts.
- Image uploads are stored in public Supabase bucket (`captures`), so URLs are public.
- Domain logic rejects non-animal captures using AI output + kingdom validation.
- OAuth callback validates `next` redirect to avoid open redirect (`must start with / and not //`).

---

## 31) Practical Local Setup Sequence

1. Install dependencies: `npm install`
2. Create `.env.local` with Supabase + Gemini keys
3. Ensure Supabase schema/tables/bucket exist from `/home/runner/work/Dexter/Dexter/supabase/schema.sql`
4. Run dev server: `npm run dev`
5. Open app, authenticate via Google, complete onboarding, begin capture flow

---

## 32) Summary

Dexter is a full-stack Next.js + Supabase wildlife collection platform with:
- strong domain-centric backend orchestration,
- AI-assisted species verification and enrichment pipeline,
- challenge progression with deterministic and dynamic systems,
- highly animated themed tab-based frontend,
- structured persistence for captures, cards, XP, and leaderboard gameplay.
