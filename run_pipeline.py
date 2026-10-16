from __future__ import annotations

import argparse
import importlib
import importlib.util
from pathlib import Path

from pipeline_utils import iter_image_files


STEPS = [
    "convert_to_png",
    "tile_images",
    "filter_tiles",
    "generate_labels",
    "train",
]

REQUIRED_DIRS = [
    Path("processed"),
    Path("tiles"),
    Path("tiles_clean"),
    Path("dataset"),
    Path("dataset/images"),
]


def check_ready(root: Path) -> None:
    missing = [name for name in ("cv2", "numpy", "torch", "torchvision", "PIL") if importlib.util.find_spec(name) is None]
    if missing:
        raise SystemExit(
            "run_pipeline: missing Python packages: " + ", ".join(missing)
            + ". Install requirements.txt into a Python 3.12 virtual environment."
        )
    if not any(iter_image_files(root / "raw")):
        raise SystemExit("run_pipeline: no microscopy images in raw/. Add images before running the pipeline.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert images, generate labels, and train the colony classifier.")
    parser.add_argument("--check", action="store_true", help="Check Python dependencies and input images without running stages.")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    check_ready(root)
    if args.check:
        print("run_pipeline: ready")
        return

    for directory in REQUIRED_DIRS:
        (root / directory).mkdir(parents=True, exist_ok=True)

    for module_name in STEPS:
        print(f"run_pipeline: stage={module_name}")
        module = importlib.import_module(module_name)
        module.main()


if __name__ == "__main__":
    main()
