# DexE - Wildlife Binder

DexE is a mobile-first, vibrant, and collectible wildlife identification application. It leverages Next.js, Supabase, and Gemini to identify species from photos and reward users with collectible cards.

## Features

- **Capture & Identify**: Take photos of animals, plants, or insects and get real-time species identification.
- **Collectible Cards**: Earn beautifully designed, color-coded species cards based on rarity (Common, Uncommon, Rare, Epic, Legendary).
- **Gamification**: Complete challenges, maintain streaks, and earn XP to rank up on the global leaderboard.
- **Dynamic Data**: Retrieves rich taxonomic data and lore from GBIF, iNaturalist, and Wikipedia automatically.

## Tech Stack

- Next.js 15+ (App Router)
- Supabase (Auth, Postgres, SSR)
- Tailwind CSS v4 & Framer Motion (Styling & Animations)
- Google Gemini API (Visual Identification)

## Getting Started

1. **Install dependencies**:

   ```bash
   cd dexter-app
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` inside `dexter-app/` with:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   GEMINI_API_KEY=...
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/app/`: Next.js App Router pages (auth, home, profile, leaderboard).
- `src/components/`: Reusable UI components (binder shell, species cards).
- `src/lib/`: Core logic including the Supabase integration, Gemini identification pipeline (`domain.ts`), and session handling.
- `supabase/`: Database schema and migrations.

## Testing

Currently, the codebase is lean and relies heavily on SSR and live Supabase data. Integration tests can be re-enabled by adding Playwright/Vitest configurations as needed.

## Deployment

Deploy to Vercel and ensure all environment variables (including Supabase auth tokens and Gemini keys) are properly configured.
