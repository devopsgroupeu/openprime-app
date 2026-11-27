# DESIGN.md - frontend design guide for agents (`openprime-app`)

Read this before you add or change any page, component, dialog, menu or string. It says how the UI
looks and behaves today, so new work matches it. The UI was aligned to the openprime-ai web app
(same shell, tokens and shadcn components) in November 2026.

## 1. Purpose, how to use this file, precedence

- Every class, token value, size and prop below is copied from the file named next to it; open that
  file before you build. Paths are relative to the repo root (`@/` is `src/`); short component paths
  such as `ui/button.jsx` are relative to `src/components/`.
- Find your surface in section 4 (layout) or 6 (patterns), reuse the component of section 5, check
  copy against section 7, then run sections 8 and 11.
- What to build: decisions D-1 to D-15 (section 2) are binding; do not reopen them in a feature.
- How it is built: the code wins. If this file and the code disagree, follow the code and fix this
  file in the same change. If the code contradicts a decision, follow the code and report it
  (section 10); never "fix" it on the side.
- If nothing here or in the code answers your question, stop and ask. Never invent a token, size,
  component, icon set or pattern.

## 2. Principles

Users are engineers setting up AWS infrastructure. The UI must feel calm, dense and obvious.

1. One next step per region: `--primary` marks only the forward action (primary button, sendable
   Send, a switch that is on, the selected radio card, the current wizard step).
2. Same anatomy everywhere: one shell, page header, card, row group, dialog, menu and empty state.
3. Dense but calm: 13 px text, 32 px controls, 28 px nav rows, hairline rings, motion only for state.
4. Honest states: a status is the last job's outcome; what is not built or not used yet says so.
5. Never a dead end: every empty, filtered or failed state has one recovery action; errors keep the
   server's message and its Error ID.
6. Technical values (ids, regions, prefixes, URLs) are visible but secondary: `font-mono text-xs`,
   with a copy button where people need them.

| Id   | Decision (do not reopen)                                                                                                                                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1  | Every signed-in screen is a page of the one shell (`AppLayout`: sidebar, top bar, content area). Only the content area changes; the wizard, the catalog wait, Not found and a page crash render inside it. Only the screens before sign-in are full screen (`FullScreenState`).   |
| D-2  | The sidebar is always there, a neutral grey from the page ramp (`--sidebar`), never a brand tint. Users may hide it (offcanvas, Cmd/Ctrl+B); below md it is a Sheet. While hidden, the top bar shows "Show sidebar" and "New environment".                                        |
| D-3  | The wizard is a normal shell page (`/environments/create`, `/environments/:id/edit`) with no top bar of its own: draft status, Start over, Aura and Cancel go into the shell top bar through `TopBarActions`.                                                                     |
| D-4  | The cover gradient (`CoverGradient`) is the only decorative gradient: environment cards and the detail header, picked from the environment id, decorative only. Its round provider avatar is 40 px so the AWS wordmark stays legible.                                             |
| D-5  | Logos are official files, never recolored: chart and git logos only through `LogoTile` on the white `--logo-tile`, AWS services through `ServiceIcon`, providers through `ProviderIcon`. Sources and terms: `public/assets/chart-logos/README.md`.                                |
| D-6  | Aura is shown with the OpenPrime AI mark (`AuraMark`), the brand file unchanged, animated only while Aura answers. No filled teal Aura surface, no white mark.                                                                                                                    |
| D-7  | The backend contract is fixed: UI work adds no endpoint and no payload field. UX additions (search, filters, sort, detail tabs, palette, copy buttons, type-to-confirm, unsaved guard) are frontend-only.                                                                         |
| D-8  | Helm custom values are saved (`services.<k8s>.helmCharts.<chart>.values` plus `customValues: true`) but generated repositories do not apply them yet. Every surface that shows them says so.                                                                                      |
| D-9  | Roadmap items are disabled cards with a "Roadmap" badge, never working controls: the Azure, Google Cloud and On-premises provider cards and the eight industry and compliance presets.                                                                                            |
| D-10 | A status is the outcome of the last job: Ready, Failed, Not generated, Processing (`statusDisplay`). OpenPrime generates code and never deploys: no "Running" or "Deployed".                                                                                                      |
| D-11 | One job at a time per environment page (generate, push or the ZIP download); Push asks first; a failure shows in the inline job Callout with Try again, never also in a toast. The primary button is "Generate repository" for Not generated and Failed, "Edit" otherwise.        |
| D-12 | Deleting an environment is type-to-confirm and says what is not touched (AWS resources, the state bucket, code already pushed).                                                                                                                                                   |
| D-13 | Create is allowed with incomplete delivery; Review says what stays unavailable. A git or state-backend section switched on with an empty required field is a Basics error. Edit mode locks the name and resource prefix; an existing state bucket can only change to another one. |
| D-14 | Breadcrumbs only from depth 2 (detail, wizard); list and settings pages have none; below sm the first crumb is dropped.                                                                                                                                                           |
| D-15 | No illustrations in empty states, no emoji anywhere in the UI.                                                                                                                                                                                                                    |

## 3. Tokens

### 3.1 Token files

| File                       | Holds                                                                                                                                                    | Rule                                                                                                                                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/styles/fonts.css`     | Inter and JetBrains Mono `@font-face` (latin, latin-ext) from `@fontsource-variable`                                                                     | Self-hosted: the production CSP allows `font-src 'self' data:`. Never import a font CDN.                                                                                                                                 |
| `src/index.css`            | Tailwind layers, colors (`:root`, `.dark`), radius, shadows, tracking, base layer, scrollbars, reduced motion                                            | Keep token names stable; `src/styles/__tests__/tokens-contrast.test.js` asserts the AA pairs.                                                                                                                            |
| `src/styles/motion.css`    | `--dur-fast` 120 ms, `--dur-base` 180 ms, `--dur-slow` 240 ms, `--ease-out`, `--ease-in`, entrance and stagger, overlay timings by `data-slot`           | New motion tokens go here.                                                                                                                                                                                               |
| `src/styles/ui-tokens.css` | Warning and info, `text-sm` remap (13 px), `text-md` (14 px), content widths, `--logo-tile`, ring and button shadows, chat type scope, `.cover-gradient` | An isolated Tailwind root that emits only the utilities in its `@source inline(...)` lines (`text-md` with `sm:` `md:` `lg:` `max-md:` `max-sm:`; warning and info at `/5` to `/80`). Add a missing variant there first. |
| `src/lib/utils.js`         | `cn()` (tailwind-merge knows `text-md`), `TOUCH_HIT`                                                                                                     | Always merge classes with `cn()`.                                                                                                                                                                                        |

Import order is fixed in `src/index.jsx`: fonts, index, motion, ui-tokens (last). Non-scale values
are variables, never literals: `max-w-(--content-settings)`, `max-w-(--content-detail)`,
`sm:max-w-(--palette-width)`, `shadow-(--shadow-ring-xs)`, `bg-(--logo-tile)`. `--chart-1` to
`--chart-5` and `--table-max-height` are defined but unused (no charts, no tables).

### 3.2 Color roles

One cool neutral ramp (OKLCH hue 264); elevation background < card < popover < accent (hover).

| Token                               | Light                                              | Dark                                               | Use                                                   |
| ----------------------------------- | -------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| `--background`                      | `oklch(0.982 0.002 264)`                           | `oklch(0.215 0.005 264)`                           | Page canvas                                           |
| `--card`                            | #ffffff                                            | `oklch(0.26 0.005 264)`                            | Cards, dialogs, sheets, row groups                    |
| `--popover`                         | #ffffff                                            | `oklch(0.285 0.005 264)`                           | Menus, select lists, toasts, Aura window              |
| `--secondary`                       | `oklch(0.962 0.003 264)`                           | `oklch(0.305 0.005 264)`                           | Secondary buttons, select triggers, active filter tab |
| `--muted`                           | `oklch(0.962 0.003 264)`                           | `oklch(0.3 0.005 264)`                             | Tiles, skeletons, tags, previews, code blocks         |
| `--accent`                          | `oklch(0.945 0.004 264)`                           | `oklch(0.345 0.006 264)`                           | Hover and highlighted rows                            |
| `--border` / `--input`              | `oklch(0.912 0.005 264)` / `oklch(0.64 0.008 264)` | `oklch(0.335 0.006 264)` / `oklch(0.57 0.008 264)` | Hairlines / field boundary (>= 3:1), dashed boxes     |
| `--foreground`                      | `oklch(0.215 0.006 264)`                           | `oklch(0.945 0.003 264)`                           | Text, also on every tint                              |
| `--muted-foreground`                | `oklch(0.51 0.008 264)`                            | `oklch(0.73 0.006 264)`                            | Descriptions, meta, placeholders                      |
| `--primary` / `--ring`              | #1e7366                                            | #35b0a0                                            | Forward action, focus; foreground #ffffff / #04312c   |
| `--destructive`                     | #dc2626                                            | #f87171                                            | Destructive; foreground #ffffff / #f8fafc             |
| `--warning` / `--info`              | `oklch(0.52 0.125 60)` / `oklch(0.51 0.2 268)`     | `oklch(0.85 0.135 82)` / `oklch(0.7 0.17 265)`     | Amber / blue-indigo                                   |
| `--sidebar` / `-accent` / `-border` | `oklch(0.945 0.003 264)` / L `0.88` / L `0.912`    | `oklch(0.24 0.005 264)` / L `0.32` / L `0.28`      | Sidebar surface / hover and active row / separators   |
| `--sidebar-foreground` / `-ring`    | `--foreground` / #1e7366                           | `--foreground` / #35b0a0                           | Rows at `/80`, labels at `/70`; sidebar focus         |
| `--logo-tile`                       | `oklch(1 0 0)`                                     | `oklch(1 0 0)`                                     | Logo tiles, white in both themes                      |
| `--provider-{aws,azure,gcp}`        | #d97706 / #0078d4 / #1e8e3e                        | same                                               | Region map dots when environments span providers      |

Recipes: hover `bg-accent` (cards `hover:bg-accent/40`, rows `hover:bg-muted/40`); quiet fills
`bg-muted`, `bg-muted/30` (open rows), `bg-muted/40` (code), `bg-muted/60` (previews); success
`bg-primary/10 text-primary`; warning `bg-warning/10` with a `text-warning` icon; info
`bg-info/10 ring-info/20` with a `text-info` icon; destructive `bg-destructive/10` with a
`text-destructive` icon; scrim `bg-black/15 dark:bg-black/60` (overlays only); inverted
`bg-foreground text-background` (tooltips only). On every tint the text stays `text-foreground`: red
text on a red tint fails AA (`src/styles/__tests__/destructive-tint-labels.test.jsx`).

Never: hex or `rgb()`, raw palette classes (`bg-red-500`), `text-white`, `bg-black` without opacity,
`text-[13px]`, `transition-all`, inline `style={{ color }}`. Color never carries meaning alone.

### 3.3 Typography

Inter (`font-sans`) for UI, JetBrains Mono (`font-mono`) for ids, regions, URLs, YAML and JSON.

| Role                                                                       | Classes                                                           |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| UI body: buttons, inputs, menu items, nav rows, row titles                 | `text-sm` (13 / 18 px)                                            |
| Meta, badges, tooltips, row and card descriptions, stat labels (the floor) | `text-xs` (12 / 16 px)                                            |
| Card titles, route tabs, Helm category names, empty-state titles           | `text-md` (14 / 20 px)                                            |
| Dialog title, section H2 (`SettingsSection`)                               | `text-base font-medium`                                           |
| Stat value / page H1                                                       | `text-lg font-semibold tabular-nums` / `text-xl font-semibold`    |
| Aura messages                                                              | `text-sm` inside `[data-slot="chat-thread"]`, remapped to 14 / 24 |
| Inputs below md (no iOS zoom)                                              | `text-base md:text-sm` (Aura composer `md:text-md`)               |

`font-medium` for buttons, labels and titles, `font-semibold` for H1, card names, stat values and
the Aura greeting's "Hi, I'm Aura".
Sentence case, no uppercase labels, `tabular-nums` for counts, times and step numbers.

### 3.4 Spacing and sizes

Base 4 px. Touch: `max-md:min-h-11` on text controls, `TOUCH_HIT` (44 px invisible hit area) on icon
buttons, switches, checkboxes, radios and tab triggers.

| Element                                    | Classes                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------------ |
| Button default / sm / lg / xs              | `h-8 px-2.5` / `h-7 px-2` / `h-9 px-3.5` / `h-6 px-1.5`                              |
| Icon button `icon` / `-sm` / `-xs` / `-lg` | `size-8` / `size-7` / `size-6` / `size-9`                                            |
| Input, select trigger, native select       | `h-8 px-2.5` (`size="sm"`: `h-7`); textarea `min-h-24 px-2.5 py-2`                   |
| Menu, select, command item                 | `min-h-7.5 px-2 py-1.5 gap-2`; palette items `h-10`                                  |
| Filter tab / tab track / route tab         | `h-7 px-2.5` / `h-8 p-0.5` / `h-11 px-3 lg:h-13`                                     |
| Sidebar / rows / top bar                   | `15rem` (`18rem` mobile Sheet) / `h-7 gap-1.5 px-1.5`, groups `pt-2.5` / `h-13 px-2` |
| Card body, settings row / stat card        | `p-3.5` / `p-2.5`                                                                    |
| List rows / detail rows / dialog           | `px-3.5 py-3 gap-3` / `px-3.5 py-2.5` / `p-4 gap-4`                                  |
| Page stack / sections / heading to body    | `gap-6` / `gap-8` / `gap-3`                                                          |

### 3.5 Radii

`--radius` 0.5rem: `rounded-sm` 4, `-md` 6, `-lg` 8, `-xl` 12, `-2xl` 16.

| Radius         | Elements                                                                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rounded-sm`   | Kbd, checkbox, `xs` icon and logo tiles                                                                                                            |
| `rounded-md`   | Menu, select and command items, `sm` / `xs` / `icon-sm` / `icon-xs` buttons, tooltips, skeleton bars, tab triggers, tag badges                     |
| `rounded-lg`   | Default buttons, inputs, select triggers, menus, cards, stat cards, callouts, filter tabs, toasts, nav rows, radio and template cards, code blocks |
| `rounded-xl`   | Dialogs, row groups, empty boxes and their 44 px tile, SaveBar, detail cover band, Aura window and greeting, user message bubble                   |
| `rounded-2xl`  | Aura composer                                                                                                                                      |
| `rounded-full` | Badges, switches, avatars, Aura launcher and greeting Dismiss, Send and Stop, suggested prompts, stepper markers, the provider avatar on a cover   |

### 3.6 Elevation, borders, z-index

| Element                                                         | Classes                                                                          |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Resource card, stat card, logo tile                             | `shadow-(--shadow-ring-xs)`; card hover `bg-accent/40 shadow-(--shadow-ring-sm)` |
| Row group (settings rows, detail list, service and chart lists) | `rounded-xl bg-card ring-1 ring-border ring-inset divide-y divide-border`        |
| Radio, checkbox and template cards                              | `rounded-lg border bg-card`                                                      |
| Primary / secondary button, select trigger                      | `shadow-(--shadow-button-primary)` / `shadow-(--shadow-button-secondary)`        |
| Menus, select lists, toasts, Aura launcher, greeting and window | `border shadow-lg`                                                               |
| Dialogs, sheets, SaveBar / tooltips                             | `border shadow-xl` / `shadow-sm`                                                 |

No side-stripe borders, glows or nested cards. Z-index: `z-70` toasts (above dialogs), `z-50`
portalled overlays and the skip link, `z-40` floating Aura (under every overlay), `z-20` SaveBar,
`z-10` card actions and controls above a stretched link. Do not add layers.

### 3.7 Focus (MUST)

| Control                                                        | Classes                                                                                        |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Inputs, textareas, selects, checkboxes, radios, input groups   | `focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50`                    |
| Buttons, filter tabs, tab triggers                             | `focus-visible:ring-2 focus-visible:ring-ring`                                                 |
| Rows and full-width triggers (route tabs, collapsibles, steps) | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`                        |
| Cards (stretched link)                                         | `has-[a[data-stretched]:focus-visible]:ring-2 has-[a[data-stretched]:focus-visible]:ring-ring` |
| Switch, radio, checkbox and template cards                     | `ring-2 ring-ring ring-offset-2 ring-offset-background` (offset tells focus from selection)    |
| Sidebar controls / Aura composer                               | `focus-visible:ring-sidebar-ring` / `focus-within:border-ring`, no glow                        |
| Invalid                                                        | `aria-invalid:border-destructive aria-invalid:ring-destructive/20` plus visible error text     |

Never `outline-none` without one of these. Menu items focus as `focus:bg-accent`. A heading focused
by script (the wizard step h1, `PageHeader headingRef`) is `outline-none` and announced.

### 3.8 Motion

| What                         | How                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Hover, press, color          | `transition-[color,background-color,...] duration-(--dur-fast)`, properties named; primary `hover:brightness-110`  |
| Menu, select, tooltip        | Fade + small translate, enter `--dur-fast`, exit 90 ms; tooltips from scale 0.96                                   |
| Dialog, alert dialog / sheet | Fade + scale 0.98, `--dur-base`, exit 135 ms / slide, `--dur-slow`, exit 180 ms                                    |
| Sidebar, chevrons            | `duration-(--dur-slow) ease-(--ease-out)`; chevrons `transition-transform duration-(--dur-fast)`, `rotate-90` open |
| Entrance                     | `motion-enter` (PageShell, ResourceCard, SaveBar, toasts); grids `motion-stagger` (30 ms steps, max 150 ms)        |
| Loading                      | `animate-pulse` skeletons, `Spinner`, Aura's animated mark                                                         |

Only transform, opacity and filter animate (color and box-shadow on hover); nothing over 240 ms but
spinners; no JS animation library. Under `prefers-reduced-motion`, `src/index.css` clamps animations
and transitions to 0.01 ms, overlays keep a `--dur-fast` fade, spinners turn, `AuraMark` is static.

### 3.9 Dark mode

`ThemeContext` (`src/contexts/ThemeContext.jsx`) sets `.dark` on `<html>`: the stored choice
(`openprime-theme-v2`) wins, else the OS setting at load; users switch in the user menu (Theme) or the
palette ("Toggle theme"). `dark:` utilities are token based only (`dark:bg-input/10`,
`dark:bg-black/60`). The dark destructive button is a tint
(`dark:border dark:border-destructive/60 dark:bg-destructive/15`); the sidebar turns charcoal (above
the page, below the card) with the white-wordmark logo, the logo tile stays white, and
`.cover-gradient` gets a 22 % page-color veil.

## 4. Layout

### 4.1 Shell (`src/components/layout/`)

| Part              | Rule                                                                                                                                                                                                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frame             | `AppLayout.jsx`: `SidebarProvider className="h-dvh"`, sidebar, `SidebarInset` (the `<main id="main">`) with the top bar and the one scroller; the viewport never scrolls, a new route starts at the top. Content gets `pb-16` (room for the Aura launcher) except under a SaveBar and in the wizard (`h-full`). |
| Sidebar           | `AppSidebar.jsx`: logo (home), Search (palette), Hide sidebar; then "New environment" (active on create) and "Environments" (list, detail, edit); the user menu at the bottom. On `/settings/*` it swaps to "Back to app" + "Personal" with the `SETTINGS_TABS`. Never a second nav column in the content.      |
| Rows              | `ROW` = `h-7 gap-1.5 rounded-lg px-1.5 text-sidebar-foreground/80`, `LABEL` = `h-6 px-1.5 text-xs font-normal text-sidebar-foreground/70`; active rows carry `aria-current="page"`. Any navigation closes the mobile Sheet.                                                                                     |
| Nav registry      | `src/config/nav.js`: `SETTINGS_TABS` (id, label, icon, description) feeds settings, its sidebar and the palette; `wizardRoute(pathname)` tells create from edit. Never hard-code either.                                                                                                                        |
| Top bar           | `AppTopBar.jsx`: `h-13 px-2`, hairline only when scrolled (`data-scrolled:border-border`); "Show sidebar" and "New environment" while the sidebar is hidden; crumbs from `breadcrumbsFor` (D-14); the `TopBarActions` slot at the right end.                                                                    |
| Icon buttons      | `IconAction` (`label`, `icon`, `shortcutId`, `to`, `onClick`): ghost `icon-sm`, tooltip below with the label and `ShortcutKeys`, no tooltip below md.                                                                                                                                                           |
| User menu         | `UserMenu.jsx`, opens upward, `w-60`, non-modal: name and email, Theme (Light, Dark), Settings, Help (Documentation, Keyboard shortcuts), Sign out.                                                                                                                                                             |
| Shortcuts         | `src/lib/shortcuts.js`: Cmd/Ctrl+K palette, Cmd/Ctrl+B sidebar, Cmd/Ctrl+/ shortcuts dialog (`KeyboardShortcutsDialog.jsx`).                                                                                                                                                                                    |
| Waits and crashes | `CatalogProvider` shows "Loading the service catalog..." in the content area. `ErrorBoundary resetKey={pathname} fallback={PageCrash}` keeps the shell when a page crashes; a route change clears it. The root boundary in `App.jsx` is full screen.                                                            |
| Floating Aura     | `AuraChatButton hidden={wizard} greet={list}`: on every page but the wizard, where it stays mounted so its conversation survives; `greet` (`/environments`) shows the greeting once per page load (6.4).                                                                                                        |
| Skip link, title  | `SkipLink` ("Skip to content" to `#main`); tab title "<page> - OpenPrime" via `PageHeader` or `useDocumentTitle`.                                                                                                                                                                                               |

### 4.2 Pages: width, header, list, detail, settings

`PageShell width` (`shared/page-shell.jsx`) renders `motion-enter mx-auto flex w-full flex-col gap-6`;
one per page, and no page sets its own `max-w`.

| `width`          | Max width                      | Gutters                            | Use for                                   |
| ---------------- | ------------------------------ | ---------------------------------- | ----------------------------------------- |
| `wide` (default) | none                           | `px-4 pt-6 pb-16 md:px-8 md:pt-12` | Environments list, catalog wait           |
| `detail`         | `--content-detail` 52rem       | list gutters                       | Environment detail, Not found, page crash |
| `settings`       | `--content-settings` 53.125rem | `px-4 py-6 md:px-8 md:py-8`        | Settings pages, the wizard's step column  |

- Header: `PageHeader` (`shared/page-header.jsx`; `title`, `description`, `status`, `actions`, `menu`,
  `icon`, `tile`, `documentTitle`, `headingRef`) is the only h1: `text-xl font-semibold text-balance`,
  a one-line `max-w-2xl text-sm text-muted-foreground` description, `status` beside the title,
  `actions` (at most one primary) then `menu` on the right, wrapping under the title below sm. List
  and settings pages show no tile; the detail page has its cover band above the header.
- List (environments): `PageHeader` (primary "New environment" once there are environments) >
  `ErrorState`, or the first-run `EmptyState` + `PrerequisitesChecklist`, or the stat strip
  (`grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4` of compact `StatCard`s) > `ListToolbar` > a
  filtered `EmptyState` or the `ResourceCardGrid`. Loading is `<ListPageSkeleton stats={4} />`. There
  are no data tables.
- Detail (`width="detail"`): `EnvironmentCover` (`h-20 rounded-xl sm:h-24`) > `PageHeader` (name,
  `StatusBadge`, facts divided by hairlines) > `JobCallout` > route tabs > `SettingsSection`s holding
  a `DetailList` or a row list. Route tabs are links in a `<nav>` labelled "Environment sections",
  the tab in `?tab=` (Overview is the bare URL):
  `h-11 border-b-2 border-transparent px-3 text-md font-medium text-muted-foreground lg:h-13`,
  current `border-foreground text-foreground` with `aria-current="page"`, count `text-xs tabular-nums`.
  Owned resources get a page, never a modal.
- Settings (`/settings/:tab`; `/settings` and unknown tabs go to `/settings/account`):
  `PageShell width="settings" className="grow"` > `PageHeader` (label and description from
  `SETTINGS_TABS`) > `Separator` > a `gap-8` stack of `SettingsSection`s > `SaveBar`.

### 4.3 Wizard (`src/components/WizardPage.jsx`)

It fills the content area with `@container/wizard flex h-full min-h-0 border-t`; each column scrolls
on its own.

| Column  | What                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stepper | `wizard-page/WizardStepSidebar.jsx`: `w-60 border-r`, from a 56rem content area (`@4xl/wizard:block`). Marker `size-6 rounded-full`: done `bg-primary/10 text-primary` + check, current `ring-2 ring-primary`, else `ring-1 ring-border`; Basics with errors reads "Needs attention" (`text-destructive`). Earlier and done steps are buttons, the current one has `aria-current="step"`, no jump to an unvisited step. Without it, `WizardStepProgress` shows "Step N of M" and a track. |
| Form    | `PageShell width="settings"` keyed per step, `PageHeader` with the step title and summary (`wizard-page/stepDefs.js`), focused on every step change; then the step.                                                                                                                                                                                                                                                                                                                       |
| Footer  | `wizard-page/WizardFooter.jsx`: `border-t bg-background`, inner `max-w-(--content-settings)`: secondary "Back", "Step N of M" (next to the stepper), primary "Continue", last "Create environment" or "Save changes". A click within 400 ms of Continue never submits.                                                                                                                                                                                                                    |
| Aura    | An `aside` with `w-80 border-l bg-card` from 2xl while open (`localStorage` `op-wizard-aura-open`); below 2xl a right Sheet (`w-full p-0 sm:max-w-md`).                                                                                                                                                                                                                                                                                                                                   |
| Top bar | `wizard-page/WizardActions.jsx` in `TopBarActions`: "Draft saved HH:MM" or "Draft restored" (from md), ghost sm "Start over", "Aura" (a toggle with `aria-pressed` at 2xl, the Sheet trigger below), ghost sm "Cancel".                                                                                                                                                                                                                                                                   |

Steps: Basics, Services, Helm charts (only while a Kubernetes service is enabled), Review. Edit mode
opens on Services with Basics done; its Review line reads "Check and save".

### 4.4 Responsive

Breakpoints `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536; check 390, 768, 1280 and 1536 px,
sidebar shown and hidden; no horizontal page scroll. Below md: sidebar Sheet, 44 px targets,
hover-only actions visible (`max-md:opacity-100 pointer-coarse:opacity-100`), tooltips hidden on
coarse pointers. Below lg: the detail header keeps only the primary and the menu (`max-lg:hidden` on
buttons, `className: "lg:hidden"` on menu actions). Below sm: first crumb dropped, stat cards compact,
toasts from the top, floating Aura full screen. Containers: the wizard stepper from `@4xl/wizard`,
detail rows put the label beside the value from `@md`.

## 5. Components

Primitives in `ui/`, building blocks in `shared/`. Search before you create. Every control needs
default, hover, focus-visible, active, disabled, pending and error states where they apply.

### 5.1 Buttons (`ui/button.jsx`)

Base `rounded-lg text-sm font-medium gap-1.5`, icons `size-4`, `disabled:opacity-50`.

| `variant`     | Look                                                                                       | Use                                              |
| ------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| `default`     | `bg-primary text-primary-foreground shadow-(--shadow-button-primary) hover:brightness-110` | The one forward action of a region               |
| `secondary`   | `bg-secondary shadow-(--shadow-button-secondary) hover:bg-accent`                          | Other actions, Back, Try again, empty-state CTAs |
| `ghost`       | `text-foreground/80 hover:bg-accent`                                                       | Cancel, Discard, icon buttons, quiet actions     |
| `destructive` | `bg-destructive text-destructive-foreground`, in dark a tint with a border                 | The confirm of a destructive dialog              |
| `link`        | `text-foreground/80 underline underline-offset-2`                                          | Inline links                                     |
| `outline`     | Same as secondary                                                                          | Compatibility only, not in new code              |

Sizes `default` h-8, `sm` h-7, `lg` h-9, `xs` h-6, `icon` size-8, `icon-sm` size-7, `icon-xs` size-6,
`icon-lg` size-9. Icon-only buttons need `aria-label` and a Tooltip. Pending: `<Spinner aria-hidden />`
before the label ("Generating..."), plus `disabled`. A link that looks like a button is
`<Button asChild><Link /></Button>`. The danger-zone button is ghost `lg` with
`bg-destructive/10 text-foreground hover:bg-destructive/15 [&_svg]:text-destructive`.

### 5.2 Inputs, selects, search

- `Input` (`ui/input.jsx`): `h-8 rounded-lg border border-input bg-transparent px-2.5 text-base md:text-sm dark:bg-input/10`.
  `Textarea`: `min-h-24 field-sizing-content`; code editors add `font-mono md:text-xs`. `InputGroup`
  (`ui/input-group.jsx`) holds leading icons, logos and inline buttons.
- `SearchField` (`shared/list-toolbar.jsx`): leading `Search`, `aria-label` = placeholder, a "Clear
  search" `X` while it has a value, `sm:w-72`. Never build another search input.
- `Select` (`ui/select.jsx`) for a choice in a toolbar (the environments sort): trigger
  `h-8 rounded-lg bg-secondary px-2.5 shadow-(--shadow-button-secondary)`, `w-fit`, items
  `min-h-7.5 rounded-md` with a trailing check. `NativeSelect` (`ui/native-select.jsx`) in forms,
  settings rows and catalog fields: `h-8 rounded-lg border border-input px-2.5 pr-9`.

### 5.3 Menus (`ui/dropdown-menu.jsx`, `shared/resource-actions-menu.jsx`)

Panel `min-w-48 rounded-lg border bg-popover p-1 shadow-lg`; items
`min-h-7.5 rounded-md px-2 py-1.5 text-sm focus:bg-accent`, icons `size-4 text-muted-foreground`;
separator `-mx-1 my-1 h-px bg-border`; a destructive item is `variant="destructive"`, last, after a
separator. The `...` menu of a card, row or header is `ResourceActionsMenu`: ghost `icon-sm`
`MoreHorizontal`, tooltip "More actions", `label` names the object ("More actions for demo-prod").
An action has `label`, `icon`, `onSelect`, `disabled`, `destructive`, `hint` and `className`:
destructive ones sort last, `hint` says why a disabled item is off, `className` (`lg:hidden`) moves
header buttons into the menu on small screens.

### 5.4 Dialogs, alert dialogs, sheets

- `Dialog` (`ui/dialog.jsx`) for short forms (credentials, rotate SSH key), the Helm values editor,
  Aura per service and the shortcuts list. Overlay `bg-black/15 dark:bg-black/60`; content
  `rounded-xl border bg-card p-4 gap-4 shadow-xl`; close `size-7 rounded-md` at `top-3 right-3`;
  title `text-base font-medium`; description `text-sm text-muted-foreground`; footer
  `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`, ghost "Cancel" then the primary verb.
  Field labels inside are `text-xs`. Width only through `size`: `sm` `sm:max-w-md`, `md` `sm:max-w-lg`
  (default), `lg` `sm:max-w-2xl`, `xl` `sm:max-w-4xl` (the palette keeps `--palette-width`).
- `AlertDialog` (`ui/alert-dialog.jsx`, `sm:max-w-md`, ghost Cancel) for confirms and leave guards:
  the title names the object or asks the question ("Push to <repo> (<branch>)?"), then one sentence.
- `ConfirmDestructiveDialog` (`shared/confirm-destructive-dialog.jsx`; `title`, `description`,
  `confirmLabel`, `typeToConfirm`, `onConfirm`, `children`) stays open and disabled with a spinner
  while `onConfirm` runs, submits on Enter, asks "Type <name> to confirm" with `typeToConfirm`, and
  puts `children` above the input. `modals/ConfirmDeleteModal.jsx` wraps it for environments and
  credentials.
- `Sheet` (`ui/sheet.jsx`): `bg-card shadow-xl`, right `w-3/4 border-l sm:max-w-sm` (call sites widen
  it); the wizard Aura and the mobile sidebar. Every overlay returns focus to its opener
  (`src/lib/focus-return.js`).

### 5.5 Tooltips, Kbd, tabs, filter tabs

- `TooltipContent` (`ui/tooltip.jsx`):
  `rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-sm max-w-64`, no
  arrow, `pointer-coarse:hidden`. They open at once: the app's only `TooltipProvider` is the one in
  `SidebarProvider` (`ui/sidebar.jsx`, `delayDuration={0}`); do not add another. Only on icon-only
  controls, truncated text and disabled controls
  that need a reason; never the only place of information. `HelpTooltip` (`shared/settings.jsx`)
  explains a term with a `size-3.5` `CircleQuestionMark`.
- `Kbd` (`ui/kbd.jsx`, `h-5 rounded-sm bg-muted px-1 text-xs`) only in tooltips (`ShortcutKeys`) and
  the shortcuts dialog; labels are ASCII ("Cmd", "Ctrl") from `keyLabels()`.
- List filters (statuses, service categories): `FilterTabs` (`shared/list-toolbar.jsx`),
  `h-7 rounded-lg px-2.5 text-xs font-medium`, inactive `text-muted-foreground`, active
  `bg-secondary text-foreground ring-1 ring-border`, `aria-pressed`, optional count.
- Content inside a section (JSON / YAML, SSH key tabs): `Tabs` (`ui/tabs.jsx`), track
  `h-8 rounded-lg bg-muted p-0.5 ring-1 ring-border`, trigger `px-3 text-xs font-medium`, active
  `bg-background shadow-xs`; `variant="line"` is an underline row. Page sections are route tabs (4.2).

### 5.6 Cards and row groups

- `ResourceCard` (`shared/resource-card.jsx`; `href`, `title`, `description`, `cover`, `badges`,
  `meta`, `actions`, `children`) is the only card: `rounded-lg bg-card shadow-(--shadow-ring-xs)`,
  hover `bg-accent/40 shadow-(--shadow-ring-sm)`, `cover` on top, body `p-3.5 gap-3`, name
  `h2 truncate text-md font-semibold` as a stretched link, description
  `line-clamp-2 text-xs text-muted-foreground`, `meta` in `text-xs` divided by `divide-x divide-border`.
  `actions` sit top-right on a `bg-card` pill, fade in on hover and focus, and stay visible on touch
  and while their menu is open. `ResourceCardGrid`:
  `motion-stagger grid grid-cols-[repeat(auto-fill,minmax(min(18rem,100%),1fr))] gap-4`. Controls
  inside a card sit above the link (`relative z-10`), never with `stopPropagation`.
- `StatCard` (`shared/settings.jsx`; `label`, `value`, `hint`, `compact`, `children`):
  `rounded-lg bg-card p-2.5 shadow-(--shadow-ring-xs)`, label `text-xs`, value `text-lg font-semibold`,
  then `children`, a small picture (`mt-2.5`); `compact` is one line below sm, without the picture.
- `SettingsSection` (h2 `text-base font-medium`, `description`, `action` beside the heading),
  `SettingsRowGroup`, `SettingsRow` (`title` `text-sm font-medium`, `description` `text-xs`, one
  `control` on the right, stacked below sm; `controlId`, `fullWidth`, `lockedReason`) and
  `SettingToggleRow`.
- `DetailList`, `DetailRow`, `Mono`, `NotConfigured` (`environment-detail/DetailList.jsx`):
  read-only facts, label `text-xs text-muted-foreground @md:w-44 @md:text-sm`, value `text-sm`, copy
  and open `actions` at the end; `NotConfigured` = "Not configured" + a ghost xs "Configure" link.
- Expandable rows (services, charts): `Collapsible` with a full-row trigger (`hover:bg-muted/40`,
  inset ring), chevron `rotate-90` when open, content `border-t bg-muted/30 px-3.5 py-3`.

### 5.7 Badges and status

`Badge` (`ui/badge.jsx`): `h-5 rounded-full px-1.5 gap-1 text-xs font-medium`, icons `size-3.5`.

| Variant     | Look                                                         | Use                                                       |
| ----------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| `success`   | `bg-primary/10 text-primary`                                 | Ready; Helm category "2 of 4" with a selection            |
| `neutral`   | `bg-muted text-muted-foreground`                             | Processing (`Spinner size-3`), Not generated, Unavailable |
| `attention` | `bg-warning/10 text-foreground [&>svg]:text-warning`         | "Needs VPC", "Needs attention" (`TriangleAlert`)          |
| `error`     | `bg-destructive/10 text-foreground [&>svg]:text-destructive` | Failed                                                    |
| `info`      | `bg-info/10 text-foreground [&>svg]:text-info`               | "Custom values" (`FileCode`)                              |
| `tag`       | `rounded-md bg-muted font-normal text-muted-foreground`      | "Default", "Roadmap", chart versions (`font-mono`)        |

Statuses only through `StatusBadge` (`ui/status-badge.jsx`, drawing `StatusPill` from
`shared/badges.jsx`), driven by `getEffectiveStatus()` and `statusDisplay()`
(`src/utils/environmentStats.js`): `succeeded` and `running` read Ready (success, `CircleCheck`),
`failed` and `error` Failed (error, `CircleAlert`), `pending` Not generated, `deploying` Processing
(spinner), `stopped` and `destroyed` neutral. `deploying` wins, else the newest job (by `last_*_at`),
else `status`.

### 5.8 Callouts and toasts

- `Callout` (`shared/callout.jsx`; `variant`, `title`, `icon`, `action`, `announce`):
  `flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-foreground ring-1 ring-inset`, icon
  `size-4`, bold `title` first, `action` on the right. `info` (default, `bg-info/10 ring-info/20`):
  notes, the running job with `icon={Spinner}`. `warning` (`bg-warning/10 ring-warning/30`):
  incomplete delivery, a credential in use. `neutral` (`bg-muted ring-border`): tips. `error`
  (`bg-destructive/10 ring-destructive/20`): `role="alert"` unless `announce={false}` (a failure
  already there when the view opens).
- Toasts (`src/contexts/ToastContext.jsx`): `useToast()` gives `success`, `error`, `warning` and
  `info(message, { title, action, duration })`. Look `rounded-lg border bg-popover p-4 text-sm shadow-lg`,
  icons `CircleCheck` `text-primary`, `CircleAlert` `text-destructive`, `TriangleAlert`
  `text-warning`, `Info` `text-info`, an optional secondary xs action. A polite region bottom-right
  above the Aura launcher, from the top below sm, left of the wizard Aura column at 2xl. 5 s (10 s
  with an action), held on hover or focus; an identical toast refreshes instead of stacking. Toast
  only out-of-view outcomes and failures that have no inline surface.

### 5.9 States and skeletons (`shared/states.jsx`, `shared/skeletons.jsx`)

| State           | Component                                      | Look and copy                                                                                                                               |
| --------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| First-run empty | `EmptyState icon title description action`     | Dashed box `rounded-xl border border-dashed border-input px-6 py-12`, `size-11 rounded-xl bg-muted` tile, title `text-md`, one small action |
| Filtered empty  | `EmptyState variant="filtered" onClearFilters` | "No results found" / "Try a different keyword or clear the filters." + "Clear filters" (`clearLabel` "Clear search")                        |
| Error           | `ErrorState thing message requestId onRetry`   | "Couldn't load <thing>.", the server message, "Error ID" with copy, secondary sm "Try again"; a polite status                               |
| Not found       | `NotFound thing title`                         | "This environment doesn't exist or you don't have access." / "Page not found" + "Back to environments"                                      |
| Page crash      | `PageCrash` (`ErrorBoundary.jsx`)              | "Something went wrong." / "Reload the page to try again." + "Reload", "Back to environments"                                                |
| Before sign-in  | `FullScreenState logo loading title primary`   | Centered `max-w-100`, OpenPrime symbol: "Redirecting to sign in...", or "Couldn't reach the sign-in service" + "Try again"                  |

Skeletons: `ListPageSkeleton`, `CardGridSkeleton`, `DetailPageSkeleton`, `SettingsPageSkeleton` (also
the wizard while an edit loads), built from `Skeleton` (`animate-pulse rounded-md bg-muted`) in a
`role="status" aria-busy="true"` wrapper. They mirror the layout (card band `h-24 sm:h-28`), cause no
layout shift and do not fade in. A pending action is a spinner in its button, never a page spinner.

### 5.10 Icons, logos, cover gradient

- lucide-react only, sized with `size-*` (never `h-4 w-4`): `size-4` in buttons, menus and nav,
  `size-3.5` in badges and meta, `size-5` in empty tiles. Decorative icons get `aria-hidden`.
- `IconTile` (`shared/icon-tile.jsx`), the one `bg-muted text-muted-foreground` tile: `xs` 16, `sm` 20,
  `menu` 24, `md` 28, `lg` 32, `row` 36, `xl` 40, `2xl` 56. Never hand-roll one.
- `ServiceIcon` (`icons/ServiceIcon.jsx`): official AWS icons for vpc, eks, msk, rds, aurora,
  opensearch, elasticache, ecr, waf, s3, lambda, sqs, sns, cloudfront and route53, else the lucide
  icon of `src/config/serviceIcons.js`; `size-8` in rows, `size-5` on cards. `ProviderIcon`: the official AWS,
  Azure and Google Cloud logos in their own colors (the AWS wordmark white in dark, AWS's reverse
  logo), `Server` for on-premises.
- `LogoTile` (`shared/logo-tile.jsx`) takes `chartLogo(key)`, `chartLogos(keys)` or `gitLogo(url)`
  from `src/config/logos.js`: the file on `bg-(--logo-tile)` at about 70 %,
  `shadow-(--shadow-ring-xs)`; no file or a failed load shows `Package` or `GitBranch` on `bg-muted`.
  Sizes `xs` 16 (git URL field), `sm` 24 (closed categories, git rows), `md` 36 (default: chart rows,
  dialog header, previews), `lg` 48. A new logo needs a file in `public/assets/chart-logos/`, a README
  entry with source and terms, and a key in `logos.js`.
- `AuraMark` (`shared/aura-mark.jsx`, `thinking` animates it) is Aura's only icon: `size-4`, `size-5`
  in headers, `size-6` on the launcher.
- `<CoverGradient id className>` (`shared/cover-gradient.jsx`) hashes the id (FNV-1a) into one of 16
  palettes and 4 layouts (`.cover-gradient[data-gradient][data-layout]`: three OKLCH blobs, grain, a
  dark veil). It is `aria-hidden`: no text or control on it. `EnvironmentCover` (`EnvironmentCard.jsx`)
  adds the provider avatar, an `IconTile size="xl"` with
  `absolute bottom-3 left-3 rounded-full bg-card shadow-(--shadow-ring-sm)`. Card band
  `h-24 sm:h-28`, detail band `h-20 rounded-xl sm:h-24`.

### 5.11 Switches, checkboxes, choice cards

- `Switch`: `h-5 w-9`, thumb `size-3.5`, on `bg-primary`, off `bg-input`; it always has a label or an
  `aria-label` naming what it turns on ("Enable Amazon EKS", "Install Loki"). `Checkbox`:
  `size-4 rounded-sm border-input`, checked `bg-primary`.
- `RadioCardGroup`, `RadioCard`, `CheckboxCard` (`modals/wizard/basic-config/RadioCard.jsx`):
  `rounded-lg border bg-card`, hover `border-ring/60`, selected `border-ring ring-2 ring-ring`, an
  optional `art` band `h-14 bg-muted/60`, then control, title, `badge`, description. Disabled cards
  are `cursor-not-allowed text-muted-foreground`.
- Template cards (`modals/wizard/StarterTemplates.jsx`): one button each, the same card with
  `active:scale-[0.99]`, a `h-24 bg-muted/60` preview of the real icons (a dashed `border-input` frame
  with the network or cluster icon on its corner), name, a count ("2 services") and one line.

### 5.12 Forms, save bar, unsaved guard

- `Field`, `FieldLabel` (`text-sm font-medium`, `text-xs` in dialogs), `FieldDescription`
  (`text-xs text-muted-foreground`) and `FieldError` (`role="alert"`, `text-sm text-destructive`)
  from `ui/field.jsx`. In rows the control goes into `SettingsRow` `control`, wrapped by
  `FieldControl` (`modals/wizard/basic-config/FieldControl.jsx`, `sm:w-72`, the error below) with
  `invalidProps(id, error)` (`aria-invalid`, `aria-describedby` to `<id>-error`).
- Validate on Continue, Save or Create, then focus the first `[aria-invalid="true"]`. Optional fields
  say "(optional)" in the label; required ones carry no mark. Error text is always visible.
- `SaveBar` (`shared/save-bar.jsx`; `dirty`, `saving`, `onSave`, `onDiscard`, `within`, `label`) shows
  only when dirty: `sticky bottom-4 z-20 mx-auto mt-auto max-w-xl rounded-xl border bg-card py-2 pr-2 pl-4 shadow-xl`,
  "Unsaved changes", ghost "Discard", primary "Save" with a spinner; its leave dialog reads "Discard
  unsaved changes?" ("Keep editing" / "Discard changes").
- `useUnsavedGuard(dirty, { within })` returns `{ pending, stay, leave }` for a page's own leave
  dialog. It covers reload, in-app link clicks (not new tabs, downloads, other origins, the same path
  or paths under `within`) and `guardedNavigate(go, to)`, which every programmatic navigation past a
  dirty form or a running job must use.

### 5.13 Copy button, code block, command palette

- `CopyButton` (`shared/copy-button.jsx`; `text`, `label`, `visibleLabel`, `size`): ghost `icon-sm`
  with a tooltip (`icon-xs` inline), or secondary with `visibleLabel`; for 1.5 s a check and
  "Copied", no toast.
- `CodeBlock` (`shared/code-block.jsx`; `lang`, `code`, `copyLabel`): `rounded-lg border bg-muted/40`,
  a bar `h-8 border-b text-xs` with the language in mono and a copy button, `pre`
  `p-3 font-mono text-xs leading-5`.
- `CommandPalette` (`layout/CommandPalette.jsx`): cmdk in a top-anchored Dialog
  (`top-16 md:top-32 max-h-120 sm:max-w-(--palette-width) p-0`), input row `h-14 px-4`, items
  `h-10 rounded-md`. Groups: Quick actions (New environment, Add AWS credentials, Toggle theme), the
  open page's group, Environments (status dot `bg-primary`, `bg-destructive` or `bg-muted-foreground`;
  region in mono), Navigate, Help. Empty: `No results for "<query>".` + "Clear search". Navigation
  goes through `guardedNavigate`. A page adds its group with `usePaletteActions({ heading, actions })`
  (detail: "This environment").

## 6. Patterns

### 6.1 Environments list (`EnvironmentsPage.jsx`, `EnvironmentCard.jsx`)

- Provider filter, only while the environments span two or more providers (`providerFilters`;
  OpenPrime is AWS-only until Azure, Google Cloud or on-prem is enabled in `providersConfig.js`):
  `FilterTabs` "Provider" above the stat strip, "All" + each provider that occurs with its
  `ProviderIcon`, short name and count, kept in `?provider=` (an unknown one resets to All). It
  scopes the whole page: the stat strip, the status tabs and the list. One filter row above the
  charts, not a filter per tile, so the tiles never disagree.
- Stat strip, always (`EnvironmentStatStrip.jsx`): Environments, Services, Regions, Last
  generated (relative or "Never"), four in a row from a 59rem content column (`@[59rem]`, 204 px of
  content per tile; the four-provider region legend needs 198 px on one line), else 2 x 2.
  Each tile has a picture drawn only from the environments (no invented trend), hidden below sm;
  region and generate dots name their point in a tooltip:
  - Environments: a row per status that occurs (filter-tab order): the `StatusPill` icon in the
    status color (Not generated `CircleDashed`), label, count and share (from a 12rem tile), over a
    4 px meter of that share. Statuses are few, so the tile keeps its height.
  - Services: every service in use (`servicesInUse`, most used first): `ServiceIcon`, short name
    (`shortServiceName`: VPC, EKS, Lambda), a `bg-chart-1` bar of the environments using it (from
    a 12rem tile) and "used/all", the catalog name in a tooltip. Services of several providers come
    as a list per provider ("Azure services") under its logo and short name, each counted against
    its own provider's environments. Four 20 px rows show (headings count); more scroll inside the
    tile (a focusable "Services in use" region) with a mask fade at the edge that has rows behind
    it, so the tile never grows.
  - Regions: `RegionMap` (`environments/RegionMap.jsx`), an Equal Earth map framed to the regions
    in use (land from `environments/worldLand.js`, generated once from Natural Earth; region
    `city` and `at` in `providersConfig.js` for AWS, Azure and Google Cloud, a test fails without
    them), a `bg-chart-1` dot with a halo that grows with its environments. Names are in the dots'
    tooltips and an sr-only list. Regions of several providers take the `--provider-*` colors
    (brand hues moved into the categorical band and checked for colorblind separation; red stays
    Failed's), name the provider in the tooltip and add a one-line legend under the map: a 6 px dot
    and the provider's `legendName` (AWS, Azure, GCP, On-prem; only here is Google Cloud "GCP"), no
    counts. All four need a 198 px tile; a narrower one (1024 with the sidebar, 148 px) wraps
    between names, never inside one. Regions within 1.5 degrees (Frankfurt on AWS and Google Cloud)
    sit side by side 12 px apart. On-premise datacenters have no place: the legend gives them a
    hollow dot.
  - Last generated: one dot per environment's last generate (`bg-primary`, failed
    `bg-destructive`, `ring-card`, 24 px hover target) on a line from the oldest (at least 30 days
    back) to Now, then the three most recent by name.
- `ListToolbar`: status `FilterTabs` "All" + only the statuses that occur (Ready, Not generated,
  Failed first) with counts, a live "N environments", a search field reading "Search environments"
  that matches name, resource prefix or region, and the sort (Recently modified, Name A to Z, Most
  services). Tabs and count left, search and sort right on one row; where that row does not fit
  (tablet widths with the sidebar open) search and sort wrap under the tabs instead of squeezing
  them.
- Card: cover with provider avatar, name, `StatusBadge`, region and "Resource prefix" (the prefix
  in mono), up to six `ServiceIcon`s with tooltips and "+N", "Modified 3 days ago" (exact UTC time
  for screen readers only), menu Open, Edit, Copy environment ID, Delete. Opening the list re-reads
  `GET /environments`.

### 6.2 Environment detail and jobs (`EnvironmentDetailPage.jsx`, `environment-detail/`)

- Header: "Generate repository" (`Download`), secondary "Push to git" (`GitBranch`), "Edit"
  (`Pencil`); primary per D-11. Without a git URL, Push is disabled with "Add a git repository in
  Edit > Basics to push." (tooltip, or `hint` in the menu). Menu: job actions below lg, Copy
  environment ID, Copy link, Delete environment (disabled while a job runs).
- Jobs: `POST /environments/:id/generate` or `/push` with `X-Async-Jobs: true`, then poll
  `/jobs/:jobId` (2 s, 5 s, then 10 s). While one runs every job button is disabled, the label reads
  "Generating..." or "Pushing..." and the status Processing; afterwards the page re-reads the
  environment and hands it to the list.
- `JobCallout`: running = info with a spinner, "Generating repository. This can take a few minutes."
  and an `m:ss` timer; failed = error "Couldn't generate the repository." (push and download alike)
  with the server message, Error ID and "Try again" ("Download again" for the ZIP, which never
  generates again). A failure stored before the visit is not announced; `deploying` hides it.
- Generate downloads `<name>-infrastructure.zip`; Push asks "Push to <repo> (<branch>)?", also on Try
  again, and toasts "Pushed to <repo>." with "Open repository". Leaving during a generate or download
  asks "Leave this page?" ("Stay on page" / "Leave"); switching tabs does not.
- Tabs: Overview (Services, Helm charts with EKS, Last generated, Last pushed; Delivery facts; the
  first five services), Services (expandable rows with summaries such as "PostgreSQL, t3.medium, 100
  GB"), Helm charts (logo, chart id, namespace, version; custom values read-only in a `CodeBlock` with
  the D-8 note), Configuration (Basics facts with copy, Git repository with "Rotate key", Terraform
  state, the JSON / YAML configuration file, Danger zone).

### 6.3 Wizard

- Catalog-driven: services and fields come from `SERVICES_CONFIG`, hydrated from `GET /catalog` (the
  backend's `/api/catalog`) when `VITE_USE_RUNTIME_CATALOG` is on; otherwise, or when the fetch
  fails, from `src/config/services/aws.js`. Mock mode serves `src/mocks/catalog.json`. Fields render
  through `DynamicFieldRenderer.jsx` (text, number, toggle, dropdown, multiselect, textarea, array as
  one item per line, object as JSON); a dropdown value no longer offered stays visible as "(no longer
  supported)". Never hard-code a service form.
- Basics (`modals/wizard/BasicConfigStep.jsx`): Environment (Name, Resource prefix), Cloud (provider
  cards per D-9, Region, Credentials (optional)), Domain, Terraform state backend and Git repository
  (each with a `Switch` as its section action; switched on, Git repository opens with `GitFlow`:
  OpenPrime, push, the repository's logo, and pull, Argo CD only with EKS, as `LogoTile`s on a
  `bg-muted/60` band with one text alternative), and the disabled presets ("They do not change the
  generated infrastructure yet."). One error list (`wizard-page/basicErrors.js`) shows under the
  fields, gates Continue and Create, marks the stepper and is listed on Review.
- Services (`modals/wizard/ServicesConfigStep.jsx`, `DynamicServiceConfig.jsx`): search, "N of M
  enabled", a "Service actions" menu (Enable all, Disable all), category `FilterTabs`, a
  `SettingsSection` per category. Row: `ServiceIcon`, name (a stretched trigger once on), "Needs
  <service>" or "Needs attention", one line, "Ask Aura about <service>" (from md, on hover or focus),
  `Switch`, chevron. Switching on opens the row; the first row with a problem opens on entry.
- "Start with a template" cards show while nothing is enabled and no filter is set ("VPC and EKS",
  "Basic stack"; Helm: "Monitoring stack", "Ingress stack"). Applying one turns on only what the
  catalog offers and focuses the step heading.
- Helm charts (`modals/wizard/HelmChartsStep.jsx`, `HelmChartsSelector.jsx`): "Deploys to Amazon EKS
  in <name>. Argo CD and Karpenter are always installed.", "N selected" + "Clear all", the D-8 info
  callout, then a collapsible card per category (open while it holds a selection; closed it shows the
  logos and "N of M") with rows: logo, name, chart id, version, "Custom values", ghost xs "Add custom
  values" or "Edit values", `Switch` "Install <chart>". Implicit charts are never listed.
- Helm values (`modals/wizard/HelmValuesDialog.jsx`, `size="lg"`): logo, name, `repository/chart`,
  the D-8 sentence, a mono `h-72` textarea, "YAML, as in the chart's values.yaml. Up to 64 KB.". Save
  checks size, syntax, one document and a mapping, then shows "Line N: ..." with the cursor there.
  Footer: ghost "Clear values" (left), ghost "Cancel", primary "Save values". Escape discards.
- Review (`WizardReviewStep.jsx`): problems first ("Basics needs attention." and "Services need
  attention." with "Go to Basics" / "Go to Services"; the warning "Delivery is incomplete."), then
  Basics, Services (N), Helm charts (N) and Delivery, each with a ghost sm "Edit"; empty values "-".
- Drafts (create only) save per user on every change, without secrets (`src/utils/wizardDraft.js`).
  "Start over" asks first when services are enabled; Cancel leaves without asking ("Draft saved.
  Resume it from New environment."); edit mode asks "Discard changes?" when edited. Success toasts
  "Created <name>." or "Saved changes to <name>.".

### 6.4 Aura (`AuraChatButton.jsx`, `AuraChatWindow.jsx`, `modals/ai-chat/`)

- Surfaces: the floating window, the wizard column or Sheet (`WizardAssistant.jsx`, prompts per step)
  and "Ask Aura about <service>" (`modals/AIChatModal.jsx`, `SuggestionBox` "Apply changes" /
  "Dismiss"). All share `AuraHeader`, `ChatThread`, `ChatMessage` and `Composer`; never a second
  renderer.
- Floating: launcher `size-12 rounded-full border bg-popover shadow-lg`, tooltip "Ask Aura"; window
  `sm:w-100 sm:h-[min(35rem,calc(100dvh-7rem))]`, non-modal from sm, a full-screen modal below; header
  `h-13` with the mark, "Aura", "AI assistant for OpenPrime", "Close Aura". Both move up above a
  SaveBar.
- Greeting: a `w-72 rounded-xl border bg-popover px-4 py-3 text-sm shadow-lg` button above the
  launcher (`mb-3`, right-aligned, `motion-enter`): "Hi, I'm Aura" (`font-semibold`) and "Ask me
  about your environments, AWS services or the generated code." (`text-balance`, muted); a round
  `icon-xs` "Dismiss" (`border bg-popover shadow-sm`) on its top-right corner. Once per page load
  (while the shell is mounted), 1 s after `/environments` renders; never on another page or while
  the window is open. Clicking it opens the window; Dismiss and Escape (focus in it) close it and
  send keyboard focus to the launcher. Gone after 10 s unless hovered or focused. No live region,
  never focused by script.
- Empty: "Ask about AWS services, Terraform or Helm charts." and suggested questions
  (`h-8 rounded-full border px-3 text-xs`) that fill the composer, never send, and hide once there is
  text.
- Composer: `rounded-2xl border border-input bg-card focus-within:border-ring`, auto-growing textarea
  "Message Aura", Enter sends, Shift+Enter adds a line, IME-safe; the round Send is primary only when
  sendable and is "Stop" while Aura answers; under it "Aura can be wrong. Check its answers.".
- Thread: user turns `max-w-[85%] rounded-xl bg-secondary px-3.5 py-2`; Aura turns under "Aura" with
  the mark (animated while pending, "Thinking" before text), code as `CodeBlock`. Failures are markers
  with "Try again" ("Aura couldn't answer right now. Try again in a moment.", "You stopped this
  answer.", "Aura took too long to answer."). A polite sr-only status announces finished answers.
- Conversations and drafts live above each surface, so closing or a wizard visit loses nothing.
  Requests to `/ai/chat` never carry Helm values text.

### 6.5 Settings, save models, destructive actions

- Account: Profile rows First name, Last name, Email. Preferences: Default cloud provider and
  Default region (`NativeSelect`; the region pre-fills a new wizard). The region select shows what
  Save sends: a provider change keeps a region the provider lists, else takes the saved region on
  the saved provider or the provider's default region, and a stored region its provider does not
  list loads as that default. The provider list is AWS, On-premises (selectable, OP-271) and the
  disabled "Azure (Roadmap)" and "Google Cloud (Roadmap)" (D-9), which still show as the current
  value when stored. They are drafts with one `SaveBar` on every settings tab that saves both; off
  the edited tab it reads "Unsaved changes in Account" (or "in Account and Preferences"). Save
  checks an edited profile ("Enter your first name.", "Enter a valid email address."), opens
  Account and focuses the first error; then "Changes saved". Never mix this with another save model
  on one surface.
- Cloud credentials: "AWS credentials" with primary "Add credentials" (in the empty state when there
  are none); rows with the AWS mark, name, "Default" tag, account ID with copy, "Checked 2 days ago"
  or "Not checked yet", secondary sm "Test" and a menu (Edit, Delete); then "Azure and Google Cloud
  credentials are on the roadmap.". `CloudCredentialModal` adds and edits, each save on its own.
- Destructive: a destructive menu item (last, after a separator) or the Danger zone row opens
  `ConfirmDeleteModal`: `Delete "demo-prod"?`, one sentence of consequences, focus on Cancel, a
  destructive "Delete". Environments need the typed name (D-12); a credential shows where it is used
  ("OpenPrime deletes its copy of the keys. The access key itself stays active in AWS."). Success
  toasts "Deleted <name>."; a failure toasts `describeError` and keeps the object. Never while a job
  runs on it.

### 6.6 URL and browser state

The status filter lives in `?status=` (All is no parameter), the detail tab in `?tab=`, the settings
tab in the path. Search is component state; sort, theme, the wizard Aura column and drafts live in
`localStorage` (`openprime-environments-sort`, `openprime-theme-v2`, `op-wizard-aura-open`,
`wizardDraft.js`), every read and write in try/catch. No secrets in storage. Server data only through
`authService` (`src/services/authService.js`), never `fetch` in a component.

## 7. Copy

1. Sentence case, short, calm, no exclamation marks, no emoji, ASCII only (no curly quotes, no em or
   en dashes). Strings live in the JSX (there is no i18n layer).
2. A page description says what the page is for, in one line: "AWS environments that OpenPrime turns
   into Terraform, Helm and Argo CD code.".
3. Buttons are verb + object: "New environment", "Generate repository", "Push to git", "Add
   credentials", "Save values", "Download again", "Rotate key". Never "Submit" or "OK". Failures offer
   "Try again".
4. Empty states say what goes here and offer one action: "No environments yet" / "Create an
   environment to generate Terraform, Helm and Argo CD code for AWS.".
5. Errors say what failed and what to do: "Couldn't load <thing>."; actions use
   `describeError(error, action)` (`src/lib/describe-error.js`): "Couldn't <action>: <message> (Error
   ID: <id>)", or "Couldn't <action>. Check your connection and try again." when offline. Field errors
   are imperative: "Enter a name for this environment.", "Enter the repository URL or switch this
   off.".
6. Name things by their names (`Delete "demo-prod"?`, "Ask Aura about Amazon EKS"), never by type.
7. Say plainly what is not done yet ("Generated repositories do not apply custom values yet.",
   "Roadmap"). Toasts are a past-tense outcome + object ("Created demo-prod.", "Pushed to <repo>.").
8. Time is relative ("3 days ago") with the absolute UTC time in a tooltip and for screen readers
   (`RelativeTime` in `shared/format.jsx`).
9. The prefix is "Resource prefix" everywhere: wizard, Review, card, detail header and Configuration
   tab ("Copy resource prefix"). Product names as their owners write them: AWS, Amazon EKS, Argo CD,
   GitHub, GitLab.

## 8. Accessibility checklist

- [ ] Exactly one h1 per page and a tab title "<page> - OpenPrime".
- [ ] Every control has an accessible name; icon-only ones `aria-label` + Tooltip; menus and switches
      name their object.
- [ ] Visible focus everywhere (3.7), a full keyboard path, no traps; the skip link reaches `#main`.
- [ ] Esc closes one overlay at a time, ignores the Escape that ends an IME composition; focus returns
      to the opener.
- [ ] No nested interactive elements: card and row controls are siblings above the stretched link.
- [ ] `aria-current="page"` on nav rows and route tabs, `aria-current="step"` in the stepper,
      `aria-pressed` on filter tabs and toggles.
- [ ] Polite live regions for counts, loading and Aura answers; new errors `role="alert"`; focus moves
      by script when the context changes (step h1, first invalid field, the composer).
- [ ] Invalid fields have visible text, `aria-invalid` and `aria-describedby`.
- [ ] Contrast from tokens only, labels on tints `text-foreground`, never color alone; 44 px touch
      targets below md; reduced motion respected.

## 9. Do and don't

| Do                                                                                                        | Don't                                                                  |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Every signed-in screen in `AppLayout`, page controls in `TopBarActions`                                   | A full-screen page, a second top bar or nav column                     |
| Reuse `PageShell`, `PageHeader`, `ListToolbar`, `ResourceCard`, `SettingsRow`, `DetailList`, `EmptyState` | A page-local card, header, toolbar, row or empty box                   |
| Tokens and `ui-tokens.css` variables; add missing variants to its `@source inline` list                   | Hex, raw palette classes, `text-white`, `text-[13px]`, literal widths  |
| `CoverGradient` for an environment band                                                                   | Any other gradient, gradient text or decorative image                  |
| `LogoTile`, `ServiceIcon`, `ProviderIcon`, `AuraMark`; lucide `size-*`; `IconTile`                        | Recolored logos, emoji, another icon set, `h-4 w-4`, hand-rolled tiles |
| One primary per region, `Spinner` inside the pending button                                               | Two primaries, a primary Cancel, page spinners for an action           |
| An inline Callout for a failure on its page; toasts for out-of-view outcomes                              | A toast and a Callout for the same failure                             |
| `ConfirmDestructiveDialog`, the typed name for environments                                               | `window.confirm`, a plain Dialog, deleting without confirm             |
| `FilterTabs` for list filters, `Tabs` inside a section                                                    | Tabs or segmented controls as list filters                             |
| `guardedNavigate` for programmatic navigation                                                             | `navigate()` past a dirty form or a running job                        |
| Disabled cards with "Roadmap" for what is not built                                                       | Hidden options, or controls that look like they work and do nothing    |
| `transition-[...]` with `duration-(--dur-fast)`                                                           | `transition-all`, durations over 240 ms, a JS animation library        |
| Self-hosted fonts; new data from the backend first                                                        | Font CDNs; endpoints or payload fields invented in the UI              |

## 10. Known gaps between the decisions and the code

Follow the code unless your task is to close one of these; never "fix" them on the side.

None known.

## 11. Definition of done and commands

Done means: it matches this file, every state of the surface exists (loading, first run, filtered,
error, not found, pending, disabled), tests pin the new behavior (a bug fix starts with a failing
test) and the CI gate is green. From the repo root:

```sh
npm ci --legacy-peer-deps
npm run format:check   # prettier, src/**/*.{js,jsx,json,css,md}
npm run lint           # eslint, src/ and scripts/
npm run catalog:check  # catalog:parity + catalog:lint against src/mocks/catalog.json
npm test               # vitest + Testing Library
npm run build:mock     # vite build --mode mock
npm run test:e2e       # playwright-core flows in e2e/ against a running app (PLAYWRIGHT_BASE_URL)
```

CI (`.github/workflows/reusable-test.yml`) runs the first five checks, then
`node e2e/runner.js catalogOnlyService` against `npm run preview`; the other e2e flows need the full
stack. Visual check: `npm run dev:mock` (MSW fixtures, mock auth, the runtime catalog from
`.env.mock`, port 3000); open every route you touched in light and dark at 390, 768, 1280 and 1536 px,
with the sidebar shown and hidden, next to a neighbor page of the same pattern, and walk every state:
loading, first run, filtered, error with Error ID, not found, pending and failed jobs, disabled with a
reason, unsaved changes and the leave guard.
