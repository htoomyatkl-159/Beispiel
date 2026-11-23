"""Original cleaning rules, validation, and deterministic learning profiles."""

from pathlib import Path

import numpy as np
import pandas as pd

FEATURES = ["danceability", "energy", "acousticness", "instrumentalness",
            "valence", "speechiness", "tempo", "loudness"]
CLEANING_VERSION = "legacy-dropna-then-first-id-v1"
PROFILE_SIZES = {"tiny": 40, "development": 1000, "full": None}
CATALOG_COLUMNS = ["track_id", "track_name", "artists", "album_name", "track_genre",
                   "popularity", "duration_ms", "explicit"]


def clean_dataset(raw: pd.DataFrame) -> pd.DataFrame:
    """Preserve the reference order. Reject invalid retained data; do not repair it."""
    required = {"track_id", "track_name", "artists", *FEATURES}
    missing = sorted(required - set(raw.columns))
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    cleaned = raw.dropna(subset=["track_name", "artists"])
    cleaned = cleaned.drop_duplicates(subset=["track_id"]).reset_index(drop=True).copy()
    if cleaned.empty:
        raise ValueError("No usable songs remain after the original cleaning steps.")
    for column in ["track_id", "track_name", "artists"]:
        if cleaned[column].isna().any() or cleaned[column].astype(str).str.strip().eq("").any():
            raise ValueError(f"Retained {column} values must be nonempty.")
    if not cleaned["track_id"].map(lambda item: isinstance(item, str)).all():
        raise ValueError("Track IDs must be strings; do not use row numbers as IDs.")
    values = cleaned[FEATURES].apply(pd.to_numeric, errors="coerce")
    invalid = ~np.isfinite(values.to_numpy(dtype=float)).all(axis=1)
    if invalid.any():
        raise ValueError(f"{int(invalid.sum())} retained songs have missing/nonfinite audio features.")
    cleaned[FEATURES] = values
    return cleaned


def select_profile(cleaned: pd.DataFrame, profile: str) -> pd.DataFrame:
    if profile not in PROFILE_SIZES:
        raise ValueError(f"Unknown profile {profile!r}; choose tiny, development, or full.")
    count = PROFILE_SIZES[profile]
    if count is None or len(cleaned) <= count:
        return cleaned.reset_index(drop=True).copy()
    # Source rows are genre-grouped: spread samples across the whole cleaned table.
    indices = np.linspace(0, len(cleaned) - 1, count, dtype=int)
    return cleaned.iloc[indices].reset_index(drop=True).copy()


def load_dataset(source: str | Path, profile: str = "full") -> pd.DataFrame:
    return select_profile(clean_dataset(pd.read_csv(source)), profile)


def catalog_frame(cleaned: pd.DataFrame) -> pd.DataFrame:
    """Portable metadata export; the source track_id is retained without remapping."""
    frame = cleaned[[column for column in CATALOG_COLUMNS if column in cleaned]].copy()
    for column in CATALOG_COLUMNS:
        if column not in frame:
            frame[column] = None
    return frame[CATALOG_COLUMNS]
