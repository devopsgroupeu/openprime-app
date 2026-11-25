# openprime-app - agent instructions

`CLAUDE.md` imports this file (`@AGENTS.md`). Read [DESIGN.md](DESIGN.md)
before you add or change any page, component, dialog or string.

## Purpose

The web frontend of OpenPrime. A user configures AWS infrastructure in a
wizard (basics, services, Helm charts), and OpenPrime generates Terraform,
Helm values, Argo CD manifests and a CI pipeline as a ZIP or pushes them to
the user's git repository. This app lists, creates, edits and deletes
environments, starts generate and push jobs, manages settings and cloud
credentials, and hosts the Aura assistant. The backend
(`openprime-app-backend`) owns all data, jobs and authorization; this app
renders it.

## Layout

| Path                     | What                                                                                    |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `src/App.jsx`            | Routes and the environment list load                                                    |
| `src/components/`        | Pages: `EnvironmentsPage`, `EnvironmentDetailPage`, `WizardPage`, `SettingsPage`        |
| `src/components/*/`      | Page parts: `environment-detail/`, `wizard-page/`, `modals/wizard/`, `settings-page/`   |
| `src/components/modals/` | Dialogs and Aura (`ai-chat/`)                                                           |
| `src/components/layout/` | The app shell: sidebar, top bar, command palette                                        |
| `src/components/ui/`     | shadcn primitives on Radix                                                              |
| `src/components/shared/` | App building blocks: page shell and header, cards, states, save bar, dialogs            |
| `src/config/`            | Nav registry (`nav.js`), static services (`services/aws.js`), Helm charts, icons, logos |
| `src/services/`          | `authService` (every API call), `catalogService` (`/api/catalog`)                       |
| `src/contexts/`          | Auth (Keycloak), catalog, theme, toasts                                                 |
| `src/styles/`            | Tokens, fonts, motion (`src/index.css` holds the theme)                                 |
| `src/mocks/`             | MSW handlers, fixtures and `catalog.json` for mock mode and tests                       |
| `e2e/`                   | playwright-core flows with a custom runner                                              |
| `scripts/`               | Catalog parity and lint, Helm packaging                                                 |
| `chart/`                 | Helm chart of the app (nginx)                                                           |

## Rules

- Plain JavaScript and JSX, no TypeScript. Import from `src` through `@/`.
- The API contract belongs to the backend. A UI change never changes a request
  or response body; a feature that needs new data is a backend change first.
- Every API call goes through `authService` (bearer token, timeout, the
  `X-Request-ID` of a failed call). No `fetch` in components.
- The wizard renders from the runtime catalog (`/api/catalog`, extracted from
  the template decorators). `src/config/services/aws.js` is the static
  fallback and stays in parity with `src/mocks/catalog.json`
  (`npm run catalog:check`). Fix a parity difference; allowlist it in
  `scripts/catalog-parity-allowed.json` only with a one-sentence reason.
- UI follows `DESIGN.md`: tokens only (no hex, no raw palette classes),
  primitives from `components/ui`, building blocks from `components/shared`,
  lucide icons, brand logos only through `LogoTile`. Every signed-in screen
  uses the same shell; only the content area changes.
- AWS is the only enabled provider. Azure, Google Cloud and On-premises show
  only as disabled "Roadmap" options (DESIGN.md D-9); keep their configs.
- No secrets in `.env` (it is committed) or in localStorage. The wizard draft
  drops secret fields (`src/utils/wizardDraft.js`).
- Mock mode (`VITE_MOCK=true`) runs MSW and mock auth, with no backend or
  Keycloak. Tests always run in it. A new endpoint the UI calls gets an MSW
  handler in `src/mocks/handlers.js`.
- Tests: Vitest and Testing Library in `__tests__/` next to the code. A bug fix
  starts with a failing test.
- Do not commit `public/mockServiceWorker.js` when MSW regenerates it.
- English UI. ASCII punctuation only in code, copy, comments, docs and commits;
  never em or en dashes. Comments are short and say why.
- Conventional Commits (`type(scope): subject`, lowercase subject), never a
  `Co-Authored-By` trailer. The type sets the release: `feat` minor; `fix`,
  `perf`, `revert`, `docs`, `refactor`, `build` patch; `chore`, `ci`, `test`
  none. Never bump `package.json` or `chart/Chart.yaml` versions by hand.

## Commands

```sh
npm ci --legacy-peer-deps
npm run dev:mock        # UI on :3000 with MSW, no backend or Keycloak
npm run dev             # UI on :3000 against the backend and Keycloak in .env
npm run format:check    # prettier, src/
npm run lint            # eslint, src/ and scripts/
npm run catalog:check   # static services vs src/mocks/catalog.json
npm test                # vitest
npm run build:mock
npm run test:e2e        # playwright-core against a running app (PLAYWRIGHT_BASE_URL)
helm lint chart
```

CI runs `format:check`, `lint`, `catalog:check`, `test` and `build:mock`; all
must pass before a change is done.
