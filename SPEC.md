# Music Recommendation Platform — Project Specification

Version: 3.0 — Balanced edition  
Updated: 2026-10-28  
Audience: A beginner IT university student building and learning one milestone at a time  
Status: Draft for review; application implementation has not started

## 1. Purpose and learning approach

Build a Spotify-inspired music discovery platform with a React website, Express API, and a later React Native/Expo application. The central feature is an AI-powered, content-based music recommender that **reuses the existing Python project**, its pandas cleaning, StandardScaler, and scikit-learn cosine nearest-neighbor algorithm.

“AI-powered” here means recommendations from numeric musical features and user preferences. It does not imply a language model, deep learning, or proven prediction of a user's taste. Similarity scores describe feature similarity, not the probability that a user will like a song.

Develop a small working feature, run it, test it, and understand it before starting the next one. Do not generate the entire platform at once. Follow [ROADMAP.md](./ROADMAP.md) for the objective, files, technologies, functionality, run instructions, tests, and completion criteria for every milestone.

### The balanced approach

Keep the complete Spotify-inspired platform vision and reach it through small, runnable learning milestones. The first release establishes the AI recommendation experience; later releases grow the catalog, library, editorial tools, preview player, and mobile experience.

| Need | Decision |
| --- | --- |
| A substantial university AI project | Preserve the existing Python model, evaluate its results, and build explainable personalization around it |
| A polished music platform | Retain artist/album pages, follows, saved albums, public playlists, curated discovery, richer administration, and an optional preview player in the planned product |
| A manageable starting point | Deliver metadata search, similar songs, accounts, likes/dislikes, personal feeds, and private playlists first |
| Independent projects | Keep app, api, mobile, and the supporting Python service independent; separate Git repositories can come later |
| Safe reuse of existing work | Preserve the original dataset/code; adapt copies in the new workspace and verify baseline behavior |
| Clear scope | Distinguish the core web release, platform expansion, optional authorized audio, and later mobile rather than requiring everything at once |

The fuller platform features below remain part of the intended project. Their later placement controls learning order; it does not remove them from the vision. Metadata-first operation, the existing Python engine, and no payment integration remain firm requirements.

### Review formats

Read [SPEC.html](./SPEC.html) for the browser edition and [ROADMAP.html](./ROADMAP.html) for the milestone guide. Markdown is the editable source of truth; regenerate both HTML files after changing it. The browser editions work offline with navigation, section filtering, theme controls, and print styling.

## 2. Confirmed scope

### First web release

- Free usage; no payments, checkout, subscriptions, or payment SDKs.
- React, React Router, TanStack Query, and shadcn/ui preset **beEhfqy2**.
- Node.js, Express, SQLite, Prisma **7**, and JWT authentication.
- Python, pandas, and scikit-learn for recommendations.
- Registration/login/logout, song and artist search, song-based recommendations, and personalized recommendations.
- Like/dislike feedback; playlist creation and management.
- Interaction history and controls to disable/clear optional history.
- Responsive website, English/Burmese UI, and a small web admin area.
- Realistic catalog data drawn from the existing dataset, subject to source terms.
- USD/MMK as future-ready display configuration only. No pricing page is required.
- Metadata-only songs are fully searchable, recommendable, and usable in playlists.

### Planned platform expansion

- Artist profiles, album pages, genre/mood discovery, artist follows, and saved albums.
- Public/private playlists, shareable playlist pages, and an ordered library.
- Curated homepage sections, featured playlists, richer catalog management, and aggregate admin analytics.
- Realistic development accounts, playlists, and interactions alongside the verified music dataset.
- A persistent short-preview player and queue after an authorized preview source is confirmed.
- React Native/Expo mobile app using the same Express API; Android first, iOS verified later.

Artist/album identity and additional metadata must be modeled carefully from the actual dataset. No external provider or paid service is required to complete the core AI product.

### Release boundaries

| Release | Included | Completion gate |
| --- | --- | --- |
| A — AI web foundation | M00–M17: reused Python engine, search, accounts, feedback, personalization, private playlists, history, bilingual responsive UI, basic admin | Core web acceptance checks in section 13 |
| B — Platform expansion | M21–M23: artist/album library, public playlists, genre discovery, curated home, expanded administration | Expansion checks in section 16 |
| C — Authorized previews, optional | M18 for a small preview, M24 for persistent player/queue | Documented rights and preview-specific checks; metadata releases do not depend on it |
| D — Mobile, later | M19–M20 after A; expand native features after the corresponding API features exist | Independent Expo app and cross-client personal data checks |

Release B can follow A before or after mobile. Milestone numbers are stable identifiers; follow their stated prerequisites rather than assuming all numbers are a strict execution order.

### Out of scope

- Full-track streaming, scraping/downloading music, or unauthorized audio/artwork distribution.
- Paid AI services, payment providers, live exchange rates, and commercial catalog integrations.
- Offline audio, background playback, device handoff, social login, user messaging, and collaborative playlists.
- Kubernetes, queues, vector databases, and approximate search infrastructure before measurements justify them.

## 3. Existing project: read-only inspection

Original files must **not be modified or deleted without asking the user first**. This also applies to reorganizing the original project or overwriting its generated files. Future adapters, exports, environments, caches, and artifacts belong in the new project. Do not import the interactive original module directly into a web service.

| Item | Verified location |
| --- | --- |
| Original project | C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender |
| Dataset | C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender\data\dataset.csv |
| Algorithm | C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender\src\recommend.py |
| User-reported dataset source | [Moizah1/Music-pattern-Analysis](https://github.com/Moizah1/Music-pattern-Analysis) |

### Observations verified on 2026-10-28

The source was read, not executed or imported. A standard-library CSV audit checked counts, ID uniqueness, and the eight numeric features without installing packages or changing the source files. Reproduce the audit with pandas during the first coding milestone.

| Check | Result |
| --- | ---: |
| Raw CSV records | 114,000 |
| Columns | 21 |
| Distinct raw track IDs | 89,741 |
| Rows with missing title or artist | 1 |
| Duplicate IDs removed after missing-name removal | 24,259 |
| Cleaned records / unique retained IDs | **89,740** |
| Missing IDs in retained records | 0 |
| Whitespace-only retained titles/artists | 0 |
| Retained rows with nonnumeric/nonfinite required audio features | 0 |
| Distinct genres in retained first-occurrence rows | 113 |
| Discarded duplicate rows whose genre differs from the retained row | 23,838 |

The first CSV header is blank; pandas normally calls it Unnamed: 0. It is an export index, not a music feature or application ID.

Dataset columns: export index, track_id, artists, album_name, track_name, popularity, duration_ms, explicit, danceability, energy, key, loudness, mode, speechiness, acousticness, instrumentalness, liveness, valence, tempo, time_signature, track_genre.

Inspection fingerprints (SHA-256):

- recommend.py: 639BC3D21B10F4988A6DEFD1819D99E7896A0C28F367A513D549101BF4BC8ECE
- dataset.csv: B202FA49909B2D5CEF71A04B1D21243CFEB36414535F2CA9272AA646721177BD

These identify the inspected snapshots; they are not secrets. Recheck them before adapting the code.

### Exact existing algorithm

1. Read data/dataset.csv using pandas.
2. Drop rows missing track_name or artists.
3. Drop duplicate track_id values, retaining the first occurrence, then reset the DataFrame index.
4. Select these features **in this order**: danceability, energy, acousticness, instrumentalness, valence, speechiness, tempo, loudness.
5. Fit StandardScaler on the retained feature table and transform it.
6. Fit NearestNeighbors(n_neighbors=6, metric="cosine", algorithm="brute").
7. Search titles/artists case-insensitively using literal substring matching; show up to ten matches.
8. Choose a song and query neighbors; omit the first neighbor and display five results.
9. Display max(0, (1 - cosineDistance) * 100) as feature similarity.

The script performs loading, fitting, and input() at module level. It is an interactive CLI, not currently a request-safe service. It already avoids explicitly creating a full all-pairs similarity matrix.

### Preservation and adaptation rules

- Preserve this feature order, scaler, deduplication order, and cosine metric for the first integrated baseline.
- Record reference results for fixed track IDs before adaptation. Do not silently replace the algorithm with genre rules, JavaScript scoring, or a new model.
- Create a new adapter copy with documented attribution to the original. Extract callable load/prepare/recommend functions without editing the original.
- Select songs by track_id, not by title or temporary DataFrame row index.
- Exclude the seed by **ID**, rather than removing the first neighbor blindly. Different songs can have identical feature vectors. Document tie-order differences and correctness fixes against the baseline.
- Keep row-index-to-track-ID mapping bundled with the feature matrix.
- Do not merge duplicate genre labels or change scaling during baseline integration. Multi-genre metadata may be a separately versioned improvement.
- There is no existing reproducible dependency file in the inspected root. Establish a compatible Python/pandas/scikit-learn environment and record it before adaptation.

## 4. Architecture and ownership

Proposed structure; these application folders are not generated by this documentation task:

~~~text
music_recommendation_app/
  SPEC.md
  ROADMAP.md
  docs/                 # future contracts, audit notes, and learning notes
  app/                  # standalone React website
  api/                  # standalone Express API and Prisma database ownership
  recommender/          # new Python adapter/service reusing original work
  mobile/               # standalone Expo application, created later
~~~

The Python service is a supporting component, not a replacement for the three client/API projects.

~~~text
React web ----\
               > Express REST API ----> SQLite through Prisma 7
Expo mobile --/         |
                        | private HTTP/JSON request
                        v
                Python recommendation service
                        |
              versioned read-only model artifacts
                        ^
                        |
Original CSV --read-only--> offline prepare/export step
                              |
                    catalog export + manifest
                              |
                       Express import command
~~~

### Responsibilities

| Component | Owns | Must not own |
| --- | --- | --- |
| app | UI, routing, forms, query cache | Database access, model fitting, signing secrets |
| api | Authentication, permissions, catalog, feedback, playlists, history, Python orchestration | Reimplementation of the similarity algorithm |
| recommender | Existing cleaning/features/scaler/cosine engine, recommendation computation | User passwords, JWT login, direct writes to application SQLite |
| mobile | Native UI and secure session storage | Importing web components or bypassing Express |

Express is the public backend. Clients never call Python directly. Python returns IDs/scores/reason codes; Express resolves catalog metadata and enforces publication, explicit-content, and ownership rules.

### Repository decision

Separate repositories are **not necessary early on**. Architectural independence comes from separate environments, dependencies, configuration, and HTTP contracts.

Keep the current grouping folder without Git, as previously requested. During coding, start with ordinary independent folders; each can later become its own repository. An optional single parent repository is also reasonable for a solo student if the user later changes the no-root-repository preference. Splitting repositories becomes useful for independent collaborators, release schedules, or access permissions.

Do not initialize any repository as part of this documentation task. No app may import runtime source from a sibling. Each must run when moved outside this grouping folder, with external services configured by URL.

## 5. Stack and service setup

| Component | Technology |
| --- | --- |
| Web | React + TypeScript + Vite, React Router, TanStack Query |
| UI | shadcn/ui with exact preset beEhfqy2 and compatible Tailwind |
| API | Node.js LTS + TypeScript + Express, Zod validation |
| Database | SQLite + Prisma ORM 7 + @prisma/adapter-better-sqlite3 |
| Auth | Argon2id password hashes; short-lived JWT access tokens |
| Python | Compatible Python version, pandas, NumPy, scikit-learn |
| Internal HTTP wrapper | FastAPI + Uvicorn, proposed minimal wrapper around the reused Python functions |
| Tests | pytest; Vitest/Supertest; React Testing Library; a few Playwright journeys |
| Localization | i18next/react-i18next, en and my |
| Later mobile | Expo, React Native, Expo Router, TanStack Query, SecureStore |

FastAPI adds only a small Python HTTP interface; all product endpoints and authentication stay in Express. Do not spawn a Python process or refit the model for each browser request. First prove callable Python behavior locally, then introduce the persistent service.

Use the original working Python environment's versions where recoverable; otherwise choose tested compatible versions. Do not assume the system's newest Python can install the required scientific packages. Pin dependencies after a successful reproduction. Package versions in this plan are not an instruction to upgrade the original project.

For the web, initialize the exact opaque preset through the official CLI:

~~~sh
npx shadcn@latest init --preset beEhfqy2
~~~

Resolve it in the new Vite app; do not manually guess its colors/fonts. Match React/React Native versions to the selected Expo SDK later.

For Prisma 7 use ESM, the prisma-client generator with explicit output, CLI-supported Prisma configuration, and the SQLite driver adapter. Use one resolved database path for migrations and runtime. Pin compatible CLI/client/adapter 7.x versions; do not silently move to another major version.

## 6. Data preparation, catalog import, and scale

### One authoritative snapshot

1. Read the original CSV through a configurable path.
2. Apply the existing cleaning steps without altering the source.
3. Validate nonempty IDs and finite required feature values; record exclusions rather than inventing values.
4. Export cleaned catalog metadata and ordered ID mapping.
5. Fit StandardScaler on the chosen snapshot and build the existing nearest-neighbor model offline.
6. Save the feature matrix, scaler/model, ID mapping, and manifest together.
7. Import that exact catalog export into SQLite using an explicit API command.

The manifest records source checksum, cleaning/feature versions, row count, feature order, package versions, model version, catalog version, and artifact checksums. Requests and responses carry compatible catalog/model versions. Fail readiness on mismatched artifacts; do not combine a matrix with another snapshot's ID mapping.

Use an internal Track.id plus a unique pair (source, sourceTrackId). The original track_id is sourceTrackId; never use the CSV export index, song title, artist text, or current row number as the stable key. Upsert imports using the source key so feedback and playlists survive reimports.

Start with artistsText and optional albumName on Track. Artist search can return tracks matching their artist text. A separate Artist entity can be added later; do not infer reliable global artist identity from names or split strings without checking source conventions.

### Profiles for learning

| Profile | Target and purpose |
| --- | --- |
| Tiny | 30–50 deterministic tracks; approximately five demo users; quick UI and API tests |
| Development | Approximately 1,000 deterministic tracks spread across artists/genres; richer demo feedback and playlists |
| Full | All **89,740** cleaned songs in the inspected snapshot, not 114,000 unique songs |

Within a profile, the database and Python artifacts must use the same catalog version. If scaler fitting differs by profile, use distinct model versions; do not expect identical small/full rankings.

Use the same source-based IDs across profiles. Demonstrate full data only after the small pipeline is correct. Synthetic users/interactions are demo data, not evidence of real recommendation accuracy.

### Memory and latency

Keep the existing query-to-catalog brute-force cosine approach. Never materialize an N-by-N similarity matrix. At 114,000 rows, such a dense matrix has 12,996,000,000 entries, about 104 GB at float64 before overhead; these are calculated estimates.

The eight-feature matrix is much smaller. Load artifacts once per Python process; begin with one worker, bounded request concurrency, and batched import/query work. Measure actual resident memory and warm query time on the student's machine. Use bounded candidate overfetch and filtering; return fewer results honestly if filters exhaust candidates.

Do not add approximate neighbors, another database, or retrain on each interaction. Model rebuilds are explicit offline operations. Refresh artifacts/catalog as a matched release; retain a rollback snapshot.

Load only locally generated trusted artifacts. Pickle/joblib-based files can execute code when loaded; no model-upload endpoint. Keep artifact producer and consumer environments compatible.

## 7. Recommendations and personalization

### Stage A: preserve “similar songs”

Input: a selected stable song ID and requested result count. Run the original standardized-feature/cosine-neighbor model and return comparable similar songs. Keep this working even before accounts exist.

Return raw cosine similarity separately from an optional UI display score. Cosine similarity is not a calibrated preference percentage. If retaining the old clipped percentage for comparison, label it “Feature similarity” and document the clipping.

### Stage B: personalize using the same model

Proposed first personalization method, to be implemented after baseline parity:

- For a user with likes, query neighbors for up to 20 most recently liked, feature-backed songs; union the candidate results.
- Score candidates by mean cosine similarity to those seed songs, using the same fitted scaler and feature space.
- Exclude the seeds, all explicitly liked songs, all disliked songs, and unpublished/ineligible records.
- Break ties by source track ID. Prefer at most two songs per identical artist-text group in a 20-song feed; relax if needed. This grouping is an approximation, not verified artist identity.
- Dislike initially means exclusion of that song, not automatic rejection of its whole genre.
- Playlist additions and preview completion do not automatically become likes.
- Optional recent-history downranking is a later, separately evaluated refinement.
- Invalidate recommendation cache when feedback changes; include user feedback version, catalog version, and model version in keys.

This is a personalization layer around the existing nearest-neighbor engine. The current script only handles one chosen song; it does not already implement user profiling or online learning.

### Cold start and failure handling

- Ask a new user to choose or like a few songs; browsing can be skipped.
- With no usable likes, show a curated or dataset-popularity feed labeled “Popular picks — personalize with likes.” Dataset popularity is a historical source field, not live weekly popularity.
- A disliked-only profile still receives eligible cold-start picks with dislikes removed.
- Unknown/missing-feature likes do not cause a crash; show a clear reason and use remaining seeds.
- If Python is unavailable, search, login, feedback, and playlists still work. Similar-song requests return a retryable error; the personal feed may return labeled fallback picks with mode=fallback.
- Never label a fallback result as AI-generated personalized output.
- Recommended results need not have audio.

### Quality evaluation

- Reproduce fixed baseline examples before changing logic; compare ID sets/scores with tolerances and documented tie handling.
- Check seed exclusion, deduplication, known IDs, dislike exclusion, determinism, cold start, and correct ID/matrix alignment.
- Use a short human review rubric: variety, plausibility of musical similarity, and clarity of reasons.
- Report catalog coverage, artist-text diversity, and query latency.
- Evaluate ranking with Precision@K/Recall@K only when meaningful held-out interactions exist; avoid including held-out likes in the profile. Synthetic feedback can test logic, not establish real preference accuracy.
- Do not promise a numerical accuracy target without a suitable evaluation dataset.

## 8. Feedback, playlists, and history

### Like/dislike

One TrackFeedback row per (userId, trackId), with value LIKE or DISLIKE. Absence means neutral. Setting one replaces the other transactionally; clearing removes it. Repeating the same request is idempotent.

The UI shows active state and an undo/clear action. Dislikes immediately exclude the song from personalized/cold-start recommendations, while leaving search results visible with the dislike state. Users can review and clear dislikes.

### Playlists

Start with private playlists only: create, rename, delete, add/remove, and reorder tracks. Enforce owner access in Express. Default names/descriptions are user text, not translated catalog metadata.

A track appears once per playlist. Reorder in a transaction, with a playlist version to reject stale edits. Public sharing/collaboration is later work.

### History

Record meaningful explicit actions such as opening song details or selecting “Find similar,” with event ID, track ID, type, and timestamp. Reading a page of search results is not listening.

No listening events are generated in metadata-only mode. Authorized previews may add playback events later, bounded by actual playback time rather than seek position.

History is optional and can be disabled or cleared. Explicit feedback and playlist membership are separate saved preferences; clearing history does not clear them. Explain this distinction and offer separate feedback clearing. Default event retention: 90 days, configurable; expired events are removed by a documented maintenance command. Avoid storing raw search text initially.

## 9. Authentication and authorization

- Public browsing, song/artist search, and similar-song recommendations.
- Login required for personalized recommendations, feedback, playlists, profile, and history.
- USER and ADMIN roles; admin routes require server-side checks.
- Register with normalized unique email, Unicode display name, and a 12–128 character password; hash using Argon2id.
- Validate JWT algorithm, signature, issuer, audience, expiry, and subject. Keep secrets only in the API.
- First learning checkpoint: 15-minute access JWT in memory; page reload/expiry requires login again, visibly explained.
- Before web release: rotating opaque refresh sessions, hashed server-side, carried in HttpOnly production-Secure cookies with origin/CSRF controls. Serialize client refresh calls; revoke token families on reuse.
- Logout revokes refresh credentials. Password change/account suspension increments sessionVersion so protected requests reject old access tokens.
- Native refresh transport and SecureStore are implemented only in the later mobile phase. Do not store browser refresh tokens in localStorage.
- Rate-limit login and recommendation calls; validate IDs/counts and bound JSON request size. Redact tokens/passwords from logs.
- Allowlist CORS origins. Return 404 for another user's private playlist.
- Public request bodies cannot set role/status. Provision admins through an explicit local maintenance command; preserve the last active admin.
- No email verification or password recovery is promised in the first release; disclose that limitation before public deployment.

## 10. Data model and API surface

### Initial Prisma entities

| Entity | Fields / constraints |
| --- | --- |
| User | id, email unique, passwordHash, displayName, role, status, sessionVersion, locale, currency, historyEnabled, feedbackVersion |
| Track | id, source, sourceTrackId, title, artistsText, albumName optional, genre, popularity optional, durationMs optional, explicit, status, catalogVersion, searchTitle, searchArtists; unique source/sourceTrackId |
| TrackFeedback | userId, trackId, value, updatedAt; unique user/track |
| Playlist | id, ownerId, name, description optional, version, timestamps |
| PlaylistTrack | playlistId, trackId, position; unique playlist/track and playlist/position |
| InteractionEvent | userId, eventId, trackId, type, occurredAt, receivedAt; unique user/eventId |
| CatalogImport | catalogVersion, sourceChecksum, cleaningVersion, rowCount, importedAt |
| RefreshSession | userId, tokenHash, familyId, expiry, revocation and replacement fields; release hardening stage |
| AdminAuditLog | actorId, action, target ID, safe summary, timestamp; admin stage |

Keep numeric feature/model artifacts in Python initially, rather than duplicating a second editable feature pipeline in Express. SQLite owns user/product state. Raw CSVs, model binaries, and the live SQLite file are not browser assets.

Normalize searchable text to Unicode NFC; support English lowercase and Burmese substring matching. Paginate results. Substring scans may remain linear despite indexes; benchmark on the full catalog before adding FTS. Never label the dataset's artist text as a verified artist account.

### Public Express contract

Base: /api/v1. Responses use camelCase, stable IDs, ISO 8601 UTC times, and a consistent data/error envelope. List pagination: page=1, limit=20, maximum 100. Document schemas incrementally in api/openapi.yaml.

| Endpoint | Meaning |
| --- | --- |
| GET /health/live, /health/ready | API process/database health; report recommender as a separate dependency state |
| GET /tracks, /tracks/:id | Catalog list/details |
| GET /search?q=...&type=track\|artist | Title search or artist-text match, returning tracks with IDs |
| GET /tracks/:id/similar?limit=5 | Existing Python recommendation behavior through Express |
| POST /auth/register, /auth/login | Registration/login |
| POST /auth/refresh, /auth/logout | Session lifecycle; refresh added before release |
| GET /me, PATCH /me | Profile and allowed preferences |
| POST /me/password | Current-password verification and session revocation |
| GET /me/feedback?value=LIKE\|DISLIKE | Feedback lists |
| PUT /me/feedback/:trackId | Body value=LIKE or DISLIKE |
| DELETE /me/feedback/:trackId | Clear to neutral |
| GET /me/recommendations?limit=20 | Personalized or explicitly labeled cold-start/fallback feed |
| GET /me/playlists, POST /playlists | Own playlists and creation |
| GET/PATCH/DELETE /playlists/:id | Owner-only details/rename/delete |
| POST /playlists/:id/tracks | Add a track |
| DELETE /playlists/:id/tracks/:trackId | Remove a track |
| PUT /playlists/:id/order | Ordered track IDs and current version |
| POST /me/interactions, GET/DELETE /me/history | Idempotent events, history, clearing |
| GET /config | Locales, supported currencies, accessMode=FREE, optional-preview feature flag |
| GET /admin/tracks, PATCH /admin/tracks/:id/status | Admin metadata review and publish/archive |
| GET /admin/users, PATCH /admin/users/:id/status | Admin account status management |

Use 400 validation, 401 authentication, 403 role, 404 absent/private resource, 409 conflict/version mismatch, 429 rate limit, and 503 unavailable recommendation service. Errors include a stable code, messageKey, and requestId; expose no stack traces.

### Private Python contract

Proposed loopback URL: http://127.0.0.1:8000. Private endpoints:

- GET /health: readiness, modelVersion, catalogVersion.
- POST /v1/similar: catalogVersion, seedTrackId (source ID), limit.
- POST /v1/personalized: catalogVersion, bounded likedTrackIds, excludedTrackIds, limit.
- Response: modelVersion, catalogVersion, results [{ sourceTrackId, cosineSimilarity, reasonCode, seedSourceTrackId? }].

No user emails, passwords, JWTs, or full history are sent to Python. Express maps internal IDs to source IDs before requests and back after responses.

Bind Python to loopback locally. Configure a private network plus a service credential before remote deployment; it is not a public CORS-enabled client API. Set a five-second timeout initially, bounded payloads/concurrency, and no automatic unbounded retries. Validate returned IDs/scores and cap candidate counts. Use a synchronous Python handler or controlled worker execution for CPU-bound work.

If excluded IDs grow beyond a bounded request payload, filter final results in Express and use bounded overfetch; do not truncate dislike enforcement. Return fewer results if necessary. Do not let a catalog mismatch silently trigger arbitrary ID mapping.

## 11. Website and later mobile

### Web routes

- /: discovery and popular/cold-start picks.
- /search: title/artist-text search and pagination.
- /tracks/:id: metadata and “Find similar songs.”
- /login, /register: account forms.
- /for-you: authenticated recommendations and reason labels.
- /library/liked, /library/disliked: editable feedback.
- /playlists, /playlists/:id: private playlist management.
- /history, /settings: personal controls.
- /admin/tracks, /admin/users: later web admin tools.

Use TanStack Query for server data and cache invalidation, React Router for URLs, and ordinary component/context state for the first UI. Add another state library only when a real need appears. Debounce search, cancel stale requests, and include loading/empty/error/retry states.

Support 360 px through desktop widths, keyboard navigation, visible focus, readable contrast, and Burmese fonts/wrapping. Use translation keys from the first UI; complete English/Burmese coverage in the polish milestone.

### Mobile after web

Create mobile only after the web acceptance gate. Use Expo Router, native components, TanStack Query, and the existing Express contract. shadcn/ui web components are not imported into React Native. Store native refresh credentials in SecureStore.

Begin with Android on the student's Windows setup. iOS device/build verification is a later step; a local iOS simulator requires macOS. Use a device-reachable API address instead of localhost on the phone. Keep metadata discovery, feedback, playlists, and recommendations as the initial mobile scope.

## 12. Audio, source attribution, and currency

### Metadata-first audio policy

The dataset contains metadata/features, not permission to distribute recordings or artwork. In this release, cards show metadata and generated neutral artwork placeholders; there is no play button for missing audio.

Do not download audio/artwork from Spotify IDs, scrape external sources, or expose the CSV as a static download. Keep dataset source/attribution records and check applicable dataset terms before public redistribution. The linked repository advertises a license, but this inspection does not establish independent audio/artwork rights.

Optional later previews must be user-owned or explicitly permitted for this use. Store a rights/source record and the allowed use for each asset. If no permitted source exists, skip the preview milestone without blocking the metadata product.

If enabled: clips are at most 30 seconds, assets themselves contain only the authorized clip, user action starts playback, only one clip plays at a time, and missing clips never block recommendations. Public hosting, caching, and proxying must comply with the selected source's terms; do not assume every authorized external preview can be rehosted.

### USD/MMK configuration

Store supportedCurrencies=[USD, MMK] and a user display preference independently of locale. accessMode is FREE. No prices, billing entities, checkout, currency conversion, or exchange-rate requests are needed.

If demonstrating formatting, use clearly labeled sample values with explicit currency codes. Any future real prices require separately defined exact amounts/scales and pricing decisions; no inferred USD/MMK conversion. Currency choice never gates features.

## 13. Local operation, deployment, and release gates

Proposed ports: web 5173, API 4000, Python 8000. Keep each process in a separate terminal during learning; no Docker requirement.

Configuration:

- app: public VITE_API_BASE_URL only.
- api: DATABASE_URL, PORT, JWT secret/issuer/audience, allowed web origins, RECOMMENDER_BASE_URL, expected catalog version, and release session settings.
- recommender: source CSV path, artifact directory, selected data profile, and later a service credential.
- mobile: public EXPO_PUBLIC_API_BASE_URL later.

Never put secrets in VITE_ or EXPO_PUBLIC_ settings. Use separate Python virtual environments and independent Node package files. The original absolute data path is local configuration, not a required path for other developers.

Scripts and commands in ROADMAP.md are **future implementation contracts**, not commands that work today. Only documentation is delivered now. Add each script when its milestone is implemented and explain its parameters in that component's README.

Before a local web demonstration:

- Search → choose song → similar recommendations works through Express to the reused Python engine.
- Register/login → like/dislike → personal feed → playlist works.
- History accurately records interactions, never fictitious listening.
- The full matched catalog/model snapshot has been benchmarked.
- No forbidden source edits, audio distribution, payment dependencies, or root Git repository exist.

Before a hosted web release:

- Session rotation/revocation, ownership/role checks, exact CORS and CSRF controls are tested.
- Locale coverage, responsive/accessibility checks, and recommendation failure states are verified.
- Source attribution and dataset publication terms are documented.
- Deploy Express with persistent SQLite storage and Python as a private service with its artifacts. Start with one instance/worker each.
- Apply migrations explicitly; never auto-reset or auto-seed production.
- Back up SQLite consistently and retain matched model/catalog artifacts; demonstrate a restore.
- No refresh tokens, model internals, original local paths, or credentials leak through public responses.
- Record machine specifications and measured search/query latency/memory; tune from measurements rather than promise production scale.

Mobile completion is **not** a condition for finishing the first web release.

## 14. Clarifications and remaining decisions

Answered:

- Existing source locations and source dataset are known and inspected.
- The stable source field is track_id; uniqueness is verified after cleaning.
- Metadata-first release is confirmed; previews wait for an authorized source.
- English/Burmese and a later web admin area remain in scope.
- No original file changes are authorized.

Before the first coding milestone, locate or establish a compatible Python environment and reproduce the inspected behavior with pandas. Confirm any unexpected count/version discrepancy with the user before changing cleaning rules. There are no remaining essential product questions blocking the documentation; future source-file edits or new audio providers require specific agreement.

## 15. Technical references

- [scikit-learn cosine similarity](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.pairwise.cosine_similarity.html): cosine uses normalized vector dot products; scores are feature similarity.
- [scikit-learn model persistence](https://scikit-learn.org/stable/model_persistence.html): compatible dependency environments and trusted artifact loading.
- [FastAPI first steps](https://fastapi.tiangolo.com/tutorial/first-steps/): the proposed small internal HTTP wrapper.
- [Prisma 7 SQLite connector](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite): SQLite configuration and driver adapter.
- [shadcn CLI](https://ui.shadcn.com/docs/cli): resolve the exact requested preset through the CLI.
- [Expo environment setup](https://docs.expo.dev/get-started/set-up-your-environment/): later native development.

## 16. Full platform expansion plan

These features restore the broader platform scope while protecting the beginner-friendly core. They build on the existing API and Python engine rather than replacing either. Start them after the core web release, one milestone at a time.

### Artist, album, genre, and mood discovery — M21

- Add artist profiles with credited tracks, album pages with ordered tracks, artist follows, and saved albums.
- Keep the original source artist string as provenance. Names alone are not guaranteed identities; inspect artist separators and duplicate album names before creating canonical records.
- Use internal IDs and a documented mapping/version. Do not infer that an album name uniquely identifies an album or invent release dates, biographies, or commercial artwork.
- Provide metadata-only artist/album pages with neutral placeholders when verified extra information is unavailable.
- Preserve the original model's first-row genre during baseline comparisons. Add aggregated genre associations from duplicate source rows as separately versioned metadata; that need not change the eight audio features.
- Mood tags can be explicitly curated or derived from documented feature thresholds and labeled accordingly. They are not new ground-truth labels.
- Add Artist, Album, TrackArtist, Genre, TrackGenre, Mood, TrackMood, FollowedArtist, and SavedAlbum entities as needed. Migrations preserve Track IDs and existing feedback/playlist links.
- Add routes /artists/:id, /albums/:id, /genres/:slug and their paginated API counterparts; GET /me/following and /me/albums with idempotent PUT/DELETE operations.
- Genre/artist browsing, follow state, saved albums, and filters must work without audio. Use these new preferences for ranking only through a separately evaluated model change.

### Shareable playlists and curated home — M22

- Extend Playlist with PUBLIC/PRIVATE visibility; new playlists remain private unless the owner chooses otherwise.
- Public playlists have read-only share pages. Owners retain all write access; collaboration remains outside scope.
- Add GET /playlists for public discovery and visibility-aware GET /playlists/:id. Enforce privacy on both metadata and track-list endpoints.
- Add FeaturedSection and typed FeaturedItem records with order, active state, English/Burmese titles, and optional schedules.
- Home may show For You, Popular in the Dataset, Recently Added to This Catalog, Genre Picks, Featured Playlists, and Recent Interactions.
- Name sections honestly: source popularity is not live weekly popularity, source import time is not music release time, and metadata interaction is not listening.
- Keep editorial picks visibly distinct from personalized AI results. Filter archived/private/ineligible targets when reading sections.

### Expanded administration and sample data — M23

- Grow basic admin tools into paginated catalog/user/taxonomy/featured-content management with validation, publish/archive controls, bilingual editorial titles, and safe aggregate summaries.
- Imported audio features/source IDs are read-only in ordinary catalog forms. Corrected source metadata requires an explicit import/version procedure; newly created tracks without features are labeled ineligible for similarity recommendations until prepared.
- Provide aggregate counts and operational issues, not unnecessary private listener history or invented live charts.
- Audit administrative writes and prevent removal of referenced entities or the final active administrator.
- Keep the tiny development profile. Add an optional richer demo profile targeting about 50 users, 100 public/private playlists, 2,000 feedback records, and 20,000 synthetic interaction events where the chosen catalog has enough eligible content.
- Artist/album counts come from validated mappings, not fixed invented quotas. The full music catalog remains the verified 89,740-song snapshot unless a new source/cleaning version is explicitly introduced.
- Use stable seeded IDs, repeatable randomness, a configurable reference date, and upserts. Mark synthetic people/events clearly; they test functionality, not real-world recommendation quality.
- Demo admins/credentials are development-only and explicit. Destructive reset commands must refuse normal/production operation and state which demo data they remove.

### Persistent authorized preview player — M24

Prerequisites: M18 has confirmed rights and a working preview source; catalog metadata works independently.

- Add a global mini-player that survives web navigation, a full player view, and an editable local queue.
- Support play/pause, seek within the clip, next/previous, shuffle, repeat off/one/all, and volume where supported.
- Play at most one preview at a time; autoplay requires an initial user action. Show actual clip duration and a visible Preview label.
- Track full-song duration and preview duration separately. Keep audio assets themselves limited to authorized clips of at most 30 seconds.
- Persist queue metadata locally, but require an explicit action to resume audio after reopening. Active queues remain client-local; saved library data is server-backed.
- Missing clips show an unavailable state and never exclude a song from search, recommendations, or playlists. Bound retries and advance/stop predictably after failures.
- If hosting permitted clips locally, implement correct byte-range responses, MIME types, duration/type/size validation, generated storage keys, and publication access checks. Do not add an upload/transcoding pipeline without a demonstrated need.
- Add listening history only for measured playback, not seeking or displaying a card. Keep it distinct from interaction history and respect recording preferences.
- Initial mobile previews remain foreground-only; native background playback is a separate future decision.

### Platform expansion acceptance

- A listener can browse an artist/album, follow/save it, and retrieve those collections after login.
- A private playlist never leaks through public discovery, share routes, or featured sections.
- Public playlists can be viewed without allowing another user to edit them.
- Admin-curated discovery works in English/Burmese with eligible published content only.
- Added schema relationships preserve all existing song IDs and recommendation mappings.
- The Python baseline and explicit dislike exclusion still pass after each expansion.
- Optional demo data can be regenerated without duplicating records or overwriting unrelated user data.
- Preview functionality remains disabled if rights are unresolved; no audio is needed to pass the metadata platform release.
- When a richer preview player is enabled, navigation, clip-end behavior, queue failure recovery, and recording controls pass their own checks.

## 17. Balanced definition of done

The university project can be demonstrated successfully at the end of Release A, with a working AI web platform and documented evaluation. Releases B–D grow it toward the full platform vision without making the first achievement depend on every feature.

Each delivered component installs and runs independently, uses the required stack, documents its contract, and has checks appropriate to its behavior. Markdown and HTML review editions describe the same release boundaries. No application implementation, repository creation, original source modification, or payment integration is part of this specification update.
