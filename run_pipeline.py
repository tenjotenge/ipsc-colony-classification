from __future__ import annotations

import importlib
from pathlib import Path


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


def main() -> None:
    root = Path(__file__).resolve().parent

    for directory in REQUIRED_DIRS:
        (root / directory).mkdir(parents=True, exist_ok=True)

    for module_name in STEPS:
        print(f"run_pipeline: stage={module_name}")
        module = importlib.import_module(module_name)
        module.main()


if __name__ == "__main__":
    main()
