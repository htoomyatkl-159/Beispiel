# M02 — Standalone Express API

Status: **Complete**  
Approved plan: SPEC.md Version 3.0 and ROADMAP.md Version 3.0  
Next gate: **M03 requires explicit approval**

## Implemented

The independent api project uses Node.js, TypeScript, and Express. GET /api/v1/health/live returns JSON 200 with status=ok and a server-generated request ID. It needs no Python process or other service.

Unknown resources use the common JSON 404 envelope. Malformed/oversized JSON, unsupported request encoding, deliberately safe application errors, and unexpected sync/async failures share consistent error fields: code, messageKey, message, and requestId. Unexpected failures expose no stack traces or private error details.

Configuration uses HOST, PORT, and NODE_ENV with validation and safe local defaults. Node loads the local .env file for dev/start; .env.example is the documented template. The actual .env is ignored for future repository tracking.

Independent npm scripts provide dev, build, start, typecheck, test, and test:watch. Exact dependencies are recorded in api/package-lock.json. Initial API documentation is api/openapi.yaml.

## Important files

- app.ts builds the request handler without opening a port. This keeps it independently testable.
- server.ts starts/stops the listening process and gives readable startup failures.
- config.ts checks text environment settings before startup.
- request-context.ts creates IDs connecting each response with a minimal error event.
- errors.ts is the single place that converts errors into the public JSON format.
- tests use Vitest to run assertions and Supertest to send real HTTP requests to temporary local test servers.

The full beginner guide, setup commands, environment details, and troubleshooting are in [api/README.md](../api/README.md).

## Verification

| Check | Result |
| --- | --- |
| npm run typecheck | Passed |
| npm test | 24 passed across four test files |
| npm run build | Passed |
| npm start | Compiled server started successfully |
| Real HTTP GET health | 200, JSON status=ok, correlated request ID |
| Real HTTP unknown path | JSON 404 NOT_FOUND |
| Invalid PORT startup | Clear error and exit code 1 |
| Occupied port startup | Clear error and exit code 1 |
| npm run dev | Watch mode started and responded on port 4000 |
| Protected original/M00/M01/plan files | 46 files unchanged, including content and file modification times |

The first HTTP test run was blocked by the managed environment's loopback connection restrictions (EACCES). The unchanged tests passed after local network access was allowed. Registry downloads similarly required permitted network access. No replacement or imitation of Vitest, Supertest, Express, or TypeScript was used.

The full Python test suite was not rerun because M02 did not modify any Python work. Preservation was checked against the captured fingerprints and original/recommender file sets. M00/M01 retain their previously recorded 25 passing checks.

Machine-readable results and installed versions: [m02-results.json](./m02-results.json). The protected-file snapshot is [m02-preservation-before.json](./m02-preservation-before.json).

## Open and test it

The development server was left running for review at:

[http://localhost:4000/api/v1/health/live](http://localhost:4000/api/v1/health/live)

This page displays JSON, not the future React website. If the process has stopped, restart it from Windows PowerShell:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\api'
npm run dev
```

Do not start a second server on the same port while the first is running. Ctrl+C stops a server you started in that PowerShell window.

From a separate PowerShell window:

```powershell
Invoke-RestMethod -Uri 'http://localhost:4000/api/v1/health/live' |
    ConvertTo-Json -Depth 5

curl.exe -i http://localhost:4000/api/v1/missing
```

To rerun automated checks (the test suite starts its own temporary servers):

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\api'
npm run typecheck
npm test
npm run build
```

## Preserved scope

The original Python project/dataset, M00/M01 implementation and artifacts, M00 fixture, SPEC.md, and ROADMAP.md are unchanged. The API imports no sibling source. No repository, Prisma schema, SQLite database, authentication, Python HTTP integration, or React app was created.

M03 will add the catalog database/import/search after approval. M04 provides the first React browser screens. M05/M06 connect the Python recommender to the site. M02 ends here.
