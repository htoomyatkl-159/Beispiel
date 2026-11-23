"""M00 acceptance checks; Python's unittest needs no additional test package."""

import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("m00_audit", ROOT / "scripts" / "audit_dataset.py")
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class DatasetRules(unittest.TestCase):
    def row(self, track_id, title="Example", artist="Artist", **changes):
        value = {"track_id": track_id, "track_name": title, "artists": artist,
                 "track_genre": "demo", **{feature: 0.5 for feature in audit.FEATURES}}
        value.update(changes)
        return value

    def test_missing_names_are_removed_before_first_id_is_retained(self):
        rows = [self.row("A", artist=None), self.row("A", title="Retain me"),
                self.row("A", title="Duplicate"), self.row("B", title="Other")]
        cleaned, stats = audit.inspect_dataset(pd.DataFrame(rows))
        self.assertEqual(list(cleaned["track_name"]), ["Retain me", "Other"])
        self.assertEqual(list(cleaned.index), [0, 1])
        self.assertEqual(stats["missingTitleOrArtistRows"], 1)
        self.assertEqual(stats["duplicateIdsRemovedAfterMissingNames"], 1)

    def test_invalid_features_and_ids_are_reported_without_silent_imputation(self):
        raw = pd.DataFrame([self.row("A", energy=float("inf")),
                            self.row("B", tempo=None), self.row(" ")])
        before = raw.copy(deep=True)
        cleaned, stats = audit.inspect_dataset(raw)
        self.assertEqual(stats["cleanedInvalidFeatureRows"], 2)
        self.assertEqual(stats["cleanedEmptyTrackIds"], 1)
        self.assertEqual(len(cleaned), 3)
        pd.testing.assert_frame_equal(raw, before)

    def test_missing_required_column_is_actionable(self):
        with self.assertRaisesRegex(ValueError, "Missing required columns"):
            audit.inspect_dataset(pd.DataFrame([{"track_id": "A"}]))

    def test_outputs_cannot_escape_the_workspace(self):
        with self.assertRaises(ValueError):
            audit.workspace_path(audit.DEFAULT_ORIGINAL / "do-not-create.json")

    def test_existing_different_copy_is_never_overwritten(self):
        with tempfile.TemporaryDirectory(dir=ROOT / ".tmp") as directory:
            source = Path(directory) / "source.txt"
            target = Path(directory) / "target.txt"
            source.write_text("source")
            target.write_text("keep this")
            with self.assertRaisesRegex(RuntimeError, "refusing to overwrite"):
                audit.copy_exact(source, target)
            self.assertEqual(target.read_text(), "keep this")


class RecordedBaseline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fixture = json.loads(audit.BASELINE.read_text(encoding="utf-8"))

    def test_five_seeds_and_twenty_five_known_neighbors_are_saved(self):
        examples = self.fixture["examples"]
        self.assertEqual(len(examples), 5)
        self.assertEqual(len({example["trackId"] for example in examples}), 5)
        self.assertEqual(self.fixture["cleanedRows"], 89740)
        self.assertEqual(self.fixture["featureOrder"], audit.FEATURES)
        cleaned, _ = audit.inspect_dataset(pd.read_csv(ROOT / "data" / "dataset.csv"))
        ids = set(cleaned["track_id"])
        for example in examples:
            with self.subTest(seed=example["trackId"]):
                self.assertIn(example["trackId"], ids)
                self.assertEqual(len(example["recommendations"]), 5)
                self.assertEqual(len({item["trackId"] for item in example["recommendations"]}), 5)
                for item in example["recommendations"]:
                    self.assertIn(item["trackId"], ids)
                    self.assertGreaterEqual(item["cosineDistance"], -1e-10)
                    self.assertLessEqual(item["cosineDistance"], 2 + 1e-10)

    def test_original_and_workspace_files_match_the_approved_hashes(self):
        original = audit.DEFAULT_ORIGINAL
        self.assertEqual(audit.sha256(original / "data" / "dataset.csv"), audit.EXPECTED_DATA_HASH)
        self.assertEqual(audit.sha256(original / "src" / "recommend.py"), audit.EXPECTED_CODE_HASH)
        self.assertEqual(audit.sha256(ROOT / "data" / "dataset.csv"), audit.EXPECTED_DATA_HASH)
        self.assertEqual(audit.sha256(ROOT / "legacy" / "recommend.py"), audit.EXPECTED_CODE_HASH)

    def test_full_copied_cli_reproduces_the_saved_baseline(self):
        result = subprocess.run(
            [sys.executable, "-B", str(ROOT / "scripts" / "audit_dataset.py"), "--verify-baseline"],
            cwd=ROOT, text=True, encoding="utf-8", capture_output=True, timeout=120,
            env={**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONDONTWRITEBYTECODE": "1"},
        )
        self.assertEqual(result.returncode, 0, msg=result.stdout + result.stderr)
        report = json.loads(audit.REPORT.read_text(encoding="utf-8"))
        self.assertTrue(report["sourcePreservation"]["unchanged"])
        self.assertTrue(report["isolatedEnvironment"])
        self.assertEqual(report["baseline"]["mode"], "verified")
        self.assertEqual(report["baseline"]["examples"], 5)
        for name, expected_hash in report["approvedDocuments"].items():
            self.assertEqual(audit.sha256(audit.WORKSPACE / name), expected_hash)

    def test_empty_unknown_and_invalid_search_inputs_do_not_crash(self):
        inputs = [
            ("\n", "Please enter a song title or artist name."),
            ("__m00_no_matching_title_or_artist_91e7__\n", "No matching songs found."),
            (self.fixture["examples"][0]["query"] + "\ninvalid\n", "Invalid selection."),
        ]
        for answer, expected_output in inputs:
            with self.subTest(answer=answer):
                result = subprocess.run(
                    [sys.executable, "-B", str(ROOT / "legacy" / "recommend.py")],
                    input=answer, text=True, encoding="utf-8", cwd=ROOT,
                    capture_output=True, timeout=60,
                    env={**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONDONTWRITEBYTECODE": "1"},
                )
                self.assertEqual(result.returncode, 0, msg=result.stderr)
                self.assertIn(expected_output, result.stdout)


if __name__ == "__main__":
    unittest.main()
