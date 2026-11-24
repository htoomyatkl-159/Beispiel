# Recommendation system

The Python service loads a prepared StandardScaler and cosine-similarity artifact. A selected track is sent by stable source ID and catalog version; Express validates the response and resolves returned IDs to website metadata.

For You currently uses genuine user feedback as seed selection. Several liked tracks are queried, their similarity scores are averaged per candidate, and explicit LIKE/DISLIKE tracks are excluded. A user without likes receives a cold-start response explaining that feedback is needed.

Familiar preserves the aggregate relevance order. Balanced suppresses repeated artists while retaining relevance. Adventurous currently uses the same verified candidate pool with a more permissive diversity policy; it is intentionally not described as random or as a popularity signal. The 40-track catalog limits how visibly the modes can differ.

Cosine similarity is a feature distance, not a probability that a user will enjoy a song. The current MVP does not claim collaborative filtering, mood inference, or full user audio-vector training.
