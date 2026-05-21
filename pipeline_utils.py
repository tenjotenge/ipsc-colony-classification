from __future__ import annotations

import hashlib
import json
import os
import shutil
from pathlib import Path
from typing import Any, Generator, Iterable


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}


def project_root() -> Path:
    return Path(__file__).resolve().parent


def ensure_directories(paths: Iterable[Path]) -> None:
    for path in paths:
        path.mkdir(parents=True, exist_ok=True)


def iter_image_files(root: Path) -> Generator[Path, None, None]:
    if not root.exists():
        return
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
            yield path


def sorted_image_files(root: Path) -> list[Path]:
    return sorted(iter_image_files(root), key=lambda path: path.as_posix())


def safe_copy_file(src: Path, dst: Path) -> bool:
    try:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        return True
    except OSError:
        return False


def safe_link_or_copy_file(src: Path, dst: Path) -> bool:
    try:
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists():
            dst.unlink()
        os.link(src, dst)
        return True
    except OSError:
        return safe_copy_file(src, dst)


def unique_destination(path: Path) -> Path:
    if not path.exists():
        return path

    stem = path.stem
    suffix = path.suffix
    counter = 1
    while True:
        candidate = path.with_name(f"{stem}_{counter}{suffix}")
        if not candidate.exists():
            return candidate
        counter += 1


def clear_files(root: Path, suffixes: set[str] | None = None) -> None:
    if not root.exists():
        return
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if suffixes is not None and path.suffix.lower() not in suffixes:
            continue
        try:
            path.unlink()
        except OSError:
            continue


def file_signature(path: Path) -> dict[str, Any]:
    if not path.exists() or not path.is_file():
        return {"type": "file", "exists": False, "size": 0, "mtime_ns": 0}
    stat = path.stat()
    return {
        "type": "file",
        "exists": True,
        "size": stat.st_size,
        "mtime_ns": stat.st_mtime_ns,
    }


def directory_signature(root: Path, suffixes: set[str] | None = None) -> dict[str, Any]:
    hasher = hashlib.sha256()
    count = 0

    if root.exists():
        for path in sorted(root.rglob("*"), key=lambda item: item.as_posix()):
            if not path.is_file():
                continue
            if suffixes is not None and path.suffix.lower() not in suffixes:
                continue
            stat = path.stat()
            rel_path = path.relative_to(root).as_posix()
            hasher.update(rel_path.encode("utf-8"))
            hasher.update(str(stat.st_size).encode("utf-8"))
            hasher.update(str(stat.st_mtime_ns).encode("utf-8"))
            count += 1

    return {
        "type": "directory",
        "exists": root.exists(),
        "count": count,
        "digest": hasher.hexdigest(),
    }


def marker_path(root: Path, stage_name: str) -> Path:
    return root / f".{stage_name}.stage.json"


def load_marker(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError):
        return None


def save_marker(
    path: Path,
    stage_name: str,
    stage_version: str,
    input_signature_data: dict[str, Any],
    output_signature_data: dict[str, Any],
    config: dict[str, Any] | None = None,
    summary: dict[str, Any] | None = None,
) -> None:
    payload = {
        "stage": stage_name,
        "version": stage_version,
        "input_signature": input_signature_data,
        "output_signature": output_signature_data,
        "config": config or {},
        "summary": summary or {},
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)


def stage_is_cached(
    marker_file: Path,
    stage_name: str,
    stage_version: str,
    input_signature_data: dict[str, Any],
    config: dict[str, Any] | None = None,
    required_paths: Iterable[Path] | None = None,
) -> bool:
    marker = load_marker(marker_file)
    if marker is None:
        return False
    if marker.get("stage") != stage_name or marker.get("version") != stage_version:
        return False
    if marker.get("input_signature") != input_signature_data:
        return False
    if marker.get("config", {}) != (config or {}):
        return False
    for path in required_paths or []:
        if not path.exists():
            return False
    return True


def adopt_existing_stage(
    marker_file: Path,
    stage_name: str,
    stage_version: str,
    input_signature_data: dict[str, Any],
    output_signature_data: dict[str, Any],
    config: dict[str, Any] | None = None,
    summary: dict[str, Any] | None = None,
    required_paths: Iterable[Path] | None = None,
    allow_empty: bool = False,
) -> bool:
    if marker_file.exists():
        return False
    for path in required_paths or []:
        if not path.exists():
            return False
    count = int(output_signature_data.get("count", 0))
    exists = bool(output_signature_data.get("exists", False))
    if not exists:
        return False
    if count == 0 and not allow_empty:
        return False
    save_marker(
        marker_file,
        stage_name=stage_name,
        stage_version=stage_version,
        input_signature_data=input_signature_data,
        output_signature_data=output_signature_data,
        config=config,
        summary=summary,
    )
    return True
