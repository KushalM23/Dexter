# DexE — Technical Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Prepared for:** Engineering Team

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Technical Stack](#2-technical-stack)
3. [Design System](#3-design-system)
4. [Authentication & Onboarding](#4-authentication--onboarding)
5. [Navigation & Layout](#5-navigation--layout)
6. [Screen Specifications](#6-screen-specifications)
   - 6.1 [Home — Capture Screen](#61-home--capture-screen)
   - 6.2 [DexE — Collection Screen](#62-dexe--collection-screen)
   - 6.3 [Challenges Screen](#63-challenges-screen)
   - 6.4 [Leaderboard Screen](#64-leaderboard-screen)
   - 6.5 [Profile Screen](#65-profile-screen)
7. [Capture Pipeline](#7-capture-pipeline)
8. [Species Card System](#8-species-card-system)
9. [Rarity System](#9-rarity-system)
10. [XP & Points System](#10-xp--points-system)
11. [Challenges System](#11-challenges-system)
12. [Data Models](#12-data-models)
13. [API Integrations](#13-api-integrations)
14. [Database Schema](#14-database-schema)
15. [Future Features (Scoped Out)](#15-future-features-scoped-out)

---

## 1. Product Overview

DexE is a mobile-first web application that gamifies wildlife observation. Users capture photos of animals, plants, and organisms in the real world. The app identifies the species using AI, enriches it with scientific data, assigns it a rarity, and adds it to the user's personal collection as a flippable card — like a real-life Pokédex.

**Core loop:** Go outside → Spot an animal → Capture it → Get a card → Earn XP → Climb the leaderboard.

**Target platform:** Mobile browsers (iOS Safari, Android Chrome). The app is a website optimised exclusively for mobile screen sizes. Desktop is a secondary, non-priority concern.

---

## 2. Technical Stack

| Layer            | Technology                                                     |
| ---------------- | -------------------------------------------------------------- |
| Frontend         | React (Next.js)                                                |
| Styling          | Tailwind CSS                                                   |
| Animation        | Framer Motion                                                  |
| Auth             | Supabase Auth (Google OAuth)                                   |
| Database         | Supabase (PostgreSQL)                                          |
| Storage          | Supabase Storage (captured images)                             |
| Species AI       | Google Gemini 2.0 Flash API                                    |
| Taxonomy         | GBIF API                                                       |
| Species Photos   | iNaturalist API → GBIF Media → Wikipedia REST (fallback chain) |
| Lore/Description | Wikipedia REST API                                             |
| Deployment       | Vercel                                                         |

---

## 3. Design System

### 3.1 Philosophy

- **Abstraction first:** Never expose technical details to the user. No API names, no error codes, no loading spinners with text like "Fetching taxonomy." Use progress bars and contextual language only.
- **Mobile-first:** All layouts designed at 390px width. Nothing is designed for desktop first and scaled down.
- **Binder metaphor:** The entire app UI is a physical binder. Pages are binder tabs on the right side. Navigation = switching tabs.

### 3.2 Colour Palette

**Base:**

- Background: `#FAFAFF`
- Text primary: `#1A1A1A`
- Text secondary: `#6B6B6B`

**Tab / Page Theme Colours (one per screen, applied app-wide when that tab is active):**

| Screen            | Hex       |
| ----------------- | --------- |
| Home (Capture)    | `#2191FB` |
| DexE (Collection) | `#FE5F55` |
| Challenges        | `#1FC147` |
| Leaderboard       | `#E1BC29` |
| Profile           | `#7902BD` |

When a tab is active, its theme colour propagates to: tab highlight, header accents, button fill, icon tints, and card border accents on that page.

**Rarity Colours (card system):**

| Rarity    | Colour     | Hex       |
| --------- | ---------- | --------- |
| Common    | Stone Grey | `#9EA3A8` |
| Uncommon  | Green      | `#9EA3A8` |
| Rare      | Blue       | `#0F52BA` |
| Epic      | Red        | `#E40046` |
| Legendary | Purple     | `#6536A7` |

### 3.3 Typography

- Font: `Bowlby` or `Lilita One` or `sigmar one` (Google Fonts)
- Species names: Use italic for scientific names always

### 3.4 Animation Principles (Framer Motion)

- All page transitions: binder tab feel
- Card reveal (post-identification): scale up from center with a spring animation
- Card flip: 3D Y-axis rotate (front to back), duration 0.6s, ease: `easeInOut`
- Rarity-tiered reveal animations:
  - Common: simple scale-in
  - Uncommon: scale-in + subtle green shimmer
  - Rare: scale-in + blue particle burst
  - Epic: scale-in + red glow pulse + shake
  - Legendary: full-screen dark overlay + purple lightning + card rises from bottom
- Progress bars: animated fill, never instant
- Tab switching: spring transition, stiffness 300, damping 30

### 3.5 Iconography

- Use Lucide React icons throughout
- All icons tinted with the active tab's theme colour

---

## 4. Authentication & Onboarding

### 4.1 Auth

- Provider: Supabase Auth with Google OAuth
- On first load, if no active session → redirect to `/auth`
- Auth screen: full-screen eggshell background, app logo centered, single "Continue with Google" button
- No email/password auth. Google only.
- On successful auth, check `users` table for existing profile:
  - Profile exists → go to `/home`
  - Profile does not exist → go to `/onboarding`

### 4.2 Friend Code Generation

On account creation (first time a user row is inserted into the `users` table), immediately generate and persist a **unique 6-character alphanumeric friend code** (uppercase, e.g. `A3KX9P`).

```
charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  // remove ambiguous chars: 0,O,1,I
code = random 6 chars from charset
// check uniqueness in DB before saving — regenerate on collision
```

This code is permanent and never changes. It is the only way users can find and add each other. Store in `users.friend_code`.

### 4.3 Onboarding Flow

A short 2-step flow shown only once after first sign-in. Cannot be skipped.

**Step 1 — Profile Icon**

- Prompt: "Pick your explorer icon"
- Grid of 12 preset illustrated avatars (animal/nature themed illustrations — use a fixed set of SVG illustrations stored in the codebase)
- User taps one to select, tap again to confirm
- Display name is shown below this(google name) which is editable to anything

**Step 2 — Welcome**

- Show the user's generated friend code
- Copy button next to the code
- Text: "This is your unique explorer code. Share it with friends to connect later."
- CTA button: "Start Exploring" → navigates to `/home`

Onboarding completion sets `users.onboarding_complete = true`.

---

## 5. Navigation & Layout

### 5.1 Binder Tab Navigation

The app's primary navigation is a **vertical stack of binder tabs on the right edge of the screen**, always visible. This is the most critical UI element of the app.

- Tabs are positioned absolutely on the right side, vertically centered
- Each tab is a rotated label (text rotated 90°, reading bottom to top)
- Tabs are layered like physical binder dividers — inactive tabs peek out, active tab is flush with the page edge and visually "opens"
- Tab order (top to bottom): Profile, Challenges, Leaderboard, DexE, Home
- Active tab: full theme colour fill, white text, slightly wider, no drop shadow
- Inactive tabs: lighter tint of their respective colour, grey text, slight drop shadow to create depth
- Switching tabs triggers a Framer Motion page transition (slide direction based on tab order — moving down the list slides new page in from bottom, moving up slides from top)

### 5.2 Page Layout Shell

Every page has:

- Top: page header (page title + contextual right-side action if needed)
- Middle: scrollable page content
- Right: binder tab rail (fixed, always visible)
- No bottom navigation bar (tabs replace it)

Content area width = screen width minus tab rail width (~40px)

---

## 6. Screen Specifications

### 6.1 Home — Capture Screen

This is the most complex screen. It has two states: **idle** and **capture mode**.

#### Idle State

The full screen shows contextual home information:

- **Header:** Date, user's display name greeting ("Hey, Kusham"), total cards collected count
- **Stats strip:** XP this week, captures today, current streak (days)
- **Recent captures:** Horizontal scroll of the last 3 cards captured (mini card previews)
- **Active challenge teaser:** One card showing the most urgent active challenge (title + progress bar)
- **Capture button:** Fixed at the bottom center. Large circular button, amber fill, camera icon. Label: "Capture"

#### Capture Mode (triggered by tapping Capture button)

The home screen information is replaced by the camera viewfinder. The transition should feel like the page content folds away and the camera opens up — use a Framer Motion layout animation.

- **Viewfinder:** Full area above the button showing live camera feed via `getUserMedia()` — rear camera preferred (`facingMode: environment`)
- **Capture button:** Same position, now acts as shutter. Icon changes to a filled circle (shutter icon).
- **Cancel (X) button:** Top left of viewfinder to exit capture mode and return to idle state

#### Post-Capture State (image taken)

- Viewfinder is replaced by the captured image preview (static, no live feed)
- Two buttons replace the single capture button:
  - **Retry** (left, outlined): discards the current image, returns to live viewfinder
  - **Confirm** (right, amber fill): confirms the image and starts the backend pipeline
- No upload option. Camera capture only.

#### Pipeline Running State

- Image preview stays visible
- A progress bar appears below the image with no technical labels — just contextual messages cycling through:
  - "Scanning the wild..."
  - "Consulting the field guide..."
  - "Preparing your catch..."
- The confirm/retry buttons are replaced by the progress bar. No interaction possible during pipeline.

#### Result States

**A) Success — New Species:**

- Card reveal animation plays (rarity-dependent, see §8)
- Card is shown in full in the center of the screen
- Button below: "Add to DexE" (amber fill)
- Tapping it adds to collection and returns to idle state with a success toast

**B) Success — Duplicate Species:**

- Card is shown but greyed out
- Message: "Already in your DexE"
- Button: "Back" — returns to idle state
- No points or XP awarded

**C) Low Confidence:**

- No card shown
- Icon + message: "Couldn't identify this one. Try getting closer or better lighting."
- Button: "Try Again" — returns to live viewfinder

**D) No Organism Detected:**

- Icon + message: "No animal or plant detected in this photo."
- Button: "Try Again"

**E) Error:**

- Generic: "Something went wrong. Try again."
- Button: "Retry"

---

### 6.2 DexE — Collection Screen

The user's full card collection.

**Header:** "DexE" title + total count badge (e.g. "47 caught")

**Filter bar:** tab filters:

- All | Common | Uncommon | Rare | Epic | Legendary

Selected filter: filled with rarity colour (or indigo for "All"). Unselected: outlined.

**Card grid:** 2-column grid of card thumbnails. Each card thumbnail shows:

- Rarity colour as card background tint
- Species photo
- Common name
- Rarity badge

Tapping a card → opens full card view with flip animation (front → back).

**Empty state:** If no cards in selected filter: illustration + "No [rarity] catches yet. Get out there!"

**Sort:** Default sort is most recently caught first. No sort controls needed for v1.

---

### 6.3 Challenges Screen

**Three sections, each collapsible:**

**Daily Challenges**

- Resets every 24 hours at midnight UTC
- 3 challenges per day
- Progress bar per challenge
- XP reward shown on each

**Weekly Challenges**

- Resets every Monday midnight UTC
- 3 challenges per week
- Harder than daily, higher XP

**Achievements**

- Permanent, one-time milestones
- Locked achievements show silhouette + "???" label
- Unlocked show full details + earned date

**Challenge card anatomy:**

- Title (user-friendly, e.g. "City Safari" not "capture_urban_mammal_x3")
- Description (one sentence max)
- Progress: "2 / 3" + progress bar
- XP reward badge
- Status: In Progress / Completed (green checkmark)

**Urban vs Rural Challenge Logic:**

The backend detects the user's environment using their GPS coordinates at session start. Classification:

- Urban: population density above threshold (use reverse geocoding + urban area API or a simple city boundary check)
- Rural/Wildlife: everything else

Urban users receive challenges specifically designed around urban fauna:

- Pigeons, sparrows, squirrels, crows, rats, domestic cats, dogs (common urban species)
- Challenges like "Spot 3 bird species in your city", "Find an insect in a park", "Catch a mammal without leaving the city"

Rural users receive challenges around broader wildlife:

- Reptiles, amphibians, wild mammals, forest birds

The challenge pool is segmented in the database by `environment_type: urban | rural`. On challenge generation (daily/weekly reset), query challenges from the matching pool for that user.

Store `users.environment_type` and update it on each session start.

---

### 6.4 Leaderboard Screen

Global leaderboard ranked by total XP.

**Filter tabs:** Weekly | Monthly | All Time (default: All Time)

**Leaderboard row:**

- Rank number (1st, 2nd, 3rd get gold/silver/bronze styling)
- Profile icon (avatar illustration)
- Display name
- XP total
- Top caught rarity badge (their rarest card)

**Current user row:** Always pinned/highlighted even if not in top view, showing their rank and XP.

Top 3 users get a podium-style header treatment (larger avatars, crown icons for #1).

No friend filtering in v1. Global only.

---

### 6.5 Profile Screen

**Sections:**

**Profile Header:**

- Avatar illustration (large)
- Display name
- Friend code in a styled chip: `A3KX9P` with a copy icon
- Small caption: "Share this code to connect with friends"
- Edit button (pencil icon) → allows changing display name and avatar

**Mini Dashboard:**

- Total cards: [n]
- Total XP: [n]
- Global rank: #[n]
- Current streak: [n] days
- Rarest catch: [card mini preview]
- Captures this week: [n]

**Collection Breakdown:**

- Bar or donut visual showing distribution across rarities

**Settings:**

- Notification preferences (future)
- Account: displays linked Google account email (read only)
- Sign out button

---

## 7. Capture Pipeline

### 7.1 Image Capture (Frontend)

```
1. getUserMedia({ video: { facingMode: "environment" } })
2. Stream to <video> element as viewfinder
3. On shutter tap: draw current video frame to <canvas>
4. canvas.toDataURL("image/jpeg", 0.85) → base64 string
5. Store base64 in local state for preview
6. On Confirm: proceed to pipeline
```

No file upload input. Camera capture only. JPEG at 85% quality to balance size and fidelity.

### 7.2 Image Upload

Before calling Gemini, upload the image to Supabase Storage:

- Bucket: `captures`
- Path: `{user_id}/{timestamp}.jpg`
- Returns a permanent public URL stored with the card record

### 7.3 Gemini 2.0 Flash — Species Identification

**Endpoint:**

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}
```

**Request body:**

```json
{
  "contents": [
    {
      "parts": [
        {
          "inline_data": {
            "mime_type": "image/jpeg",
            "data": "{base64_string}"
          }
        },
        {
          "text": "You are a wildlife species identification expert and fraud detection system.\n\nAnalyze this image carefully. First, determine if this is a genuine photo of a real animal, plant, or organism taken in the real world.\n\nREJECT the image if:\n- It appears to be a photo of a screen, monitor, TV, or digital display\n- It is a drawing, illustration, painting, or cartoon\n- It is a stuffed animal, toy, or statue\n- No organism is visible\n\nIf genuine, identify the species.\n\nRespond ONLY in this exact JSON format, no other text:\n{\n  \"valid_capture\": true,\n  \"common_name\": \"Snow Leopard\",\n  \"scientific_name\": \"Panthera uncia\",\n  \"confidence\": \"high\",\n  \"reasoning\": \"Distinctive rosette patterns, thick tail, gray-white coat typical of Panthera uncia\",\n  \"kingdom\": \"Animalia\",\n  \"class\": \"Mammalia\"\n}\n\nIf invalid capture, return:\n{\n  \"valid_capture\": false,\n  \"reason\": \"photo_of_screen\" | \"illustration\" | \"no_organism\" | \"toy_or_statue\"\n}\n\nIf valid but confidence is low, still return full structure with confidence: \"low\".\n\nConfidence levels: \"high\" (clearly identifiable), \"medium\" (likely but some ambiguity), \"low\" (best guess, unclear image)."
        }
      ]
    }
  ]
}
```

**Handling response:**

- `valid_capture: false` → show appropriate rejection message, prompt retry
- `confidence: low` → show "couldn't identify" state, prompt retry
- `confidence: medium | high` + `valid_capture: true` → proceed to GBIF validation

> **Note on AI fraud detection:** The prompt instructs Gemini to reject photos of screens, illustrations, toys, and non-real captures. This is the v1 anti-cheating mechanism. It is prompt-level only and not foolproof — a more robust image authenticity check can be layered in v2.

### 7.4 GBIF — Taxonomy Validation & Enrichment

```
GET https://api.gbif.org/v1/species/match?name={scientific_name}&verbose=true
```

**matchType handling:**

| matchType    | Action                                               |
| ------------ | ---------------------------------------------------- |
| `EXACT`      | Proceed with full confidence                         |
| `FUZZY`      | Proceed, use GBIF's corrected name                   |
| `HIGHERRANK` | Proceed but flag `taxonomy_confidence: partial`      |
| `NONE`       | Abort — do not create card, show "couldn't identify" |

**Data extracted from GBIF:**

- `usageKey` → used as the canonical species ID (the card's "Pokédex number")
- `kingdom`, `phylum`, `class`, `order`, `family`, `genus`, `species`
- `canonicalName` → authoritative scientific name

### 7.5 Duplicate Check

Before proceeding to card creation:

```sql
SELECT id FROM user_collections
WHERE user_id = {user_id} AND gbif_taxon_key = {usageKey}
```

If a row exists → show duplicate state. Pipeline ends here.

### 7.6 Photo Fallback Chain

```
1. iNaturalist: GET https://api.inaturalist.org/v1/taxa?q={scientific_name}
   → use results[0].default_photo.medium_url if exists

2. GBIF Media: GET https://api.gbif.org/v1/occurrence/search?scientificName={name}&mediaType=StillImage&limit=1
   → use results[0].media[0].identifier if exists

3. Wikipedia: GET https://en.wikipedia.org/api/rest_v1/page/summary/{scientific_name}
   → use thumbnail.source if exists
   → also extract extract (summary text) for lore

4. Fallback: use a local SVG silhouette keyed by `class`:
   Mammalia, Aves, Reptilia, Amphibia, Insecta, Arachnida, Actinopterygii, Plantae, Fungi, Other
```

Store both `photo_url` and `photo_source` ("inaturalist" | "gbif" | "wikipedia" | "silhouette") in the card record.

### 7.7 Rarity Assignment

Rarity is assigned deterministically based on GBIF occurrence data — combining both global observation counts and **regional context**. Rarer in the real world = rarer in the app, but this accounts for geography. For example, a Kangaroo may be "Common" in Australia but would be "Epic" or "Legendary" if captured in a region where it is incredibly rare like India.

To achieve this, the API call includes the user's current country code or bounding box.

```
GET https://api.gbif.org/v1/occurrence/count?taxonKey={usageKey}&country={country_code}

regional_occurrence_count thresholds:
  > 1,000,000  → Common
  100,000–999,999 → Uncommon
  10,000–99,999   → Rare
  1,000–9,999     → Epic
  < 1,000         → Legendary
```

These thresholds are configurable in an environment variable or admin config — they will need tuning after launch based on real distribution data.

### 7.8 XP & Points Assignment

Points are assigned by rarity. Points are fixed per rarity tier (not per species):

| Rarity    | XP Awarded |
| --------- | ---------- |
| Common    | 10         |
| Uncommon  | 25         |
| Rare      | 60         |
| Epic      | 150        |
| Legendary | 400        |

No Common species will ever award more XP than any Uncommon species. This is enforced by the tier-based fixed assignment, not per-species scoring.

### 7.9 Card Creation & Storage

On successful pipeline completion:

1. Insert row into `species_cards` (master species table, upsert by `gbif_taxon_key`)
2. Insert row into `user_collections` (linking user to card, with capture metadata)
3. Return full card data to frontend
4. Trigger card reveal animation

---

## 8. Species Card System

### 8.1 Card Front

Displayed on collection grid and after capture. Content:

- **Background:** Gradient tinted with rarity colour (light to medium, not full saturation)
- **Rarity badge:** Top right corner — colour dot + rarity label ("Rare")
- **Species photo:** Upper 55% of card, object-fit: cover, slight rounded corners
- **Common name:** Large, bold, white text with subtle drop shadow
- **Scientific name:** Below common name, smaller, italic, semi-transparent white
- **Kingdom badge:** Bottom left — icon + label (e.g. 🐾 Animalia)
- **XP badge:** Bottom right — star icon + XP value (e.g. ⭐ 60 XP)
- **Caught location:** Very small text at bottom — city/region name derived from GPS at capture time

### 8.2 Card Back

Revealed on tap via 3D flip animation. Content:

- **Background:** Darker version of rarity colour gradient
- **Taxonomy chain:** Kingdom → Phylum → Class → Order → Family → Genus → Species (vertical list, small text)
- **Lore paragraph:** 2-3 sentences from Wikipedia extract. Styled like a field notes entry.
- **Stats block:**
  - Rarity tier
  - XP value
  - GBIF observation count (shown as "Recorded sightings: 12,400" — no API branding)
  - Photo source credit (shown as "Photo: Community Wildlife Archive" — no iNaturalist branding needed)
- **Caught metadata:**
  - Date and time of capture
  - Location (city/region)
- **Flip back button:** Small arrow icon at top right to flip back to front

### 8.3 Card Reveal Animation (Framer Motion)

Triggered after successful pipeline. Sequence:

**Common:**

- Card scales up from 0.5 to 1.0, opacity 0 → 1, spring animation

**Uncommon:**

- Same scale-up + green shimmer overlay that fades out after 1s

**Rare:**

- Dark overlay fades in (0.3 opacity), card rises from bottom with blue glow, particle burst (CSS/canvas particles in blue)

**Epic:**

- Full dark overlay, card shakes subtly on entry, red glow pulses twice, dramatic scale-in

**Legendary:**

- Full-screen black overlay, purple lightning bolt CSS animation, card rises slowly from bottom center, purple particle explosion, screen flashes white once before reveal

All reveal animations complete before the "Add to DexE" button appears.

---

## 9. Rarity System

### 9.1 Assignment

Rarity is assigned at card creation time based on GBIF regional occurrence count (see §7.7). It is stored in `user_collections.rarity` (or derived at capture time based on location) as rarity can differ by region.

### 9.2 Rarity Distribution (Expected)

Given GBIF data distribution, expect roughly:

- ~60% Common
- ~25% Uncommon
- ~10% Rare
- ~4% Epic
- ~1% Legendary

Thresholds in §7.7 should be calibrated post-launch using real capture data.

### 9.3 Rarity in the UI

Rarity colour appears on:

- Card background tint
- Rarity badge
- Filter pills (in DexE)
- Collection breakdown chart (profile)
- Leaderboard row badge

---

## 10. XP & Points System

- XP is earned from two sources: card captures and challenge completion
- XP is additive and never decreases
- Total XP determines leaderboard rank
- XP is stored in `users.total_xp` and updated on every earn event
- Capture XP is defined by rarity tier (see §7.8)
- Challenge XP is defined per challenge in the `challenges` table

There is no separate "points" vs "XP" concept. One currency: XP.

---

## 11. Challenges System

### 11.1 Challenge Types

**Daily challenges:** Generated per user every 24h. 3 challenges. Examples:

- "Capture any animal today" (1 XP = 15)
- "Find a bird species" (XP = 20)
- "Capture 2 animals in one day" (XP = 30)

**Weekly challenges:** Generated per user every Monday. 3 challenges. Examples:

- "Capture 3 different classes of animal this week" (XP = 75)
- "Find a Rare or better species" (XP = 100)
- "Capture 5 animals this week" (XP = 60)

**Achievements:** Permanent, one-time. Examples:

- "First Catch" — capture your first animal (XP = 50)
- "City Naturalist" — capture 10 urban species (XP = 150)
- "Legendary Hunter" — capture your first Legendary (XP = 500)
- "Full House" — have at least one card of each rarity (XP = 300)

### 11.2 Urban/Rural Segmentation

On each session start, the app requests GPS. Using coordinates, classify the user's environment:

- Use the [OpenCage Geocoding API](https://opencagedata.com/) (free tier: 2,500 req/day) or equivalent to determine if coordinates fall within an urban area
- Store classification as `users.environment_type = "urban" | "rural"`
- Refresh on every session start (user may travel)

Challenges in the `challenges` table have a field `environment_type: "urban" | "rural" | "any"`. When generating daily/weekly challenges for a user, only pull from challenges where `environment_type` matches the user's current environment or is `"any"`.

Urban challenge examples:

- "Capture a pigeon, crow, or sparrow"
- "Find an insect in an urban park"
- "Spot a mammal without leaving the city limits"

Rural/wildlife challenge examples:

- "Capture a wild mammal"
- "Find an amphibian or reptile"
- "Spot a raptor (bird of prey)"

### 11.3 Challenge Progress Tracking

Progress is tracked in `user_challenge_progress`. Each capture event triggers a check against all active challenges for that user. If a capture satisfies a challenge condition, increment `progress`. If `progress >= target`, mark as completed and award XP.

---

## 12. Data Models

### User

```
id: uuid (Supabase auth UID)
display_name: string
avatar_id: string (e.g. "avatar_03")
friend_code: string (6-char, unique, generated on creation)
total_xp: integer (default 0)
environment_type: enum("urban", "rural")
onboarding_complete: boolean (default false)
created_at: timestamp
```

### Species Cards (master table — one row per species globally)

```
id: uuid
gbif_taxon_key: integer (unique)
common_name: string
scientific_name: string
kingdom: string
phylum: string
class: string
order: string
family: string
genus: string
rarity: enum("common", "uncommon", "rare", "epic", "legendary")
xp_value: integer
photo_url: string
photo_source: enum("inaturalist", "gbif", "wikipedia", "silhouette")
lore: text
occurrence_count: integer
created_at: timestamp
```

### User Collections (one row per user–species pair)

```
id: uuid
user_id: uuid (FK → users.id)
species_card_id: uuid (FK → species_cards.id)
captured_image_url: string (Supabase Storage URL)
captured_at: timestamp
capture_lat: float
capture_lng: float
capture_location_label: string (city/region)
```

### Challenges

```
id: uuid
title: string
description: string
type: enum("daily", "weekly", "achievement")
environment_type: enum("urban", "rural", "any")
xp_reward: integer
target_count: integer
condition_type: string (e.g. "capture_any", "capture_class:Aves", "capture_rarity:rare")
```

### User Challenge Progress

```
id: uuid
user_id: uuid
challenge_id: uuid
progress: integer (default 0)
completed: boolean (default false)
completed_at: timestamp
assigned_at: timestamp
expires_at: timestamp (null for achievements)
```

---

## 13. API Integrations

### Gemini 2.0 Flash

- **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Auth:** API key via query param `?key={GEMINI_API_KEY}`
- **Key storage:** Server-side env variable only. Never expose to client.
- **Invocation:** Server-side only (Next.js API route). Client sends image to your backend; backend calls Gemini.
- **Rate limit:** Free tier: 1,500 req/day. Monitor usage.

### GBIF API

- **Base:** `https://api.gbif.org/v1/`
- **Auth:** None required for read endpoints
- **Used endpoints:**
  - `/species/match?name={name}&verbose=true` — taxonomy validation
  - `/occurrence/count?taxonKey={key}` — occurrence count for rarity
  - `/occurrence/search?scientificName={name}&mediaType=StillImage&limit=1` — photo fallback

### iNaturalist API

- **Base:** `https://api.inaturalist.org/v1/`
- **Auth:** None for read
- **Used endpoints:**
  - `/taxa?q={scientific_name}` — primary photo source
- **Rate limit:** Be a good citizen. One call per pipeline run.

### Wikipedia REST API

- **Base:** `https://en.wikipedia.org/api/rest_v1/`
- **Auth:** None
- **Used endpoints:**
  - `/page/summary/{scientific_name}` — lore text + photo fallback

### Supabase

- Auth, Database (PostgreSQL), and Storage all via Supabase SDK
- Use Row Level Security (RLS) on all tables
- RLS policy: users can only read/write their own rows in `user_collections` and `user_challenge_progress`
- `species_cards` is globally readable, insert/update only via service role (server-side)

---

## 14. Database Schema Notes

- All Gemini API calls go through a Next.js API route (`/api/identify`) — never call Gemini directly from the client
- Use Supabase Edge Functions or Next.js API routes for all backend logic
- `species_cards` acts as a global cache — if a species has been captured before by any user, the enriched card data already exists and the pipeline skips GBIF/photo fetching and goes straight to card creation
- Index `user_collections` on `(user_id, species_card_id)` for fast duplicate checks
- Index `users` on `friend_code` for fast friend lookup

---

## 15. Future Features (Scoped Out of v1)

The following are acknowledged but explicitly not in scope for v1. They should be architecturally considered but not built:

### Friends System

- Users add each other by friend code
- Friend list stored in a `friendships` table (user_id_a, user_id_b, status)
- Friends leaderboard filtered to friend network

### Card Trading

- Users propose trades between friends
- Trade: swap one card from each user's collection
- Requires `trades` table with status (pending, accepted, rejected, cancelled)
- A user cannot have duplicate species — trades must be validated

### Friends Leaderboard

- Leaderboard filtered to only show a user's friends + themselves
- Same XP system, different filter

### AI Image Authenticity (v2)

- Layer a dedicated image authenticity model on top of the Gemini prompt-level check
- Detect screen captures, printed photos, and AI-generated images more robustly

### Push Notifications

- Daily challenge reminders
- "You're close to levelling up" nudges
- Friend trade requests

---

_End of PRD v1.0_
