"""M01 dataset acceptance tests (unittest; also discoverable by pytest)."""

import unittest

import numpy as np
import pandas as pd

from engine.dataset import FEATURES, clean_dataset, select_profile


def example_frame(count=8):
    return pd.DataFrame([
        {"track_id": f"track-{index}", "track_name": f"Song {index}", "artists": "Artist",
         "track_genre": "demo", **{feature: index + offset / 10 for offset, feature in enumerate(FEATURES)}}
        for index in range(count)
    ])


class DatasetTests(unittest.TestCase):
    def test_legacy_cleaning_order_preserves_first_usable_duplicate(self):
        raw = example_frame(3)
        raw.loc[0, "artists"] = None
        raw.loc[1, "track_id"] = "track-0"
        raw = pd.concat([raw, raw.iloc[[1]]], ignore_index=True)
        cleaned = clean_dataset(raw)
        self.assertEqual(list(cleaned["track_id"]), ["track-0", "track-2"])
        self.assertEqual(list(cleaned["track_name"]), ["Song 1", "Song 2"])
        self.assertEqual(list(cleaned.index), [0, 1])

    def test_invalid_retained_data_is_rejected_instead_of_imputed(self):
        for column, value in [("energy", np.inf), ("tempo", "not-a-number"),
                              ("track_id", " "), ("track_name", " "), ("artists", " ")]:
            with self.subTest(column=column):
                raw = example_frame().astype({column: object})
                raw.loc[0, column] = value
                with self.assertRaises(ValueError):
                    clean_dataset(raw)

    def test_missing_columns_and_empty_cleaned_catalog_are_actionable(self):
        with self.assertRaisesRegex(ValueError, "Missing required columns"):
            clean_dataset(pd.DataFrame({"track_id": ["x"]}))
        raw = example_frame()
        raw["artists"] = None
        with self.assertRaisesRegex(ValueError, "No usable songs"):
            clean_dataset(raw)

    def test_profiles_are_repeatable_and_keep_stable_source_ids(self):
        cleaned = clean_dataset(example_frame(1200))
        for profile, expected in [("tiny", 40), ("development", 1000), ("full", 1200)]:
            selected = select_profile(cleaned, profile)
            self.assertEqual(len(selected), expected)
            self.assertEqual(list(selected["track_id"]), list(select_profile(cleaned, profile)["track_id"]))
            self.assertTrue(selected["track_id"].is_unique)
            self.assertEqual(selected.iloc[0]["track_id"], "track-0")
            self.assertEqual(selected.iloc[-1]["track_id"], "track-1199")
        self.assertEqual(len(select_profile(clean_dataset(example_frame(2)), "tiny")), 2)
        with self.assertRaises(ValueError):
            select_profile(cleaned, "unknown")

    def test_input_table_is_not_modified_and_feature_order_is_preserved(self):
        raw = example_frame()
        before = raw.copy(deep=True)
        clean_dataset(raw)
        pd.testing.assert_frame_equal(raw, before)
        self.assertEqual(FEATURES, ["danceability", "energy", "acousticness", "instrumentalness",
                                    "valence", "speechiness", "tempo", "loudness"])


if __name__ == "__main__":
    unittest.main()
