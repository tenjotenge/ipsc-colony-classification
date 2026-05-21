from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

from pipeline_utils import (
    IMAGE_EXTENSIONS,
    clear_files,
    directory_signature,
    ensure_directories,
    iter_image_files,
    marker_path,
    project_root,
    save_marker,
    stage_is_cached,
)


RAW_DIR = Path("raw")
PROCESSED_DIR = Path("processed")
STAGE_NAME = "convert_to_png"
STAGE_VERSION = "2"


def normalize_to_uint8(image: np.ndarray) -> np.ndarray:
    if image.ndim == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    elif image.ndim == 4:
        image = cv2.cvtColor(image[0], cv2.COLOR_BGR2GRAY)

    image = np.nan_to_num(image).astype(np.float32)
    min_val = float(image.min())
    max_val = float(image.max())

    if max_val <= min_val:
        return np.zeros(image.shape[:2], dtype=np.uint8)

    normalized = (image - min_val) * (255.0 / (max_val - min_val))
    return np.clip(normalized, 0, 255).astype(np.uint8)


def convert_image(src_path: Path, raw_root: Path, processed_root: Path) -> bool:
    image = cv2.imread(str(src_path), cv2.IMREAD_UNCHANGED)
    if image is None:
        return False

    try:
        normalized = normalize_to_uint8(image)
        relative_path = src_path.relative_to(raw_root).with_suffix(".png")
        dst_path = processed_root / relative_path
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        return bool(cv2.imwrite(str(dst_path), normalized))
    except Exception:
        return False


def main() -> None:
    root = project_root()
    raw_root = root / RAW_DIR
    processed_root = root / PROCESSED_DIR
    ensure_directories([processed_root])

    image_paths = list(iter_image_files(raw_root))
    if not image_paths:
        print("convert_to_png: no input images found")
        return

    input_signature_data = directory_signature(raw_root, IMAGE_EXTENSIONS)
    stage_marker = marker_path(processed_root, STAGE_NAME)

    if stage_is_cached(
        stage_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        config={},
        required_paths=[processed_root],
    ):
        print("convert_to_png: cached")
        return

    clear_files(processed_root, {".png"})

    converted = 0
    skipped = 0

    for index, src_path in enumerate(image_paths, start=1):
        if convert_image(src_path, raw_root, processed_root):
            converted += 1
        else:
            skipped += 1
        if index % 100 == 0:
            print(
                f"convert_to_png: processed={index}/{len(image_paths)} "
                f"converted={converted} skipped={skipped}"
            )

    output_signature_data = directory_signature(processed_root, {".png"})
    save_marker(
        stage_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        output_signature_data=output_signature_data,
        summary={"converted": converted, "skipped": skipped},
    )
    print(f"convert_to_png: converted={converted} skipped={skipped}")


if __name__ == "__main__":
    main()
