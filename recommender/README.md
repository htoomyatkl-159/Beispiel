# Recommender — M00, M01, and M05

M01 is the reusable Python foundation for the future recommendation website. It preserves the existing pandas cleaning, eight-feature StandardScaler, and scikit-learn brute-force cosine model. The original project and the M00 legacy copy/baseline remain unchanged.

## Quick start — try a recommendation

The prepared tiny, development, and full snapshots are stored locally under artifacts/. Open Windows PowerShell:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTHONIOENCODING = 'utf-8'

& '.\.venv\Scripts\python.exe' -B -m engine.cli similar --profile full --track-id 5SuOikwiRyPMVoIQDJUgSV --limit 5
```

This returns five similar songs for **Comedy**, with source IDs, metadata, raw cosine distance/similarity, and catalog/model versions. A similarity score is not a probability of liking the song. This is still a terminal command, not the React website.

## Prepare a catalog/model snapshot

Run this once per profile/source/environment change, not for every query:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTHONIOENCODING = 'utf-8'

& '.\.venv\Scripts\python.exe' -B -m engine.cli prepare --profile tiny --source 'C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender\data\dataset.csv'
& '.\.venv\Scripts\python.exe' -B -m engine.cli similar --profile tiny --track-id 5SuOikwiRyPMVoIQDJUgSV --limit 5
```

Use --profile development for 1,000 songs or --profile full for all 89,740 cleaned songs. Tiny contains 40 songs. Sampling is deterministic and spread across the cleaned source order; source IDs never change. Each profile fits its own scaler, so different profiles legitimately return different recommendations.

The JSON prepare output gives the exact catalog export path and an example source ID. M03 imports the selected catalog metadata into SQLite; M05 now serves the matching prepared model privately over HTTP.

## M05 — run the private service

Install the pinned service dependencies into the isolated environment, then start one long-running process:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
& '.\.venv\Scripts\python.exe' -B -m pip install --disable-pip-version-check --only-binary=:all: -r requirements.txt
$env:RECOMMENDER_ARTIFACT_PROFILE = 'tiny'
& '.\.venv\Scripts\python.exe' -B -m uvicorn service.main:app --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs`. The service loads the artifact once at startup. `GET /health` shows the active catalog/model versions. `POST /v1/similar` requires a preserved `sourceTrackId`, the matching `catalogVersion`, and an optional limit from 1 to 100. This is a private service for Express; do not expose it directly to browsers or public networks.

Example PowerShell request:

```powershell
$health = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health'
$body = @{ sourceTrackId = '5SuOikwiRyPMVoIQDJUgSV'; catalogVersion = $health.data.catalogVersion; limit = 5 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:8000/v1/similar' -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 7
```

The service does not use SQLite, authentication, user feedback, or a new recommendation algorithm. Those belong to later milestones.

## What the new components do

| Component | Beginner explanation |
| --- | --- |
| engine/dataset.py | Reads the table, applies the original cleaning, validates retained rows, and selects a repeatable learning-size profile |
| engine/baseline.py | Learns the scaling and neighbor model once; recommend(track_id, limit) reuses it without prompts or refitting |
| engine/artifacts.py | Saves/loads a complete matching snapshot and checks versions, checksums, and ID order before use |
| engine/cli.py | Converts terminal arguments into preparation or query calls and prints readable JSON |
| artifacts/PROFILE/current.json | A small pointer to the active immutable snapshot for that profile |
| manifest.json | A contents/version label: source hash, cleaning/model versions, package versions, feature order, row count, and file checksums |
| catalog.csv | Metadata-only export with stable source track_id values for the later API import |
| ids.json | Ordered IDs: row i belongs to this song in the matrix and catalog |
| features.npy | The saved standardized eight-feature matrix, not an all-pairs similarity matrix |
| model.joblib | The already-fitted scaler and cosine-neighbor model |

An **artifact** is a saved output of preparation. A **function** accepts arguments and returns a result, allowing a later server to call the algorithm without typing at input prompts. A **manifest** helps prevent combining a model with the wrong catalog or ID order.

Snapshots have separate catalog and model versions. Identical preparation reuses an existing validated version; it does not overwrite old payloads. A new complete snapshot becomes active only after validation. An interrupted prepare can leave an inactive .building directory for inspection, while the old current snapshot stays usable.

Only load locally generated, trusted joblib files. They use executable Python serialization; checksums detect accidental corruption or mismatch, not malicious authors. Keep the pinned environment. All artifact paths must stay inside this recommender project; this boundary moves with the project if relocated.

## M01 behavior and comparison with M00

- Cleaning order, the eight features, StandardScaler, and brute-force cosine distance are preserved.
- The selected song is excluded by source ID. The old script skipped the first neighbor even if it was a different song with tied features.
- Fewer than six songs is valid: return only available other songs. A one-song catalog returns an empty list.
- Query limits are 1–100; unknown IDs and invalid limits produce clear errors and nonzero CLI exits.
- Tied-neighbor ordering remains scikit-learn's order in the pinned environment. Do not assume portability of tie order across library versions.
- Full-profile comparisons use M00's saved five examples; small-profile rankings are not compared with full-data rankings.
- Imports have no preparation side effects. Loaded engine queries do not read CSVs, fit scalers/models, or build all-pairs similarities.

## Run the M01 and regression tests

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTHONIOENCODING = 'utf-8'
$env:TEMP = 'D:\music_recommendation_app\recommender\.tmp'
$env:TMP = $env:TEMP

# M01 dataset tests.
& '.\.venv\Scripts\python.exe' -B -m unittest discover -s tests -p 'test_dataset.py' -v

# M01 model, artifact, CLI, and full M00-baseline comparisons.
& '.\.venv\Scripts\python.exe' -B -m unittest discover -s tests -p 'test_baseline.py' -v

# All M00 + M01 tests.
& '.\.venv\Scripts\python.exe' -B -m unittest discover -s tests -p 'test_*.py' -v
```

The planned pytest runner could not be installed from this session's package index (no distribution was available). These tests use unittest, included in Python, and are also discoverable by pytest when available. This is a documented test-runner substitution, not a change to the algorithm or project architecture. Runtime dependency versions remain the M00 pins.

## What remains before a browser website?

| Milestone | Visible result |
| --- | --- |
| M02, requires approval next | A small Express backend with health/error handling |
| M03 | SQLite catalog import, song details, and search endpoints |
| M04 | The first React website: browse/search/open song details in a browser |
| M05 | A private Python HTTP wrapper loading these prepared snapshots — complete |
| M06 | The React song page requests and displays AI-powered similar songs end to end |

The tiny profile/export is ready for that path. M02 and all later milestones remain unapproved and unimplemented.

<details>
<summary>Completed M00: original setup, audit, and learning reference</summary>

## M00 reference — previous checkpoint

This milestone reproduces your existing Python project in a separate environment and records a reference result. It does **not** create the callable M01 engine, FastAPI, Express, React, a database, or mobile code.

Approved plan: [SPEC.md](../SPEC.md) Version 3.0 and [ROADMAP.md](../ROADMAP.md) Version 3.0. Execution status is recorded separately in [development-status.md](../docs/development-status.md) so the approved documents do not drift.

## What the files do

| File | Purpose |
| --- | --- |
| requirements.txt | Exact versions verified for M00, including dependencies |
| .venv/ | Isolated Python environment; not a copy of the original project |
| legacy/recommend.py | Unmodified copy of your interactive Python program |
| data/dataset.csv | Byte-identical workspace dataset copy for the program's relative path |
| scripts/bootstrap_environment.py | Offline package-copy alternative when matching wheels cannot be installed |
| scripts/audit_dataset.py | Read-only original-project audit, safe copies, and reference capture/verification |
| tests/fixtures/baseline.json | Five selected songs, 25 neighbors, scores, and actual CLI transcripts |
| tests/test_m00.py | Standard-library unittest acceptance checks |
| bootstrap-environment.json | Records where the offline packages came from and what was copied |

The original dataset is not moved. Its workspace copy takes about 20 MB. Only ordinary recommendation outputs are saved; model/scaler serialization and reusable recommendation functions wait for M01.

## Commands to run now

Open Windows PowerShell and run:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTHONIOENCODING = 'utf-8'
$env:TEMP = 'D:\music_recommendation_app\recommender\.tmp'
$env:TMP = $env:TEMP

# Check installed dependencies.
& '.\.venv\Scripts\python.exe' -B -m pip --disable-pip-version-check check

# Recheck counts and preservation without running the five example searches.
& '.\.venv\Scripts\python.exe' -B scripts/audit_dataset.py --source 'C:\Users\Htoo Myat Kyaw Lwin\Desktop\music-recommender\data\dataset.csv'

# Reproduce all five saved examples and compare song IDs and raw distances.
& '.\.venv\Scripts\python.exe' -B scripts/audit_dataset.py --verify-baseline

# Run all M00 checks (includes another complete baseline verification).
& '.\.venv\Scripts\python.exe' -B -m unittest discover -s tests -p 'test_m00.py' -v
```

The audit updates docs/m00-audit-results.json inside this workspace; it never overwrites the saved baseline during verification. A nonzero exit means investigate the reported mismatch rather than changing the original or forcing different cleaning rules.

### Try the copied interactive program

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
$env:PYTHONIOENCODING = 'utf-8'
& '.\.venv\Scripts\python.exe' -B legacy/recommend.py
```

Enter **Comedy**, then **1** at the second prompt. You can try any title or artist from the dataset. Run from the recommender folder: the unchanged program expects data/dataset.csv relative to its current working directory.

## Environment setup and reproduction

Python 3.14.7 was found locally with the scientific packages already installed. The matching NumPy wheel was unavailable through the package installer in this session. The separate .venv therefore uses **offline copies of installed distribution files**, not a successful PyPI installation. pip check and actual model execution verify this particular environment.

requirements.txt pins the environment that passed M00; these are not claims about the latest versions or availability on every public package index. Offline copying requires the same Python build and Windows architecture. It intentionally skips console-script wrappers; commands here use python -m instead.

To recreate a missing environment on this same machine while those base packages remain installed:

```powershell
Set-Location -LiteralPath 'D:\music_recommendation_app\recommender'
New-Item -ItemType Directory -Force -Path '.tmp' | Out-Null
$env:TEMP = 'D:\music_recommendation_app\recommender\.tmp'
$env:TMP = $env:TEMP
$env:PYTHONDONTWRITEBYTECODE = '1'
$env:PYTHONIOENCODING = 'utf-8'
$env:PIP_CACHE_DIR = 'D:\music_recommendation_app\recommender\.pip-cache'

py --list
& 'C:\Python314\python.exe' -B -m venv .venv
& 'C:\Python314\python.exe' -u -B scripts/bootstrap_environment.py
& '.\.venv\Scripts\python.exe' -B -m pip --disable-pip-version-check check
```

On a machine where the exact wheels are available, a normal install into a fresh compatible environment is preferable:

```powershell
& '.\.venv\Scripts\python.exe' -B -m pip --disable-pip-version-check install --only-binary=:all: --no-cache-dir -r requirements.txt
```

If dependencies or the Python build differ, discuss the discrepancy before updating baseline data. Do not overwrite an existing environment to experiment. The helper refuses different existing package contents and requires all output inside the workspace.

## How the baseline was recorded

The first capture used this one-time command:

```powershell
& '.\.venv\Scripts\python.exe' -B scripts/audit_dataset.py --record-baseline
```

Do **not** run it again to hide a failing comparison. It refuses to overwrite an existing baseline. Verification uses --verify-baseline.

The audit chooses five songs spread across the cleaned table that can be selected through your original top-ten search. For each, it runs the unmodified copied program, supplies the search and selection, then observes that program's own neighbors and scores. It retains the original StandardScaler, eight-feature order, brute-force cosine model, six neighbors, and first-neighbor skipping. It records the console transcript as well as stable IDs.

## Python concepts in this milestone

- **Virtual environment:** a separate package folder for this project. Using its full python.exe path avoids changing PowerShell's activation policy.
- **Module versus script:** a module can be imported; a script runs top to bottom. Your current file asks for input at top level, so the audit runs the workspace copy as a script. It does not import or refactor the original.
- **DataFrame:** pandas' table. A row is a dataset record; a column is a field such as energy or track_id.
- **Cleaning order:** remove missing names first, then keep the first row per track_id. Reversing that order could choose different rows.
- **StandardScaler:** learns each feature's mean and spread, then standardizes values. This stops a large numeric scale such as tempo from dominating simply because its units are larger.
- **Cosine distance:** compares vector direction. Smaller distance means a more similar pattern of standardized audio features. It is not a probability of liking a song.
- **Baseline fixture:** saved known results used to detect changes later. Tied neighbors can behave differently in another library version, so versions and raw scores are recorded.
- **SHA-256 fingerprint:** a compact check of file bytes. We also compare original file names, sizes, and modification times to detect accidental writes or new cache files.
- **Test:** a repeatable check with an expected result. unittest is included in Python; M00 needs no pytest installation.

## Boundaries and next step

These paragraphs record the completed M00 checkpoint. M01 now adds the reusable engine and artifacts described above. Original files and the M00 fixture remain unchanged. Service endpoints and every milestone from M02 onward still require explicit approval.

</details>
