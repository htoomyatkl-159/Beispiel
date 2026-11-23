"""Small, explicit environment configuration for the Python service."""

from dataclasses import dataclass
import os
from pathlib import Path

from engine.artifacts import DEFAULT_ARTIFACT_ROOT, PROFILE_SIZES


@dataclass(frozen=True)
class Settings:
    artifact_profile: str = "tiny"
    artifact_root: Path = DEFAULT_ARTIFACT_ROOT

    @classmethod
    def from_env(cls) -> "Settings":
        profile = os.getenv("RECOMMENDER_ARTIFACT_PROFILE", "tiny").strip().lower()
        if profile not in PROFILE_SIZES:
            raise ValueError("RECOMMENDER_ARTIFACT_PROFILE must be tiny, development, or full.")
        raw_root = os.getenv("RECOMMENDER_ARTIFACT_ROOT")
        root = Path(raw_root).resolve() if raw_root else DEFAULT_ARTIFACT_ROOT
        return cls(profile, root)

