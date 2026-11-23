# Music Recommendation API — M03

A standalone Express/TypeScript API with a persistent SQLite catalog, using **Prisma 7.10.1**. The tiny M01 catalog is already imported: **40 published songs**. No Python service, authentication, React app, audio, or streaming is required.

Approved plan: root SPEC.md Version 3.0 and ROADMAP.md Version 3.0, unchanged. Implementation status lives in docs/development-status.md. M04 remains unapproved.

## Open search in your browser

The development API was left running on port 4000. Try:

- [All songs, first page](http://localhost:4000/api/v1/tracks)
- [Search titles for Comedy](http://localhost:4000/api/v1/search?q=Comedy&type=track)
- [Search artist text for Gen Hoshino](http://localhost:4000/api/v1/search?q=Gen%20Hoshino&type=artist)
- [Page two, five songs per page](http://localhost:4000/api/v1/tracks?page=2&limit=5)
- [Unchanged health check](http://localhost:4000/api/v1/health/live)

Your browser will show **JSON data**, which is the intended M03 result. A search box and visual React pages start in M04. Recommendations connect to the website in M05–M06.

To view song details, copy a record's **id** from a list/search result and append it to http://localhost:4000/api/v1/tracks/. Do not substitute sourceTrackId: that field is the original Python dataset identifier.

## Start the API and diagnose connection errors

Open Windows PowerShell:

~~~powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\api'
npm run dev
~~~

Keep the terminal open. Stop a server you started with **Ctrl+C**. Run only one server on port 4000; if it is already running, use its browser URLs rather than launching a second copy.

If the browser reports that it cannot connect, first check the liveness URL:

~~~powershell
try {
    Invoke-RestMethod -Uri 'http://127.0.0.1:4000/api/v1/health/live' -TimeoutSec 5 |
        ConvertTo-Json -Depth 5
} catch {
    Write-Host 'The API is not reachable. Start npm run dev in the API terminal and keep it open.'
}
~~~

The API is an ordinary long-running Node process. It does not start automatically when the React website starts, and the website cannot serve catalog data while the API process is stopped. A successful response contains `data.status` equal to `ok`.

## Fresh setup, independent of the Python checkout

Use a compatible supported Node version; this milestone was verified with Node 26.8.1 and npm 11.19.0.

~~~powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\api'
npm ci

if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}

npm run db:generate
npm run db:deploy

# This local metadata fixture is a byte-identical copy of the M01 tiny export.
# It has its matching manifest beside it; no sibling checkout is needed.
npm run catalog:import -- --file '.\tests\fixtures\tiny\catalog.csv'

npm run dev
~~~

When developing new schema changes, npm run db:migrate creates/applies migrations. For an existing checkout, db:deploy applies the committed migration without creating a new one. No reset/drop command is needed.

For the original M01 export input:

~~~powershell
npm run catalog:import -- --file 'D:\music_recommendation_app\recommender\artifacts\tiny\cosine-v1-26cae89bdf34991fa167\catalog.csv'
~~~

The API reads this explicit metadata file and its adjacent manifest; it never imports Python source or unpickles model files. Running the import again is supported. You should see rowCount: 40 and reusedCatalogVersion: true.

## Exact PowerShell search commands

While the API is running, open a second terminal:

~~~powershell
$result = Invoke-RestMethod -Uri 'http://localhost:4000/api/v1/search?q=Comedy&type=track'
$result | ConvertTo-Json -Depth 6

$artist = Invoke-RestMethod -Uri 'http://localhost:4000/api/v1/search?q=Gen%20Hoshino&type=artist'
$artist | ConvertTo-Json -Depth 6

$page = Invoke-RestMethod -Uri 'http://localhost:4000/api/v1/tracks?page=2&limit=5'
$page | ConvertTo-Json -Depth 6

# Fetch details using an internal ID returned by search:
$song = $result.data[0]
Invoke-RestMethod -Uri ('http://localhost:4000/api/v1/tracks/' + $song.id) |
    ConvertTo-Json -Depth 6

# Inspect status/body for an invalid limit or a missing track:
curl.exe -i 'http://localhost:4000/api/v1/tracks?limit=101'
curl.exe -i 'http://localhost:4000/api/v1/tracks/missing-id'
~~~

PowerShell normally throws on HTTP errors; curl.exe is used explicitly above to display the status and JSON body across Windows PowerShell versions.

## Endpoint contract

| Endpoint | Parameters | Meaning |
| --- | --- | --- |
| GET /api/v1/health/live | None | Process liveness; same M02 response |
| GET /api/v1/tracks | page, limit | Published catalog list |
| GET /api/v1/tracks/ | page, limit | Same list; trailing slash is accepted |
| GET /api/v1/tracks/:id | Internal track ID | One published song or JSON 404 |
| GET /api/v1/search | q, type, page, limit | Literal title or artist-text search |

- page defaults to 1, with allowed values 1–1,000,000.
- limit defaults to 20, with allowed values 1–100.
- q defaults to an empty string, is trimmed, and has a 200-character maximum. Empty search returns catalog suggestions in normal list order.
- type is track (default, title search) or artist (artist-text search). Artist searches still return **track records**, not inferred artist entities.
- English matching is case-insensitive. Search values and stored search text use Unicode NFC normalization; Burmese substrings are supported.
- %, _, punctuation, and SQL-like text are literal search text, not wildcard or executable syntax.
- Results sort by normalized title, then internal ID. Pagination order is stable; count/page data use one read transaction.
- Beyond the final page returns an empty data array while retaining the total.
- Unknown, repeated, malformed, or unsupported query parameters return JSON 400 VALIDATION_ERROR. Use /search for q/type; /tracks accepts only page/limit.
- Missing or archived songs return JSON 404 NOT_FOUND. Internal errors use the existing safe M02 envelope. A test/app instance without an injected database returns 503 CATALOG_UNAVAILABLE.
- There is no readiness endpoint yet, and no recommendation endpoint in M03.

Example list metadata:

~~~json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "hasNext": false,
    "requestId": "server-generated-uuid"
  }
}
~~~

Real records include id, source, sourceTrackId, title, artistsText, albumName, genre, popularity, durationMs, explicit, and catalogVersion. Internal normalized search fields and local file paths are not exposed.

The complete machine-readable route/schema description is [openapi.yaml](./openapi.yaml).

## SQLite and Prisma in plain language

**SQLite** stores database tables in one local file. Here the file is api/prisma/dev.db; it survives restarting Node.

**Prisma** is the database access layer. Its generated client lets TypeScript check calls such as finding a track by ID, while Prisma sends the database queries.

A **model** describes a table's fields and rules. Track is a song record; CatalogImport records where a catalog snapshot came from.

A **migration** is a saved change to the database structure. prisma/migrations contains the initial SQL instructions. Applying those instructions to a new empty database creates the same structure without copying a developer's live database file.

An **internal ID** is the API's opaque primary key. A **source key** is the pair source/sourceTrackId. For example, Comedy retains sourceTrackId 5SuOikwiRyPMVoIQDJUgSV. The unique source key lets an import find the same song again while preserving the internal ID.

A **transaction** is an all-or-nothing group of changes. If one imported row fails, the active snapshot, previous song states, and all inserts roll back together.

An **upsert** updates a matching record or inserts it if it is new. It makes repeated imports safe.

## Import integrity and snapshot selection

The importer verifies the actual export against its M01 manifest: checksum, header order, row count, ordered-ID digest, nonempty/unique IDs, required text, numeric fields, and explicit flag. It rejects the original dataset.csv because that is not the cleaned M01 export.

Track.sourceTrackId preserves the source ID exactly. Imported source text remains intact; normalized copies are used only for searching. No musical-feature computation or algorithm change occurs in this API.

The import transaction activates one catalog for this source and archives tracks absent from that selected snapshot. It never deletes track IDs. Reimporting the tiny snapshot restores its metadata/publication state without breaking IDs. CatalogImport records provenance, row count, catalog/model versions, and activation; reimport does not duplicate that version record. A conflicting version/provenance is rejected.

This is an explicit catalog-selection operation, not a merge of unrelated snapshots. Later feedback/playlist features can keep their stable track references. Normal startup never imports/resets/seeds data automatically.

Only the tiny catalog import is the M03 delivery target. Full-catalog import performance tuning belongs to the later scale milestone.

## Important files and settings

| File | Purpose |
| --- | --- |
| prisma/schema.prisma | Track/CatalogImport fields, unique source key, indexes, and foreign key |
| prisma/migrations/ | Committed database-structure changes |
| prisma7.config.ts | Prisma 7 CLI setup, sharing runtime's database-path resolver |
| src/database-url.ts | Resolves one absolute SQLite path from the API root |
| src/db.ts | Creates the Prisma 7 client with the better-sqlite3 adapter |
| src/init-database.ts | Safely opens/closes the file before migration commands |
| src/catalog/import.ts | Validates and transactionally imports the M01 metadata |
| src/catalog/import-cli.ts | Implements the explicit catalog:import command |
| src/catalog/validation.ts | Query/ID validation and search normalization |
| src/catalog/service.ts | Paginated database reads, literal search, and detail lookup |
| src/catalog/routes.ts | Connects the public URLs to the service |
| src/app.ts | Testable Express app; health needs no database query |
| src/server.ts | Creates/injects the database client and listens on the configured port |
| tests/catalog.test.ts | Actual isolated SQLite migrations/import/search tests |
| tests/fixtures/tiny/ | Forty-row M01 metadata/manifest copies for independent tests/setup |
| src/generated/prisma/ | Generated client, recreated with db:generate, ignored in Git |
| .env.example | Safe local environment template |
| package-lock.json | Pinned dependency installation |
| openapi.yaml | Public API contract |

DATABASE_URL defaults to file:./prisma/dev.db. Relative file paths resolve from this API root in both the CLI and runtime, not from two different folders. For this milestone, database paths must remain inside the API project. Tests explicitly use a separate api/.tmp directory.

HOST, PORT, and NODE_ENV retain M02 behavior. PowerShell environment variables take precedence over .env. No JWT secret or Python service URL is required. No private settings are returned by health/search.

The migration scripts first open and close the SQLite file. This avoids a fresh-file creation failure observed with this Prisma/Windows setup; it does not reset or clear an existing database. Prisma CLI/client/adapter are pinned to **7.10.1**; do not follow upgrade notices to Prisma 8 as part of this project.

The generated client is ESM TypeScript with explicit output. Both development execution and compiled JavaScript were verified. WAL and a bounded SQLite busy timeout are configured for local operation.

## Checks and compiled startup

~~~powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\api'
npm run db:generate
npm test
npm run typecheck
npm run build

# After stopping any existing dev server:
npm start
~~~

The final suite passed **50 tests in six files**, including all 24 M02 checks, 20 catalog checks, and six database-path checks. Tests apply the committed migration to a temporary database, never clear dev.db, and do not need the Python checkout. No test fault endpoints exist in the real app.

The tests cover repeat imports, persistent IDs after reconnection, database uniqueness/foreign keys, rollback after a deliberately failed write, snapshot switching, invalid exports, pagination, title/artist search, literal punctuation, Unicode/Burmese, no matches, validation, archived detail, and health regression.

Additional real-server smoke checks verified persistence after a process restart, title/artist/detail routes, and invalid-limit errors. Registry/engine installation needed a retry in the agent environment; the official Prisma engine was downloaded and both published SHA-256 checksums verified. No substitute database or Prisma implementation was used.

In a managed tool environment, Supertest needs permission for loopback connections. In normal Windows PowerShell, run the commands without opening an Administrator window.

## GitHub and scope

Keep schema, migrations, source, tests, OpenAPI, and lockfile. Generated client, local SQLite files/sidecars, node_modules, .env, and test databases are ignored. This milestone does not initialize a repository.

Metadata fixtures come from the user's M01 export of the [Spotify Tracks Dataset source repository](https://github.com/Moizah1/Music-pattern-Analysis). They contain no audio or commercial artwork; dataset provenance/terms should remain documented before a public release.

M03 adds **only Track and CatalogImport**. User accounts, feedback tables, playlists, React, and Python HTTP integration remain in their approved later milestones. The original Python project and recommendation algorithm are untouched.

Official implementation references: [Prisma 7 SQLite](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite), [Prisma configuration](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference), [Prisma generators](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators).

**M03 ends here. M04 requires explicit approval.**
