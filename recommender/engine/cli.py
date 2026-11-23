"""M01 offline preparation and ID-based queries. No web/API process is started."""

import argparse
import json
from pathlib import Path
import sys

from .artifacts import DEFAULT_ARTIFACT_ROOT, load_snapshot, save_snapshot, sha256
from .baseline import fit_engine
from .dataset import PROFILE_SIZES, load_dataset


def main(argv=None) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    prepare = commands.add_parser("prepare", help="Clean, fit once, and save a matched local snapshot.")
    prepare.add_argument("--source", type=Path, required=True)
    similar = commands.add_parser("similar", help="Load a prepared snapshot and query by source track ID.")
    similar.add_argument("--track-id", required=True)
    similar.add_argument("--limit", type=int, default=5)
    for command in [prepare, similar]:
        command.add_argument("--profile", choices=list(PROFILE_SIZES), default="tiny")
        command.add_argument("--artifact-root", type=Path, default=DEFAULT_ARTIFACT_ROOT)
    args = parser.parse_args(argv)
    try:
        if args.command == "prepare":
            before = sha256(args.source)
            cleaned = load_dataset(args.source, args.profile)
            if sha256(args.source) != before:
                raise ValueError("Source CSV changed during preparation; no snapshot was published.")
            snapshot = save_snapshot(fit_engine(cleaned), args.profile, before, args.artifact_root)
            result = {"command": "prepare", "profile": args.profile,
                      "rowCount": snapshot.manifest["rowCount"],
                      "catalogVersion": snapshot.manifest["catalogVersion"],
                      "modelVersion": snapshot.manifest["modelVersion"],
                      "snapshotDirectory": str(snapshot.directory),
                      "catalogExport": str(snapshot.directory / "catalog.csv"),
                      "exampleTrackId": snapshot.engine.track_ids[0]}
        else:
            snapshot = load_snapshot(args.profile, args.artifact_root)
            results = snapshot.engine.recommend(args.track_id, args.limit)
            result = {"command": "similar", "seedSourceTrackId": args.track_id,
                      "catalogVersion": snapshot.manifest["catalogVersion"],
                      "modelVersion": snapshot.manifest["modelVersion"], "results": results}
        print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))
        return 0
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"M01 error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
