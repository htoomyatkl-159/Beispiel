# M05 — Private Python recommendation service

Completed: 2026-11-05  
Status: **Complete**  
Next gate: **M06 requires explicit approval**

## What was implemented

M05 wraps the existing M01 content-based engine in a small FastAPI service. It loads one already-prepared artifact snapshot once at startup. Each request queries that fitted model; it does not rebuild the scaler, fit a model, read SQLite, or modify the original Python project.

Files added or updated:

- `recommender/service/settings.py` — reads the selected artifact profile and safe local artifact root.
- `recommender/service/schemas.py` — validates request and response fields with Pydantic.
- `recommender/service/main.py` — exposes `/health` and `/v1/similar`.
- `recommender/service/__init__.py` — marks the service package.
- `recommender/tests/test_service.py` — five focused service/contract tests.
- `recommender/requirements.txt` — adds FastAPI, Uvicorn, Pydantic, and HTTPX pins compatible with Python 3.14.
- `recommender/README.md` — adds M05 concepts, commands, and endpoint examples.

## Endpoints

`GET http://127.0.0.1:8000/health` reports the loaded profile, row count, catalog version, and model version.

`POST http://127.0.0.1:8000/v1/similar` accepts:

```json
{
  "sourceTrackId": "5SuOikwiRyPMVoIQDJUgSV",
  "catalogVersion": "catalog-v1-5b375897bac1e8f6dfa2",
  "limit": 5
}
```

The service returns source IDs, metadata, cosine distance/similarity, a reason code, and both artifact versions. Unknown IDs return 404, a mismatched catalog returns 409, and invalid fields return 422.

## Run it in PowerShell

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
$env:RECOMMENDER_ARTIFACT_PROFILE = 'tiny'
& '.\.venv\Scripts\python.exe' -B -m uvicorn service.main:app --host 127.0.0.1 --port 8000
```

Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) for the interactive API page. M06 will make Express call this service; the browser should not call it directly.

To use the 1,000-song or full prepared snapshot, set `RECOMMENDER_ARTIFACT_PROFILE` to `development` or `full`. The corresponding catalog must be imported into the API in a later approved milestone before IDs can be resolved by the website.

## Beginner explanation

FastAPI is the Python web framework that receives HTTP requests. Uvicorn is the small server process that keeps FastAPI running. Pydantic checks that incoming JSON has the expected fields and safe limits. The artifact snapshot is like a saved learning result: startup loads it once, and a request asks the saved model for nearby songs. This keeps the existing algorithm intact and avoids the slow, unsafe pattern of starting a new Python process for every click.

## Verification

- Focused M05 tests: **5 passed**.
- Live `/health`: **passed** with the tiny 40-song snapshot.
- Live `/v1/similar`: **passed** for `Comedy`, returning three stable source IDs and similarity scores.
- M00/M01 source and artifacts: preserved.
- Original project at `C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender`: not modified.

M06 is deliberately not started. It will add the Express client/route and React “Find Similar Songs” panel while keeping Python private.
