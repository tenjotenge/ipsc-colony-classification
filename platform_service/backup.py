"""Offline, integrity-checked backup and restore for a single-site data directory."""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import io
import json
import os
import shutil
import sqlite3
import tarfile
import tempfile
from contextlib import contextmanager
from pathlib import Path


def sha256(path: Path) -> str:
    with path.open("rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


@contextmanager
def exclusive_data_lock(root: Path):
    root.mkdir(parents=True, exist_ok=True)
    with (root / ".service.lock").open("w") as handle:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise RuntimeError("Stop the service before backing up or restoring this data directory") from exc
        yield


def backup(root: Path, output: Path) -> None:
    root = root.resolve()
    output = output.resolve()
    if output.exists():
        raise FileExistsError(f"Backup already exists: {output}")
    if root == output.parent or root in output.parents:
        raise ValueError("Backup must be written outside the data directory")
    with exclusive_data_lock(root):
        if not (root / "atlas.sqlite3").is_file():
            raise FileNotFoundError("No atlas.sqlite3 found in data directory")
        with tempfile.TemporaryDirectory() as temporary:
            snapshot = Path(temporary) / "atlas.sqlite3"
            with sqlite3.connect(root / "atlas.sqlite3") as source, sqlite3.connect(snapshot) as destination:
                source.backup(destination)
            files = {"atlas.sqlite3": snapshot}
            for directory in ("images", "jobs"):
                folder = root / directory
                if folder.exists():
                    for path in sorted(folder.rglob("*")):
                        if path.is_file() and not path.is_symlink() and (directory != "jobs" or "output" in path.parts):
                            files[path.relative_to(root).as_posix()] = path
            manifest = {name: {"sha256": sha256(path), "size": path.stat().st_size} for name, path in files.items()}
            output.parent.mkdir(parents=True, exist_ok=True)
            with tempfile.NamedTemporaryFile(dir=output.parent, delete=False) as temp:
                temp_path = Path(temp.name)
            try:
                with tarfile.open(temp_path, "w:gz") as archive:
                    payload = json.dumps({"format": 1, "files": manifest}, indent=2).encode("utf-8")
                    info = tarfile.TarInfo("manifest.json")
                    info.size = len(payload)
                    archive.addfile(info, io.BytesIO(payload))
                    for name, path in files.items():
                        archive.add(path, arcname=name, recursive=False)
                os.replace(temp_path, output)
            finally:
                temp_path.unlink(missing_ok=True)


def verified_members(archive_path: Path) -> list[str]:
    with tarfile.open(archive_path, "r:gz") as archive:
        members = archive.getmembers()
        names = [member.name for member in members]
        if len(names) != len(set(names)) or "manifest.json" not in names:
            raise ValueError("Missing manifest or duplicate archive members")
        manifest_member = archive.getmember("manifest.json")
        if not manifest_member.isfile() or manifest_member.size > 10 * 1024 * 1024:
            raise ValueError("Invalid manifest")
        manifest_file = archive.extractfile(manifest_member)
        if manifest_file is None:
            raise ValueError("Missing manifest")
        manifest = json.load(manifest_file)
        if manifest.get("format") != 1 or not isinstance(manifest.get("files"), dict):
            raise ValueError("Unsupported backup format")
        expected = manifest["files"]
        if set(names) != set(expected) | {"manifest.json"} or "atlas.sqlite3" not in expected:
            raise ValueError("Archive files do not match manifest")
        result = []
        for member in members:
            if member.name == "manifest.json":
                continue
            parts = Path(member.name).parts
            if not member.isfile() or member.name.startswith("/") or ".." in parts or parts[0] not in {"atlas.sqlite3", "images", "jobs"}:
                raise ValueError("Unsafe archive member")
            if parts[0] == "atlas.sqlite3" and len(parts) != 1:
                raise ValueError("Unsafe database path")
            source = archive.extractfile(member)
            if source is None:
                raise ValueError("Unreadable archive member")
            digest = hashlib.sha256()
            size = 0
            while chunk := source.read(1024 * 1024):
                digest.update(chunk)
                size += len(chunk)
            if size != expected[member.name]["size"] or digest.hexdigest() != expected[member.name]["sha256"]:
                raise ValueError(f"Backup checksum mismatch: {member.name}")
            result.append(member.name)
        return result


def restore(archive_path: Path, root: Path) -> None:
    contents = verified_members(archive_path)
    root = root.resolve()
    if root.exists():
        raise FileExistsError("Restore target must not already exist")
    root.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix=f".{root.name}-restore-", dir=root.parent))
    try:
        with tarfile.open(archive_path, "r:gz") as archive:
            for name in contents:
                source = archive.extractfile(name)
                if source is None:
                    raise ValueError("Unreadable archive member")
                target = staging / name
                target.parent.mkdir(parents=True, exist_ok=True)
                with target.open("xb") as destination:
                    shutil.copyfileobj(source, destination, length=1024 * 1024)
        os.rename(staging, root)
    finally:
        if staging.exists():
            shutil.rmtree(staging)


def main() -> None:
    parser = argparse.ArgumentParser(description="Back up, verify, or restore Colony Atlas data")
    subcommands = parser.add_subparsers(dest="action", required=True)
    create = subcommands.add_parser("create")
    create.add_argument("--data-dir", type=Path, required=True)
    create.add_argument("--output", type=Path, required=True)
    verify = subcommands.add_parser("verify")
    verify.add_argument("archive", type=Path)
    recover = subcommands.add_parser("restore")
    recover.add_argument("archive", type=Path)
    recover.add_argument("--data-dir", type=Path, required=True)
    args = parser.parse_args()
    if args.action == "create":
        backup(args.data_dir, args.output)
        print(f"Created {args.output}")
    elif args.action == "verify":
        files = verified_members(args.archive)
        print(f"Verified {len(files)} files")
    else:
        restore(args.archive, args.data_dir)
        print(f"Restored to {args.data_dir}")


if __name__ == "__main__":
    main()
