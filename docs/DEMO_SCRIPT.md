# Five-minute hackathon demo

1. Introduce Beispiel and the goal: discover music beyond the ordinary without unauthorized streaming.
2. Browse the metadata catalog and search for a song or artist.
3. Open a track and request genuine similar-song results from the Python engine.
4. Register or sign in; explain the HttpOnly cookie session.
5. Like and dislike tracks. Explain that feedback belongs to the signed-in account.
6. Open For You. With no likes, show the honest cold-start message; with likes, show aggregated recommendations and exclusions.
7. Switch Familiar, Balanced, and Adventurous and explain the current relevance/diversity trade-off and small-catalog limitation.
8. Close with the architecture: React -> Express/SQLite -> private FastAPI -> Python artifacts.
