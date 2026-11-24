# Beispiel

**Discover Music Beyond the Ordinary.**

Beispiel is a metadata-first music discovery application. It supports catalog search, explainable similar-song recommendations, authentication, per-user LIKE/DISLIKE feedback, and a For You experience built from real feedback and the existing Python cosine-similarity engine. It does not distribute copyrighted audio or provide full-song streaming.

## Run locally

Start the private recommender, API, and web app in three PowerShell windows:

```powershell
cd D:\music_recommendation_app\recommender
& ".\.venv\Scripts\python.exe" -B -m uvicorn service.main:app --host 127.0.0.1 --port 8000

cd D:\music_recommendation_app\api
npm install
npm run db:deploy
npm run dev

cd D:\music_recommendation_app\app
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`. Copy `api/.env.example` to `.env` only when configuring a local environment; never commit real secrets.

## Tests

Run `npm test`, `npm run typecheck`, and `npm run build` in both `api` and `app`. Run the Python unittest suite from `recommender`. Some Supertest tests may require a host environment that permits loopback listeners.

## Limitations

The development catalog contains 40 songs. For You aggregates Python recommendations from liked seed tracks; it is not collaborative filtering and does not claim to infer mood, popularity, or enjoyment probability. Audio playback, payments, mobile, OAuth, and refresh tokens are deferred.
