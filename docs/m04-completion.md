# M04 — First React music website

Completed: 2026-10-29  
Status: **Complete, with the explicitly permitted preset fallback documented below**  
Approved plan: SPEC.md Version 3.0 and ROADMAP.md Version 3.0, unchanged  
Next gate: **M05 is not approved or started**

## Open it

[http://127.0.0.1:5173/](http://127.0.0.1:5173/)

The React development server and existing API were left available for review. The site uses the working identity **Beispiel**. Home, Search, song details, missing-page states, and request-error recovery are implemented with real M03 catalog data.

Try Comedy under Songs, then Hoshino under Artists. Click a result and refresh its detail page. Browse the full collection using the page controls. No account or Python service is needed for these features.

## Implemented

- Independent app project: React, TypeScript, Vite, React Router, and TanStack Query.
- Dark responsive interface, fixed/compact navigation, readable song lists, and explicit typographic placeholders.
- Home with API-derived total and catalog pages.
- Debounced/submit search, song/artist mode, URL query state, cancellation signals, and pagination.
- Detail pages showing real title/artist/album/genre/duration/source fields; absent metadata is not invented.
- Loading, empty/reset, structured error/retry, missing-track, missing-page, and route-error states.
- English/Burmese translation scaffolding and a usable core language switch.
- Tests, type checking, production build, local production-preview verification, screenshots, and beginner instructions.

## Two documented implementation decisions

**Preset availability:** the official shadcn CLI was invoked with the exact beEhfqy2 code using latest and 4.22.0. Both timed out connecting to ui.shadcn.com/init. No preset was installed and no generated component configuration is claimed. Following the user's “if available” condition, the website uses a small local Base UI button wrapper and a zinc/blue theme. app/design-status.json records the attempts and fallback. Reapplying the exact preset later should be a reviewed change.

**Local proxy:** the roadmap's example used an absolute VITE_API_BASE_URL. M03 has no cross-origin headers, so this frontend instead uses /api/v1 with Vite forwarding to http://localhost:4000. This preserves every API contract and backend file. Production hosting will need an equivalent same-origin reverse proxy or a separately approved CORS configuration. The proxy is also enabled for local build preview.

## Important components

- main.tsx creates React's root and shared router/query client.
- router.tsx declares screens and missing/error routes.
- Layout.tsx owns shared navigation and language controls.
- Home.tsx, Search.tsx, and TrackDetail.tsx render their corresponding API-backed pages.
- lib/api.ts centralizes typed requests and safe errors.
- TanStack Query owns server-data state; React Router owns URL state.
- Shared TrackCard/TrackList, Pagination, and PageState components keep page code understandable.
- locales/en.json and my.json hold UI text; song metadata remains in its original language.

See [the full app guide](../app/README.md) for every file, concepts, configuration, and troubleshooting.

## Windows PowerShell commands

Use two terminals if the servers have stopped. Do not launch duplicate copies on the same ports.

```powershell
# Terminal 1: existing Express API
Set-Location -LiteralPath 'D:\music_recommendation_app\api'
npm run dev
```

```powershell
# Terminal 2: React website
Set-Location -LiteralPath 'D:\music_recommendation_app\app'
# On a fresh checkout: npm ci
npm run dev
```

Visit http://127.0.0.1:5173. Navigate using Discover/Search and song links. The API remains http://localhost:4000/api/v1.

For frontend checks:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\app'
npm test
npm run typecheck
npm run build
```

## Verification results

| Check | Result |
| --- | --- |
| Frontend Vitest/Testing Library | 12 passed in two test files |
| Frontend TypeScript check | Passed |
| Frontend production build | Passed |
| Existing API regression suite | All 50 tests passed |
| Real artist query | Hoshino query returned Comedy with artist mode retained in URL |
| Full catalog | Four pages of 12, 12, 12, 4; 40 unique IDs reachable |
| Client-side navigation | Song click changed route with only one document request |
| Detail direct-link/refresh | Passed in development and compiled preview |
| Loading/empty/failure/retry | Component tests and blocked-request browser recovery passed |
| Missing track and unknown page | Dedicated recovery screens verified |
| Responsive layout | Desktop 1440 px, mobile 390 px, and Burmese 360 px checked |
| Keyboard skip/focus | Skip link reached and focused main content |
| Browser application errors | None recorded during completed checks |

Desktop/mobile screenshots are saved in app/docs for review. The production-preview server used port 4173 temporarily and is stopped after verification. The development website remains available on 5173.

Metadata requests were blocked in a test browser to exercise the visible offline/retry path without stopping the shared API. This verifies the UI behavior, not a full network/performance audit. Locale keys are aligned, but the later M13 language/accessibility polish remains planned.

## Preservation and scope

The original Python project, M00/M01 engine/artifacts, API source/contracts, SQLite database, and approved documents were fingerprinted before work and checked afterward. No backend CORS or endpoint changes were made. See [m04-results.json](./m04-results.json) and [the before snapshot](./m04-preservation-before.json).

No authentication, playlists, audio, invented album covers/preview URLs, Python integration, repository initialization, or hosted deployment was added. The decorative UI tiles are explicitly labeled placeholders and use real genre text; Inter's supplied license is included with the self-hosted font.

M04 is ready for review. **Stop here; M05 requires explicit approval.**
