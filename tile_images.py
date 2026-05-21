from __future__ import annotations

import os
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import cv2

from pipeline_utils import (
    clear_files,
    directory_signature,
    ensure_directories,
    marker_path,
    project_root,
    save_marker,
    sorted_image_files,
    stage_is_cached,
)
from tile_quality import keep_tile


PROCESSED_DIR = Path("processed")
TILES_DIR = Path("tiles")
TILE_SIZE = 256
STRIDE = 256
STAGE_NAME = "tile_images"
STAGE_VERSION = "2"


def tile_image_worker(src_path_text: str, processed_root_text: str, tiles_root_text: str) -> dict[str, int]:
    src_path = Path(src_path_text)
    processed_root = Path(processed_root_text)
    tiles_root = Path(tiles_root_text)

    image = cv2.imread(str(src_path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return {"saved": 0, "failed": 1, "too_small": 0, "generated": 0, "discarded": 0}

    height, width = image.shape[:2]
    if height < TILE_SIZE or width < TILE_SIZE:
        return {"saved": 0, "failed": 0, "too_small": 1, "generated": 0, "discarded": 0}

    relative_parent = src_path.relative_to(processed_root).parent
    tile_dir = tiles_root / relative_parent
    tile_dir.mkdir(parents=True, exist_ok=True)

    saved = 0
    generated = 0
    discarded = 0
    base_name = src_path.stem

    for y in range(0, height - TILE_SIZE + 1, STRIDE):
        for x in range(0, width - TILE_SIZE + 1, STRIDE):
            generated += 1
            tile = image[y : y + TILE_SIZE, x : x + TILE_SIZE]
            if not keep_tile(tile):
                discarded += 1
                continue

            tile_name = f"{base_name}_{x}_{y}.png"
            tile_path = tile_dir / tile_name
            if cv2.imwrite(str(tile_path), tile):
                saved += 1

    return {
        "saved": saved,
        "failed": 0,
        "too_small": 0,
        "generated": generated,
        "discarded": discarded,
    }


def main() -> None:
    root = project_root()
    processed_root = root / PROCESSED_DIR
    tiles_root = root / TILES_DIR
    ensure_directories([tiles_root])

    image_paths = sorted_image_files(processed_root)
    if not image_paths:
        print("tile_images: no processed images found")
        return

    input_signature_data = directory_signature(processed_root, {".png"})
    stage_marker = marker_path(tiles_root, STAGE_NAME)
    config = {
        "tile_size": TILE_SIZE,
        "stride": STRIDE,
        "prefiltered_before_save": True,
    }

    if stage_is_cached(
        stage_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        config=config,
        required_paths=[tiles_root],
    ):
        print("tile_images: cached")
        return

    clear_files(tiles_root, {".png"})

    worker_count = max(1, os.cpu_count() or 1)
    chunk_size = max(1, len(image_paths) // max(worker_count * 4, 1))
    tiles_saved = 0
    skipped = 0
    too_small = 0
    raw_generated = 0
    discarded = 0

    with ProcessPoolExecutor(max_workers=worker_count) as executor:
        for result in executor.map(
            tile_image_worker,
            (str(path) for path in image_paths),
            [str(processed_root)] * len(image_paths),
            [str(tiles_root)] * len(image_paths),
            chunksize=chunk_size,
        ):
            tiles_saved += result["saved"]
            skipped += result["failed"]
            too_small += result["too_small"]
            raw_generated += result["generated"]
            discarded += result["discarded"]

    output_signature_data = directory_signature(tiles_root, {".png"})
    save_marker(
        stage_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        output_signature_data=output_signature_data,
        config=config,
        summary={
            "saved": tiles_saved,
            "corrupt_or_failed": skipped,
            "too_small": too_small,
            "generated": raw_generated,
            "discarded_pre_save": discarded,
        },
    )
    print(
        f"tile_images: total_tiles_generated={raw_generated} kept_on_disk={tiles_saved} "
        f"discarded_pre_save={discarded} corrupt_or_failed={skipped} too_small={too_small}"
    )


if __name__ == "__main__":
    main()
