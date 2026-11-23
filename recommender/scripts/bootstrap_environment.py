"""M00-only offline setup: copy installed packages, never the original project.

Run with the base Python that already has the pinned scientific packages.
This is an alternative to pip install when the pinned wheels are unavailable.
"""

import argparse
import hashlib
import importlib.metadata as metadata
import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--venv", type=Path, default=ROOT / ".venv")
    args = parser.parse_args()
    venv = args.venv.resolve()
    if not venv.is_relative_to(ROOT) or not (venv / "pyvenv.cfg").is_file():
        parser.error("Target must be an existing virtual environment inside recommender.")
    executable = venv / "Scripts" / "python.exe"
    result = subprocess.run(
        [str(executable), "-I", "-B", "-c",
         "import json,sys,sysconfig;print(json.dumps({'site':sysconfig.get_path('purelib'),"
         "'prefix':sys.prefix,'base':sys.base_prefix,'version':list(sys.version_info[:3])}))"],
        check=True, text=True, capture_output=True,
    )
    target_info = json.loads(result.stdout)
    site = Path(target_info["site"]).resolve()
    if not site.is_relative_to(venv) or target_info["prefix"] == target_info["base"]:
        raise RuntimeError("The target is not an isolated environment.")
    if target_info["version"] != list(sys.version_info[:3]):
        raise RuntimeError("Offline copying requires the same Python interpreter version.")
    requirements = []
    for line in (ROOT / "requirements.txt").read_text().splitlines():
        if line.strip() and not line.startswith("#"):
            name, version = line.strip().split("==")
            dist = metadata.distribution(name)
            if dist.version != version:
                raise RuntimeError(f"Installed {name} {dist.version} does not match {version}.")
            requirements.append((name, version, dist))
    copied = []
    for name, version, dist in requirements:
        source_site = Path(dist.locate_file("")).resolve()
        if source_site == site:
            raise RuntimeError("Run this helper using the base Python, not the target venv.")
        count = 0
        skipped = []
        for entry in dist.files or []:
            relative = Path(str(entry))
            source = Path(dist.locate_file(entry)).resolve()
            target = (site / relative).resolve()
            if not source.is_relative_to(source_site) or not target.is_relative_to(site):
                skipped.append(str(entry))  # console wrappers outside site-packages
                continue
            if "__pycache__" in relative.parts or source.suffix == ".pyc":
                continue
            if not source.is_file():
                raise RuntimeError(f"Missing installed package file: {source}")
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists() and source.read_bytes() != target.read_bytes():
                raise RuntimeError(f"Refusing to overwrite a different package file: {target}")
            if not target.exists():
                shutil.copy2(source, target)
            count += 1
        if not count:
            raise RuntimeError(f"No package files found for {name}.")
        copied.append({"name": name, "version": version, "files": count,
                       "skippedConsoleWrappers": skipped})
        print(f"Copied {name}=={version}: {count} files")
    manifest = {
        "method": "offline copy of installed distribution files; not a PyPI wheel install",
        "python": sys.version,
        "baseExecutable": sys.executable,
        "targetExecutable": str(executable),
        "requirementsSha256": hashlib.sha256((ROOT / "requirements.txt").read_bytes()).hexdigest(),
        "packages": copied,
        "limitation": "Same Python/Windows architecture only. Console entry wrappers are not copied; use python -m commands.",
    }
    (ROOT / "bootstrap-environment.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("Next: .\\.venv\\Scripts\\python.exe -B -m pip check")


if __name__ == "__main__":
    main()
