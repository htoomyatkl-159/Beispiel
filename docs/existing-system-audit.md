# M00 — Existing-system audit and learning notes

Completed: 2026-10-28  
Scope: **M00 only**  
Result: **Passed — existing algorithm reproduced in a new isolated environment**

The user approved SPEC.md Version 3.0 and ROADMAP.md Version 3.0. These plan documents were read before implementation and have not been edited. Progress is tracked in [development-status.md](./development-status.md).

## What was implemented

- A new recommender/.venv environment inside D:\music_recommendation_app.
- Exact dependency pins and an explicit offline environment bootstrap helper.
- A byte-identical copy of the original recommend.py, with attribution in legacy/README.md.
- A byte-identical dataset copy inside recommender/data for the unchanged script's relative path.
- A pandas audit of the original cleaning order, stable IDs, and eight feature columns.
- Five scripted executions of the copied interactive program, recording its own actual recommendations and console output.
- A saved JSON baseline and nine standard-library acceptance tests, including a full second baseline run.

No algorithm refactoring, engine package, serialized model, API, web app, database, or mobile application was created. The only callable helpers are audit/test tooling; they are not the M01 recommendation engine.

## Source preservation

Original project: C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender

| File | SHA-256 before and after |
| --- | --- |
| src/recommend.py | 639BC3D21B10F4988A6DEFD1819D99E7896A0C28F367A513D549101BF4BC8ECE |
| data/dataset.csv | B202FA49909B2D5CEF71A04B1D21243CFEB36414535F2CA9272AA646721177BD |

The audit compares the entire original project's file/directory inventory, hashes, sizes, and file modification times before and after execution: **all eight original files remained unchanged; no new files or directories appeared**. Access timestamps are intentionally excluded because reading a file can update them.

The script that executes is the workspace copy, never the original. Original data and source are only read. Python runs with bytecode writing disabled to prevent cache files. The data copy is about 20 MB and is not a cleaned/replaced source dataset.

## Verified environment

Python: **3.14.7, Windows x64**  
Interpreter: D:\music_recommendation_app\recommender\.venv\Scripts\python.exe  
Isolation: sys.prefix differs from sys.base_prefix; pandas/NumPy/scikit-learn import from the new .venv.

| Package | Version |
| --- | --- |
| pandas | 3.0.6 |
| NumPy | 2.5.3 |
| scikit-learn | 1.9.1 |
| SciPy | 1.18.1 |
| joblib | 1.6.0 |
| threadpoolctl | 3.7.0 |
| python-dateutil | 2.9.0.post0 |
| six | 1.17.0 |
| tzdata | 2026.5 |
| cloudpickle | 3.1.2 |
| narwhals | 2.26.0 |

A normal pip install could not find the pinned NumPy version through the available package installer. The base interpreter already contained these packages, so the new environment was bootstrapped by copying their installed distribution files, including compiled libraries and package metadata. Two dependency-check findings (cloudpickle and narwhals) were resolved by pinning/copying the installed versions before baseline capture.

Final pip check: **No broken requirements found.** Actual imports and recommendation executions also passed. This proves this isolated local setup; it does not prove that the same wheels are available on another computer/package index. The offline helper requires the same Python build/Windows architecture and skips console wrappers; documented commands use python -m. Setup provenance is in [bootstrap-environment.json](../recommender/bootstrap-environment.json).

## Verified dataset

| Check | Result |
| --- | ---: |
| Raw records | 114,000 |
| Columns | 21 |
| Distinct raw IDs | 89,741 |
| Missing title/artist rows removed | 1 |
| Duplicate IDs removed after missing-name removal | 24,259 |
| Cleaned records | **89,740** |
| Distinct retained IDs | **89,740** |
| Empty/missing retained IDs | 0 |
| Whitespace-only retained titles/artists | 0 |
| Retained rows with nonnumeric/infinite/missing required features | 0 |
| Retained first-row genre labels | 113 |

The approved counts matched the pandas audit. No cleaning adjustment or data repair was needed. pandas names the empty first CSV header Unnamed: 0; this is an export index and is not used as a musical feature or stable ID.

The original algorithm was retained exactly:

1. Drop rows missing track_name or artists.
2. Keep the first row for each track_id, then reset the row index.
3. Select features in this exact order: danceability, energy, acousticness, instrumentalness, valence, speechiness, tempo, loudness.
4. Fit StandardScaler on all 89,740 cleaned records.
5. Fit NearestNeighbors with six neighbors, cosine distance, and brute-force search.
6. Use the original case-insensitive literal title/artist search and top-ten selection.
7. Retain the original first-neighbor removal and clipped display percentage.

## Saved recommendation examples

The audit selects reachable examples spread across the cleaned table. Each is selected by the original CLI's search/choice flow. The fixture records stable IDs, all five returned neighbors, raw cosine distances/similarities, display percentages, and the actual console transcript.

| Selected song | Source track ID | Returned recommendations |
| --- | --- | ---: |
| Comedy | 5SuOikwiRyPMVoIQDJUgSV | 5 |
| Jireh (My Provider) | 4pR4oQJULf7FDB54TleMyH | 5 |
| Toast | 7sd72KZS8D59g5NmhxyHpJ | 5 |
| Raise the Game | 7AuiZ7HPqzqqwRU6jVdgxd | 5 |
| Neugeborene Schlafhilfe | 3IVQzOYO8JG9Lj41pq98Pf | 5 |

The full fixture is [baseline.json](../recommender/tests/fixtures/baseline.json). A second run reproduced the selected IDs, ordered neighbor IDs, and distances within absolute tolerance 1e-10. Twenty-five recommendations were checked; every returned ID exists in the cleaned catalog.

The original [1:] first-neighbor skip remains unchanged. None of these five examples retained the seed, but that does not establish that all possible tied-feature cases are safe. Fixing exclusion by ID belongs to M01 after approval. The present fixture intentionally captures the existing behavior.

## Test results

Command:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTHONIOENCODING = 'utf-8'
$env:TEMP = 'D:\music_recommendation_app\recommender\.tmp'
$env:TMP = $env:TEMP
& '.\.venv\Scripts\python.exe' -B -m unittest discover -s tests -p 'test_m00.py' -v
```

Observed result: **Ran 9 tests in 41.034 seconds — OK.**

| Check | Result |
| --- | --- |
| Cleaning removes missing names before retaining the first duplicate ID | Passed |
| Invalid features/empty IDs are reported without silent correction | Passed |
| Missing columns produce a useful error | Passed |
| Audit output paths cannot escape the workspace | Passed |
| A different existing workspace copy is not silently overwritten | Passed |
| Empty search, unknown search, and invalid CLI selection are handled | Passed |
| Five distinct seeds and 25 known neighbors are recorded | Passed |
| Full copied CLI reproduces saved baseline IDs/scores | Passed |
| Original/workspace copies match approved source fingerprints | Passed |

The tests verify preservation and reproducibility, not that people will enjoy these recommendations. Human evaluation and preference ranking belong to later milestones.

## Beginner explanations

**Why a separate environment?** It gives this project its own package installation. We can later change the new project without changing packages or files in the original project. The base Python executable is still shared, which is normal for a virtual environment.

**Why does scaling matter?** Tempo might be around 100 while energy is between 0 and 1. StandardScaler subtracts each column's learned mean and divides by its learned spread. The model compares standardized values rather than letting units alone determine influence.

**What does cosine distance mean?** Treat a song's eight standardized values as a vector. Cosine compares its direction with other vectors. A smaller distance indicates a closer feature pattern; it is not a probability that a listener will like the song.

**Why record IDs and scores?** Titles can repeat and row numbers change after cleaning. Stable IDs identify the actual songs. Saved scores reveal whether a later adapter changed computation. The package versions matter because tie ordering and numeric details can differ across environments.

**Why not fix the original code now?** M00 establishes the reference first. M01 will make the algorithm callable and can document specific fixes against this saved reference. Doing both at once would make changes harder to explain.

## Approved-plan fingerprints

- SPEC.md Version 3.0: 3b964d62090f9839bcf32931d08645e0e5c14b8a1ba60a1b21e3d5c5f22bf7e3
- ROADMAP.md Version 3.0: ac5a062881083545c4664b1253cb017201975542328adc4714169fb584d6844f

The audit report records and tests these document fingerprints. They remain unchanged. Completion status is tracked separately rather than rewriting the approved plan.

## Completion and next gate

M00's implementation checks are complete: isolated environment, original-project preservation, expected dataset counts, exact legacy copy, package versions, five baseline examples, rerun comparison, and beginner run instructions.

Review [recommender/README.md](../recommender/README.md) for setup, normal audit, verification, and manual CLI commands. The machine-readable evidence is [m00-audit-results.json](./m00-audit-results.json).

**Stop here. M01 or any later milestone requires the user's explicit approval.**
