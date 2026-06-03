# Dexter UI Design Reference

This document is a detailed implementation-grounded reference for the three UI-complete screen groups currently in the app:

1. Auth
2. Onboarding
3. Home, excluding species card internals

It is intended to be the source of truth for future screen design and implementation. Everything here is derived from the live codebase, primarily:

- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/layout/binder-shell.tsx`
- `src/components/ui/screen-primitives.tsx`
- `src/components/ui/illustrations.tsx`
- `src/features/auth/index.tsx`
- `src/features/onboarding/index.tsx`
- `src/features/home/index.tsx`
- `src/features/home/idle-state.tsx`
- `src/features/home/capture-stage.tsx`
- `src/features/home/capture-result.tsx`

This document captures:

- Exact visual tokens currently in use
- Layout and spacing patterns
- Typography behavior
- Motion and transition rules
- Per-screen UI structure
- UX patterns that should carry into future screens
- Current inconsistencies that should be normalized going forward

## 1. Product Visual Intent

Dexter is not a minimal productivity app and not a skeuomorphic game UI. Its visual language sits between a premium mobile app and a playful collectible field journal.

The current implemented direction is defined by six traits:

1. Bold color-blocked screens rather than neutral app chrome
2. Strong mascot-led branding through the `DexterEyes` illustration
3. Large display typography with compressed line-height
4. Rounded, tactile surfaces with soft depth rather than hard outlines
5. Mobile-first layouts with bottom-anchored primary actions
6. Fast, spring-based motion that feels playful but not noisy

The result should feel energetic, approachable, and collectible, but still polished enough to support progression, reward, and repetition.

An important structural rule sits underneath that visual identity:

- In authenticated areas, the theme of the page is decided by the color of the active binder tab.

That means the active tab color is not a small accent choice. It is the page's full thematic anchor. If the active binder tab is blue, the page should feel blue. If the active binder tab is red, the page should feel red. If the active binder tab is green, the page should feel green.

Examples:

- Home uses the Home tab theme, so the overall page language is blue.
- DexE should use the DexE tab theme, so the overall page language should be red.
- Challenges should use the Challenges tab theme, so the overall page language should be green.
- Leaderboard should use the Leaderboard tab theme, so the overall page language should be yellow/gold.
- Profile should use the Profile tab theme, so the overall page language should be purple.

## 2. Scope And Boundaries

This reference covers the design system implied by the completed screens only.

In scope:

- Auth screen
- Onboarding step 1 and step 2
- Home binder shell
- Home idle state
- Home capture camera / preview / processing
- Home capture results and failure states
- Shared primitives used by those screens

Out of scope:

- Species card internal visual system
- Dexe, Challenges, Leaderboard, and Profile detailed layouts
- Backend state logic except where it affects UX

## 3. Platform Assumptions

The current UI is explicitly mobile-first.

- Major screens use `min-h-[100dvh]` or `h-[100dvh]`
- Primary actions are positioned for thumb reach near the bottom edge
- The home experience assumes a persistent left-side tab rail inside authenticated areas
- Large display copy is optimized for narrow widths first, then allowed to breathe on larger screens
- Scrolling is vertical and natural; no nested horizontal carousels are part of the current completed flows

Desktop should preserve the same visual language, but it is not the primary reference when inventing new screens.

## 4. Global Tokens

### 4.1 Base Color Tokens

Defined in `src/app/globals.css`:

| Token | Value | Purpose |
| --- | --- | --- |
| `--background` | `#FAFAFF` | Global app background |
| `--foreground` | `#1A1A1A` | Primary text / ink |
| `--surface` | `#FFFFFF` | Default white surface |
| `--surface-soft` | `#F5F7FB` | Soft neutral surface |
| `--surface-cream` | `#FFF7EB` | Warm secondary surface |
| `--surface-card` | `#FFFDF6` | Cream card surface |
| `--border-strong` | `#1A1A1A` | Strong border / icon stroke |
| `--border-subtle` | `rgb(26 26 26 / 0.1)` | Soft separators and hairlines |
| `--ink-muted` | `rgb(26 26 26 / 0.65)` | Secondary text |
| `--ink-soft` | `rgb(26 26 26 / 0.45)` | Tertiary text |
| `--overlay-strong` | `rgb(17 17 17 / 0.95)` | Dark overlay |
| `--overlay-soft` | `rgb(0 0 0 / 0.2)` | Soft overlay |

### 4.2 Theme Accent Model

Authenticated screens use theme-swapping via CSS custom properties. The current completed home implementation uses:

| Token | Home Value | Meaning |
| --- | --- | --- |
| `--theme-accent` | `#2191FB` | Primary action and emphasis |
| `--theme-soft` | `#D8ECFF` | Soft tint / filled badge / loading surfaces |
| `--theme-wash` | `#F5FAFF` | Very light thematic wash |
| `--theme-ink` | `#12385F` | Theme-specific readable dark text |
| `--theme-contrast` | `#FFFFFF` | Text on accent |
| `--theme-chrome` | `#97C9FF` | Decorative chrome / supporting accent |
| `--theme-shadow` | `rgba(33,145,251,0.22)` | Accent-tinted shadow color |

Other section themes already exist in `src/lib/constants.ts` and should be reused for future authenticated tabs rather than inventing new arbitrary colors.

### 4.2.1 Binder Tab Controls Page Theme

This is a core system rule and should be treated as non-optional.

- The active binder tab color determines the active page theme.
- Theme application should affect the whole screen, not just one button or one badge.
- The accent should flow through headings, actions, supportive surfaces, shadows, progress fills, icon accents, and decorative treatments.
- The result should make the screen feel unmistakably owned by that tab.

For future implementation, think of the binder tab as the page's theme selector:

- `home` -> blue page language
- `dexe` -> red page language
- `challenges` -> green page language
- `leaderboard` -> yellow page language
- `profile` -> purple page language

This is one of the main reasons the current Home screen feels coherent: the binder tab and the page itself are speaking the same color language.

### 4.3 Screen-Specific Hardcoded Background Colors

The current completed top-level flows still use direct hex backgrounds in places:

| Screen | Color | Meaning |
| --- | --- | --- |
| Auth | `#2191FB` | Trust, energy, welcome |
| Onboarding step 1 | `#FE5F55` | Energy, setup, identity creation |
| Onboarding step 2 | `#1FC147` | Success, completion, launch |
| Camera stage | `#111111` | Immersive capture mode |
| Primary dark buttons | `#1A1A1A` | High-contrast action surface |

Guideline for future screens: preserve this bright color-blocked approach, but prefer routing colors through theme tokens or a documented screen token layer instead of scattering hardcoded hex values.

### 4.4 Color Restraint Rules

Color in Dexter should be bold, but controlled.

Rules:

1. One active page theme should dominate at a time.
2. Do not introduce extra accent colors unless they are semantically required, such as rarity or success feedback.
3. Do not use gradients for page backgrounds, cards, buttons, or decorative chrome unless a future system-level redesign explicitly adds them.
4. Prefer solid fills, tinted surfaces, subtle blur, and texture over gradient-heavy styling.

The current visual language is flat-color led, not gradient led.

## 5. Typography System

### 5.1 Font Stack

Loaded in `src/app/layout.tsx`:

| Variable | Font | Use |
| --- | --- | --- |
| `--font-display` | Titan One | Hero headings, high-impact labels, large numeric/value content |
| `--font-slackey` | Slackey | Playful section labels and high-character UI copy |
| `--font-pixel` | Press Start 2P | Reserved retro/pixel moments |
| `--font-body` | Bricolage Grotesque | Body copy, labels, default app text |

### 5.2 Canonical Font Roles

Use these roles consistently:

- `Display`: Titan One for headlines, major CTA labels, large values, status statements
- `Body`: Bricolage Grotesque for paragraphs, helper text, labels, errors
- `Playful UI`: Slackey for section headings that need extra personality
- `Pixel Accent`: Press Start 2P only for intentionally retro micro-moments, never for dense reading

### 5.3 Global Type Classes

Defined in `globals.css`:

| Class | Spec |
| --- | --- |
| `display-title` | `clamp(2rem, 4vw, 3.2rem)`, line-height `0.92`, letter-spacing `0.05em`, display font |
| `display-title-sm` | `1.8rem`, line-height `0.92`, letter-spacing `0.05em`, display font |
| `display-title-xs` | `1.35rem`, line-height `0.94`, letter-spacing `0.04em`, display font |
| `display-hero` | `clamp(2.25rem, 4vw, 2.75rem)`, line-height `0.92`, letter-spacing `0.04em`, display font |
| `display-section` | `clamp(1.5rem, 3vw, 2rem)`, line-height `0.95`, letter-spacing `0.04em`, display font |

### 5.4 Typography Behavior Across The Three Completed Flows

#### Auth

- Hero headline: `text-6xl` = `60px`, line-height `0.85`, letter-spacing `-0.04em`, display font
- Tagline: `text-base` = `16px`, relaxed leading, white at `90%` opacity
- Button micro label: `text-xs` = `12px`, uppercase, `0.22em` tracking, white at `50%` opacity
- Button label: `text-2xl` = `24px`, display font

#### Onboarding

- Step label: `text-xs`, uppercase, bold, `0.24em` tracking
- Step title: `display-title` with manual override to `line-height: 0.9` and `letter-spacing: -0.03em`
- Input field text: `text-3xl` = `30px`, display font
- Helper copy inside friend code card: `text-sm` with `leading-6`

#### Home

- Greeting: `display-hero`, visually compact and wide
- Stats row label: `text-xl`, Slackey, uppercase tracking
- Stats row value: `text-3xl`, display font
- Challenge title: `display-section`
- Small labels: `text-xs`, heavy uppercase tracking
- Result-state titles: `display-title` with size overrides where needed

### 5.5 Typography Rules For Future Screens

1. Reserve Titan One for high-signal moments, not for long paragraphs.
2. Use Bricolage Grotesque for anything longer than one short phrase.
3. Use uppercase tracked microcopy to structure sections without adding visual clutter.
4. Keep display line-height compressed between `0.9` and `0.95`.
5. Avoid introducing a fifth font or ad hoc font-family overrides.

## 6. Spacing System

The current screens are built mostly on Tailwind spacing increments. These are the most repeated values and should become the practical layout rhythm:

| Token | Pixels | Common Usage |
| --- | --- | --- |
| `gap-1` | `4px` | Tight icon/text pairs |
| `gap-2` | `8px` | Small inline pairs |
| `gap-2.5` | `10px` | Avatar grid spacing |
| `gap-3` | `12px` | Step progress, stacked action groups |
| `gap-4` | `16px` | Standard content grouping |
| `gap-5` | `20px` | Larger card/content spacing |
| `gap-6` | `24px` | Section separation |
| `px-3` | `12px` | Home inner gutters |
| `px-4` | `16px` | Standard app gutter inside authenticated shell |
| `px-5` | `20px` | Card/button internals |
| `px-6` | `24px` | Major CTA and overlay gutter |
| `px-8` | `32px` | Auth screen horizontal padding |
| `py-4` | `16px` | Inputs, small actions |
| `py-5` | `20px` | Primary action buttons |
| `py-6` | `24px` | Card interiors |
| `py-8` | `32px` | Main page shell vertical padding |
| `py-12` | `48px` | Full-screen auth top/bottom breathing room |
| `pt-14` | `56px` | Onboarding top inset |
| `pb-10` | `40px` | Bottom safe breathing room |
| `bottom-12` | `48px` | Floating bottom action offset |

### 6.1 Practical Spacing Rules

- Use `16px` as the base gutter inside shell content
- Use `24px` for section breathing room
- Use `40px` to `56px` for full-screen top/bottom separation
- Keep full-screen bottom primary actions at least `40px` away from the viewport floor
- Use `12px` gutters when content is already visually heavy or when working within narrow embedded sections

## 7. Radius System

The UI strongly favors rounded geometry. The main radius values in active use are:

| Radius | Approx. Pixels | Usage |
| --- | --- | --- |
| `rounded-xl` | `12px` | Inner code panel, compact surfaces |
| `rounded-2xl` | `16px` | Buttons, inputs, avatar badges, modal controls |
| `rounded-3xl` | `24px` | Home highlight cards |
| `rounded-4xl` | `32px` | Poster panels, large polished containers |
| `rounded-full` / pill | `999px` | Badges, progress rails, circular controls |

Guideline: do not introduce sharp rectangles unless a deliberate contrast is needed. Dexter's surfaces are soft, approachable, and toy-like without becoming childish.

## 8. Border System

### 8.1 Default Philosophy

The design language has mostly moved away from heavy black cartoon borders in content surfaces.

Preferred border types:

- Hairline or low-opacity neutral borders for glass and card surfaces
- White borders for special circular controls
- Strong black stroke only for mascot illustrations, rail tabs, and select expressive elements

### 8.2 Current Border Recipes

| Element | Border |
| --- | --- |
| Home glass surfaces | `1px solid rgb(26 26 26 / 0.08)` |
| Progress rail | `1px solid var(--border-subtle)` |
| Binder rail tabs | `2px solid var(--border-strong)` |
| Avatar selected ring | `box-shadow: 0 0 0 3px white` |
| Capture trigger | `4px solid white` |
| Friend code card | No visible border; depth comes from shadow |

### 8.3 Border Rules For Future Screens

1. Use bold borders sparingly and intentionally.
2. Prefer low-opacity separators over framed boxes.
3. If a screen already has a saturated full-screen background, let shadows and contrast define the surface instead of adding outlines everywhere.

## 8.4 Surface Simplicity Rules

Future screens should stay visually disciplined.

Avoid:

- Gradient cards
- Gradient buttons
- Decorative strokes that do not communicate structure
- Layered ornamental wrappers around ordinary content

Prefer:

- Solid fills
- Soft tinted surfaces
- Light texture
- Blur when appropriate
- Simple rounded geometry

## 9. Shadow And Depth System

The app uses shadows as the main depth cue instead of thick borders.

### 9.1 Global Shadow Tokens

Defined in `globals.css`:

| Token | Value |
| --- | --- |
| `--shadow-accent-lg` | `0 20px 44px -30px var(--theme-shadow)` |
| `--shadow-accent-button` | `0 22px 38px -20px rgb(33 145 251 / 0.85)` |

### 9.2 Repeated Surface Recipes

#### Glass Surface

Used in home shell surfaces:

- Border: `1px solid rgb(26 26 26 / 0.08)`
- Background: `rgb(255 255 255 / 0.58)` or `rgb(255 255 255 / 0.66)`
- Shadow: soft, low-contrast, tinted
- Backdrop blur: `10px` to `12px`
- Inner highlight: white inset line
- Noise overlay: subtle pseudo-element texture

#### Flat Elevated Card

Used in onboarding friend code card:

- Solid white background
- Rounded corners
- `shadow-lg`
- No outer border

#### Action Button Depth

Primary shared action buttons use layered shadows:

- Accent glow
- Small drop edge underneath
- Subtle top inset highlight

This makes buttons feel pressable rather than flat.

## 10. Texture, Blur, And Surface Effects

### 10.1 Texture Overlay

The `texture-overlay` utility uses an inline SVG fractal noise image.

- Opacity: `0.05`
- Blend mode: `overlay`
- Purpose: stop large flat color blocks from feeling sterile

Use it only on major feature surfaces or saturated blocks, not everywhere.

### 10.2 Glass / Frosted Treatments

Observed in:

- Home surfaces
- Onboarding display name input
- Secondary onboarding back button

Ingredients:

- White tint with alpha
- Low-opacity borders or none
- `backdrop-blur-sm` or stronger
- Slightly brighter hover/focus state instead of thick focus ring

Guideline: reserve frosted treatment for elements placed over saturated backgrounds or imagery.

## 11. Motion System

Framer Motion is core to Dexter's character. Motion is not ornamental; it explains screen changes, confirms input, and adds mascot personality.

### 11.1 Motion Principles

1. Use motion for continuity, not spectacle.
2. Prefer spring transitions for major screen and control changes.
3. Keep durations short.
4. Use blur and scale sparingly to support focus and reveal.
5. Give bottom actions tactile press feedback.

### 11.2 Shared Transition Characteristics

| Pattern | Spec |
| --- | --- |
| Route transition in binder shell | Spring, `stiffness: 300`, `damping: 30` |
| Full-state fade/blur swap | `0.25s` to `0.35s`, `easeInOut` |
| Tap compression | Typically `scale: 0.97` to `0.92` |
| Hover lift | Very subtle, typically `-0.5px` translate or `scale: 1.02` to `1.05` |
| Loader loops | Smooth `easeInOut`, repeated infinitely |

### 11.3 Brand Animation

The blinking `DexterEyes` is a recurring comfort and identity device.

Current blink animation:

- `scaleY: [1, 1, 0.1, 1, 1]`
- Duration: `4s`
- Key blink occurs late in the cycle

Use this when a screen needs personality, waiting reassurance, or a soft empty-state presence.

### 11.4 Motion Rules For Future Screens

1. Every primary screen transition should have either a spring slide or a fade/blur handoff.
2. Every button that matters should have press feedback.
3. Repeated looping motion should stay slow and low-amplitude.
4. Avoid stacking multiple competing animations in the same viewport region.

## 12. Iconography And Illustration

### 12.1 Icon Style

Lucide icons are used throughout.

Common treatment:

- Simple outline icons
- Often larger stroke weights than default for game-like boldness
- Monochrome within a given surface

Common sizes:

- `16px` for helper icons
- `20px` to `24px` for standard action icons
- `32px` and above for prominent close/capture contexts

### 12.2 Mascot Illustration

`DexterEyes` is the brand's primary illustration primitive.

Construction:

- White eye shapes with black stroke
- Saturated accent iris
- Black pupil
- White highlight

This asset is used as:

- Hero illustration on auth
- Companion mark in home greeting
- Empty/error visual anchor
- Animated loader basis

Future screens should reuse `DexterEyes` before introducing new illustration styles.

### 12.3 Avatar System

Onboarding avatars are rendered with DiceBear Toon Head and clipped by the app UI rather than by the source image.

Current selected state:

- Scale down to `0.95`
- White ring via `box-shadow`
- Floating check badge top-right

This is a clean reference for any future single-select visual grid.

## 13. Layout Grammar

### 13.1 Full-Screen Standalone Screens

Auth and onboarding use the entire viewport as one visual field.

Pattern:

- Saturated solid background
- Content stacked vertically
- Strong top hero zone
- Center visual or main task
- Bottom anchored CTA

### 13.2 Authenticated Shell Screens

Home lives inside `BinderShell`.

Shell characteristics:

- Left tab rail width: `48px` mobile, `56px` on `sm+`
- Main content max width: `56rem` / `896px`
- Main content padding: `16px` horizontal, `32px` vertical
- Whole shell height: `100dvh`

### 13.3 Bottom Action Pattern

The app heavily prefers bottom-floating or bottom-anchored actions:

- Auth sign-in button
- Onboarding continue and complete button
- Home capture trigger
- Preview confirm bar
- Result state primary buttons

Guideline: if a screen has one obvious next step, place it low enough for thumb reach and make it visually dominant.

## 14. Binder Shell Specification

The binder shell is a defining authenticated pattern and should frame future authenticated screens.

### 14.1 Rail Structure

- Fixed vertical strip at left
- Active tab creates the effect of an exposed page edge
- Inactive tabs are colored by destination theme
- Labels run vertically using `writing-mode: vertical-rl` and `rotate(180deg)`

### 14.2 Rail Measurements

- Rail width: `48px` mobile, `56px` desktop breakpoint and above
- Tab height: `100px` inactive, `120px` active
- Border thickness: `2px`
- Tab overlap: `-2px` margin-top between neighboring tabs

### 14.3 Rail Visual Behavior

- Active tab background switches to app background
- Active label uses that tab's accent color
- Inactive tab label is white with text shadow
- Inactive tab uses inset shadow for depth

### 14.4 Page Transition In Binder

Each route animates in with a vertical offset whose direction depends on tab position. This gives navigation a physical stacked-page feeling rather than a generic fade.

### 14.5 Important Current Note

`BinderShell` currently accepts `title` and `action` props, but does not render them in the shell UI. Future screens should not assume there is a visible shell header until that is implemented.

## 15. Shared Component Specs

### 15.1 Eyebrow Badge

Defined by `.eyebrow-badge`:

- Inline-flex
- Centered contents
- `gap: 8px`
- Pill radius
- Padding: `8px 16px`
- Font size: `12px`
- Font weight: `900`
- Letter-spacing: `0.18em`
- Uppercase

Use for:

- Count chips
- XP reward chips
- Small thematic status labels

Badge restraint rule:

- Do not add badges just to make a layout feel busier or more "designed".
- A badge should only exist when it communicates a compact piece of useful metadata.
- If a label can live as ordinary text, use ordinary text.
- Future screens should avoid unnecessary badges.

### 15.2 Primary Action

Canonical shared class: `.solid-action`

- Width: full
- Radius: `12px`
- Padding: `16px 20px`
- Display font
- Font size: `24px`
- Letter-spacing: `0.08em`
- Accent background
- White text
- Multi-layer tactile shadow
- Hover: slight brightness increase
- Active: subtle translate down and scale
- Disabled: opacity reduction and no-pointer feel

### 15.3 Secondary Action

Canonical shared class: `.ghost-action`

- Width: full
- Radius: `12px`
- Padding: `16px 20px`
- Display font
- Font size: `24px`
- Accent text
- Light surface hover fill

### 15.4 Progress Rail

- Height: `12px`
- Rounded full
- Subtle border
- Filled track transitions width over `500ms`

### 15.5 Poster Panel

Large polished panel component:

- `rounded-4xl`
- subtle border
- accent-tinted soft shadow
- decorative accent circles
- relative positioning for layered decoration

This is the reference panel for future empty/loading/error states.

### 15.6 No General Card Design

Card design should not be used as a general UI pattern in Dexter.

Rules:

1. Do not design ordinary screen sections as cards.
2. Do not place stats, menus, settings groups, onboarding content, or informational content inside generic card shells.
3. Do not introduce card-style wrappers just to create separation or visual polish.
4. Use open layout, spacing, typography, themed blocks, simple surfaces, and screen composition before reaching for any card treatment.

Only exception:

- The actual species card is allowed to use its own dedicated card language because it represents collectible species content and must remain visually special.

This means the species card is an intentional product artifact, not a reusable page-layout pattern.

## 16. Auth Screen Detailed Spec

Source: `src/features/auth/index.tsx`

### 16.1 Overall Structure

- Full-screen vertical flex layout
- Background: `#2191FB`
- Text color: white
- Padding: `32px` horizontal, `48px` vertical
- Overflow hidden

Three vertical zones:

1. Top narrative zone
2. Center illustration zone
3. Bottom action zone

### 16.2 Top Narrative Zone

- Starts with `mt-12` = `48px` extra top separation
- Hero copy:
  - Content: `Your World is Wild.`
  - Font: display
  - Size: `60px`
  - Line-height: `0.85`
  - Tracking: `-0.04em`
  - Color: white
- Tagline:
  - Max width: `18rem` / `288px`
  - Margin top: `20px`
  - Size: `16px`
  - Color: `white/90`
  - Tone: concise, descriptive, collectible-focused

### 16.3 Center Illustration Zone

- `flex-1` centers the mascot vertically within remaining space
- `DexterEyes` size: `220`
- This is intentionally large and simple, not decorative clutter

### 16.4 Bottom Action Zone

Primary auth button:

- Full width
- Horizontal layout with text group left and arrow right
- Background: `#1A1A1A`
- Radius: `16px`
- Padding: `24px 20px`
- Text aligned left
- Hover: slight upward micro-lift
- Active: reset down
- Disabled: `opacity: 0.7`

Text stack inside button:

- Top label:
  - `12px`
  - uppercase
  - bold
  - tracking `0.22em`
  - white at `50%`
- Main label:
  - `24px`
  - display font
  - margin top `4px`

Arrow icon:

- `24px`
- White

Error state:

- Margin top `12px`
- Rounded `12px`
- Background `white/15`
- Padding `16px 12px`
- `14px` body text
- White

### 16.5 Auth Motion

- Top block enters with spring from `y: 30`
- Center illustration enters with spring scale from `0.9`
- Bottom CTA enters with delayed spring from `y: 20`

### 16.6 Auth UX Principles To Reuse

1. Explain value proposition immediately.
2. Use one giant action only.
3. Keep authentication emotionally light rather than admin-like.
4. Anchor the action where the thumb already rests.

## 17. Onboarding Screen Detailed Spec

Source: `src/features/onboarding/index.tsx`

The onboarding flow is a two-step full-screen sequence inside a black outer stage, with each step rendered as an absolute full-screen color panel.

### 17.1 Shared Onboarding Structure

- Root:
  - `position: relative`
  - `height: 100dvh`
  - `width: 100%`
  - `overflow: hidden`
  - Base background: `#1A1A1A`
- Each step:
  - `absolute inset-0`
  - `flex flex-col`
  - `overflow-y-auto`
  - `px-6`
  - `pt-14`
  - `pb-10`
  - white foreground text

### 17.2 Shared Onboarding Motion

The step container uses `AnimatePresence` with directional slide:

- Step 1 enters from left and exits to left
- Step 2 enters from right and exits to right
- Spring: `stiffness 300`, `damping 30`

Within each step:

- Header fades in from `y: 20`
- Task block fades in sequentially with short delays
- Main buttons use `whileTap` compression

### 17.3 Step Progress Indicator

Each step begins with:

- Two horizontal bars
- Height: `6px`
- Gap: `12px`
- Radius: full
- Active bar: solid white
- Inactive bar: white at `30%`

This is the reference pattern for short multi-step linear flows.

## 18. Onboarding Step 1: Identity Setup

### 18.1 Background And Tone

- Full-screen background: `#FE5F55`
- Emotional tone: energetic, expressive, high-ownership

### 18.2 Header

Step label:

- `12px`
- uppercase
- bold
- tracking `0.24em`
- white at `60%`

Title:

- `display-title`
- explicit line-height override `0.9`
- explicit tracking override `-0.03em`
- content breaks onto two lines

### 18.3 Display Name Input

Position:

- `mt-8` after header

Label:

- `12px`
- uppercase
- bold
- tracking `0.22em`
- white at `80%`
- margin-bottom `8px`

Input field:

- Full width
- Radius: `16px`
- Background: `white/20`
- Padding: `20px 16px`
- Text size: `30px`
- Text color: white
- Placeholder: `white/40`
- Display font
- `backdrop-blur-sm`
- Focus state: background increases to `white/25`
- Outline removed
- Max length: `24`

This is the canonical form-field style for colorful, brand-led full-screen onboarding steps.

### 18.4 Avatar Grid

- Margin top: `24px`
- 4 columns
- Gap: `10px`
- Each avatar button:
  - no visible frame outside the badge
  - tap scale `0.92`

Avatar badge:

- Default size in this screen: `76px`
- `rounded-2xl`
- Selected state:
  - `scale(0.95)`
  - white ring via `box-shadow`
  - floating 24x24 white check badge
  - check icon stroke is bold and dark

### 18.5 Bottom Action

- Spacer pushes CTA to the bottom
- Button:
  - full width
  - dark background `#1A1A1A`
  - radius `16px`
  - padding `24px 20px`
  - label `24px` display font
  - arrow icon `24px`
  - hover slight lift
  - tap scale `0.97`

### 18.6 UX Logic To Reuse

1. Put the highest-cognitive-load task first.
2. Follow text entry with a visual choice.
3. Make the end of the step feel decisive, not tentative.

## 19. Onboarding Step 2: Activation And Friend Code

### 19.1 Background And Tone

- Full-screen background: `#1FC147`
- Emotional tone: success, handoff, launch into the main product

### 19.2 Header

Same structure as step 1, but step label is slightly dimmer at `white/50`.

Title content:

- `Welcome Dexter.`
- two-line break
- same display-title treatment

### 19.3 Friend Code Card

Outer card:

- Margin top: `40px`
- Radius: `16px`
- Background: white
- Padding: `24px`
- Text color: `#1A1A1A`
- Shadow: `shadow-lg`

Card label:

- `12px`
- uppercase
- bold
- tracking `0.24em`
- black at `45%`

Inner code panel:

- Margin top: `16px`
- Horizontal layout
- Justify between
- Radius: `12px`
- Background: `#1A1A1A`
- Padding: `20px 16px`
- White text

Friend code text:

- `30px`
- display font
- tracking `0.2em`

Copy button:

- Circular
- Padding: `12px`
- Background: `white/12`
- Tap scale: `0.85`

Copy success state:

- Icon switches from `Copy` to `Check`
- Success green `#1FC147`
- `Copied!` label appears below with a short motion fade-up

Supporting paragraph:

- Margin top: `16px`
- `14px`
- `leading-6`
- black at `60%`

### 19.4 Bottom Actions

Action stack:

- `space-y-3`

Primary complete button:

- same visual recipe as step 1 CTA
- disabled state `opacity: 0.7`

Secondary back button:

- full width
- centered contents
- gap `8px`
- radius `16px`
- background `white/20`
- padding `20px 16px`
- `14px` bold body text
- `backdrop-blur-sm`
- hover brightens to `white/30`

### 19.5 UX Logic To Reuse

1. End onboarding with a celebratory state, not a sterile form submit.
2. Present shareable or identity data inside a reward-like card.
3. Always keep a safe retreat path with a lower-weight secondary action.

## 20. Home Screen Detailed Spec

Sources:

- `src/features/home/index.tsx`
- `src/features/home/idle-state.tsx`
- `src/features/home/capture-stage.tsx`
- `src/features/home/capture-result.tsx`

The home experience is more than one screen. It is a state machine with a consistent visual language:

1. Idle dashboard
2. Camera mode
3. Preview mode
4. Processing mode
5. Success / duplicate / failure result mode

The persistent capture trigger is the central UX anchor across these states.

## 21. Home Shell And Frame

### 21.1 Container

- Root uses `.app-shell-min`
- Relative column layout
- Designed to fill viewport minus some persistent shell allowance

### 21.2 Floating Capture Zone

The bottom capture control exists outside normal content flow and sits above most home states.

- Fixed positioning
- Left offset accounts for binder rail
- Bottom padding `40px`
- Horizontal padding `16px`
- Centered layout with symmetrical spacers

This should remain a home signature rather than being reused universally across unrelated tabs.

### 21.3 Theme Application In Home

Home is the clearest current example of the binder-tab theme rule working correctly.

- The active binder tab is Home.
- The Home tab accent is blue.
- The page therefore uses a blue-led visual system throughout.

That blue theme is visible across:

- Greeting text
- Stats values and icon treatment
- Challenge surfaces
- Capture trigger
- Result-state actions
- Accent shadows
- The animated eye loader

Future authenticated screens should show the same level of thematic consistency with their own binder-tab color.

## 22. Home Idle State

### 22.1 Root Layout

- `theme-scope`
- `space-y-5`
- Horizontal padding `12px`
- Bottom padding `40px`

### 22.2 Greeting Row

- `display-hero`
- Color: `theme-accent`
- Tight tracking
- Horizontal layout with `12px` gap
- Eye illustration size: `64`
- Eye animates with slow blink loop

Tone:

- Friendly and immediate
- Very little copy
- Brand mascot acts like a companion rather than a logo stamp

### 22.3 Stats Rows

Three rows:

- Streak
- Weekly XP
- Captures

Each row layout:

- Full-width flex
- Left group:
  - icon size `24`
  - stroke width `3`
  - Slackey font
  - `text-xl`
  - uppercase feel
- Middle divider:
  - `border-b-4`
  - dotted
  - black
- Right value:
  - display font
  - `text-3xl`
  - accent color

Interaction:

- Hover scale `1.02`
- Slight horizontal nudge `x: 2`

This row pattern is highly characteristic and should inform future playful statistic lists.

### 22.4 Active Challenge Surface

Surface:

- `rounded-3xl`
- Accent background
- `px-5 py-6`
- `shadow-md`
- `border border-black/5`
- noise overlay

Header zone:

- small uppercase label in white at `70%`
- challenge title in `display-section`
- description in `14px` body text, `white/90`

Reward badge:

- Uses `eyebrow-badge`
- Background: `var(--surface)`
- Text: accent color

Progress:

- Margin top `20px`
- White progress fill
- Soft translucent white track

Footer meta:

- small uppercase tracked labels
- left shows numeric progress
- right shows expiry label

Important note:

- Although this section is visually grouped, it should be understood as a themed surface block, not as a reusable "card design" pattern for future screens.

### 22.5 Empty Challenge Variant

When there is no active challenge:

- same accent-card family
- centered text
- title: `font-display text-xl`
- inline call-to-action below
- arrow icon reinforces forward movement

The empty state remains optimistic and active rather than passive.

### 22.6 Recent Captures Section

Header row:

- left: Slackey section title at `text-xl`
- right: compact accent link button with arrow

If captures exist:

- 2-column grid
- `gap-3`

If captures do not exist:

- Uses `PosterEmptyState`

Note: the card internals are intentionally out of scope for this document, but the section framing and spacing are in scope and should be followed.

## 23. Persistent Capture Trigger

This is one of the strongest interaction signatures in the product.

Defined by `.capture-trigger` and `.capture-trigger__inner`.

Outer button:

- Size: `84px x 84px`
- Circular
- Border: `4px solid white`
- Background: accent blue
- White iconography context
- Multi-layer shadow including strong accent glow and a dark bottom edge
- Hover: slight brightness increase
- Active: `translateY(3px) scale(0.98)`

Inner circle:

- Size: `50px x 50px`
- Circular
- White fill
- Inset shadow
- Small top highlight

Behavior:

- In idle mode, tap opens camera
- In camera mode, tap takes shot

The button is centered between two invisible `56px` spacers so it feels perfectly balanced whether or not the close button is visible.

## 24. Camera Stage

### 24.1 Full-Screen Overlay

- Fixed overlay
- Left offset matches binder rail
- Background: `#111111`
- Full-height immersive takeover

### 24.2 Live Camera View

- Video fills entire available area
- `object-cover`
- No extra chrome over the camera feed besides essential controls

### 24.3 Camera Error State

If camera access fails:

- Replace immersive feed with a branded fallback screen
- Background returns to light app background
- Accent heading in display font
- Large blinking eyes recenter the screen emotionally
- Single bottom CTA returns user home

This is a good reference for technical failure UX: branded, calm, actionable.

## 25. Preview Stage

### 25.1 Captured Image

- Full-screen image
- `object-cover`
- On entry, a black overlay fades out quickly, giving a shutter/reveal feel

### 25.2 Preview Action Bar

- Fixed near bottom
- Centered inside max width container
- Two controls:
  - square retry button
  - flexible-width confirm button

Retry:

- White surface
- Square aspect
- radius `16px`
- `shadow-lg`
- soft border
- rotate icon in accent color

Confirm:

- Uses primary action class
- icon and label aligned center
- visually more dominant than retry

## 26. Processing Stage

### 26.1 Image Treatment

- Captured image remains visible underneath
- Brightness reduced to `45%`
- Blurred overlay with dark tint sits above

### 26.2 Loader

- Custom animated eyes SVG
- White sclera, accent iris, animated pupil drift
- Sits centered above heading

### 26.3 Processing Copy

- Uses rotating phrase slot, though current phrase list only contains `Identifying...`
- Text class starts from `display-hero` but is explicitly forced to `text-xl`
- White with strong drop shadow
- Center aligned
- max width `18rem`

Guideline for future async states: keep the previous user context visible behind the loading layer when possible.

## 27. Capture Result States

There are three distinct visual outcomes:

1. New species captured
2. Duplicate species
3. Failed capture

All retain the same theme color family and bottom action pattern.

## 28. New Capture Result

### 28.1 Layout

- Centered column
- Large card reveal zone
- `pb-36` leaves room for bottom action

### 28.2 Reward Messaging

- XP badge at top uses accent background and white text
- Reveal species card sits below inside a constrained width
- Supporting copy is italic, muted, and celebratory without being loud

### 28.3 Delayed Primary Action

- `Add to DexE` button only appears once `revealReady` becomes true
- Delay: `1400ms`

This is important: the design intentionally forces a beat of reward appreciation before allowing the user to dismiss the moment.

## 29. Duplicate Capture Result

- Title in accent display type: `Already in your DexE`
- Card remains visible but slightly desaturated with `grayscale-[0.12]`
- Copy explains that duplicates cannot be captured
- Bottom action returns user home

The tone is corrective but not punitive.

## 30. Failed Capture Result

### 30.1 Title Logic

Dynamic copy based on failure reason:

- `No wild subject found`
- `Missed this time`
- `Something went wrong!`

### 30.2 Layout

- Top title and explanatory paragraph
- Large centered blinking eyes
- Soft shadow ellipse underneath eyes
- Primary retry action at bottom

### 30.3 UX Principle

The failure state does not show an error card or technical jargon. It returns to a brand-led, encouraging posture with a single recovery path.

## 31. Copywriting Pattern

The UI writing across the completed screens follows these rules:

1. Short phrases over full sentences for headings
2. One emotional idea per heading
3. Friendly, lightly game-like tone
4. No bureaucratic labels
5. Progress and reward language is concrete and energetic

Examples of the tone:

- `Your World is Wild.`
- `Pick your explorer icon.`
- `Start Exploring`
- `Already in your DexE`
- `No wild subject found`

Future screens should sound like an inviting field guide, not a dashboard admin panel.

## 32. Interaction And UX Rules To Preserve

1. One primary action per screen or state.
2. Use saturated background colors to mark major user journey phases.
3. Put reward, progress, and identity front and center.
4. Make system feedback visual before textual when possible.
5. Use the mascot as reassurance during uncertainty.
6. Keep primary actions large enough for one-handed use.
7. Prefer bottom actions over top-right confirmations.
8. Keep choice sets visually chunky and obvious.

## 33. Accessibility And Usability Notes

The current UI is strong visually, but future screens should improve accessibility without diluting the style.

### 33.1 What Already Works

- Large targets on major controls
- Strong color contrast on dark CTA buttons
- Clear single-task hierarchy
- Large display titles for immediate scanning

### 33.2 What Should Improve Going Forward

1. Add visible `focus-visible` styles for keyboard users.
2. Avoid relying only on opacity changes to communicate secondary states.
3. Check contrast for white text on bright saturated backgrounds when opacity is reduced.
4. Preserve semantic labels and aria attributes for icon-only controls.
5. Respect reduced motion preferences for looping and screen transitions.

These improvements should be treated as system work, not optional polish.

## 34. Known Inconsistencies In The Current Implementation

The completed screens are cohesive, but not fully normalized yet. Future screens should follow the canonical direction below rather than duplicating every inconsistency.

### 34.1 Button Styling Split

Current state:

- Auth and onboarding buttons are hand-styled inline with dark solid surfaces
- Home uses shared `.solid-action` and `.ghost-action`

Recommendation:

- Keep the auth/onboarding visual look
- Refactor future screens toward shared button primitives with variants instead of one-off class strings

### 34.2 Display Tracking Split

Current state:

- Global display classes use positive tracking
- Auth and onboarding hero headings override to negative tracking

Recommendation:

- Canonical rule:
  - use slightly negative tracking for giant hero titles on full-screen color-block screens
  - use positive tracking for badge-like and object-title contexts

### 34.3 Color Token Split

Current state:

- Some screens use theme variables
- Some use direct hex literals

Recommendation:

- Future screens should define screen colors via a documented token layer first

### 34.4 Shell Header Props Not Yet Rendered

Current state:

- `title` and `action` props are passed into `BinderShell`
- they are not currently rendered

Recommendation:

- Do not base future layout designs on a visible shell header until it exists

## 35. Canonical Rules For Future Screens

If a new screen is built tomorrow, it should follow these rules unless there is a strong reason not to:

1. Start with one of two layout families:
   - full-screen color-block flow
   - binder-shell authenticated screen
2. In binder-shell screens, let the active binder tab color define the whole page theme.
3. Use Titan One only for high-priority text.
4. Use Bricolage Grotesque for anything descriptive.
5. Make the primary action large, bottom-anchored, and unmistakable.
6. Prefer rounded `16px` to `24px` corners for interactive surfaces.
7. Use shadows and blur before using hard borders.
8. Do not use gradients unless the design system is explicitly updated to support them.
9. Do not add badges unless they carry meaningful metadata.
10. Do not use general card design as a layout pattern.
11. The only allowed card language is the actual species card for species content.
12. Animate screen changes with spring or short fade/blur transitions.
13. Reuse `DexterEyes` or existing illustration vocabulary before inventing a new art style.
14. Structure multi-step flows with clear progress indicators and directional transitions.
15. Preserve a collectible, field-guide tone in both copy and composition.

## 36. Screen Creation Checklist

Before shipping a future screen, verify:

- The screen belongs clearly to either the full-screen flow family or the binder-shell family
- If it is inside the binder shell, the active tab color clearly drives the page theme
- Typography uses only the existing role fonts
- Primary spacing uses the `16 / 24 / 40 / 56` rhythm
- Interactive surfaces use the established radius system
- CTA treatment matches the current tactile button language
- No gradients were introduced casually
- No unnecessary badges were added
- No generic card design was introduced
- Species-card styling was not reused for non-species UI
- Motion supports clarity and brand feel
- Empty / loading / error states remain branded and encouraging
- Bottom reach and one-handed mobile use were considered
- Colors come from documented tokens or existing theme definitions
- The screen feels like Dexter, not a generic template

## 37. Recommended Next Step

This file should be treated as the detailed reference, and the next layer of system work should be:

1. Consolidate current repeated button styles into shared variants
2. Introduce a documented token file for full-screen flow colors
3. Add focus-visible and reduced-motion support
4. Render or remove the dormant `BinderShell` header API

That work is not required to use this document, but it will make future screen implementation much more consistent.
