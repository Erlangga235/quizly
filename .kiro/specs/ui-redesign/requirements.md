# Requirements Document

## Introduction

Quizly is a real-time, code-based, Kahoot-style quiz application built with Nuxt 3, TypeScript, and Tailwind CSS, using shadcn-vue (`new-york` style) components auto-prefixed as `Ui*`. All user-facing copy is in Indonesian. This feature delivers a complete visual and experiential redesign of every user-facing page while preserving all existing behavior, data flows, server interactions, and Indonesian UI strings.

The redesign establishes a distinctive, cohesive, production-grade visual identity that avoids generic AI aesthetics. It introduces a centralized design system (design tokens for color, typography, spacing, radius, elevation, and motion) applied consistently across all pages and shared `Ui*` components. The redesign covers the landing/join page (`/`), the admin login/register page (`/admin/login`), the admin dashboard (`/admin`), the quiz editor (`/admin/quiz/[id]`), the gameplay screen (`/quiz/[id]`), and the player result/leaderboard screen (`/quiz/[id]/result`). The work is explicitly a visual and UX redesign, not a behavior change.

This effort emphasizes responsive layouts (players frequently join on mobile), accessibility (color contrast, visible focus states, keyboard navigation), and engaging dynamic visuals for timed gameplay and the live leaderboard.

## Glossary

- **Quizly**: The overall quiz web application being redesigned.
- **Design_System**: The centralized set of design tokens, typography scale, component styling conventions, and motion guidelines that define Quizly's visual identity.
- **Design_Token**: A named, reusable value (color, typography, spacing, radius, elevation, motion duration/easing) defined once and referenced across pages and components.
- **Theme_Variable**: A CSS custom property (e.g., `--primary`, `--background`) declared in `assets/css/tailwind.css` and consumed by Tailwind and components.
- **Ui_Component**: A shared shadcn-vue component under `~/components/ui/`, auto-prefixed as `Ui*` (e.g., `UiButton`, `UiInput`, `UiCard`, `UiDialog`, `UiTable`, `UiAlertDialog`, `UiLabel`).
- **Landing_Page**: The page at route `/` (`pages/index.vue`) containing the hero and join-by-code form.
- **Login_Page**: The page at route `/admin/login` (`pages/admin/login.vue`) with the login/register toggle.
- **Admin_Dashboard**: The page at route `/admin` (`pages/admin/index.vue`) listing the admin's quizzes.
- **Quiz_Editor**: The page at route `/admin/quiz/[id]` (`pages/admin/quiz/[id].vue`) for editing a quiz, its questions, and viewing participants.
- **Gameplay_Page**: The page at route `/quiz/[id]` (`pages/quiz/[id]/index.vue`) where players answer timed questions.
- **Result_Page**: The page at route `/quiz/[id]/result` (`pages/quiz/[id]/result.vue`) showing a player's score and the live leaderboard.
- **Leaderboard**: The ranked list of participants displayed on the Result_Page, updated in real time via Supabase Realtime.
- **Answer_Timer**: The visual countdown indicator shown during a question on the Gameplay_Page.
- **Player**: A non-authenticated user who joins a quiz with a code and answers questions.
- **Admin**: An authenticated user who creates and manages quizzes.
- **Micro_Interaction**: A small, purposeful animation or visual response triggered by user action (hover, press, selection, state change).
- **Focus_Indicator**: A visible visual treatment applied to an interactive element when it receives keyboard focus.
- **Breakpoint**: A defined viewport width threshold at which layout adapts (mobile, tablet, desktop).
- **WCAG_AA**: The Web Content Accessibility Guidelines 2.1 Level AA conformance criteria referenced for contrast and interaction.

## Requirements

### Requirement 1: Centralized Design System and Tokens

**User Story:** As a developer, I want a centralized design system with named tokens, so that the new visual identity is applied consistently and can be maintained from a single source.

#### Acceptance Criteria

1. THE Design_System SHALL define color Design_Tokens for background, foreground, primary, secondary, accent, muted, destructive, border, input, and ring as Theme_Variables in `assets/css/tailwind.css`.
2. THE Design_System SHALL define typography Design_Tokens specifying a heading typeface, a body typeface, and a numeric/monospace treatment for codes and scores.
3. THE Design_System SHALL define Design_Tokens for spacing scale, border radius, and elevation (shadow) levels.
4. THE Design_System SHALL define motion Design_Tokens specifying standard durations and easing curves for transitions and Micro_Interactions.
5. WHERE a page or Ui_Component applies color, typography, spacing, radius, elevation, or motion, THE Quizly application SHALL reference Design_Tokens rather than ad-hoc hardcoded values.
6. THE Design_System SHALL document each Design_Token with its name and intended usage in a location within the repository.

### Requirement 2: Distinctive Visual Identity

**User Story:** As a product owner, I want a bold, cohesive, production-grade visual identity, so that Quizly feels distinctive rather than generic.

#### Acceptance Criteria

1. THE Design_System SHALL define an intentional color palette with a primary brand color, at least one supporting accent color, and defined semantic colors for success and error states.
2. THE Design_System SHALL define a typographic hierarchy with at least three distinct heading levels and one body level, each with specified size, weight, and line-height tokens.
3. THE Landing_Page SHALL present an atmospheric background treatment that uses Design_Tokens and is consistent with the defined visual identity.
4. THE Quizly application SHALL apply the same color palette, typography hierarchy, and background treatment conventions across all six redesigned pages.
5. WHERE a brand mark or logotype is displayed, THE Quizly application SHALL render it using the Design_System typography and color tokens.

### Requirement 3: Landing and Join Page Redesign

**User Story:** As a Player, I want an inviting and clear landing page, so that I can join a quiz quickly with a code and my name.

#### Acceptance Criteria

1. THE Landing_Page SHALL display a hero section, a name input field, a quiz code input field, and a primary join action using the Design_System.
2. THE Landing_Page SHALL retain the existing Indonesian strings for the hero heading, field labels ("Nama Kamu", "Kode Kuis"), placeholders, and the join button ("Mulai Kuis").
3. WHEN a Player submits the join form with a non-empty name and a non-empty code, THE Landing_Page SHALL invoke the existing join behavior that resolves the code via `POST /api/play/join` and navigates to `/quiz/{id}`.
4. WHILE the join request is in progress, THE Landing_Page SHALL display the existing "Menghubungkan..." loading indication and disable the join action.
5. IF the submitted code cannot be resolved, THEN THE Landing_Page SHALL display the existing Indonesian error message "Kode kuis tidak ditemukan." using the Design_System error styling.
6. THE Landing_Page SHALL display a navigation affordance to the admin area using the existing Indonesian string "Masuk sebagai Admin".

### Requirement 4: Admin Login and Register Redesign

**User Story:** As an Admin, I want a polished login and registration screen, so that I can authenticate and toggle between modes with clarity.

#### Acceptance Criteria

1. THE Login_Page SHALL display a username field, a password field, and a primary submit action styled with the Design_System.
2. WHILE the page is in login mode, THE Login_Page SHALL display the Indonesian login headings, descriptions, and the submit label "Masuk".
3. WHILE the page is in register mode, THE Login_Page SHALL display the Indonesian register headings, descriptions, and the submit label "Buat Akun".
4. WHEN the Admin activates the mode toggle, THE Login_Page SHALL switch between login and register modes and clear the displayed error message.
5. WHEN the Admin submits valid credentials, THE Login_Page SHALL invoke the existing authentication behavior against `/api/auth/login` or `/api/auth/register` and navigate to `/admin` on success.
6. IF authentication fails, THEN THE Login_Page SHALL display the returned Indonesian error message using the Design_System error styling.

### Requirement 5: Admin Dashboard Redesign

**User Story:** As an Admin, I want a clear and attractive dashboard, so that I can view and manage my quizzes efficiently.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display a header with the Indonesian greeting, a create-quiz action ("+ Buat Kuis Baru"), and a logout action ("Keluar").
2. WHILE the Admin has at least one quiz, THE Admin_Dashboard SHALL display each quiz as a card showing the title, question count, participant count, quiz code, and creation date using the Design_System.
3. WHILE the Admin has no quizzes, THE Admin_Dashboard SHALL display the existing empty-state content with the Indonesian strings "Belum ada kuis" and the supporting description.
4. WHEN the Admin confirms creating a quiz with a non-empty title, THE Admin_Dashboard SHALL invoke the existing create behavior via `POST /api/admin/quizzes` and navigate to the new quiz editor.
5. WHEN the Admin confirms editing a quiz title, THE Admin_Dashboard SHALL invoke the existing update behavior via `PATCH /api/admin/quizzes/{id}` and refresh the quiz list.
6. WHEN the Admin confirms deleting a quiz, THE Admin_Dashboard SHALL invoke the existing delete behavior via `DELETE /api/admin/quizzes/{id}` and refresh the quiz list.
7. THE Admin_Dashboard SHALL render its create, edit, and delete dialogs using the redesigned `UiDialog` and `UiAlertDialog` components while retaining their existing Indonesian strings.

### Requirement 6: Quiz Editor Redesign

**User Story:** As an Admin, I want a refined quiz editor, so that I can manage questions, options, settings, and participants in a clear layout.

#### Acceptance Criteria

1. THE Quiz_Editor SHALL display the quiz title, the quiz code with a copy action, and the leaderboard visibility toggle using the Design_System.
2. THE Quiz_Editor SHALL display the statistics summary for question count, participant count, average score, and highest score using the Design_System.
3. THE Quiz_Editor SHALL display the option-count selector, the "Soal" tab, and the "Peserta" tab, retaining their existing Indonesian labels.
4. WHILE the "Soal" tab is active, THE Quiz_Editor SHALL display the list of existing questions with their options and an add-question form.
5. WHEN the Admin submits the add-question form with a non-empty question text, THE Quiz_Editor SHALL invoke the existing behavior via `POST /api/admin/quizzes/{id}/questions` and refresh the question list.
6. WHEN the Admin marks an option as correct in the add-question form, THE Quiz_Editor SHALL visually indicate exactly one correct option using the Design_System success styling.
7. WHEN the Admin confirms deleting a question, THE Quiz_Editor SHALL invoke the existing behavior via `DELETE /api/admin/questions/{id}` and refresh the question list.
8. WHEN the Admin toggles leaderboard visibility, THE Quiz_Editor SHALL invoke the existing behavior via `PATCH /api/admin/quizzes/{id}` and reflect the new state visually.
9. WHEN the Admin activates the copy-code action, THE Quiz_Editor SHALL copy the quiz code and display the existing "Tersalin!" confirmation for the existing duration.
10. WHILE the "Peserta" tab is active, THE Quiz_Editor SHALL display the participant ranking in a redesigned `UiTable` retaining the existing Indonesian column headers.

### Requirement 7: Gameplay Screen Redesign

**User Story:** As a Player, I want an engaging and legible gameplay screen, so that I can read questions, track time, and answer confidently.

#### Acceptance Criteria

1. THE Gameplay_Page SHALL display the current question number and total ("Soal X/Y"), the running score, the Answer_Timer, and a progress indicator using the Design_System.
2. THE Gameplay_Page SHALL display the current question text and its answer options as distinct, tappable targets using the Design_System.
3. WHILE a question is active, THE Answer_Timer SHALL visually represent the remaining time and update each second.
4. WHEN the remaining time is at or below 5 seconds, THE Answer_Timer SHALL apply the Design_System urgency styling.
5. WHEN a Player selects an option, THE Gameplay_Page SHALL invoke the existing validation behavior via `POST /api/check-answer` and display the result feedback.
6. WHEN the selected answer is correct, THE Gameplay_Page SHALL display the existing Indonesian success feedback including the earned points using the Design_System success styling.
7. IF the selected answer is incorrect, THEN THE Gameplay_Page SHALL display the existing Indonesian "Salah!" feedback using the Design_System error styling.
8. WHEN the final question is completed, THE Gameplay_Page SHALL invoke the existing finish behavior via `POST /api/play/{id}/finish` and navigate to the Result_Page.
9. WHILE questions are loading, THE Gameplay_Page SHALL display a loading indication styled with the Design_System.

### Requirement 8: Result and Live Leaderboard Redesign

**User Story:** As a Player, I want a celebratory result screen with a dynamic live leaderboard, so that I can see my score and standing in real time.

#### Acceptance Criteria

1. THE Result_Page SHALL display a completion heading, the Player's name, and the Player's final score prominently using the Design_System.
2. THE Result_Page SHALL retain the existing Indonesian strings for the completion heading ("Kuis Selesai!"), the score label ("Skor Anda"), and the back action ("Kembali ke Beranda").
3. WHILE the quiz leaderboard is visible, THE Result_Page SHALL display the ranked Leaderboard with each participant's rank, name, and score using the Design_System.
4. THE Result_Page SHALL visually distinguish the current Player's entry within the Leaderboard.
5. THE Result_Page SHALL visually distinguish the top three ranks within the Leaderboard using the Design_System.
6. WHEN a new or updated participant result is received via Supabase Realtime, THE Result_Page SHALL refresh the Leaderboard and reflect the change with a Micro_Interaction.
7. WHILE the leaderboard is visible, THE Result_Page SHALL display the existing "LIVE" status indicator.
8. WHILE the quiz leaderboard is hidden, THE Result_Page SHALL display the existing Indonesian message "Papan peringkat disembunyikan oleh admin."

### Requirement 9: Responsive Layout

**User Story:** As a Player or Admin, I want the interface to adapt to my device, so that I can use Quizly comfortably on mobile and desktop.

#### Acceptance Criteria

1. THE Quizly application SHALL define Breakpoints for mobile, tablet, and desktop viewport widths.
2. WHILE the viewport width is at or below the mobile Breakpoint, THE Landing_Page, Login_Page, and Result_Page SHALL present a single-column layout with touch targets of at least 44 by 44 CSS pixels for primary interactive elements.
3. WHILE the viewport width is at or above the desktop Breakpoint, THE Admin_Dashboard SHALL present the quiz list in a multi-column grid.
4. WHILE the viewport width is at or above the desktop Breakpoint, THE Quiz_Editor SHALL present the question list and the add-question form in a multi-column arrangement.
5. WHILE the viewport width is at or below the mobile Breakpoint, THE Gameplay_Page SHALL present the question and options without horizontal scrolling.
6. THE Quizly application SHALL render all six redesigned pages without content overflow or clipping at the mobile, tablet, and desktop Breakpoints.

### Requirement 10: Accessibility

**User Story:** As a user relying on assistive technology or keyboard navigation, I want accessible interactions and legible contrast, so that I can use Quizly effectively.

#### Acceptance Criteria

1. THE Design_System SHALL define foreground and background color pairings that meet the WCAG_AA contrast ratio of at least 4.5 to 1 for normal-size text.
2. WHEN an interactive element receives keyboard focus, THE Quizly application SHALL display a visible Focus_Indicator using the Design_System.
3. THE Quizly application SHALL allow keyboard navigation to reach and activate every primary interactive element on each redesigned page in a logical order.
4. WHERE an interactive control conveys meaning through an icon alone, THE Quizly application SHALL provide an accessible text label for that control.
5. WHEN answer feedback indicates correctness on the Gameplay_Page, THE Gameplay_Page SHALL convey correctness through a text or icon cue in addition to color.
6. THE Quizly application SHALL associate each form input on the Landing_Page, Login_Page, and Quiz_Editor with a programmatic label.

### Requirement 11: Motion and Micro-Interactions

**User Story:** As a user, I want purposeful motion and feedback, so that the experience feels dynamic and responsive without being distracting.

#### Acceptance Criteria

1. WHEN a user hovers or presses a primary action, THE Quizly application SHALL provide a Micro_Interaction defined by the Design_System motion tokens.
2. WHEN a route transition occurs, THE Quizly application SHALL apply a page transition consistent with the Design_System motion tokens.
3. WHEN a Player selects an answer option, THE Gameplay_Page SHALL animate the selected option's state change using the Design_System motion tokens.
4. WHEN the Leaderboard reorders, THE Result_Page SHALL animate ranking changes using the Design_System motion tokens.
5. WHERE the user's system indicates a reduced-motion preference, THE Quizly application SHALL minimize non-essential animation.

### Requirement 12: Shared Component Restyling

**User Story:** As a developer, I want the shared `Ui*` components restyled to the new design system, so that the redesign is consistent everywhere those components appear.

#### Acceptance Criteria

1. THE Quizly application SHALL restyle the shared `Ui_Component` set used across pages, including `UiButton`, `UiInput`, `UiLabel`, `UiCard`, `UiDialog`, `UiAlertDialog`, and `UiTable`, to reference Design_Tokens.
2. WHERE a page uses a shared `Ui_Component`, THE Quizly application SHALL render that component with the redesigned styling without altering the component's existing props or behavior.
3. THE Quizly application SHALL preserve the existing variant and size options of `UiButton` while applying the redesigned styling.

### Requirement 13: Functional and Content Preservation

**User Story:** As a product owner, I want all existing behavior and Indonesian copy preserved, so that the redesign changes only the look and feel.

#### Acceptance Criteria

1. THE Quizly application SHALL preserve every existing route, server API interaction, and client-side data flow described for the six redesigned pages.
2. THE Quizly application SHALL preserve all existing Indonesian UI strings across the six redesigned pages, except where a string is intentionally restyled without changing its meaning.
3. THE Quizly application SHALL preserve the existing authentication flow, including `localStorage` token handling and the `admin-auth` route middleware behavior.
4. THE Quizly application SHALL preserve the existing scoring display, where a correct answer shows the earned points consistent with the server-side scoring of `1000 + (time_left * 10)`.
5. WHEN the redesign is complete, THE Quizly application SHALL build successfully using the existing `npm run build` command.
6. THE Quizly application SHALL retain the existing author attribution link rendered in `app.vue`.
