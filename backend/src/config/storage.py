import os
from pathlib import Path

STORAGE_TYPE: str = os.environ.get("STORAGE_TYPE", "local")
UPLOAD_DIR: str = os.environ.get("UPLOAD_DIR", str(Path.cwd() / "uploads"))

Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
