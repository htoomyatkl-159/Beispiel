# M01 — Callable recommendation engine

Completed: 2026-10-28  
Scope: **M01 only**  
Result: **25 combined M00/M01 tests passed**

The user explicitly approved M01. SPEC.md Version 3.0 and ROADMAP.md Version 3.0 remain the approved plan; neither was edited. M02 is not authorized or implemented.

## What works now

Your original Python recommender is available as reusable code in recommender/engine. It retains the original cleaning order, feature order, StandardScaler, and NearestNeighbors with cosine distance and brute-force search. It can prepare a versioned snapshot and return recommendations for a source track ID without interactive prompts.

The original project, dataset, workspace legacy copy, and M00 baseline fixture remain unchanged. All new files and artifacts are inside D:\music_recommendation_app.

| Component | Purpose |
| --- | --- |
| engine/dataset.py | Read/validate data, apply the original cleaning, and select a deterministic profile |
| engine/baseline.py | Fit the existing algorithm once and query it by stable source ID |
| engine/artifacts.py | Save/load a matched catalog, ID list, feature matrix, scaler/model, and manifest |
| engine/cli.py | Expose prepare and similar commands without running a service |
| tests/test_dataset.py | Cleaning, validation, non-mutation, and profile checks |
| tests/test_baseline.py | Query edge cases, snapshot consistency, CLI behavior, and full M00 parity |

At the Python level: engine = fit_engine(cleaned) prepares once; engine.recommend(track_id, limit=5) returns a list of dictionaries. A later Python HTTP wrapper will load a saved engine once and reuse it for requests.

## Prepared profiles

| Profile | Songs | Feature matrix | Saved payload size, approximately |
| --- | ---: | --- | ---: |
| tiny | 40 | 40 × 8 | 14 KB |
| development | 1,000 | 1,000 × 8 | 267 KB |
| full | 89,740 | 89,740 × 8 | 23.7 MB |

The sizes include catalog metadata, ID mapping, standardized matrix, fitted model/scaler, and manifest. No all-pairs similarity matrix was created. Small profiles deliberately fit on their own selected data; their rankings can differ from full-data rankings.

Each profile uses a versioned subdirectory. current.json points to the active snapshot. catalog.csv is ready for the future M03 import; the importer itself is not part of M01.

Source hashes, cleaning/model versions, feature order, ordered-ID digest, package/Python versions, row count, and payload checksums are recorded. Loading rejects mismatched versions, corruption, and misaligned IDs/matrix rows. All payload checksums are checked before joblib loading.

**Trust boundary:** joblib uses executable Python serialization. Only load locally generated trusted snapshots. Checksums are consistency checks, not signatures. The loader also validates that artifact paths remain within this recommender project.

## Deliberate corrections to the original program

1. **Exclude by source ID:** the original removes the first neighbor by position. The new code removes the selected song wherever its ID occurs, avoiding self-recommendations when different songs have identical features.
2. **Small catalogs work:** one song returns no neighbors; two songs return one; fewer than six songs do not crash.
3. **Bounded requests:** limits must be integers from 1 to 100; unknown IDs produce a clear error.
4. **No training in query:** recommend reuses the fitted scaler/model and does not read CSVs or fit anything. CLI similar loads a saved snapshot once per command; a later long-running service can load once at startup.

Neighbor tie ordering remains the pinned scikit-learn behavior. It is not promised to be identical across different scientific-library versions. For all five full-data M00 examples, the new ID exclusion produced exactly the same ordered IDs and raw distances as the preserved reference, within absolute tolerance 1e-10. The M00 fixture was not regenerated.

## How to try it

Open Windows PowerShell:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTHONIOENCODING = 'utf-8'

& '.\.venv\Scripts\python.exe' -B -m engine.cli similar --profile full --track-id 5SuOikwiRyPMVoIQDJUgSV --limit 5
```

This queries **Comedy**. Its full-catalog results include She's Royal, Pop Virus, So Good (feat. Ty Dolla $ign), 我們的歌, and The Git Up. The JSON includes stable IDs and raw cosine scores. Similarity is a feature-pattern measurement, not a probability of enjoyment.

To prepare the tiny snapshot again:

```powershell
& '.\.venv\Scripts\python.exe' -B -m engine.cli prepare --profile tiny --source 'C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender\data\dataset.csv'
```

An identical preparation validates/reuses the same version rather than overwriting its payloads. The command prints the catalog export path and an example track ID.

## Verification results

The final combined run completed **25 tests in 152.361 seconds — OK**. This includes the existing nine M00 checks plus sixteen new M01 checks. Final dependency check: **No broken requirements found.**

- All five full-catalog reference examples matched saved neighbor IDs and scores.
- Deterministic profiles retained stable source IDs.
- Missing/invalid retained data and unknown track IDs were handled explicitly.
- Identical/zero-feature vectors excluded the selected ID and returned finite scores.
- Catalogs with one, two, or five songs returned only available other songs.
- Querying/loading did not call model fitting.
- Snapshot save/load retained results and matched metadata.
- Repeated identical preparation retained the immutable snapshot payloads.
- Corrupt checksums were rejected before executable model loading.
- Reordered/rehashed ID mappings, incompatible features, and invalid pointers were rejected.
- CLI queries returned JSON; unknown IDs returned a nonzero exit.
- Original source inventory, approved plan hashes, and M00 fixture remained unchanged.
- Every actual tiny/development/full saved snapshot was loaded and successfully queried.

The planned pytest package was unavailable from the session's installer (no distribution was available). Tests are unittest-compatible classes and were run using Python's built-in runner. They remain discoverable by pytest when it is available. No scientific runtime package version changed; requirements.txt only clarifies reuse of the M00 pins.

Run everything again from the recommender folder:

```powershell
$env:TEMP = 'D:\music_recommendation_app\recommender\.tmp'
$env:TMP = $env:TEMP
& '.\.venv\Scripts\python.exe' -B -m unittest discover -s tests -p 'test_*.py' -v
```

See [m01-artifact-results.json](./m01-artifact-results.json) for the actual prepared profile versions, dimensions, sizes, and preservation checks. See [the recommender guide](../recommender/README.md) for focused tests and setup details.

## Beginner concepts

**Callable engine:** ordinary Python code that accepts arguments and returns results instead of asking input questions. A future server can call it on behalf of a browser.

**Preparation versus prediction:** preparation learns the scaler and fits the neighbor search. A query uses those learned values to look up similar songs. Separating them avoids rebuilding the model every time a user clicks.

**Source ID versus row number:** an ID refers to the same song across profiles/imports. A row number only describes a temporary position. ids.json keeps the saved matrix's row positions connected to stable song IDs.

**Manifest and version:** a manifest is the snapshot's contents label. Versions and checksums keep the catalog, matrix, and model together and catch accidental mixing.

## Shortest planned route to the browser

1. **M02:** minimal Express API and health/error handling.
2. **M03:** SQLite catalog import and searchable song endpoints.
3. **M04:** first React website that opens in your browser and browses/searches songs.
4. **M05:** private Python HTTP wrapper around this saved callable engine.
5. **M06:** website song page displays Python-powered recommendations through Express.

The tiny catalog export and callable engine are ready for those milestones. No speculative API, mobile, or frontend work was added. **M01 is complete; M02 awaits explicit approval.**
