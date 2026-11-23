"""M01 recommendation, snapshot, and full M00-reference comparisons."""

import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler

from engine.artifacts import load_snapshot, save_snapshot, sha256
from engine.baseline import fit_engine
from engine.dataset import FEATURES, clean_dataset, load_dataset
from test_dataset import example_frame

ROOT = Path(__file__).resolve().parents[1]


class QueryTests(unittest.TestCase):
    def test_small_catalogs_return_only_available_other_songs(self):
        for count in [1, 2, 5]:
            engine = fit_engine(clean_dataset(example_frame(count)))
            results = engine.recommend("track-0", 100)
            self.assertEqual(len(results), count - 1)
            self.assertNotIn("track-0", [item["sourceTrackId"] for item in results])

    def test_unknown_ids_and_invalid_limits_are_explicit(self):
        engine = fit_engine(clean_dataset(example_frame()))
        with self.assertRaisesRegex(KeyError, "Unknown track ID"):
            engine.recommend("missing")
        for value in [0, -1, 101, True, 1.5, "5"]:
            with self.subTest(limit=value), self.assertRaises(ValueError):
                engine.recommend("track-0", value)

    def test_identical_and_zero_feature_vectors_never_return_the_seed(self):
        raw = example_frame(10)
        raw[FEATURES] = 0.5  # after scaling every vector is zero
        engine = fit_engine(clean_dataset(raw))
        for seed in engine.track_ids:
            results = engine.recommend(seed)
            self.assertEqual(len(results), 5)
            self.assertNotIn(seed, [item["sourceTrackId"] for item in results])
            self.assertEqual(len({item["sourceTrackId"] for item in results}), 5)
            self.assertTrue(all(np.isfinite(item["cosineSimilarity"]) for item in results))

    def test_query_does_not_fit_or_load_a_model(self):
        engine = fit_engine(clean_dataset(example_frame()))
        with patch.object(StandardScaler, "fit", side_effect=AssertionError("unexpected fit")), \
                patch.object(NearestNeighbors, "fit", side_effect=AssertionError("unexpected fit")):
            first = engine.recommend("track-0")
            self.assertEqual(first, engine.recommend("track-0"))


class SnapshotTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(dir=ROOT / ".tmp")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / "artifacts"
        self.engine = fit_engine(clean_dataset(example_frame()))
        self.snapshot = save_snapshot(self.engine, "tiny", "test-source-checksum", self.root)

    def test_round_trip_returns_the_same_ids_scores_and_matching_metadata(self):
        with patch.object(NearestNeighbors, "fit", side_effect=AssertionError("unexpected fit")):
            restored = load_snapshot("tiny", self.root)
        self.assertEqual(restored.engine.recommend("track-0"), self.engine.recommend("track-0"))
        self.assertEqual(restored.manifest["rowCount"], 8)
        self.assertEqual(restored.manifest["featureOrder"], FEATURES)
        self.assertEqual(list(restored.engine.catalog["track_id"]), restored.engine.track_ids)

    def test_repeat_preparation_reuses_the_same_immutable_version(self):
        before = {p.name: sha256(p) for p in self.snapshot.directory.iterdir()}
        again = save_snapshot(self.engine, "tiny", "test-source-checksum", self.root)
        self.assertEqual(again.directory, self.snapshot.directory)
        self.assertEqual(before, {p.name: sha256(p) for p in again.directory.iterdir()})

    def test_checksum_failure_is_detected_before_executable_model_loading(self):
        with (self.snapshot.directory / "ids.json").open("a", encoding="utf-8") as stream:
            stream.write(" ")
        with patch("engine.artifacts.joblib.load", side_effect=AssertionError("unsafe load")) as loader:
            with self.assertRaisesRegex(ValueError, "checksum"):
                load_snapshot("tiny", self.root)
            loader.assert_not_called()

    def test_rehashed_but_reordered_ids_are_rejected_as_misaligned(self):
        directory = self.snapshot.directory
        ids = list(reversed(self.engine.track_ids))
        (directory / "ids.json").write_text(json.dumps(ids), encoding="utf-8")
        manifest = self.snapshot.manifest.copy()
        manifest["files"]["ids.json"] = sha256(directory / "ids.json")
        (directory / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "not aligned"):
            load_snapshot("tiny", self.root)

    def test_incompatible_manifest_and_pointer_are_rejected(self):
        directory = self.snapshot.directory
        manifest = self.snapshot.manifest.copy()
        manifest["featureOrder"] = list(reversed(FEATURES))
        (directory / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "incompatible"):
            load_snapshot("tiny", self.root)
        pointer = directory.parent / "current.json"
        pointer.write_text(json.dumps({"modelVersion": "../../escape"}), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Invalid snapshot pointer"):
            load_snapshot("tiny", self.root)

    def test_cli_queries_existing_artifacts_and_reports_unknown_ids(self):
        base = [sys.executable, "-B", "-m", "engine.cli", "similar", "--profile", "tiny",
                "--artifact-root", str(self.root), "--limit", "2", "--track-id"]
        env = {**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONDONTWRITEBYTECODE": "1"}
        good = subprocess.run(base + ["track-0"], cwd=ROOT, text=True, encoding="utf-8",
                              capture_output=True, timeout=60, env=env)
        self.assertEqual(good.returncode, 0, good.stderr)
        self.assertEqual(len(json.loads(good.stdout)["results"]), 2)
        bad = subprocess.run(base + ["missing"], cwd=ROOT, text=True, encoding="utf-8",
                             capture_output=True, timeout=60, env=env)
        self.assertNotEqual(bad.returncode, 0)
        self.assertIn("Unknown track ID", bad.stderr)


class FullBaselineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture_path = ROOT / "tests" / "fixtures" / "baseline.json"
        cls.fixture_before = sha256(cls.fixture_path)
        cls.fixture = json.loads(cls.fixture_path.read_text(encoding="utf-8"))
        source = ROOT / "data" / "dataset.csv"
        if sha256(source) != cls.fixture["sourceHashes"]["dataset"]:
            raise AssertionError("M00 source fingerprint differs; stop before comparing rankings.")
        cls.engine = fit_engine(load_dataset(source, "full"))

    def test_all_five_m00_examples_match_full_catalog_ids_and_distances(self):
        self.assertEqual(len(self.engine.track_ids), 89740)
        for example in self.fixture["examples"]:
            with self.subTest(seed=example["trackId"]):
                actual = self.engine.recommend(example["trackId"])
                self.assertEqual([item["sourceTrackId"] for item in actual],
                                 [item["trackId"] for item in example["recommendations"]])
                np.testing.assert_allclose([item["cosineDistance"] for item in actual],
                                           [item["cosineDistance"] for item in example["recommendations"]],
                                           rtol=0, atol=1e-10)
        self.assertEqual(sha256(self.fixture_path), self.fixture_before)


if __name__ == "__main__":
    unittest.main()
