"""Package the unpacked Manifest V3 extension directory into a clean release .zip."""
from __future__ import annotations

import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EXT_DIR = ROOT / "extension"
DIST_DIR = ROOT / "dist"


def build_zip() -> Path:
    manifest_path = EXT_DIR / "manifest.json"
    if not manifest_path.exists():
        raise FileNotFoundError(f"Missing manifest.json at {manifest_path}")

    json.loads(manifest_path.read_text(encoding="utf-8"))

    DIST_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = DIST_DIR / "whatsapp-web-sidebar-toggle.zip"

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for file_path in sorted(EXT_DIR.rglob("*")):
            if file_path.is_file() and not file_path.name.endswith((".pyc", ".tmp", ".DS_Store")):
                arcname = file_path.relative_to(EXT_DIR).as_posix()
                zf.write(file_path, arcname)

    print(f"Created {zip_path}")
    return zip_path


if __name__ == "__main__":
    build_zip()
