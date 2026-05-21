from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

import cv2
import numpy as np

from pipeline_utils import (
    clear_files,
    directory_signature,
    ensure_directories,
    marker_path,
    project_root,
    safe_link_or_copy_file,
    save_marker,
    sorted_image_files,
    stage_is_cached,
)


TILES_CLEAN_DIR = Path("tiles_clean")
PROCESSED_DIR = Path("processed")
DATASET_DIR = Path("dataset")
DATASET_IMAGES_DIR = DATASET_DIR / "images"
LABELS_PATH = DATASET_DIR / "labels.json"
MANUAL_DIR = Path("manual_labels")
MANUAL_IMAGES_DIR = MANUAL_DIR / "images"
MANUAL_LABELS_PATH = MANUAL_DIR / "labels.json"
STAGE_NAME = "generate_labels"
STAGE_VERSION = "4"
TILE_NAME_PATTERN = re.compile(r"^(?P<base>.+)_(?P<x>\d+)_(?P<y>\d+)$")


def weak_label(image_std: float) -> str:
    if image_std > 50:
        return "likely_good"
    if image_std > 25:
        return "uncertain"
    return "bad"


def smooth_quality_score(image_std: float) -> float:
    return float(np.clip((image_std - 15.0) / 45.0, 0.0, 1.0))


def parse_tile_metadata(tile_path: Path) -> tuple[str, int, int] | None:
    match = TILE_NAME_PATTERN.match(tile_path.stem)
    if match is None:
        return None
    return match.group("base"), int(match.group("x")), int(match.group("y"))


@lru_cache(maxsize=8192)
def source_image_shape(processed_root_text: str, relative_parent_text: str, base_name: str) -> tuple[int, int] | None:
    processed_root = Path(processed_root_text)
    relative_parent = Path(relative_parent_text) if relative_parent_text != "." else Path()
    source_image_path = processed_root / relative_parent / f"{base_name}.png"
    image = cv2.imread(str(source_image_path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return None
    height, width = image.shape[:2]
    return width, height


def edge_distance(tile_x: int, tile_y: int, tile_size: int, source_width: int, source_height: int) -> int:
    distances = [
        tile_x,
        tile_y,
        max(0, source_width - (tile_x + tile_size)),
        max(0, source_height - (tile_y + tile_size)),
    ]
    return int(min(distances))


def seed_manual_labels(weak_labels: list[dict[str, object]], dataset_images_root: Path, manual_images_root: Path, manual_labels_path: Path) -> int:
    if manual_labels_path.exists():
        return 0

    ensure_directories([manual_images_root])
    seeded_labels: list[dict[str, object]] = []
    seeded_count = 0

    for item in weak_labels:
        source_image_id = str(item.get("source_image_id", ""))
        top_level = source_image_id.split("/")[0] if source_image_id else ""
        if top_level == "training_high":
            manual_label = "likely_good"
        elif top_level == "training_low":
            manual_label = "bad"
        else:
            continue

        image_name = str(item["image"])
        src_path = dataset_images_root / image_name
        dst_path = manual_images_root / image_name
        if not safe_link_or_copy_file(src_path, dst_path):
            continue

        seeded_labels.append(
            {
                "image": image_name,
                "label": manual_label,
                "loss_weight": 3.0,
                "manual": True,
                "source": "curated_seed",
                "source_image_id": source_image_id,
                "tile_x": int(item.get("tile_x", 0)),
                "tile_y": int(item.get("tile_y", 0)),
                "tile_size": int(item.get("tile_size", 256)),
                "edge_distance": int(item.get("edge_distance", 0)),
                "edge_tile": bool(item.get("edge_tile", False)),
                "pixel_std": float(item.get("pixel_std", 0.0)),
                "quality_score": float(item.get("quality_score", 0.0)),
            }
        )
        seeded_count += 1

    with manual_labels_path.open("w", encoding="utf-8") as handle:
        json.dump(seeded_labels, handle, indent=2)

    return seeded_count


def main() -> None:
    root = project_root()
    clean_root = root / TILES_CLEAN_DIR
    processed_root = root / PROCESSED_DIR
    dataset_root = root / DATASET_DIR
    images_root = root / DATASET_IMAGES_DIR
    labels_path = root / LABELS_PATH
    manual_root = root / MANUAL_DIR
    manual_images_root = root / MANUAL_IMAGES_DIR
    manual_labels_path = root / MANUAL_LABELS_PATH

    ensure_directories([dataset_root, images_root, manual_root, manual_images_root])

    image_paths = sorted_image_files(clean_root)
    input_signature_data = {
        "tiles_clean": directory_signature(clean_root, {".png"}),
        "processed": directory_signature(processed_root, {".png"}),
    }
    stage_marker = marker_path(dataset_root, STAGE_NAME)
    config = {
        "link_or_copy_dataset_images": True,
        "metadata_enriched": True,
        "manual_label_support": True,
    }

    if not image_paths:
        print("generate_labels: no clean tiles found")
        with labels_path.open("w", encoding="utf-8") as handle:
            json.dump([], handle, indent=2)
        return

    if stage_is_cached(
        stage_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        config=config,
        required_paths=[images_root, labels_path, manual_images_root, manual_labels_path],
    ):
        print("generate_labels: cached")
        return

    clear_files(images_root, {".png"})

    labels: list[dict[str, object]] = []
    copied = 0
    skipped = 0
    label_counts = {"likely_good": 0, "uncertain": 0, "bad": 0}

    for src_path in image_paths:
        image = cv2.imread(str(src_path), cv2.IMREAD_GRAYSCALE)
        if image is None:
            skipped += 1
            continue

        std_value = float(np.std(image))
        label = weak_label(std_value)
        metadata = parse_tile_metadata(src_path)
        relative_parent = src_path.relative_to(clean_root).parent
        source_width = image.shape[1]
        source_height = image.shape[0]
        tile_x = 0
        tile_y = 0
        base_name = src_path.stem

        if metadata is not None:
            base_name, tile_x, tile_y = metadata
            shape = source_image_shape(
                str(processed_root),
                relative_parent.as_posix() if relative_parent.as_posix() else ".",
                base_name,
            )
            if shape is not None:
                source_width, source_height = shape

        tile_size = int(image.shape[0])
        edge_dist = edge_distance(tile_x, tile_y, tile_size, source_width, source_height)
        edge_tile = edge_dist <= tile_size // 2
        image_name = src_path.relative_to(clean_root).as_posix().replace("/", "__")
        dst_path = images_root / image_name

        if not safe_link_or_copy_file(src_path, dst_path):
            skipped += 1
            continue

        labels.append(
            {
                "image": dst_path.name,
                "label": label,
                "source_image_id": str(relative_parent / base_name).replace("\\", "/"),
                "tile_x": tile_x,
                "tile_y": tile_y,
                "tile_size": tile_size,
                "source_width": int(source_width),
                "source_height": int(source_height),
                "edge_distance": edge_dist,
                "edge_tile": edge_tile,
                "pixel_std": std_value,
                "quality_score": smooth_quality_score(std_value),
                "manual": False,
            }
        )
        label_counts[label] += 1
        copied += 1

    with labels_path.open("w", encoding="utf-8") as handle:
        json.dump(labels, handle, indent=2)

    seeded_manual_count = seed_manual_labels(labels, images_root, manual_images_root, manual_labels_path)
    output_signature_data = directory_signature(images_root, {".png"})
    save_marker(
        stage_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        output_signature_data=output_signature_data,
        config=config,
        summary={
            "copied": copied,
            "skipped": skipped,
            "label_counts": label_counts,
            "seeded_manual_labels": seeded_manual_count,
        },
    )
    print(
        f"generate_labels: copied={copied} skipped={skipped} labels={len(labels)} "
        f"distribution={label_counts} manual_seeded={seeded_manual_count}"
    )


if __name__ == "__main__":
    main()
