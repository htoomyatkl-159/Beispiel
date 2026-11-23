# M06 — Similar songs through Express and React

Completed: 2026-11-23  
Status: **Complete**  
Next gate: **M07 requires explicit approval**

## What changed

M06 connects the existing three layers without exposing Python to the browser:

`React song detail → Express /api/v1/recommendations/similar → private FastAPI /v1/similar → existing M01 model`

Express verifies the selected internal track ID in SQLite, sends its preserved `sourceTrackId` and `catalogVersion` to Python, validates the response, and resolves every returned source ID back to published website metadata. Unresolvable IDs are omitted rather than displayed as incorrect songs. The Python algorithm and database schema were not replaced.

## Important files

- `api/src/recommendations/client.ts` — timeout-aware private HTTP client and response contract validation.
- `api/src/recommendations/service.ts` — source-ID mapping, catalog-version checks, and metadata resolution.
- `api/src/recommendations/routes.ts` — validated `POST /api/v1/recommendations/similar` endpoint.
- `api/src/config.ts` and `.env.example` — `RECOMMENDER_BASE_URL` and timeout configuration.
- `app/src/lib/api.ts` — typed browser request through the existing `/api` proxy.
- `app/src/pages/TrackDetail.tsx` — Find Similar Songs button, loading, results, retry, and empty/error states.
- `app/src/locales/*.json` and `app/src/index.css` — bilingual labels and consistent responsive styling.
- `api/tests/recommendations.test.ts` — success, validation, and unavailable-service coverage.

## Run all three services

Terminal 1 — Python:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
$env:RECOMMENDER_ARTIFACT_PROFILE = 'tiny'
& '.\.venv\Scripts\python.exe' -B -m uvicorn service.main:app --host 127.0.0.1 --port 8000
```

Terminal 2 — Express:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\api'
Copy-Item -LiteralPath '.env.example' -Destination '.env' -ErrorAction SilentlyContinue
npm run dev
```

Terminal 3 — React:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\app'
npm run dev
```

Open `http://127.0.0.1:5173`, search `Comedy`, open the result, and click **Find similar songs**. The browser sends only the Express request; it never calls port 8000.

## Tests

- API: **53 passed** across seven test files.
- API typecheck: passed.
- API production build: passed.
- Frontend: **12 passed** across two test files.
- Frontend typecheck: passed.
- Frontend production build: passed.
- M00-M05 source/artifacts and original project remain preserved.

## Limitations

The website still uses the 40-song tiny catalog. The Python full artifact has 89,740 songs, but importing it is intentionally deferred until compatibility/performance evaluation. Similarity is content-based audio-feature similarity, not a probability that a user will like a song. Collaborative filtering, authentication, feedback, playlists, and hybrid fusion remain later milestones.
