# Development Roadmap — Music Recommendation Platform

Updated: 2026-10-28  
Companion specification: [SPEC.md](./SPEC.md)  
Edition: 3.0 — Balanced platform vision and learning plan  
Browser review: [ROADMAP.html](./ROADMAP.html) and [SPEC.html](./SPEC.html)  
Current deliverable: documentation only; none of the application files or scripts below exists yet.

## How to use this roadmap

Work on **one milestone at a time**. Ask for an explanation of unfamiliar concepts before moving on. A milestone may take multiple study sessions; these are checkpoints, not deadlines.

For every checkpoint: explain the concepts, implement only the listed behavior, run it, perform the checks, then record what you learned. Do not install mobile tooling or build the entire backend in the first session.

All file paths below are relative to the grouping root D:\music_recommendation_app. They describe **future files**. Adapted Python filenames can change after environment discovery, but preserve the module boundaries and contracts.

### Sequence and dependencies

| Phase | Milestones | Result |
| --- | --- | --- |
| Preserve existing work | M00–M01 | Reproducible Python baseline and artifacts |
| First recommendation on the web | M02–M06 | Search → choose song → similar songs through Express/Python |
| Personal product | M07–M12 | Accounts, feedback, personalization, playlists, interaction history |
| Complete and verify web | M13–M17 | Bilingual responsive UI, admin, reliable sessions, scale/evaluation, release checks |
| Optional audio | M18 | Authorized previews only if a permitted source is available |
| Later mobile | M19–M20 | Expo app reusing the proven API |
| Full platform expansion | M21–M23, after M17 | Artist/album library, public playlists, curated home, expanded admin |
| Richer optional player | M24, after M18 | Persistent preview queue and player behavior |

The core web release ends at M17. The broader platform vision remains planned in M21–M24. M18/M24 require authorized audio and can be skipped. Mobile starts after the web acceptance gate. Expansion can happen before or after mobile; use the stated prerequisites rather than treating every milestone number as a strict order. No milestone introduces payments.

### Local terminal conventions

Use PowerShell and separate terminals for long-running processes:

- Python terminal: cd D:\music_recommendation_app\recommender
- API terminal: cd D:\music_recommendation_app\api
- Web terminal: cd D:\music_recommendation_app\app
- Later mobile terminal: cd D:\music_recommendation_app\mobile

Commands below assume you are in that milestone's named directory. Python commands use .\.venv\Scripts\python.exe so activation is not required. Create a compatible interpreter environment during M00; do not upgrade the original Python project.

Once the scripts exist, recurring development commands will be:

~~~powershell
# Python terminal
.\.venv\Scripts\python.exe -m uvicorn service.main:app --host 127.0.0.1 --port 8000

# API terminal
npm run dev

# Web terminal
npm run dev
~~~

Run each in its own terminal. On first setup of a Node project, use npm install; on subsequent installs from a committed lockfile, use npm ci. Each milestone must add its proposed scripts before the instructions are considered runnable. Tests must use isolated fixtures/test databases, never reset the original CSV or a real user database.

## M00 — Reproduce and protect the existing project

**Objective:** Understand the current algorithm and confirm a working Python environment before creating a web architecture around it.

**Files to create or modify:** docs/existing-system-audit.md; recommender/README.md; recommender/requirements.txt; recommender/legacy/recommend.py as an attributed copy; recommender/scripts/audit_dataset.py; recommender/tests/fixtures/baseline.json; new recommender/.venv directory. Do not modify original files.

**Technologies involved:** Python environments, CSV, pandas, scikit-learn, file checksums, simple tests.

**Expected functionality:** Reproduce 114,000 raw / 89,740 cleaned rows, verify unique nonempty source IDs, record the eight-feature order and versions, and capture results for at least five chosen songs. This verifies existing work; it does not build an API.

**How to run:** From the root, check py --list and select an interpreter compatible with the existing dependencies. From recommender, create its .venv with that selected interpreter, install its documented requirements, then run .\.venv\Scripts\python.exe scripts/audit_dataset.py --source "C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender\data\dataset.csv". Audit tooling may run the new legacy copy with the working directory and input fixture documented; the original module must not be imported.

**How to test:** Recheck source SHA-256 values from SPEC.md, reproduce cleaning with pandas, check finite values in all eight features, and record chosen IDs and neighbor scores. Verify no output/cache files appeared in the original project. Record errors rather than changing cleaning to force a count.

**Definition of done:** The baseline is reproducible in a new environment; source hashes are unchanged; differences in counts or package behavior are explained. You can explain what scaling and cosine distance do in your code.

## M01 — Make the reused engine callable

**Objective:** Separate your existing computation from interactive input/output while preserving its behavior.

**Files to create or modify:** recommender/engine/__init__.py, dataset.py, baseline.py, artifacts.py, cli.py; recommender/tests/test_dataset.py, test_baseline.py; recommender/artifacts/ (generated, ignored); requirements.txt and README.md.

**Technologies involved:** Python functions/modules, pandas, StandardScaler, NearestNeighbors, pytest, JSON manifests.

**Expected functionality:** Prepare a tiny/development/full profile offline; save matching catalog export, matrix/model/scaler, ID mapping, and manifest. Recommend by sourceTrackId without input(). Exclude the seed by ID; document that correctness fix and score ties.

**How to run:** In recommender, install the added dependencies, then .\.venv\Scripts\python.exe -m engine.cli prepare --profile tiny --source "C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender\data\dataset.csv". Run .\.venv\Scripts\python.exe -m engine.cli similar --profile tiny --track-id SELECTED_SOURCE_TRACK_ID --limit 5 using a real ID printed by prepare. These flags are to be implemented in this milestone.

**How to test:** Run .\.venv\Scripts\python.exe -m pytest tests/test_dataset.py tests/test_baseline.py. Compare full-profile results against M00 fixtures when preparing the full baseline; do not compare rankings from differently fitted scalers as if they were identical. Include unknown ID, identical-feature songs, duplicate IDs, and small catalogs with fewer than six tracks.

**Definition of done:** A plain function returns stable song IDs and cosine scores; preparation does not run during each query; original source remains untouched; catalog/model versions and mapping are recorded together.

## M02 — Start the Express API

**Objective:** Learn an HTTP request/response cycle with the smallest useful backend.

**Files to create or modify:** api/package.json, package-lock.json, tsconfig.json, .env.example, .gitignore, README.md; api/src/app.ts, server.ts, config.ts, middleware/errors.ts; api/tests/health.test.ts; api/openapi.yaml.

**Technologies involved:** Node.js LTS, npm, TypeScript, Express, environment variables, Vitest, Supertest.

**Expected functionality:** GET /api/v1/health/live returns a minimal JSON result; unknown routes and errors use a consistent safe envelope. No database or Python dependency yet.

**How to run:** In api, npm install, create local .env from .env.example, then npm run dev. Add dev, build, start, typecheck, and test scripts here. Open http://localhost:4000/api/v1/health/live.

**How to test:** Run npm test and npm run typecheck. Use Invoke-RestMethod http://localhost:4000/api/v1/health/live; request an unknown URL and check a structured 404.

**Definition of done:** The API starts independently and you can explain routes, status codes, JSON, and why secrets are not sent to a browser.

## M03 — Add SQLite and import a tiny catalog

**Objective:** Learn persistence and stable database identity.

**Files to create or modify:** api/prisma/schema.prisma, Prisma configuration supported by the pinned 7.x version, initial migration, src/db.ts, src/catalog/import.ts, routes.ts, service.ts; api/tests/catalog.test.ts; .env.example, package scripts, README, OpenAPI.

**Technologies involved:** Prisma 7, SQLite adapter, relational constraints, validation, transactions.

**Expected functionality:** Track and CatalogImport tables; import the M01 export using source/sourceTrackId; GET /tracks, /tracks/:id, and title/artist-text search with pagination. No separate Artist table is needed for this first search.

**How to run:** In api, npm install; set DATABASE_URL; npm run db:generate; npm run db:migrate; npm run catalog:import -- --file "PATH_TO_TINY_CATALOG_EXPORT"; npm run dev. Add these scripts in this milestone. The export is an explicit input file, not a runtime import of sibling source.

**How to test:** Run npm test. Import twice and verify unchanged counts/IDs. Search a known title and artist; test missing song, page limits, duplicate IDs, literal search punctuation, and empty results. Confirm no original CSV was rewritten.

**Definition of done:** Tiny catalog metadata persists across restarts; stable keys survive reimport; paginated searches return the expected tracks. You can explain a primary key versus a unique source key.

## M04 — Build the first React catalog screen

**Objective:** Learn components, routing, HTTP fetching, and query states.

**Files to create or modify:** app/package.json, package-lock.json, vite/TypeScript setup, components.json, .env.example, README.md; app/src/main.tsx, router.tsx, lib/api.ts, lib/queryClient.ts, pages/Home.tsx, Search.tsx, TrackDetail.tsx, components/TrackCard.tsx; app/src/locales/en.json, my.json; generated shadcn components and theme; search component tests.

**Technologies involved:** React, Vite, React Router, TanStack Query, shadcn/ui preset beEhfqy2.

**Expected functionality:** Home/search/detail routes display real API metadata with loading, empty, error/retry, and pagination states. Artist search means matching artistsText on track results. There is no audio play button.

**How to run:** Scaffold a standalone Vite React TypeScript app and install its dependencies. In app, run npx shadcn@latest init --preset beEhfqy2. Set VITE_API_BASE_URL=http://localhost:4000/api/v1. Start the API, then npm run dev in app; visit the displayed local URL, normally port 5173.

**How to test:** Run npm test, npm run typecheck, and npm run build in app. Manually search known songs/artists, open details, refresh a detail URL, and stop the API to inspect the retry state.

**Definition of done:** A responsive catalog reads persisted API data rather than hardcoded cards. You understand why TanStack Query manages server data and React Router manages URLs.

## M05 — Wrap the Python engine in a private HTTP service

**Objective:** Learn how another language can serve the existing computation without replacing Express.

**Files to create or modify:** recommender/service/__init__.py, main.py, schemas.py, settings.py; recommender/tests/test_service.py; requirements.txt, .env.example, README.md.

**Technologies involved:** FastAPI, Uvicorn, validated request schemas, service startup lifecycle.

**Expected functionality:** GET /health and POST /v1/similar call M01 functions. Load one matching artifact snapshot at startup. No fitting per request, user authentication, or SQLite access.

**How to run:** In recommender, install the updated requirements, set the tiny artifact directory, then .\.venv\Scripts\python.exe -m uvicorn service.main:app --host 127.0.0.1 --port 8000. Open http://127.0.0.1:8000/docs and submit a known sourceTrackId/catalogVersion/limit.

**How to test:** Run .\.venv\Scripts\python.exe -m pytest tests/test_service.py. Test valid IDs, unknown IDs, bad counts, missing artifacts, mismatched manifests, and two repeated requests. Confirm outputs match M01 and no model rebuild occurs.

**Definition of done:** One long-running Python process answers ID-based requests predictably on loopback. You can distinguish a service wrapper from a new recommendation algorithm.

## M06 — Show Python recommendations on the website

**Objective:** Complete the first end-to-end recommendation feature.

**Files to create or modify:** api/src/recommendations/client.ts, routes.ts, service.ts; api/tests/recommendations.test.ts; api/.env.example and OpenAPI; app/src/components/SimilarTracks.tsx, pages/TrackDetail.tsx; contract fixture files.

**Technologies involved:** Node HTTP client, timeouts, source-ID mapping, TanStack Query.

**Expected functionality:** GET /tracks/:id/similar translates the application ID into the source ID, calls Python, validates its response, resolves metadata, and returns results to React. The page shows “Similar songs” and honest feature-similarity labels.

**How to run:** Set RECOMMENDER_BASE_URL=http://127.0.0.1:8000 and the expected catalog version in api. Start Python, API, and web in three terminals. Search a song, select it, and click “Find similar songs.”

**How to test:** Run targeted API recommendation tests and web component tests. Compare results to M01. Stop Python: search still works and the recommendation panel offers retry. Test bad response IDs/version mismatches and seed exclusion.

**Definition of done:** The website demonstrably uses your Python algorithm through Express. No browser-to-Python request, per-request subprocess, or JavaScript replacement engine exists.

## M07 — Add backend registration and JWT login

**Objective:** Learn password hashing and protected API routes.

**Files to create or modify:** api/prisma/schema.prisma and migration; api/src/auth/routes.ts, service.ts, tokens.ts, middleware.ts; api/tests/auth.test.ts; .env.example, README, OpenAPI.

**Technologies involved:** Prisma User model, Argon2id, JWT, Zod, rate limiting.

**Expected functionality:** Register, log in, and read GET /me using a 15-minute access JWT. USER/ADMIN roles are server-controlled. At this learning checkpoint, expired/reloaded sessions require login again; refresh sessions come in M15.

**How to run:** In api, install auth dependencies, set a locally generated JWT secret, run db:generate and db:migrate, then npm run dev. Use a documented test client or PowerShell example from the README to register/login and call /me.

**How to test:** Run npm test -- auth. Check duplicate normalized email, wrong password, missing/expired/modified token, password never returned, and attempted role assignment. Inspect the test database to confirm a hash rather than plaintext storage.

**Definition of done:** Authentication is enforced by Express; passwords are hashed; tokens are validated. You can explain authentication versus authorization.

## M08 — Add account screens to the website

**Objective:** Connect forms and authenticated requests to the existing API.

**Files to create or modify:** app/src/pages/Login.tsx, Register.tsx, Settings.tsx; app/src/auth/AuthProvider.tsx, RequireAuth.tsx; app/src/lib/api.ts, router.tsx, locales; auth component tests.

**Technologies involved:** React forms, validation, context, in-memory JWTs, TanStack Query.

**Expected functionality:** Register/login/logout, show the current user, protect personal routes, and display a clear re-login message on expiry. Access tokens remain in memory; a page reload logs out until M15.

**How to run:** Start API/web. Register a new local account through /register, sign in, open /settings, and log out.

**How to test:** Run app auth tests and a manual invalid-password/expired-session flow. Check that logging out clears private query caches and a second account cannot see the first account's cached data.

**Definition of done:** Forms work end to end; temporary session limitations are visible and documented rather than hidden in insecure storage.

## M09 — Add like, dislike, and clear feedback

**Objective:** Persist explicit preferences with clear, testable meaning.

**Files to create or modify:** api/prisma/schema.prisma and migration; api/src/feedback/routes.ts, service.ts; api/tests/feedback.test.ts; OpenAPI; app/src/components/TrackFeedback.tsx, pages/FeedbackLibrary.tsx, query keys and locales.

**Technologies involved:** Unique database constraints, idempotent PUT/DELETE, protected routes, cache invalidation.

**Expected functionality:** LIKE and DISLIKE are mutually exclusive; deleting feedback returns to neutral. Liked/disliked lists are paginated. Search remains visible even for disliked songs.

**How to run:** Apply the API migration and restart API/web. Sign in and like a song, switch it to dislike, clear it, and inspect both library lists.

**How to test:** API tests cover repeated writes, switching values, another user's isolation, unknown IDs, and unauthorized access. UI tests check active states and rollback/error handling when a write fails.

**Definition of done:** Feedback survives reload/login; one user/track has at most one feedback value; state changes are immediately understandable.

## M10 — Personalize with your existing engine

**Objective:** Turn similar-song computation into a user-specific feed without rebuilding the baseline.

**Files to create or modify:** recommender/engine/personalize.py, service/schemas.py, service/main.py, tests/test_personalize.py; api/src/recommendations/profile.ts and service.ts; api/tests/personalization.test.ts; app/src/pages/ForYou.tsx and locales; OpenAPI.

**Technologies involved:** Existing scaler/nearest-neighbor model, candidate aggregation, cosine scores, feedback-aware caching.

**Expected functionality:** Use up to 20 recent feature-backed likes as seeds, aggregate neighbors, and rank by mean cosine similarity to seeds. Exclude likes/dislikes and invalid catalog IDs. A new user sees a labeled curated/popularity feed and an invitation to like songs.

**How to run:** Start all three services with matching artifacts/catalog. Log into two users with different likes, open /for-you, then dislike one result and refresh. No offline model rebuild is needed after feedback.

**How to test:** Run Python personalization tests and API integration tests. Cover no likes, disliked-only, identical seeds, unknown IDs, all candidates filtered, Python unavailable, cache invalidation, and no disliked songs leaking through an oversized exclusion profile.

**Definition of done:** Feedback changes the personal feed; baseline similar-song behavior remains intact; fallbacks are labeled; you can explain the difference between content similarity and personalization.

## M11 — Add private playlists

**Objective:** Learn relational ownership and transactions.

**Files to create or modify:** api/prisma/schema.prisma and migration; api/src/playlists/routes.ts, service.ts; api/tests/playlists.test.ts; app/src/pages/Playlists.tsx, PlaylistDetail.tsx, components/AddToPlaylist.tsx; routes/locales/OpenAPI.

**Technologies involved:** One-to-many/many-to-many relationships, validation, ordered records, optimistic concurrency.

**Expected functionality:** Create/rename/delete playlists; add/remove/reorder tracks. A track appears once; playlist details are private to the owner. Reorders carry a version and conflicting updates return 409.

**How to run:** Apply migration, start API/web, sign in, create a playlist, add tracks from search/recommendations, reorder, and revisit it.

**How to test:** Run playlist tests; request a private playlist as a different user; add a duplicate; send an incomplete/invalid order and a stale version. Confirm no partial reorder survives a failed transaction.

**Definition of done:** The owner can manage a persistent ordered playlist; another account cannot read or modify it; normal reordering does not violate temporary position uniqueness.

## M12 — Add honest interaction history

**Objective:** Distinguish actual product actions from listening.

**Files to create or modify:** api/prisma/schema.prisma and migration; api/src/history/routes.ts, service.ts, retention.ts; api/tests/history.test.ts; app/src/pages/History.tsx, interaction helper, Settings.tsx, locales/OpenAPI.

**Technologies involved:** Event IDs, idempotency, UTC timestamps, privacy controls, maintenance scripts.

**Expected functionality:** Record explicit detail-open/find-similar actions. History can be disabled or cleared. Provide a retention cleanup script. Metadata-only use generates no listening events; feedback/playlists remain separate.

**How to run:** Apply migration and start API/web. Open track details, request similar songs, and view /history. Turn recording off and clear history. Add npm run history:prune -- --dry-run and document a deliberate non-dry-run invocation.

**How to test:** Test duplicate events, another user's isolation, disabled recording, retention cutoff, and history clearing without deleting feedback/playlists. Confirm viewing search results does not create fake listening records.

**Definition of done:** History accurately describes actions, privacy controls work, and clearing history does not unexpectedly erase saved preferences.

## M13 — Complete responsive bilingual UI and currency configuration

**Objective:** Make existing features usable in English/Burmese and on small screens without adding another product subsystem.

**Files to create or modify:** app/src/locales/en.json, my.json, i18n.ts, shared layout/navigation, forms and states, Settings.tsx; api/src/config/routes.ts and allowed profile preferences; responsive/UI tests.

**Technologies involved:** i18next, CSS/Tailwind, shadcn theme tokens, accessible forms, Intl formatting.

**Expected functionality:** All implemented screens, errors, recommendation reasons, and settings support en/my. Persist locale and USD/MMK preference separately. GET /config reports free access and supported currencies. No pricing/checkout screen.

**How to run:** Start API/web, change language/currency in settings, and inspect 360 px, tablet, and desktop widths. Test Burmese fonts and long/mixed-language titles.

**How to test:** Run locale-key coverage checks and focused UI tests; manually use keyboard-only navigation and error/retry states. Inspect browser requests: there is no exchange-rate request or payment service.

**Definition of done:** All existing workflows fit small screens and both languages; currency is configuration only; users understand fallback and recommendation reason labels.

## M14 — Add a small web admin area

**Objective:** Deliver the previously requested administration without building an entire publishing platform.

**Files to create or modify:** api/src/admin/routes.ts, service.ts, provision.ts; Prisma audit model/migration; api/tests/admin.test.ts; app/src/pages/admin/Tracks.tsx, Users.tsx, admin route guard and locales; OpenAPI.

**Technologies involved:** Role-based authorization, paginated tables, audit logging.

**Expected functionality:** Explicit local admin provisioning; view/search catalog and users; archive/publish metadata; suspend/reactivate users; audit changes. No audio uploads, rich editorial CMS, or private listener-history browsing.

**How to run:** Apply migrations; run npm run admin:provision using an existing account through the README's explicit local command. Start API/web, sign in as admin, and open /admin/tracks and /admin/users.

**How to test:** USER accounts receive 403 on direct admin requests. Archived tracks leave recommendations/search but remain unavailable placeholders in saved collections. Suspended users lose protected access. Prevent suspending the last active admin.

**Definition of done:** Admin permissions are enforced in Express, safe changes are audited, and public API users cannot promote themselves.

## M15 — Finish reliable web sessions

**Objective:** Replace the temporary re-login checkpoint with secure refresh and revocation behavior.

**Files to create or modify:** Prisma RefreshSession model/migration; api/src/auth/refresh.ts, cookie.ts, csrf.ts, password.ts and tests; app/src/auth/AuthProvider.tsx, lib/api.ts, refresh/retry tests; environment examples and OpenAPI.

**Technologies involved:** Rotating opaque refresh tokens, hashed session records, HttpOnly cookies, CSRF/origin checks, serialized refresh, session versions.

**Expected functionality:** Reload restores the web session through a refresh cookie; expiry triggers one refresh; logout revokes refresh state; replay revokes the token family. Password changes invalidate old sessions. Only safe bounded retries occur.

**How to run:** Apply migration, set documented local cookie/origin settings, start API/web, sign in, reload, and test expiry with a short development-only TTL. Keep production Secure-cookie settings separately documented.

**How to test:** Test token replay, two concurrent expired API calls, disallowed Origin/CSRF, password change, logout, suspension, and changed sessionVersion. Verify no refresh credentials in localStorage, JSON browser login responses, or logs.

**Definition of done:** Browser sessions survive reload correctly; ownership is unchanged; temporary M08 limitations are removed; no insecure persistence was added to hide session failures.

## M16 — Scale from development data to the full catalog

**Objective:** Verify data integrity, runtime cost, and recommendation quality against your actual dataset.

**Files to create or modify:** recommender/scripts/benchmark.py, evaluate.py; Python parity/profile tests; api import/benchmark checks; docs/evaluation.md, data-provenance.md, performance.md; component README files and data profile configuration.

**Technologies involved:** Full-data offline preparation, chunked imports, profiling, reproducible benchmarks, ranking evaluation.

**Expected functionality:** Matched tiny/development/full artifacts and imports; full cleaned count is 89,740 for the inspected source hash. Reports show preparation time, memory, warm query latency, ID coverage, diversity, and baseline comparisons.

**How to run:** In recommender, run the M01 prepare command with --profile development, then --profile full. In api, import the corresponding export with catalog:import. Restart Python/API against the same full version; run .\.venv\Scripts\python.exe scripts/benchmark.py --profile full and scripts/evaluate.py --profile full with documented fixture inputs.

**How to test:** Verify every returned ID exists in the imported catalog; reimport without breaking feedback/playlist keys; run fixed baseline queries; exercise requests under modest concurrency and record machine specifications. Check that no N-by-N matrix is generated. Manually review sample outputs using the agreed rubric.

**Definition of done:** The full catalog works on the student's machine with measured limitations and matched versions. No unsupported “accuracy” claim is based on synthetic data; meaningful ranking metrics wait for held-out real interactions.

## M17 — Verify and document the first web release

**Objective:** Finish a demonstrable, recoverable web product before adding mobile.

**Files to create or modify:** app/e2e/core-flow.spec.ts; api/recommender contract fixtures/tests; component README files; docs/runbook.md, release-checklist.md; safe example configuration and backup/restore scripts.

**Technologies involved:** Playwright, contract/integration testing, HTTPS/private-service configuration, SQLite backups, operational documentation.

**Expected functionality:** A new developer can start Python/API/web from the READMEs; the core journey passes; unavailable Python degrades visibly; source attribution and dataset publication terms are recorded. Optional hosting uses persistent SQLite and private Python networking.

**How to run:** Start the three components from clean documented setup. Run npm run typecheck, npm test, and npm run build in app/api as appropriate; run Python pytest; run npm run test:e2e in app with documented test services. If hosting is attempted, follow the runbook rather than exposing the development servers publicly.

**How to test:** Complete search → similar songs → register/login → feedback → personal feed → playlist → history controls → logout. Test English/Burmese, small screens, Python failure, and account isolation. Restore a consistent database backup and matched artifacts to a separate test location. Verify original hashes again.

**Definition of done:** The SPEC web acceptance gate passes, known limitations are documented, no original files were changed, and there are no payments or unauthorized media. Mobile is not required to finish this release.

## M18 — Optional authorized preview experiment

**Objective:** Add short previews only after an allowed source is explicitly established.

**Files to create or modify:** docs/media-rights.md; optional Prisma media metadata/migration; api/src/media routes/tests only for an approved hosting approach; app/src/components/PreviewPlayer.tsx and optional player context; configuration/locales.

**Technologies involved:** Browser audio; optional range delivery for locally hosted authorized clips; asset provenance.

**Expected functionality:** At most 30-second permitted clips, clear Preview labels, user-initiated play/pause, and no play button when unavailable. Metadata-only songs remain fully usable. No full-streaming pipeline or complex queue is required.

**How to run:** First document the asset owner/source and permitted use. Enable the preview feature flag and use a local owned/generated test clip or a provider-supported method whose terms permit the intended use. If rights/source are unresolved, skip this milestone.

**How to test:** Check actual asset duration, unavailable clips, failed requests, and stopping one clip before starting another. Verify a full recording is never distributed behind a 30-second UI timer. Confirm the chosen provider allows any proxy/cache/rehosting behavior actually implemented.

**Definition of done:** Every enabled asset has a documented permitted source and works within those terms; otherwise the feature stays disabled without affecting web release completion.

## M19 — Start the later Expo application

**Objective:** Learn native navigation and API access after understanding the web flow.

**Files to create or modify:** mobile/package.json, lockfile, app.json, .env.example, README.md; mobile/app/_layout.tsx, index.tsx, search.tsx, tracks/[id].tsx; mobile/src/lib/api.ts, queryClient.ts; native components and tests.

**Technologies involved:** React Native, Expo, Expo Router, TanStack Query.

**Expected functionality:** Android-first Home, Search, and Track Detail screens show real metadata and similar songs through Express. Native layouts use their own components; no web source imports.

**How to run:** Create the standalone Expo project using SDK-compatible dependencies. Set EXPO_PUBLIC_API_BASE_URL to the host's reachable LAN address. Start Python/API, configure API LAN binding/firewall deliberately for trusted local testing, and run npx expo start in mobile. Start with an Android device/emulator; document Expo Go limitations and move to a development build when necessary.

**How to test:** Search and open a track on the device, load similar results, disconnect/reconnect, and use navigation back actions. Confirm the phone never calls the Python service directly and no private key is in its public configuration.

**Definition of done:** The independent mobile project can browse the proven API on a real/emulated Android device. Web/API do not require mobile to run.

## M20 — Add mobile accounts and personal features

**Objective:** Reuse the proven backend while learning native forms and secure storage.

**Files to create or modify:** mobile auth screens/provider, SecureStore helper, personal-feed/feedback/playlist/history/settings routes, locale files, native tests; API native refresh transport and auth tests; OpenAPI and mobile README.

**Technologies involved:** Expo SecureStore, JWT access sessions, native refresh transport, TanStack Query, i18next, React Native forms.

**Expected functionality:** Login/logout, private recommendations, feedback, playlists, history controls, and English/Burmese settings. Store access tokens in memory and refresh tokens in SecureStore. Add previews only if M18 passed; pause them when backgrounded.

**How to run:** Apply any API auth changes, start existing services, and run npx expo start with the configured API address or the documented development build command. Use two accounts and a web session to check cross-client persistence. Validate iOS later on a suitable device/build environment.

**How to test:** Cover native refresh rotation/revocation, logout storage clearing, user switching, error states, saved-library refetch, and language layout. Verify web refresh cookies still work and native tokens are not available through accidental browser transport behavior.

**Definition of done:** Core personal features work natively against the same API; sessions and caches remain isolated by account; the web app still passes its checks. Mark iOS support verified only after actual device/build testing.

## M21 — Expand the artist, album, and discovery library

**Objective:** Build the richer music-library experience from the original vision after the core web release (M17).

**Files to create or modify:** api/prisma/schema.prisma and migrations; api/src/catalog/identity.ts, artists.ts, albums.ts, taxonomies.ts; api/src/library/follows.ts, albums.ts; import mapping/tests and OpenAPI; app/src/pages/Artist.tsx, Album.tsx, Genre.tsx, SavedAlbums.tsx, Following.tsx; routes/locales; docs/catalog-mapping.md.

**Technologies involved:** Prisma relations, explicit identity mapping, Express, TanStack Query, React Router, shadcn components.

**Expected functionality:** Metadata-only artist/album pages, genre/mood filters, followed artists, and saved albums. Reconcile repeated artist/album strings without inventing external IDs. Preserve the existing Track IDs and Python feature pipeline. Keep source metadata provenance.

**How to run:** Document and review mapping rules first, then apply the new API migration. Run an explicit catalog:enrich command first against a tiny copied test database. Start Python/API/web with matched catalog versions and visit the new artist/album/library routes.

**How to test:** Test ambiguous album names, artist strings with separators, unknown information, repeat imports, ownership of saved lists, paginated filters, and existing feedback/playlist preservation. Rerun fixed Python baseline and ID-alignment tests.

**Definition of done:** Artist/album navigation and saved collections persist correctly; unknown metadata stays unknown; baseline recommendation behavior and existing IDs remain stable. New ranking signals are not silently added.

## M22 — Add public playlists and curated discovery

**Objective:** Make discovery feel like a fuller music platform while keeping private data private. Prerequisites: M17; use M21 for artist/genre links.

**Files to create or modify:** Prisma playlist-visibility and featured-content migrations; api/src/playlists/visibility.ts, discovery/home.ts, featured.ts; authorization tests and OpenAPI; app/src/pages/PublicPlaylists.tsx, Home.tsx, PlaylistDetail.tsx; share/visibility controls and locales.

**Technologies involved:** Access control, typed editorial references, scheduling/order, React Router, TanStack Query.

**Expected functionality:** Public read-only playlist pages, private-by-default creation, owner visibility controls, and curated homepage sections. Labels distinguish personal AI results, historical dataset popularity, new catalog imports, and editorial picks.

**How to run:** Apply migrations, create a private playlist, explicitly publish it, and seed a small featured section using a development-only command. Start API/web; open the share URL in a logged-out browser and inspect Home.

**How to test:** Ensure private playlists cannot appear in discovery/featured responses or unauthorized details. Test visibility changes, archived featured tracks, inactive/scheduled sections, section ordering, and non-owner edit rejection.

**Definition of done:** Sharing and curated discovery work without private-data leakage; editorial and model outputs are clearly distinguished; public viewing never grants write access.

## M23 — Expand admin tools and realistic demo data

**Objective:** Complete the richer administration and populated demo experience. Prerequisites: M21–M22.

**Files to create or modify:** api/src/admin/catalog.ts, taxonomies.ts, featured.ts, summary.ts; api/prisma/seed.ts or equivalent demo seed module; seed/admin tests; app/src/pages/admin/Artists.tsx, Albums.tsx, Taxonomies.tsx, Featured.tsx, Dashboard.tsx; locales/OpenAPI; docs/demo-data.md.

**Technologies involved:** Validated CRUD, audit logging, Prisma upserts/transactions, seeded randomness, shadcn tables/forms.

**Expected functionality:** Manage validated catalog metadata/taxonomy/featured sections and inspect real aggregate summaries. Add an optional repeatable demo profile with about 50 users, 100 playlists, 2,000 feedback records, and 20,000 synthetic interaction events. Counts adapt to eligible catalog size; imported model features remain protected.

**How to run:** Apply migrations, run the documented development-only demo seed, start API/web, and sign in using explicitly provisioned development credentials. Add and order English/Burmese featured content. The seed must state its target database and refuse production use.

**How to test:** Seed twice and compare IDs/counts; verify foreign keys, bilingual form errors, featured references, authorization, safe audit logs, and preserved non-demo data. Run recommendation tests against distinct demo taste profiles without claiming synthetic accuracy.

**Definition of done:** The expanded platform can be demonstrated with populated, coherent data; admin changes are validated/audited; seed/reset behavior is explicit and does not silently destroy unrelated data.

## M24 — Grow the optional preview into a persistent player

**Objective:** Restore the full preview-player experience after a permitted audio source works. Prerequisites: M18 and a working web catalog.

**Files to create or modify:** app/src/player/PlayerProvider.tsx, queue.ts, persistence.ts; app/src/components/MiniPlayer.tsx, QueuePanel.tsx; player tests and locales; api playback-event validation and optional media range tests; docs/media-rights.md and player behavior notes.

**Technologies involved:** Browser audio, React context or justified local state library, queue state, optional HTTP byte ranges, validated playback events.

**Expected functionality:** Navigation-persistent preview playback, queue editing, seek, next/previous, shuffle/repeat, actual clip progress, and local queue restoration without automatic audio on reopen. Missing previews remain compatible with all metadata features. Only actual playback produces listening history.

**How to run:** Enable the already approved M18 preview source, start API/web, play an authorized clip, navigate through search/library, and edit the queue. Use a small set of owned/generated or permitted clips to verify behavior before expanding coverage.

**How to test:** Test clip end, repeat off/one/all, shuffle, failed/missing clips, queue persistence, only one active player, keyboard access, and history disabled. Confirm seeks do not count as listening and that only short authorized assets are delivered.

**Definition of done:** The richer player works predictably across web navigation and failure cases; audio rights remain documented; the metadata platform still works when the feature flag is off. Mobile background playback remains outside this milestone.

## Questions before implementation

The essential product/data questions were answered during the specification review:

- The original source paths and stable track_id are known.
- The source was inspected read-only and the 89,740-song cleaned count was confirmed.
- Metadata first is confirmed; audio is not a blocker.
- Original source modification/deletion is not authorized.

M00 still needs to discover or recreate the compatible Python environment. If reproduction differs, stop that dependent coding work and explain the specific discrepancy before proposing a source or algorithm change. No unanswered preference question needs to delay these documentation updates.

## Suggested next request

“Start M00 only. Explain the environment and verification steps, reproduce my existing recommender in the new workspace, and leave my original files untouched.”
