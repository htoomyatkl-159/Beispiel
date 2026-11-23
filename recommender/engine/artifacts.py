"""Save and load matched, checksum-verified local model snapshots.

Joblib files are executable Python serialization: load only snapshots generated
locally by this project. Checksums detect inconsistency, not a malicious author.
"""

from dataclasses import dataclass
import hashlib
import importlib.metadata as metadata
import json
import os
from pathlib import Path
import platform
import re
from uuid import uuid4

import joblib
import numpy as np
import pandas as pd

from .baseline import ENGINE_VERSION, RecommendationEngine
from .dataset import CLEANING_VERSION, FEATURES, PROFILE_SIZES

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARTIFACT_ROOT = ROOT / "artifacts"
FILES = {"catalog.csv", "ids.json", "features.npy", "model.joblib"}
FORMAT_VERSION = 1


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def json_digest(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                    separators=(",", ":")).encode("utf-8")).hexdigest()


def package_versions() -> dict:
    return {name: metadata.version(name) for name in
            ["numpy", "pandas", "scikit-learn", "scipy", "joblib", "threadpoolctl", "narwhals", "cloudpickle"]}


def write_json(path: Path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
                    encoding="utf-8")


def artifact_root(path=DEFAULT_ARTIFACT_ROOT) -> Path:
    resolved = Path(path).resolve()
    if not resolved.is_relative_to(ROOT):
        raise ValueError("Artifact output/loading must stay inside this recommender project.")
    return resolved


def profile_directory(root: Path, profile: str) -> Path:
    if profile not in PROFILE_SIZES:
        raise ValueError("Unknown profile; choose tiny, development, or full.")
    target = (artifact_root(root) / profile).resolve()
    if not target.is_relative_to(artifact_root(root)):
        raise ValueError("Profile directory escapes artifact root.")
    return target


@dataclass
class Snapshot:
    engine: RecommendationEngine
    manifest: dict
    directory: Path


def _activate(parent: Path, manifest: dict):
    # Switching current.json is atomic; failed preparations never replace a good snapshot.
    temporary = parent / f".current-{uuid4().hex}.json"
    write_json(temporary, {key: manifest[key] for key in ["modelVersion", "catalogVersion"]})
    os.replace(temporary, parent / "current.json")


def save_snapshot(engine: RecommendationEngine, profile: str, source_sha256: str,
                  root=DEFAULT_ARTIFACT_ROOT) -> Snapshot:
    parent = profile_directory(root, profile)
    parent.mkdir(parents=True, exist_ok=True)
    catalog_text = engine.catalog.to_csv(index=False, lineterminator="\n")
    catalog_sha = hashlib.sha256(catalog_text.encode("utf-8")).hexdigest()
    identity = {"sourceSha256": source_sha256, "profile": profile,
                "rowCount": len(engine.track_ids), "orderedIdsSha256": json_digest(engine.track_ids),
                "cleaningVersion": CLEANING_VERSION, "catalogSha256": catalog_sha}
    catalog_version = "catalog-v1-" + json_digest(identity)[:20]
    versions = package_versions()
    model_identity = {**identity, "engineVersion": ENGINE_VERSION, "featureOrder": FEATURES,
                      "packages": versions, "pythonVersion": platform.python_version()}
    model_version = "cosine-v1-" + json_digest(model_identity)[:20]
    directory = parent / model_version
    if directory.exists():
        snapshot = _load_directory(directory, profile)
        if snapshot.manifest["catalogVersion"] != catalog_version:
            raise ValueError("Existing snapshot identity differs; refusing to overwrite it.")
        _activate(parent, snapshot.manifest)
        return snapshot
    staging = parent / (".building-" + uuid4().hex)
    staging.mkdir()
    # An interrupted build may leave an inactive .building directory for inspection.
    # No previous snapshot is deleted or overwritten.
    (staging / "catalog.csv").write_text(catalog_text, encoding="utf-8", newline="")
    write_json(staging / "ids.json", engine.track_ids)
    np.save(staging / "features.npy", engine.matrix, allow_pickle=False)
    joblib.dump({"scaler": engine.scaler, "model": engine.model}, staging / "model.joblib")
    manifest = {"formatVersion": FORMAT_VERSION, "profile": profile,
                "modelVersion": model_version, "catalogVersion": catalog_version,
                **model_identity,
                "legacyScriptSha256": sha256(ROOT / "legacy" / "recommend.py"),
                "files": {name: sha256(staging / name) for name in sorted(FILES)},
                "tiePolicy": "Retain scikit-learn neighbor order; exclude seed by source ID. Versions are pinned.",
                "trust": "Local generated artifacts only; checksums are not signatures."}
    write_json(staging / "manifest.json", manifest)
    _load_directory(staging, profile)  # validate before publication
    os.rename(staging, directory)
    _activate(parent, manifest)
    return Snapshot(engine, manifest, directory)


def _load_directory(directory: Path, profile: str) -> Snapshot:
    directory = directory.resolve()
    if not directory.is_relative_to(ROOT):
        raise ValueError("Snapshot must stay inside this project.")
    manifest = json.loads((directory / "manifest.json").read_text(encoding="utf-8"))
    if (manifest.get("formatVersion") != FORMAT_VERSION or manifest.get("profile") != profile
            or manifest.get("featureOrder") != FEATURES
            or manifest.get("cleaningVersion") != CLEANING_VERSION
            or manifest.get("engineVersion") != ENGINE_VERSION):
        raise ValueError("Snapshot format, profile, features, or algorithm version is incompatible.")
    if manifest.get("packages") != package_versions() or manifest.get("pythonVersion") != platform.python_version():
        raise ValueError("Artifact and runtime dependency/Python versions differ; prepare a matched snapshot.")
    if set(manifest.get("files", {})) != FILES:
        raise ValueError("Manifest must list exactly the four expected payload files.")
    # Check every payload before reading executable serialization.
    for name in sorted(FILES):
        payload = (directory / name).resolve()
        if payload.parent != directory or sha256(payload) != manifest["files"][name]:
            raise ValueError(f"Artifact checksum/path mismatch: {name}")
    catalog = pd.read_csv(directory / "catalog.csv", dtype={"track_id": str}, keep_default_na=False)
    ids = json.loads((directory / "ids.json").read_text(encoding="utf-8"))
    matrix = np.load(directory / "features.npy", allow_pickle=False)
    if (not isinstance(ids, list) or not all(isinstance(item, str) and item for item in ids)
            or manifest.get("rowCount") != len(ids) or not ids
            or json_digest(ids) != manifest.get("orderedIdsSha256")
            or list(catalog["track_id"]) != ids
            or matrix.shape != (len(ids), len(FEATURES)) or not np.isfinite(matrix).all()):
        raise ValueError("Catalog, matrix, manifest, and ID mapping are not aligned.")
    fitted = joblib.load(directory / "model.joblib")
    model, scaler = fitted["model"], fitted["scaler"]
    if (model.metric != "cosine" or model.algorithm != "brute"
            or model.n_samples_fit_ != len(ids)
            or list(scaler.feature_names_in_) != FEATURES
            or not np.array_equal(model._fit_X, matrix)):
        raise ValueError("Saved fitted model/scaler does not match the feature matrix.")
    return Snapshot(RecommendationEngine(catalog, matrix, scaler, model, ids), manifest, directory)


def load_snapshot(profile: str = "tiny", root=DEFAULT_ARTIFACT_ROOT) -> Snapshot:
    parent = profile_directory(root, profile)
    if not (parent / "current.json").is_file():
        raise FileNotFoundError(f"No prepared {profile!r} snapshot. Run engine.cli prepare first.")
    pointer = json.loads((parent / "current.json").read_text(encoding="utf-8"))
    version = pointer.get("modelVersion", "")
    if not isinstance(version, str) or not re.fullmatch(r"cosine-v1-[a-f0-9]{20}", version):
        raise ValueError("Invalid snapshot pointer.")
    snapshot = _load_directory(parent / version, profile)
    if any(snapshot.manifest.get(key) != pointer.get(key) for key in ["modelVersion", "catalogVersion"]):
        raise ValueError("Active pointer and snapshot versions differ.")
    return snapshot
