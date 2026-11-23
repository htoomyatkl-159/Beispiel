"""The existing StandardScaler + brute-force cosine algorithm, without CLI input.

Adapted from the student's legacy/recommend.py. The intended corrections are:
exclude the seed by stable ID, support small catalogs, and allow bounded limits.
"""

from dataclasses import dataclass

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

from .dataset import FEATURES, catalog_frame

ENGINE_VERSION = "legacy-scaled-cosine-id-exclusion-v1"


@dataclass
class RecommendationEngine:
    catalog: pd.DataFrame
    matrix: np.ndarray
    scaler: StandardScaler
    model: NearestNeighbors
    track_ids: list[str]

    def __post_init__(self):
        self._positions = {track_id: index for index, track_id in enumerate(self.track_ids)}
        if len(self._positions) != len(self.track_ids):
            raise ValueError("Duplicate IDs in engine mapping.")
        if self.matrix.shape != (len(self.track_ids), len(FEATURES)):
            raise ValueError("Feature matrix and ID mapping have different shapes.")
        if list(self.catalog["track_id"]) != self.track_ids:
            raise ValueError("Catalog order does not match the matrix ID mapping.")

    def recommend(self, track_id: str, limit: int = 5) -> list[dict]:
        """Query an already-fitted model. Never clean, fit, or load files here."""
        if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 100:
            raise ValueError("limit must be an integer between 1 and 100.")
        if track_id not in self._positions:
            raise KeyError(f"Unknown track ID: {track_id}")
        if len(self.track_ids) == 1:
            return []
        position = self._positions[track_id]
        count = min(limit + 1, len(self.track_ids))
        distances, indices = self.model.kneighbors(
            self.matrix[position:position + 1], n_neighbors=count,
        )
        results = []
        for distance, index in zip(distances[0], indices[0]):
            neighbor_id = self.track_ids[int(index)]
            if neighbor_id == track_id:
                continue
            row = self.catalog.iloc[int(index)]
            results.append({"sourceTrackId": neighbor_id, "title": str(row["track_name"]),
                            "artists": str(row["artists"]), "cosineDistance": float(distance),
                            "cosineSimilarity": float(1 - distance),
                            "reasonCode": "SIMILAR_AUDIO_FEATURES"})
            if len(results) == limit:
                break
        return results


def fit_engine(cleaned: pd.DataFrame) -> RecommendationEngine:
    """Fit once during offline preparation, using exactly the eight legacy features."""
    if cleaned.empty:
        raise ValueError("Cannot fit an empty catalog.")
    scaler = StandardScaler()
    matrix = scaler.fit_transform(cleaned[FEATURES])
    model = NearestNeighbors(n_neighbors=min(6, len(cleaned)), metric="cosine", algorithm="brute")
    model.fit(matrix)
    return RecommendationEngine(catalog_frame(cleaned), matrix, scaler, model,
                                list(cleaned["track_id"]))
