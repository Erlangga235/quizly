# Quizly Design Tokens

This document is the single reference for every design token in the Quizly design system. Tokens are declared as CSS custom properties under `:root` in `assets/css/tailwind.css` and surfaced to Tailwind through the `tailwind.config` HSL-variable convention. All pages and shared `Ui*` components must reference these tokens rather than hardcoded values (Requirement 1.5).

**Token categories:** [Colors](#colors) · [Typography](#typography) · [Type Scale](#type-scale) · [Spacing](#spacing) · [Radius](#radius) · [Elevation](#elevation) · [Motion](#motion) · [Semantic Usage Guidelines](#semantic-usage-guidelines)

---

## Colors

Color tokens are stored as space-separated HSL channels (e.g. `150 14% 5%`) so they compose naturally with Tailwind's `hsl(var(--token))` mapping and `/<alpha>` opacity modifiers (e.g. `bg-background/50`).

The palette is **dark-forward**: near-black neutrals dominate every surface and the primary brand action; **green acts as the neutral anchor / supporting accent** for highlights, focus, selected/active states, and key emphasis.

### Base Surfaces

| Token | Value (HSL channels) | Intended Usage | Tailwind Binding |
|-------|----------------------|----------------|-----------------|
| `--background` | `150 14% 5%` | App/base background. The dominant near-black with a faint green tint; the atmospheric dark base rendered by `app.vue` and shared by all pages. | `bg-background`, `text-background` |
| `--foreground` | `150 8% 95%` | Default text color. Light (~16:1 on `--background`); use for all body and heading copy rendered on the base background. | `text-foreground` |
| `--card` | `150 12% 8%` | Card/surface background. Slightly elevated near-black; use for `UiCard`, panel containers, and any surface that sits above the base background. | `bg-card` |
| `--card-foreground` | `150 8% 95%` | Text on card surfaces. Matches `--foreground`; use for headings and body text inside cards. | `text-card-foreground` |
| `--popover` | `150 12% 8%` | Overlay/dialog background. Mirrors `--card`; use for `UiDialog`, `UiAlertDialog`, dropdowns, and tooltips. | `bg-popover` |
| `--popover-foreground` | `150 8% 95%` | Text on overlays. Use for all text inside dialogs and popovers. | `text-popover-foreground` |

### Brand & Primary Actions

| Token | Value (HSL channels) | Intended Usage | Tailwind Binding |
|-------|----------------------|----------------|-----------------|
| `--primary` | `150 12% 11%` | Primary brand action fill. Near-black; use for `UiButton` default variant and other primary CTAs. Distinguished from the base by a green accent ring/border + `--shadow-brand` glow, not by fill contrast. | `bg-primary` |
| `--primary-foreground` | `150 8% 96%` | Text on primary actions. Use for button labels and icons on `--primary` fill (~12:1). | `text-primary-foreground` |
| `--brand` | `150 14% 8%` | Brand identity base. Near-black; use for logotype/hero surfaces and as the leading stop of `--gradient-brand`. Not for interactive controls — that is `--primary`. | `bg-brand` |
| `--gradient-brand` | `linear-gradient(135deg, hsl(var(--brand)) 0%, hsl(var(--brand)) 55%, hsl(var(--accent-2)) 100%)` | Near-black → green brand gradient. Black dominates the sweep (0–55%); green appears as the trailing supporting stop. Use for hero tiles, score cards, and primary brand surfaces. | `bg-[var(--gradient-brand)]` or inline `background: var(--gradient-brand)` |

### Accent (Green Anchor)

| Token | Value (HSL channels) | Intended Usage | Tailwind Binding |
|-------|----------------------|----------------|-----------------|
| `--accent` | `152 64% 44%` | Green anchor. Use for highlights, selected/active states, hover surfaces, and decorative emphasis. As text/icon on dark surfaces: ~5:1 (AA). As a large UI fill: ~3:1 boundary. | `bg-accent`, `text-accent` |
| `--accent-foreground` | `150 40% 6%` | Text on accent fill. Dark (~6.5:1 on `--accent`); use for labels/icons placed directly on a green accent background. | `text-accent-foreground` |
| `--accent-2` | `152 64% 44%` | Green secondary gradient stop. Alias of `--accent`; use exclusively as the trailing stop of `--gradient-brand` and for gradient-related utilities. | `bg-accent-2` |
| `--accent-2-foreground` | `150 40% 6%` | Text on `--accent-2` fill. Alias of `--accent-foreground`. | `text-accent-2-foreground` |

### Secondary & Muted Surfaces

| Token | Value (HSL channels) | Intended Usage | Tailwind Binding |
|-------|----------------------|----------------|-----------------|
| `--secondary` | `150 10% 15%` | Low-emphasis surfaces. Use for chips, tags, secondary buttons, and inactive tabs. | `bg-secondary` |
| `--secondary-foreground` | `150 8% 92%` | Text on secondary surfaces. | `text-secondary-foreground` |
| `--muted` | `150 10% 13%` | Muted background. Use for skeleton loaders, disabled surfaces, and subtle divider fills. | `bg-muted` |
| `--muted-foreground` | `150 7% 66%` | Secondary/caption text (~5.4:1 on `--card`). Use for metadata, timestamps, placeholder-adjacent copy, and de-emphasized labels. | `text-muted-foreground` |

### Semantic States

| Token | Value (HSL channels) | Intended Usage | Tailwind Binding |
|-------|----------------------|----------------|-----------------|
| `--success` | `122 55% 50%` | Correct answer / positive feedback. Grass green (~30° hue shift from accent green) reserved solely for correctness/positive semantics. Always pair with a non-color cue (check icon + Indonesian success copy). | `bg-success`, `text-success` |
| `--success-foreground` | `150 40% 6%` | Text on success fill (~7:1 on `--success`). | `text-success-foreground` |
| `--warning` | `38 95% 55%` | Timer urgency / caution. Amber; apply to the `AnswerTimer` when ≤ 5 seconds remain and to any caution messaging. | `bg-warning`, `text-warning` |
| `--warning-foreground` | `40 40% 8%` | Text on warning fill. | `text-warning-foreground` |
| `--destructive` | `0 72% 55%` | Errors / delete / "Salah!". Brightened red for legibility on the dark base. Use for error messages, delete actions, and incorrect-answer feedback. Always pair with a non-color cue (icon + text). | `bg-destructive`, `text-destructive` |
| `--destructive-foreground` | `0 0% 100%` | Text on destructive fill. | `text-destructive-foreground` |

### Borders, Inputs & Focus

| Token | Value (HSL channels) | Intended Usage | Tailwind Binding |
|-------|----------------------|----------------|-----------------|
| `--border` | `150 10% 18%` | Borders and dividers (≥ 3:1 against surfaces). Use for `UiCard` outlines, section dividers, and `UiTable` row borders. | `border-border` |
| `--input` | `150 10% 20%` | Input field borders. Slightly lighter than `--border` to give inputs a distinct boundary. | `border-input` |
| `--ring` | `152 64% 44%` | Focus indicator ring. High-contrast green; use for `focus-visible:ring-ring` on every interactive element to satisfy WCAG AA visible focus. | `ring-ring` |

---

## Typography

Three font families are defined. The stack order ensures graceful degradation if a webfont fails to load.

| Token | Value | Intended Usage | Tailwind Binding |
|-------|-------|----------------|-----------------|
| `--font-display` | `"Clash Display", "Quicksand", sans-serif` | Hero headings, logotype, large brand titles. Use for the `BrandMark` wordmark, hero H1, and display-level text. Quicksand is the live fallback, preserving the existing feel. | `font-display` |
| `--font-sans` | `"Quicksand", ui-sans-serif, system-ui, sans-serif` | Body copy and all UI text. Default for paragraphs, labels, button text, card descriptions, and navigation. | `font-sans` |
| `--font-mono` | `"Space Mono", ui-monospace, "SFMono-Regular", monospace` | Quiz codes, scores, and timers. Use with `tabular-nums` for stable digit alignment. Apply to the 4-char join code, the score display, and the countdown timer. | `font-mono` |

---

## Type Scale

Each heading level exposes three tokens: `size`, `lh` (line-height), and `weight`. Apply all three together for the intended typographic rhythm.

| Level | Token Prefix | Size | Line-height | Weight | Intended Usage |
|-------|-------------|------|-------------|--------|----------------|
| Display | `--text-display-*` | `clamp(2.5rem, 6vw, 3.75rem)` | `1.05` | `800` | Hero heading and brand logotype on the landing page. Fluid between 40px and 60px. |
| Heading 1 | `--text-h1-*` | `1.875rem` (30px) | `1.15` | `800` | Page-level titles (e.g. "Kuis Selesai!", dashboard heading). |
| Heading 2 | `--text-h2-*` | `1.25rem` (20px) | `1.25` | `700` | Section headings inside pages (e.g. question section, stats group). |
| Heading 3 | `--text-h3-*` | `1.05rem` (≈17px) | `1.3` | `700` | Card titles and item headings in lists. |
| Body | `--text-body-*` | `1rem` (16px) | `1.6` | `500` | All body copy, descriptions, and readable prose. |
| Small / Label | `--text-sm-*` | `0.8125rem` (13px) | `1.4` | `600` | Form labels, badges, metadata, secondary captions. Slightly heavier weight keeps small text legible on dark surfaces. |

---

## Spacing

A 4 px base ramp. Tailwind's default spacing scale aligns to 4 px, so these tokens document the canonical steps the redesign uses — keeping layout rhythm consistent across pages without arbitrary values.

| Token | Value | px equivalent | Intended Usage |
|-------|-------|---------------|----------------|
| `--space-1` | `0.25rem` | 4px | Icon gap, tight internal padding |
| `--space-2` | `0.5rem` | 8px | Inline element gap, small padding |
| `--space-3` | `0.75rem` | 12px | Input internal padding (vertical), chip padding |
| `--space-4` | `1rem` | 16px | Standard component padding, form field gap |
| `--space-5` | `1.25rem` | 20px | Card inner padding (compact) |
| `--space-6` | `1.5rem` | 24px | Card inner padding (default), section gap |
| `--space-7` | `2rem` | 32px | Section padding, between-card gap |
| `--space-8` | `2.5rem` | 40px | Page section vertical spacing |
| `--space-9` | `3rem` | 48px | Page top/bottom padding (mobile) |
| `--space-10` | `3.5rem` | 56px | Hero vertical padding |
| `--space-11` | `3.75rem` | 60px | Large hero spacer |
| `--space-12` | `4rem` | 64px | Max hero/content top padding |

---

## Radius

| Token | Value | Intended Usage | Tailwind Binding |
|-------|-------|----------------|-----------------|
| `--radius-sm` | `0.5rem` (8px) | Small elements: badges, chips, tags, and icon containers. | — |
| `--radius-md` | `0.75rem` (12px) | Inputs (`UiInput`) and small cards. | — |
| `--radius-lg` | `1rem` (16px) | Default radius for cards, dialogs, and dropdowns. | `rounded-lg` |
| `--radius-xl` | `1.5rem` (24px) | Large cards and prominent surfaces (score card, hero join card). | `rounded-xl` |
| `--radius-pill` | `9999px` | Pill/badge shapes and fully rounded buttons. | `rounded-full` |
| `--radius` | `var(--radius-lg)` | Legacy alias retained for shadcn-vue compatibility. Maps to `--radius-lg`. Do not use directly in new code; prefer `--radius-lg` or the named Tailwind class. | `rounded-lg` (via shadcn) |

---

## Elevation

Shadows are tuned for the dark base: deep near-black drops create depth; `--shadow-brand` adds a low-alpha green edge glow around primary actions.

| Token | Value | Intended Usage | Tailwind Binding |
|-------|-------|----------------|-----------------|
| `--shadow-sm` | `0 1px 2px 0 hsl(150 14% 3% / 0.5)` | Subtle elevation for small elements: inline chips, small tooltips. | `shadow-sm` |
| `--shadow-md` | `0 4px 16px 0 hsl(150 14% 3% / 0.6)` | Standard card elevation: `UiCard`, dropdowns, popovers. Default elevation for content surfaces. | `shadow-md` |
| `--shadow-lg` | `0 8px 32px 0 hsl(150 14% 3% / 0.7)` | High elevation: modals/dialogs, overlays, full-screen sheets. | `shadow-lg` |
| `--shadow-brand` | `0 0 0 1px hsl(152 64% 44% / 0.3), 0 4px 24px 0 hsl(152 64% 44% / 0.15)` | Primary button / brand surface glow. A 1px green edge ring plus a soft green halo. Apply to the default `UiButton` and prominent brand tiles so the near-black primary action is distinct on the dark base. | `shadow-brand` |

---

## Motion

All transitions and animations must reference these tokens. Pair a duration token with an easing token; do not mix ad-hoc values. A global `@media (prefers-reduced-motion: reduce)` rule in `assets/css/tailwind.css` neutralizes non-essential motion when the user's system requests it.

### Durations

| Token | Value | Intended Usage | Tailwind Binding |
|-------|-------|----------------|-----------------|
| `--motion-fast` | `120ms` | Press/active micro-feedback: button scale-down on click, option tap response. | `duration-fast` |
| `--motion-base` | `200ms` | Hover states, color transitions, opacity fades. Default for most interactive elements. | `duration-base` |
| `--motion-slow` | `400ms` | Larger state changes: leaderboard row reorder, page-level entrance animations, result card reveal. | `duration-slow` |

### Easing Curves

| Token | Value | Intended Usage | Tailwind Binding |
|-------|-------|----------------|-----------------|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default easing for all hover, focus, and color transitions. Mirrors Material Design's standard curve — accelerates quickly, decelerates gently. | `ease-standard` |
| `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1)` | Entrances and celebratory moments: result card entrance, success feedback reveal. Starts fast, lingers on arrival. | `ease-emphasized` |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Selection and pop micro-interactions: answer option select, checkbox tick, active tab indicator. Overshoots slightly for a tactile feel. | `ease-spring` |

---

## Semantic Usage Guidelines

These rules encode the intent behind the token system. Following them ensures the visual language stays coherent and accessible across all pages.

### Color Pairing Rules

**Always pair semantic colors with a non-color cue.**
- `--success` (correct answer / positive) → always accompany with a check icon and/or Indonesian success copy (e.g. "Benar!"). Never rely on green alone to communicate correctness (Requirement 10.5).
- `--destructive` (error / "Salah!" / delete) → always accompany with an ✕ icon and/or error text. Never rely on red alone.
- `--warning` (timer urgency) → pair the amber color change with the countdown number; the numerical value is the non-color cue.

**Keep accent green and success green visually distinct.**
`--accent` (hue ≈152, lightness 44%) is the UI anchor: focus rings, selected tabs, active states, hover fills, and the gradient stop. `--success` (hue ≈122, lightness 50%) is reserved exclusively for correct-answer/positive feedback. The ~30° hue shift and different lightness keep them distinguishable. Do not repurpose `--accent` for correctness feedback, and do not use `--success` as a decorative accent.

**Near-black is the brand color — not a neutral.**
`--brand`, `--primary`, and `--background`/`--card` are all near-black, but each plays a different role. `--primary` is for interactive controls (buttons, CTAs). `--brand` is for logotype and hero surfaces. `--background`/`--card` are for layout surfaces. Do not interchange them.

**`--primary` needs a visual edge on dark backgrounds.**
Because `--primary` is near-black on a near-black base, it must always carry either a `--border`/`--accent` ring or `--shadow-brand` to remain visually distinct as an interactive control. Never render a `--primary` button without at least one of these differentiators.

### Typography Rules

**Match font family to content role.**
- `font-display` → hero/logotype only. Do not use for body text or form labels.
- `font-mono` → quiz codes (4-char join codes), scores, and timers. Always apply `tabular-nums` alongside `font-mono` to prevent digit-width jitter during countdowns.
- `font-sans` → everything else.

**Use the full token triplet for each level.**
Each type scale level has `size`, `lh`, and `weight` tokens. Apply all three; using only `size` without the intended `lh`/`weight` breaks the hierarchy rhythm.

### Spacing Rules

**Stick to the ramp — no one-off values.**
All padding, gap, and margin values must map to a `--space-*` step or the equivalent Tailwind spacing utility (which aligns to the same 4px grid). Avoid arbitrary pixel values like `p-[13px]` or `mt-[7px]`.

**Touch targets on mobile must be ≥ 44×44 CSS px.**
Primary interactive elements (buttons, answer options, tab items) must use at least `h-12` (48px) on mobile viewports to meet Requirement 9.2. Pair with sufficient horizontal padding from the spacing ramp.

### Elevation Rules

**Use the right shadow tier.**
- Inline chips, tags → `shadow-sm`
- Cards, dropdowns, popovers → `shadow-md`
- Modals, dialogs, overlays → `shadow-lg`
- Primary brand buttons and brand tiles → `shadow-brand`

Do not apply `shadow-brand` to non-interactive or non-brand surfaces — it creates false visual hierarchy.

### Motion Rules

**Every transition needs both a duration and an easing.**
Pair tokens explicitly: fast interactions use `--motion-fast` + `--ease-spring`; standard hover/focus use `--motion-base` + `--ease-standard`; larger entrances use `--motion-slow` + `--ease-emphasized`.

**Respect `prefers-reduced-motion`.**
The global reduced-motion rule in `assets/css/tailwind.css` handles non-essential animations. For JavaScript-driven animations (e.g. leaderboard reorder via FLIP), check `window.matchMedia('(prefers-reduced-motion: reduce)')` and skip or sharply shorten the animation (Requirement 11.5).

**Reserve spring easing for selection feedback.**
`--ease-spring` overshoots. It is intentional for answer option pops and checkbox ticks — it is jarring on page transitions or hover states. Use `--ease-standard` for hover/focus and `--ease-emphasized` for entrances.

### Accessibility Checklist

When implementing any interactive element, verify:
- [ ] Focus state uses `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` (or equivalent)
- [ ] Text on `--background` or `--card` uses `--foreground` or `--card-foreground` (≥ 14:1)
- [ ] Text on `--accent` uses `--accent-foreground` (≥ 6.5:1)
- [ ] Text on `--success` uses `--success-foreground` (≥ 7:1)
- [ ] Text on `--destructive` uses `--destructive-foreground` (≥ 4.5:1)
- [ ] `--muted-foreground` text is used only for secondary/non-critical copy (≥ 5.4:1 on `--card`)
- [ ] Every semantic color cue (success, error, warning) is accompanied by an icon or text cue
- [ ] Form inputs are associated with a `UiLabel` via `for`/`id`
- [ ] Primary actions are ≥ 44×44 CSS px on mobile viewports
