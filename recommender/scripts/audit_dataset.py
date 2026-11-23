"""M00 audit and reference capture. No service, model rewrite, or M01 artifacts.

The unmodified legacy COPY runs with scripted answers in this workspace.
Its own DataFrame, fitted model, neighbors, and printed output are inspected.
"""

import argparse
from contextlib import contextmanager, redirect_stdout
from datetime import datetime, timezone
import hashlib
import importlib.metadata as metadata
import io
import json
from pathlib import Path
import runpy
import shutil
import sys
import os
from unittest.mock import patch

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
DEFAULT_ORIGINAL = Path(r"C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender")
FEATURES = ["danceability", "energy", "acousticness", "instrumentalness",
            "valence", "speechiness", "tempo", "loudness"]
PACKAGES = ["numpy", "pandas", "scikit-learn", "scipy", "joblib",
            "threadpoolctl", "python-dateutil", "six", "tzdata", "cloudpickle", "narwhals"]
EXPECTED_DATA_HASH = "b202fa49909b2d5cef71a04b1d21243cfeb36414535f2ca9272aa646721177bd"
EXPECTED_CODE_HASH = "639bc3d21b10f4988a6defd1819d99e7896a0c28f367a513d549101bf4bc8ece"
BASELINE = ROOT / "tests" / "fixtures" / "baseline.json"
REPORT = WORKSPACE / "docs" / "m00-audit-results.json"


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_inventory(original):
    """Compare contents, modification times, and directory names; not access times."""
    result = {}
    for item in sorted(original.rglob("*")):
        key = item.relative_to(original).as_posix()
        if item.is_symlink():
            raise RuntimeError(f"Unexpected symlink in original project: {item}")
        if item.is_dir():
            result[key + "/"] = {"kind": "directory"}
        else:
            stat = item.stat()
            result[key] = {"sha256": sha256(item), "bytes": stat.st_size,
                           "modifiedNs": stat.st_mtime_ns}
    return result


def workspace_path(path):
    path = Path(path).resolve()
    if not path.is_relative_to(WORKSPACE):
        raise ValueError("All output must stay inside D:\\music_recommendation_app.")
    return path


def write_json(path, value):
    path = workspace_path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n",
                    encoding="utf-8")


def copy_exact(source, target):
    target = workspace_path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if sha256(source) != sha256(target):
            raise RuntimeError(f"Existing workspace copy differs; refusing to overwrite: {target}")
    else:
        shutil.copyfile(source, target)
    if sha256(source) != sha256(target):
        raise RuntimeError("Copy fingerprint verification failed.")


def inspect_dataset(raw):
    """Apply the original cleaning in the original order; only report problems."""
    required = {"track_id", "track_name", "artists", "track_genre", *FEATURES}
    missing_columns = sorted(required - set(raw.columns))
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")
    named = raw.dropna(subset=["track_name", "artists"])
    cleaned = named.drop_duplicates(subset=["track_id"]).reset_index(drop=True)
    values = cleaned[FEATURES].apply(pd.to_numeric, errors="coerce").to_numpy(dtype=float)
    valid_rows = np.isfinite(values).all(axis=1)
    empty_ids = cleaned["track_id"].isna() | cleaned["track_id"].fillna("").astype(str).str.strip().eq("")
    blank_names = (cleaned["track_name"].astype(str).str.strip().eq("") |
                   cleaned["artists"].astype(str).str.strip().eq(""))
    result = {
        "rawRows": len(raw), "columnCount": len(raw.columns), "columns": list(raw.columns),
        "rawUniqueTrackIds": int(raw["track_id"].nunique(dropna=False)),
        "missingTitleOrArtistRows": len(raw) - len(named),
        "duplicateIdsRemovedAfterMissingNames": len(named) - len(cleaned),
        "cleanedRows": len(cleaned), "cleanedUniqueTrackIds": int(cleaned["track_id"].nunique()),
        "cleanedEmptyTrackIds": int(empty_ids.sum()),
        "cleanedWhitespaceOnlyNames": int(blank_names.sum()),
        "cleanedInvalidFeatureRows": int((~valid_rows).sum()),
        "retainedGenres": int(cleaned["track_genre"].nunique()), "featureOrder": FEATURES,
    }
    return cleaned, result


def validate_snapshot(stats):
    expected = {"rawRows": 114000, "columnCount": 21, "rawUniqueTrackIds": 89741,
                "missingTitleOrArtistRows": 1, "duplicateIdsRemovedAfterMissingNames": 24259,
                "cleanedRows": 89740, "cleanedUniqueTrackIds": 89740,
                "cleanedEmptyTrackIds": 0, "cleanedWhitespaceOnlyNames": 0,
                "cleanedInvalidFeatureRows": 0, "retainedGenres": 113}
    differences = {key: {"expected": value, "actual": stats[key]}
                   for key, value in expected.items() if stats[key] != value}
    if differences:
        raise RuntimeError(f"Approved dataset audit differs: {differences}. Do not change cleaning to force agreement.")


@contextmanager
def local_working_directory():
    previous = Path.cwd()
    os.chdir(ROOT)
    try:
        yield
    finally:
        os.chdir(previous)


def run_legacy(query, choice):
    """Run the byte-identical workspace script; original input() is answered by a mock."""
    transcript = io.StringIO()
    with local_working_directory(), patch("builtins.input", side_effect=[query, str(choice)]), redirect_stdout(transcript):
        observed = runpy.run_path(str(ROOT / "legacy" / "recommend.py"), run_name="__main__")
    if "selected" not in observed or "indices" not in observed:
        raise RuntimeError("The chosen CLI input did not produce recommendations.")
    if observed["features"] != FEATURES:
        raise RuntimeError("Legacy feature order changed.")
    if observed["model"].metric != "cosine" or observed["model"].algorithm != "brute":
        raise RuntimeError("Legacy nearest-neighbor configuration changed.")
    selected = observed["selected"]
    frame = observed["df"]
    recommendations = []
    # This is observation of the original [1:] output, not the M01 ID-exclusion fix.
    for index, distance in zip(observed["indices"][0][1:], observed["distances"][0][1:]):
        song = frame.iloc[int(index)]
        recommendations.append({
            "trackId": str(song["track_id"]), "title": str(song["track_name"]),
            "artists": str(song["artists"]), "genre": str(song["track_genre"]),
            "cosineDistance": float(distance), "cosineSimilarity": float(1 - distance),
            "displaySimilarityPercent": float(max(0, (1 - distance) * 100)),
        })
    return {
        "query": query, "choice": choice, "trackId": str(selected["track_id"]),
        "title": str(selected["track_name"]), "artists": str(selected["artists"]),
        "recommendations": recommendations, "transcript": transcript.getvalue(),
    }


def choose_examples(cleaned):
    """Choose five spread-out songs reachable through the original top-ten CLI search."""
    examples = []
    for offset in [0, 1000, 20000, 45000, 80000]:
        for position in range(offset, min(offset + 100, len(cleaned))):
            song = cleaned.iloc[position]
            query = str(song["track_name"])
            matches = cleaned[
                cleaned["track_name"].str.contains(query, case=False, regex=False, na=False) |
                cleaned["artists"].str.contains(query, case=False, regex=False, na=False)
            ].head(10)
            ids = list(matches["track_id"])
            if song["track_id"] in ids:
                examples.append({"query": query, "choice": ids.index(song["track_id"]) + 1,
                                 "trackId": str(song["track_id"])})
                break
        else:
            raise RuntimeError(f"Could not choose a CLI-reachable example near row {offset}.")
    return examples


def compare_example(expected, actual):
    if expected["trackId"] != actual["trackId"]:
        raise AssertionError("Selected track ID differs from the saved baseline.")
    expected_items = expected["recommendations"]
    actual_items = actual["recommendations"]
    if [item["trackId"] for item in expected_items] != [item["trackId"] for item in actual_items]:
        raise AssertionError("Neighbor order/IDs differ. Inspect versions or tied distances; do not silently refresh the fixture.")
    np.testing.assert_allclose([item["cosineDistance"] for item in actual_items],
                               [item["cosineDistance"] for item in expected_items],
                               rtol=0, atol=1e-10)


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_ORIGINAL / "data" / "dataset.csv")
    parser.add_argument("--original-script", type=Path, default=DEFAULT_ORIGINAL / "src" / "recommend.py")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--record-baseline", action="store_true")
    mode.add_argument("--verify-baseline", action="store_true")
    args = parser.parse_args(argv)
    source, script = args.source.resolve(), args.original_script.resolve()
    if not source.is_file() or not script.is_file():
        parser.error("Required original files are unavailable. Ask the user before proceeding.")
    if source.parent.parent != script.parent.parent:
        parser.error("Original dataset and script must belong to the same original project.")
    if args.record_baseline and BASELINE.exists():
        parser.error("A baseline already exists; use --verify-baseline. Never silently overwrite references.")
    if args.verify_baseline and not BASELINE.is_file():
        parser.error("No baseline exists; explicitly record it first.")
    hashes = {"dataset": sha256(source), "script": sha256(script)}
    if hashes != {"dataset": EXPECTED_DATA_HASH, "script": EXPECTED_CODE_HASH}:
        parser.error("Original fingerprints differ from the approved snapshot; discuss the difference before proceeding.")
    original = source.parent.parent
    before = source_inventory(original)
    versions = {name: metadata.version(name) for name in PACKAGES}
    report = {
        "milestone": "M00", "generatedAtUtc": datetime.now(timezone.utc).isoformat(),
        "sourceHashes": hashes, "originalProject": str(original), "python": sys.version,
        "executable": sys.executable, "isolatedEnvironment": sys.prefix != sys.base_prefix,
        "packages": versions,
        "approvedDocuments": {name: sha256(WORKSPACE / name) for name in ["SPEC.md", "ROADMAP.md"]},
    }
    try:
        if not report["isolatedEnvironment"]:
            raise RuntimeError("Run the audit using recommender/.venv/Scripts/python.exe.")
        copy_exact(script, ROOT / "legacy" / "recommend.py")
        copy_exact(source, ROOT / "data" / "dataset.csv")
        raw = pd.read_csv(source)
        cleaned, stats = inspect_dataset(raw)
        report["dataset"] = stats
        validate_snapshot(stats)
        print(f"Dataset: {stats['rawRows']:,} raw rows -> {stats['cleanedRows']:,} unique cleaned songs")
        if args.record_baseline or args.verify_baseline:
            fixture = json.loads(BASELINE.read_text(encoding="utf-8")) if args.verify_baseline else None
            if fixture and (fixture["sourceHashes"] != hashes or fixture["packages"] != versions):
                raise RuntimeError("Baseline source/package versions differ; inspect the environment before comparing.")
            examples = fixture["examples"] if fixture else choose_examples(cleaned)
            observed = []
            for number, example in enumerate(examples, 1):
                actual = run_legacy(example["query"], example["choice"])
                if actual["trackId"] != example["trackId"]:
                    raise RuntimeError("CLI search selected a different song.")
                if len(actual["recommendations"]) != 5:
                    raise RuntimeError("Legacy CLI did not return five recommendations.")
                if fixture:
                    compare_example(example, actual)
                observed.append(actual)
                print(f"Example {number}: {actual['title']} [{actual['trackId']}] — five neighbors captured")
            if not fixture:
                write_json(BASELINE, {
                    "milestone": "M00", "sourceHashes": hashes, "packages": versions,
                    "pythonVersion": list(sys.version_info[:3]), "featureOrder": FEATURES,
                    "cleanedRows": len(cleaned), "method": "observe byte-identical copied legacy CLI; retain original [1:] behavior",
                    "examples": observed,
                })
            report["baseline"] = {"mode": "verified" if fixture else "recorded",
                                  "examples": len(observed), "neighborsPerExample": 5,
                                  "fixtureSha256": sha256(BASELINE)}
        report["status"] = "passed"
    except Exception as error:
        report["status"] = "failed"
        report["error"] = str(error)
        raise
    finally:
        after = source_inventory(original)
        report["sourcePreservation"] = {"unchanged": before == after,
                                        "before": before, "after": after}
        write_json(REPORT, report)
        if before != after:
            raise RuntimeError("Original project inventory changed during audit; stop and investigate.")
    print("Original project: contents, file modification times, and directory inventory unchanged.")
    print(f"Report: {REPORT}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (RuntimeError, ValueError, AssertionError) as error:
        print(f"M00 audit failed: {error}", file=sys.stderr)
        raise SystemExit(1)
