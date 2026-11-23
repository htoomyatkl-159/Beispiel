# M03 — SQLite database and music catalog search

Completed: 2026-10-29  
Status: **Complete — M04 not started**  
Plan: approved SPEC.md Version 3.0 and ROADMAP.md Version 3.0, unchanged

## Delivered

- SQLite storage inside api/prisma/dev.db, with Prisma CLI, client, and adapter all pinned to 7.10.1.
- Track and CatalogImport models, generated ESM client, initial committed migration, and explicit generate/migrate/deploy scripts.
- The verified **40-song M01 tiny catalog**, with original track_id values preserved as sourceTrackId.
- Repeatable source-key upserts that retain internal IDs and do not duplicate songs/import-version records.
- Explicit snapshot activation and archival of absent records; no deletion of stable song IDs.
- Manifest/checksum/header/count/order/row validation before database writes, and transactional rollback on failures.
- Public list, detail, and title/artist-text search with stable pagination and safe structured errors.
- Updated OpenAPI and a standalone beginner README with exact PowerShell/browser examples.

The prompt listed both /tracks and /tracks/. Both work. The approved roadmap also specifies /tracks/:id and /search; those are implemented. No separate artist entities or other future models were added. User/auth/feedback/playlist models remain outside M03.

## Try the running API in your browser

- [Search Comedy by title](http://localhost:4000/api/v1/search?q=Comedy&type=track)
- [Search Gen Hoshino by artist text](http://localhost:4000/api/v1/search?q=Gen%20Hoshino&type=artist)
- [Browse page two with five songs](http://localhost:4000/api/v1/tracks?page=2&limit=5)
- [All songs, default page](http://localhost:4000/api/v1/tracks)
- [Original M02 health endpoint](http://localhost:4000/api/v1/health/live)

These pages intentionally show JSON. The visual React website starts after M04 approval; this milestone does not generate a frontend.

If the server has stopped:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\api'
npm run dev
```

Use the already-running server rather than starting a second one on port 4000. Ctrl+C stops a server in your own PowerShell window.

## PowerShell verification

```powershell
$result = Invoke-RestMethod -Uri 'http://localhost:4000/api/v1/search?q=Comedy&type=track'
$result | ConvertTo-Json -Depth 6

$song = $result.data[0]
Invoke-RestMethod -Uri ('http://localhost:4000/api/v1/tracks/' + $song.id) |
    ConvertTo-Json -Depth 6

Invoke-RestMethod -Uri 'http://localhost:4000/api/v1/search?q=Gen%20Hoshino&type=artist' |
    ConvertTo-Json -Depth 6
```

The Comedy record preserves sourceTrackId 5SuOikwiRyPMVoIQDJUgSV and catalogVersion catalog-v1-5b375897bac1e8f6dfa2, matching the Python tiny snapshot. Its separate internal ID is returned by the API and stays stable across reimport/restart.

## Fresh setup and repeat import

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\api'
npm ci
if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
}
npm run db:generate
npm run db:deploy
npm run catalog:import -- --file '.\tests\fixtures\tiny\catalog.csv'
```

The fixture/manifest are byte-identical metadata copies of the M01 tiny export, allowing the API and its tests to work independently of the Python checkout. To import directly from the existing prepared snapshot instead:

```powershell
npm run catalog:import -- --file 'D:\music_recommendation_app\recommender\artifacts\tiny\cosine-v1-26cae89bdf34991fa167\catalog.csv'
```

Repeated import reported rowCount 40 and reusedCatalogVersion true. It did not duplicate records. Normal server startup never imports or resets data automatically.

The migration wrapper safely opens/closes the SQLite file before invoking Prisma. This addresses an observed Windows first-file creation failure without changing the schema or dropping data. Applying migrations to an already migrated database reported no pending migrations.

## Concepts in simple language

**SQLite:** the database is a file that stores tables. Closing Node does not erase it.

**Prisma:** a TypeScript database tool. Its generated client checks field names/types and sends database queries.

**Model:** a table description. Track describes songs; CatalogImport describes a catalog snapshot's provenance and version.

**Migration:** saved SQL instructions that create/change the table structure. Keep migrations in the eventual GitHub repository; do not commit your live database file.

**Primary versus source key:** the internal id belongs to this API. The unique source/sourceTrackId pair identifies the original song so the future Python integration can find it and repeated imports retain the same internal record.

**Transaction:** all changes succeed together, or none do. The automated rollback check deliberately fails one insert and confirms the old catalog stays intact.

## Endpoint behavior

Lists accept page (default 1) and limit (default 20, maximum 100). Search additionally accepts q and type=track|artist, with track as the default. A missing/blank q returns catalog suggestions. Maximum page is 1,000,000 and maximum q length is 200 characters.

English matching is case-insensitive; stored/query search text uses Unicode NFC. Burmese matching and literal punctuation are tested. %, _, and SQL-like input remain literal text. All query values use bound database parameters.

Public results sort by normalized title and internal ID. Artist-text search still returns songs. Missing/archived song details use JSON 404; bad query parameters use JSON 400. No private paths, normalized search columns, audio, or model binaries are returned.

## Verification evidence

| Check | Result |
| --- | --- |
| npm test | **50 passed, six test files**, 2.64 seconds in the final run |
| Existing M02 regressions | All 24 retained and passing |
| New catalog checks | 20 passing |
| Database-path checks | Six passing |
| npm run typecheck | Passed |
| npm run build | Passed |
| Prisma package versions | CLI/client/adapter all 7.10.1 |
| Initial migration + later deploy | Applied; subsequent deploy had no pending migrations |
| Real tiny import twice | 40 songs; same catalog version, no duplicates |
| Compiled-server health/list/search/detail | Passed through real HTTP |
| Invalid limit through real HTTP | Structured 400 |
| Server restart | Same internal ID persisted |

Database tests apply the real migration to an isolated api/.tmp database. They do not reset dev.db. They cover unique/foreign-key constraints, failed-import rollback, incompatible provenance, repeat import, snapshot switching, pagination, detail access, archived records, literal/Unicode searches, malformed parameters, and health preservation.

A registry download was interrupted during installation, and the Prisma engine hook stalled. Installation was completed using the official packages; the official schema-engine download was verified against both published compressed and executable SHA-256 values. The actual Prisma client, adapter, migration CLI, and native SQLite driver were exercised; no substitutes were introduced.

M00/M01's Python tests were not rerun because Python work was unchanged. File preservation is verified separately, including the original project, recommender source/artifacts/fixtures, and approved documents. See [m03-results.json](./m03-results.json) and [the before snapshot](./m03-preservation-before.json).

## Scope and next gate

Original Python source/data and the recommendation algorithm are untouched. No React, authentication, playlists, Python HTTP integration, copyrighted audio, or streaming was implemented. The two new product tables are Track and CatalogImport; other specification models remain in their assigned milestones.

M03 is complete. **M04 requires explicit user approval.** The next step is a React catalog/search interface using this API; AI recommendations connect through M05–M06.
