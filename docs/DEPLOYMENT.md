# Deployment preparation

This repository is prepared for a Vercel frontend and two Railway services, but cloud deployment has not been completed.

## Vercel

Set the project root to `app`, install with `npm ci`, build with `npm run build`, and publish `dist`. The included `vercel.json` provides SPA fallback for React Router. Configure `VITE_API_BASE_URL` to the public Express URL ending in `/api/v1`.

## Railway API

Use root `api`. Build with `npm ci && npm run db:generate && npm run build`; start with `npm run db:deploy && npm run start`. Set `HOST=0.0.0.0`, Railway's `PORT`, `NODE_ENV=production`, a strong `JWT_SECRET`, the exact frontend origin, and `DATABASE_URL=file:/data/dev.db`. Mount a persistent volume at `/data`. `database-url.ts` permits this path only when `NODE_ENV=production`.

For separate Vercel and Railway domains, use HTTPS and `AUTH_COOKIE_SAMESITE=none`. The API still requires the exact configured origin and credentialed CORS; never use a wildcard origin.

## Railway recommender

Use root `recommender`, install `requirements.txt`, and start with `python -m uvicorn service.main:app --host 0.0.0.0 --port $PORT`. Keep the service private and set `RECOMMENDER_ARTIFACT_PROFILE=tiny` and `RECOMMENDER_ARTIFACT_ROOT=/app/recommender/artifacts`. The small prepared snapshot is now allowed to be published with the repository; do not publish the full generated dataset without a size and licensing review.

The API should call the Python service through Railway private networking, using the generated private hostname in `RECOMMENDER_BASE_URL`.

## Verification

Check the API live health endpoint, Python `/health`, registration/login, catalog search, feedback, and `/for-you` after deployment. Cloud deployment is not claimed until those checks succeed against public URLs.
