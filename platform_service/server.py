from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import subprocess
import sys
import tempfile
import threading
import fcntl
import warnings
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from PIL import Image, UnidentifiedImageError

from .store import Store


LOG = logging.getLogger("colony_atlas")
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
MAX_IMAGE_PIXELS = 100_000_000
IMAGE_TYPES = {"PNG": (".png", "image/png"), "JPEG": (".jpg", "image/jpeg"), "TIFF": (".tiff", "image/tiff")}
FIELD_ROUTE = re.compile(r"^/api/fields/([0-9a-f]{32})(?:/(image|analysis|jobs|decisions|export))?$")


def process_one_job(store: Store, job: dict, model_path: Path) -> None:
    field = store.get_field(job["field_id"])
    if field is None:
        store.finish_job(job["id"], None, None, "Source field no longer exists")
        return
    if not model_path.is_file():
        store.finish_job(job["id"], None, None, "No trained model is installed. Ask an administrator to add model.pth.")
        return
    try:
        input_dir = store.root / "jobs" / job["id"] / "input"
        output_dir = store.root / "jobs" / job["id"] / "output"
        input_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)
        source = store.root / field["image_path"]
        target = input_dir / ("field" + source.suffix)
        if not target.exists():
            target.symlink_to(source)
        with model_path.open("rb") as model_file:
            model_digest = hashlib.file_digest(model_file, "sha256").hexdigest()
        result = subprocess.run(
            [sys.executable, str(PROJECT_ROOT / "run_analysis.py"), "--input", str(input_dir), "--output", str(output_dir)],
            cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=3600, check=False,
        )
        if result.returncode:
            raise RuntimeError((result.stderr or result.stdout)[-1500:] or "Analysis failed")
        report_items = json.loads((output_dir / "plate_report.json").read_text(encoding="utf-8"))
        if len(report_items) != 1:
            raise RuntimeError("Analysis did not return exactly one field")
        with model_path.open("rb") as model_file:
            finished_digest = hashlib.file_digest(model_file, "sha256").hexdigest()
        if finished_digest != model_digest:
            raise RuntimeError("Model changed during analysis; rerun the job")
        store.finish_job(job["id"], report_items[0], model_digest)
        LOG.info("job succeeded id=%s field=%s", job["id"], job["field_id"])
    except Exception as exc:
        LOG.exception("job failed id=%s", job["id"])
        store.finish_job(job["id"], None, None, str(exc)[:1500])


def worker_loop(store: Store, model_path: Path, stop: threading.Event) -> None:
    while not stop.is_set():
        try:
            job = store.claim_job()
            if job:
                process_one_job(store, job, model_path)
            else:
                stop.wait(1)
        except Exception:
            LOG.exception("worker loop failed; retrying")
            stop.wait(1)


def make_handler(store: Store, api_token: str | None = None, ready_check=None):
    class Handler(BaseHTTPRequestHandler):
        server_version = "ColonyAtlas/0.2"

        def authorized(self) -> bool:
            if api_token is None:
                return True
            import hmac
            provided = self.headers.get("Authorization", "")
            return hmac.compare_digest(provided, f"Bearer {api_token}")

        def reply(self, status: int, value: object) -> None:
            data = json.dumps(value).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def fail(self, status: int, message: str) -> None:
            self.reply(status, {"error": message})

        def body(self, limit: int = 65536) -> bytes:
            raw_length = self.headers.get("Content-Length")
            if raw_length is None or not raw_length.isdecimal():
                raise ValueError("Content-Length is required")
            length = int(raw_length)
            if length < 1 or length > limit:
                raise ValueError(f"Body must be between 1 and {limit} bytes")
            data = self.rfile.read(length)
            if len(data) != length:
                raise ValueError("Incomplete request body")
            return data

        def send_file(self, path: Path, mime: str) -> None:
            if not path.is_file():
                self.fail(404, "File not found")
                return
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(path.stat().st_size))
            self.send_header("Cache-Control", "private, no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            with path.open("rb") as source:
                while chunk := source.read(1024 * 1024):
                    self.wfile.write(chunk)

        def do_GET(self) -> None:
            path = urlsplit(self.path).path
            if path == "/health":
                self.reply(200, {"status": "ok"})
                return
            if not self.authorized():
                self.fail(401, "Unauthorized")
                return
            if path == "/ready":
                try:
                    with store.connect() as db:
                        db.execute("SELECT 1").fetchone()
                    if ready_check is not None and not ready_check():
                        raise RuntimeError("worker unavailable")
                    self.reply(200, {"status": "ready"})
                except Exception:
                    self.fail(503, "Service is not ready")
                return
            if path == "/api/fields":
                self.reply(200, {"fields": store.list_fields()})
                return
            if path == "/api/jobs":
                self.reply(200, {"jobs": store.list_jobs()})
                return
            match = FIELD_ROUTE.fullmatch(path)
            if not match:
                self.fail(404, "Not found")
                return
            field_id, resource = match.groups()
            field = store.get_field(field_id)
            if field is None:
                self.fail(404, "Field not found")
                return
            if resource is None:
                self.reply(200, field)
            elif resource == "image":
                extension = Path(field["image_path"]).suffix.lower()
                mime = next((item[1] for item in IMAGE_TYPES.values() if item[0] == extension), "application/octet-stream")
                self.send_file(store.root / field["image_path"], mime)
            elif resource == "jobs":
                self.reply(200, {"jobs": store.list_jobs(field_id)})
            elif resource == "analysis":
                analysis = store.latest_analysis(field_id)
                self.reply(200, analysis) if analysis else self.fail(404, "No analysis yet")
            elif resource == "decisions":
                self.reply(200, {"decisions": store.list_decisions(field_id)})
            elif resource == "export":
                self.reply(200, {"field": field, "analysis": store.latest_analysis(field_id),
                                 "decisions": store.list_decisions(field_id)})

        def do_POST(self) -> None:
            path = urlsplit(self.path).path
            if not self.authorized():
                self.fail(401, "Unauthorized")
                return
            try:
                if path == "/api/fields":
                    self.upload()
                    return
                match = FIELD_ROUTE.fullmatch(path)
                if not match:
                    self.fail(404, "Not found")
                    return
                field_id, resource = match.groups()
                if resource == "jobs":
                    self.reply(201, store.add_job(field_id))
                elif resource == "decisions":
                    payload = json.loads(self.body())
                    if not isinstance(payload, dict):
                        raise ValueError("JSON object required")
                    required = ("job_id", "colony_id", "decision", "reviewer")
                    if any(not isinstance(payload.get(key), str) or not payload[key].strip() for key in required):
                        raise ValueError("job_id, colony_id, decision, and reviewer are required")
                    note = payload.get("note", "")
                    if not isinstance(note, str) or len(note) > 2000 or len(payload["reviewer"]) > 100:
                        raise ValueError("Invalid reviewer or note length")
                    self.reply(201, store.add_decision(field_id, payload["job_id"], payload["colony_id"],
                                                       payload["decision"], payload["reviewer"].strip(), note.strip()))
                else:
                    self.fail(404, "Not found")
            except KeyError as exc:
                self.fail(404, str(exc))
            except (ValueError, json.JSONDecodeError) as exc:
                self.fail(400, str(exc))

        def upload(self) -> None:
            raw_name = self.headers.get("X-Filename-Encoded")
            filename = (unquote(raw_name) if raw_name is not None else self.headers.get("X-Filename", "")).strip()
            if not filename or len(filename) > 255 or "/" in filename or "\\" in filename or any(ord(char) < 32 for char in filename):
                raise ValueError("X-Filename must contain a filename under 256 characters")
            raw_length = self.headers.get("Content-Length")
            if raw_length is None or not raw_length.isdecimal():
                raise ValueError("Content-Length is required")
            length = int(raw_length)
            if length < 1 or length > MAX_UPLOAD_BYTES:
                self.fail(413, "Image exceeds the 100 MB upload limit")
                return
            blob_dir = store.root / "images"
            blob_dir.mkdir(exist_ok=True)
            digest_builder = hashlib.sha256()
            with tempfile.NamedTemporaryFile(dir=blob_dir, delete=False) as temp:
                temp_path = Path(temp.name)
                try:
                    remaining = length
                    while remaining:
                        chunk = self.rfile.read(min(1024 * 1024, remaining))
                        if not chunk:
                            raise ValueError("Incomplete request body")
                        temp.write(chunk)
                        digest_builder.update(chunk)
                        remaining -= len(chunk)
                    temp.flush()
                    os.fsync(temp.fileno())
                except Exception:
                    temp_path.unlink(missing_ok=True)
                    raise
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("error", Image.DecompressionBombWarning)
                    Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
                    with Image.open(temp_path) as image:
                        image_format = image.format
                        width, height = image.size
                        image.verify()
            except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombWarning) as exc:
                temp_path.unlink(missing_ok=True)
                raise ValueError("Invalid image file") from exc
            if image_format not in IMAGE_TYPES or width < 1 or height < 1 or width * height > MAX_IMAGE_PIXELS:
                temp_path.unlink(missing_ok=True)
                raise ValueError("Supported images are PNG, JPEG, and TIFF up to 100 megapixels")
            extension = IMAGE_TYPES[image_format][0]
            digest = digest_builder.hexdigest()
            relative_path = f"images/{digest}{extension}"
            blob_path = store.root / relative_path
            if not blob_path.exists():
                os.replace(temp_path, blob_path)
            else:
                temp_path.unlink()
            field = store.add_field(filename, relative_path, digest, width, height)
            self.reply(201, field)

        def log_message(self, format: str, *args: object) -> None:
            LOG.info("http %s %s", self.address_string(), format % args)

    return Handler


def serve(host: str = "127.0.0.1", port: int = 8765, root: Path | None = None, start_worker: bool = True) -> None:
    api_token = os.environ.get("ATLAS_API_TOKEN") or None
    if host not in {"127.0.0.1", "::1", "localhost"} and not api_token:
        raise SystemExit("ATLAS_API_TOKEN is required when binding beyond localhost")
    data_root = (root or PROJECT_ROOT / "platform_data").resolve()
    data_root.mkdir(parents=True, exist_ok=True)
    lock = (data_root / ".service.lock").open("w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError as exc:
        raise SystemExit("Another service already uses this data directory") from exc
    store = Store(data_root)
    stop = threading.Event()
    worker = None
    if start_worker:
        worker = threading.Thread(target=worker_loop, args=(store, PROJECT_ROOT / "model.pth", stop), daemon=True)
        worker.start()
    server = ThreadingHTTPServer((host, port), make_handler(store, api_token, lambda: worker is None or worker.is_alive()))
    server.daemon_threads = True
    LOG.info("Colony Atlas API listening on http://%s:%s", host, port)
    try:
        server.serve_forever()
    finally:
        stop.set()
        server.server_close()
        lock.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run the local Colony Atlas service")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--data-dir", type=Path, default=PROJECT_ROOT / "platform_data")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    serve(args.host, args.port, args.data_dir)
