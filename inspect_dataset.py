from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

from pipeline_utils import project_root


DATASET_IMAGES_DIR = Path("dataset/images")
LABELS_PATH = Path("dataset/labels.json")


def main() -> None:
    root = project_root()
    images_dir = root / DATASET_IMAGES_DIR
    labels_path = root / LABELS_PATH

    if not images_dir.exists() or not labels_path.exists():
        print("inspect_dataset: dataset missing")
        return

    with labels_path.open("r", encoding="utf-8") as handle:
        labels = json.load(handle)

    if not labels:
        print("inspect_dataset: no labeled images found")
        return

    widths: list[int] = []
    heights: list[int] = []
    label_counts: dict[str, int] = {}
    sample_filenames: list[str] = []

    for index, item in enumerate(labels):
        image_name = item.get("image")
        label = item.get("label", "unknown")
        label_counts[label] = label_counts.get(label, 0) + 1

        image_path = images_dir / image_name
        if not image_path.is_file():
            continue

        try:
            with Image.open(image_path) as image:
                width, height = image.size
        except Exception:
            continue

        widths.append(width)
        heights.append(height)
        if len(sample_filenames) < 10:
            sample_filenames.append(image_name)

    average_width = sum(widths) / len(widths) if widths else 0.0
    average_height = sum(heights) / len(heights) if heights else 0.0

    print(f"inspect_dataset: total_images={len(labels)}")
    print(f"inspect_dataset: label_counts={label_counts}")
    print(
        "inspect_dataset: average_image_size="
        f"{average_width:.2f}x{average_height:.2f}"
    )
    print(f"inspect_dataset: sample_filenames={sample_filenames}")


if __name__ == "__main__":
    main()
