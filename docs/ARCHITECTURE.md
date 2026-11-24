# Beispiel architecture

The browser talks only to the React/Vite app. Vite proxies `/api` to Express, so the private Python service is never exposed to the browser.

```text
React + Vite (5173) -> Express + Prisma (4000) -> SQLite
                                      |
                                      v
                          private FastAPI (8000)
                                      |
                                      v
                         Python cosine-similarity engine
```

Authentication uses a short-lived JWT in an HttpOnly cookie. Feedback rows are owned by the authenticated user and uniquely constrained per user/track.

For You reads that user's LIKE rows, asks FastAPI for similar candidates for several liked seeds, aggregates cosine similarity, removes liked/disliked tracks, and returns metadata resolved from SQLite.
