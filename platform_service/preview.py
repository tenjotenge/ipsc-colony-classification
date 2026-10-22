"""Create a bounded browser preview while retaining the source image unchanged."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from PIL import Image


PREVIEW_EDGE = 3072


def ensure_preview(source: Path, destination: Path) -> Path:
    if destination.is_file():
        return destination
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=destination.parent, suffix=".jpg", delete=False) as temporary:
        staged = Path(temporary.name)
    try:
        with Image.open(source) as image:
            image.thumbnail((PREVIEW_EDGE, PREVIEW_EDGE), Image.Resampling.LANCZOS)
            if image.mode in {"I", "I;16", "F"}:
                image = image.convert("I")
                low, high = image.getextrema()
                image = image.point(lambda value: (value - low) * 255 / (high - low)).convert("L") if high > low else image.convert("L")
            elif image.mode not in {"L", "RGB"}:
                image = image.convert("RGB")
            image.save(staged, format="JPEG", quality=88, optimize=True)
        os.replace(staged, destination)
    finally:
        staged.unlink(missing_ok=True)
    return destination
