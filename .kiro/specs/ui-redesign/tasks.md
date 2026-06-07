# Implementation Plan: UI Redesign

## Overview

This plan converts the Quizly UI redesign into incremental coding steps. The work is strictly a visual/UX redesign: every existing route, server API call, client data flow, `localStorage` handling, and Indonesian UI string is preserved. The implementation follows the layered architecture from the design: define the design tokens first (`assets/css/tailwind.css`), map them to Tailwind utilities (`tailwind.config`), document them, then restyle the shared `Ui*` components, add behavior-free presentational components and the app shell background, and finally refactor each of the six pages to consume tokens. Each page step changes only presentation (class attributes, layout/visual markup), never `<script setup>` logic.

Note: the design's PBT assessment concluded property-based testing does not apply (UI/CSS/config work with no new pure functions or business logic). Testing therefore relies on Vitest example/unit checks (token presence + WCAG contrast), a string-preservation check, the existing server test suite, and the `npm run build` gate.

## Tasks

- [x] 1. Establish the design token foundation
  - [x] 1.1 Declare design tokens in `assets/css/tailwind.css`
    - Add color tokens as space-separated HSL channels under `:root` (background, foreground, card/card-foreground, popover/popover-foreground, primary/primary-foreground, brand, accent/accent-foreground, accent-2/accent-2-foreground, secondary/secondary-foreground, muted/muted-foreground, success/success-foreground, warning/warning-foreground, destructive/destructive-foreground, border, input, ring)
    - Add the `--gradient-brand` near-black→green gradient token
    - Add typography tokens (`--font-display`, `--font-sans`, `--font-mono`) and the type-scale token groups (`--text-display-*`, `--text-h1/h2/h3-*`, `--text-body-*`, `--text-sm-*`)
    - Add spacing ramp (`--space-1`…`--space-12`), radius scale (`--radius-sm/md/lg/xl/pill`, retaining `--radius` mapped to `--radius-lg`), and elevation tokens (`--shadow-sm/md/lg/brand`)
    - Add motion tokens (`--motion-fast/base/slow`, `--ease-standard/emphasized/spring`) and a global `@media (prefers-reduced-motion: reduce)` guard that minimizes non-essential motion
    - Group tokens with inline category comments
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 10.1, 11.5_

  - [x] 1.2 Map tokens to Tailwind utilities in `tailwind.config`
    - Expose semantic colors via `hsl(var(--token))` (including new `brand`, `accent-2`, `success`, `warning`)
    - Map `borderRadius` to `--radius-*`, `boxShadow` to `--shadow-*`, `fontFamily` to display/sans/mono, and `transitionDuration`/`transitionTimingFunction` to the motion tokens
    - _Requirements: 1.5, 2.1, 2.2_

  - [x] 1.3 Document tokens in `design-tokens.md`
    - Create `design-tokens.md` at the repo root listing each token's name, value, intended usage, and its Tailwind binding
    - _Requirements: 1.6_

  - [x] 1.4 Write token presence and contrast unit tests
    - Vitest test asserting required color tokens (Req 1.1) and typography/spacing/radius/elevation/motion token groups (Req 1.2–1.4) are declared in `assets/css/tailwind.css`
    - Vitest test computing WCAG contrast ratios for foreground/background, primary/primary-foreground, accent/accent-foreground, muted-foreground/card, destructive/destructive-foreground, success/success-foreground (≥ 4.5:1 normal text), plus accent-on-background/accent-on-card and the primary-vs-background boundary (≥ 3:1)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 10.1_

- [x] 2. Restyle the shared `Ui*` components to reference tokens
  - [x] 2.1 Restyle `UiButton` (`components/ui/button/index.ts`)
    - Update base + every variant in `buttonVariants` to token utilities: `default` uses the near-black brand gradient/`bg-primary` + `--shadow-brand` glow + green accent ring/border + spring press (`active:scale-[0.98]`); `outline`/`secondary`/`ghost`/`link`/`destructive` mapped to semantic tokens; token-driven radius and green `focus-visible:ring-ring`
    - Preserve all `variant` and `size` options and the `as`/`asChild` API
    - _Requirements: 12.1, 12.2, 12.3, 10.2, 11.1_

  - [x] 2.2 Restyle `UiInput`
    - Token border (`border-input`), token radius, comfortable height (≥ `h-12`), token focus ring, `placeholder:text-muted-foreground`; preserve `v-model`/props
    - _Requirements: 12.1, 12.2, 10.2_

  - [x] 2.3 Restyle `UiLabel`
    - Token text color/weight and consistent spacing; preserve props for programmatic association
    - _Requirements: 12.1, 12.2, 10.6_

  - [x] 2.4 Restyle `UiCard` (Card/Header/Title/Content/Footer)
    - Token surface `bg-card`, `border-border`, `--shadow-md`, `--radius-xl`; preserve structure
    - _Requirements: 12.1, 12.2_

  - [x] 2.5 Restyle `UiDialog` and `UiAlertDialog`
    - Token popover surface, radius, elevation, and backdrop; buttons use restyled `UiButton` tokens; motion via token durations/easing; preserve open/close API, triggers, and Indonesian strings
    - _Requirements: 12.1, 12.2, 11.1_

  - [x] 2.6 Restyle `UiTable` (Header/Row/Head/Cell/Body)
    - Token text colors, token divider borders, token hover surface (`hover:bg-accent`), comfortable density; preserve structure and slots
    - _Requirements: 12.1, 12.2_

  - [ ]* 2.7 Write component snapshot/render checks for restyled `Ui*` components
    - Confirm token classes are applied and that props/variants/sizes still render for `UiButton`, `UiInput`, `UiCard`
    - _Requirements: 12.2, 12.3_

- [x] 3. Add behavior-free presentational components and the app shell
  - [x] 3.1 Create `BrandMark.vue`
    - Presentational icon tile + gradient wordmark using `--font-display` and brand/accent tokens; no behavior
    - _Requirements: 2.5_

  - [x] 3.2 Create `AnswerTimer.vue`
    - Presentational SVG countdown ring receiving `timeLeft` and `total` props (emits nothing); applies `--warning` urgency styling at ≤ 5s; interval logic stays in the page
    - _Requirements: 7.3, 7.4_

  - [x] 3.3 Create `LeaderboardRow.vue`
    - Presentational ranked row with rank medal treatment, current-player highlight, and a reorder animation hook using motion tokens; no behavior
    - _Requirements: 8.4, 8.5, 11.4_

  - [x] 3.4 Re-express the `app.vue` atmospheric background with tokens
    - Replace ad-hoc background literals with the dark atmospheric base (near-black `--background` + low-alpha green radial glows); retain the author attribution link
    - _Requirements: 2.3, 2.4, 13.6_

- [~] 4. Checkpoint - foundation in place
  - Ensure `npm run build` succeeds and existing tests pass, ask the user if questions arise.

- [x] 5. Refactor the six pages to consume the design system (presentation only)
  - [x] 5.1 Redesign the Landing/Join page (`pages/index.vue`)
    - Hero with `BrandMark`, atmospheric background, and join `UiCard`; code input keeps mono/uppercase/letter-spaced treatment via `--font-mono`
    - Retain strings: hero heading/tagline, "Nama Kamu", "Kode Kuis", placeholders, "Mulai Kuis", "Menghubungkan...", "Masuk sebagai Admin", "Kode kuis tidak ditemukan." (error styled with `text-destructive`)
    - Preserve join behavior (`POST /api/play/join` → navigate `/quiz/{id}`) and in-progress disable; single-column mobile layout with primary controls ≥ 44×44px; inputs associated with labels
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.2, 10.6, 13.1, 13.2_

  - [x] 5.2 Redesign the Login/Register page (`pages/admin/login.vue`)
    - Centered auth `UiCard` with `BrandMark`; mode-dependent Indonesian headings/descriptions and submit "Masuk"/"Buat Akun"; toggle clears error; error styled with `text-destructive`
    - Preserve submit to `/api/auth/login` or `/api/auth/register` → navigate `/admin`, and `localStorage` token handling; inputs associated with `UiLabel` via `for`/`id`; single-column mobile layout
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.2, 10.6, 13.1, 13.2, 13.3_

  - [x] 5.3 Redesign the Admin Dashboard (`pages/admin/index.vue`)
    - Header with greeting, "+ Buat Kuis Baru", "Keluar"; quiz `UiCard`s showing title, question count, participant count, code, creation date; empty state retains "Belum ada kuis" + description
    - Create/edit/delete flows call the same endpoints and refresh logic using restyled `UiDialog`/`UiAlertDialog` with existing strings; desktop multi-column grid (`lg:grid-cols-3`) collapsing to single column on mobile
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 9.3, 13.1, 13.2_

  - [x] 5.4 Redesign the Quiz Editor (`pages/admin/quiz/[id].vue`)
    - Header: title, code with copy action (toggling "Salin Kode"/"Tersalin!" for the existing 2s), leaderboard visibility toggle; stats summary cards (question count, participant count, average score, highest score)
    - Option-count selector (2–6) and "Soal"/"Peserta" tabs with existing labels; "Soal" tab shows question list with options + add-question form, exactly-one-correct-option indicated with `--success` styling
    - Preserve endpoints: add question (`POST /api/admin/quizzes/{id}/questions`), delete question (`DELETE /api/admin/questions/{id}`), leaderboard toggle (`PATCH /api/admin/quizzes/{id}`); "Peserta" tab renders ranking in restyled `UiTable` with existing headers; desktop multi-column arrangement (`lg:grid-cols-3`)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 9.4, 13.1, 13.2_

  - [x] 5.5 Redesign the Gameplay page (`pages/quiz/[id]/index.vue`)
    - Top bar: "Soal X/Y", running score (mono), `AnswerTimer` ring, progress bar; question card + options as large distinct tappable targets; timer applies `--warning` urgency at ≤ 5s
    - Preserve option select (`POST /api/check-answer`), correct feedback with earned points (`1000 + time_left*10`) using `--success`, incorrect "Salah!" using `--destructive`, final-question finish (`POST /api/play/{id}/finish`) → result, and loading indicator
    - Convey correctness via icon + text in addition to color; animate selection with the spring motion token; no horizontal scroll on mobile (`max-w-md`, single-column options)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 9.5, 10.5, 11.3, 13.1, 13.2, 13.4_

  - [x] 5.6 Redesign the Result/Leaderboard page (`pages/quiz/[id]/result.vue`)
    - Completion heading "Kuis Selesai!", player name, prominent score card (brand gradient, mono); leaderboard using `LeaderboardRow` with rank/name/score when visible, current player's row distinguished, top three with medal treatment
    - Preserve the Realtime INSERT/UPDATE subscription; on update refresh + reorder with a motion-token transition; retain "LIVE" indicator, hidden-leaderboard message "Papan peringkat disembunyikan oleh admin.", and back action "Kembali ke Beranda"; single-column mobile layout
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 9.2, 11.4, 13.1, 13.2_

- [ ] 6. Content-preservation verification
  - [ ]* 6.1 Write a string-preservation check
    - Search-based test asserting required Indonesian strings remain present across the six page templates ("Mulai Kuis", "Menghubungkan...", "Kode kuis tidak ditemukan.", "Masuk", "Buat Akun", "Belum ada kuis", "Tersalin!", "Kuis Selesai!", "Skor Anda", "Kembali ke Beranda", "Papan peringkat disembunyikan oleh admin.", "LIVE", "Salah!")
    - _Requirements: 13.2_

- [~] 7. Final checkpoint - verify build and tests
  - Ensure `npm run build` succeeds and `npm test` (existing server tests + new token/string tests) passes, ask the user if questions arise.
  - _Requirements: 13.5_

## Notes

- Tasks marked with `*` are optional (test-related) and can be skipped for a faster MVP, but are recommended for confidence in token correctness and content preservation.
- Each page task changes presentation only; `<script setup>` logic, network calls, navigation, timers, Realtime subscriptions, and `localStorage` handling are left intact (Requirement 13).
- Property-based tests are intentionally omitted: the design's PBT assessment determined they do not apply to this UI/CSS/configuration redesign. Testing uses Vitest example/unit checks, a string-preservation check, the existing server suite, and the `npm run build` gate.
- Full WCAG AA conformance, responsive behavior, and keyboard/reduced-motion checks (Requirements 9, 10, 11) require manual testing with assistive technologies and visual review across breakpoints; the automated tests here cover only the token-pairing contrast criterion and string preservation.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.4", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "3.1", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["2.7", "5.1", "5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 4, "tasks": ["6.1"] }
  ]
}
```
