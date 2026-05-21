from __future__ import annotations

import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2

from pipeline_utils import (
    clear_files,
    directory_signature,
    ensure_directories,
    iter_image_files,
    load_marker,
    marker_path,
    project_root,
    safe_link_or_copy_file,
    save_marker,
    stage_is_cached,
)
from tile_quality import keep_tile


TILES_DIR = Path("tiles")
TILES_CLEAN_DIR = Path("tiles_clean")
STAGE_NAME = "filter_tiles"
STAGE_VERSION = "2"


def mirror_tile_worker(src_path_text: str, tiles_root_text: str, clean_root_text: str) -> tuple[int, int]:
    src_path = Path(src_path_text)
    tiles_root = Path(tiles_root_text)
    clean_root = Path(clean_root_text)
    dst_path = clean_root / src_path.relative_to(tiles_root)
    return (1, 0) if safe_link_or_copy_file(src_path, dst_path) else (0, 1)


def filter_tile_worker(src_path_text: str, tiles_root_text: str, clean_root_text: str) -> tuple[int, int]:
    src_path = Path(src_path_text)
    tiles_root = Path(tiles_root_text)
    clean_root = Path(clean_root_text)

    image = cv2.imread(str(src_path), cv2.IMREAD_GRAYSCALE)
    if image is None or not keep_tile(image):
        return 0, 1

    dst_path = clean_root / src_path.relative_to(tiles_root)
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    return (1, 0) if cv2.imwrite(str(dst_path), image) else (0, 1)


def main() -> None:
    root = project_root()
    tiles_root = root / TILES_DIR
    clean_root = root / TILES_CLEAN_DIR
    ensure_directories([clean_root])

    tile_paths = sorted(iter_image_files(tiles_root), key=lambda path: path.as_posix())
    if not tile_paths:
        print("filter_tiles: no tiles found")
        return

    input_signature_data = directory_signature(tiles_root, {".png"})
    stage_marker = marker_path(clean_root, STAGE_NAME)
    config = {"linked_output": True}

    if stage_is_cached(
        stage_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        config=config,
        required_paths=[clean_root],
    ):
        print("filter_tiles: cached")
        return

    clear_files(clean_root, {".png"})

    tile_stage_marker = load_marker(marker_path(tiles_root, "tile_images"))
    prefiltered = bool(
        tile_stage_marker
        and tile_stage_marker.get("config", {}).get("prefiltered_before_save")
    )
    removed = int(tile_stage_marker.get("summary", {}).get("discarded_pre_save", 0)) if prefiltered else 0

    worker_count = max(1, os.cpu_count() or 1)
    chunk_size = max(1, len(tile_paths) // max(worker_count * 8, 1))
    kept = 0
    failures = 0

    worker = mirror_tile_worker if prefiltered else filter_tile_worker
    with ThreadPoolExecutor(max_workers=worker_count) as executor:
        for copied, failed in executor.map(
            worker,
            (str(path) for path in tile_paths),
            [str(tiles_root)] * len(tile_paths),
            [str(clean_root)] * len(tile_paths),
            chunksize=chunk_size,
        ):
            kept += copied
            failures += failed

    if not prefiltered:
        removed = failures

    output_signature_data = directory_signature(clean_root, {".png"})
    save_marker(
        stage_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        output_signature_data=output_signature_data,
        config=config,
        summary={"kept": kept, "removed": removed, "failures": failures, "prefiltered": prefiltered},
    )
    print(f"filter_tiles: kept={kept} removed={removed}")


if __name__ == "__main__":
    main()
