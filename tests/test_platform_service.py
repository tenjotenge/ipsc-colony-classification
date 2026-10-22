import io
import json
import sqlite3
import subprocess
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from PIL import Image

from platform_service.server import make_handler, process_one_job
from platform_service.store import Store


class PlatformServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.store = Store(Path(self.temp.name))
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(self.store))
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)
        self.temp.cleanup()

    def request(self, method, path, body=None, headers=None):
        connection = HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        connection.request(method, path, body=body, headers=headers or {})
        response = connection.getresponse()
        data = response.read()
        status = response.status
        connection.close()
        return status, json.loads(data) if response.getheader("Content-Type", "").startswith("application/json") else data

    def upload(self):
        buffer = io.BytesIO()
        Image.new("L", (32, 24), color=100).save(buffer, format="PNG")
        return self.request("POST", "/api/fields", buffer.getvalue(), {"X-Filename": "plate.png"})

    def test_import_job_recovery_and_export(self):
        status, field = self.upload()
        self.assertEqual(status, 201)
        self.assertEqual((field["width"], field["height"]), (32, 24))
        status, image = self.request("GET", f"/api/fields/{field['id']}/image")
        self.assertEqual(status, 200)
        self.assertTrue(image.startswith(b"\x89PNG"))
        status, job = self.request("POST", f"/api/fields/{field['id']}/jobs")
        self.assertEqual(status, 201)
        self.assertEqual(self.request("POST", f"/api/fields/{field['id']}/jobs")[0], 400)
        self.assertEqual(self.store.claim_job()["id"], job["id"])
        # Restarting the service requeues interrupted work.
        Store(Path(self.temp.name))
        self.assertEqual(self.store.claim_job()["id"], job["id"])
        report = {"image_id": "field", "ranked_colonies": [{"colony_id": "field_colony_001", "x": 1}]}
        self.store.finish_job(job["id"], report, "modelhash")
        status, analysis = self.request("GET", f"/api/fields/{field['id']}/analysis")
        self.assertEqual(status, 200)
        self.assertEqual(analysis["report"], report)
        decision = dict(job_id=job["id"], colony_id="field_colony_001", decision="shortlist", reviewer="Technician", note="Review")
        self.assertEqual(self.request("POST", f"/api/fields/{field['id']}/decisions", json.dumps(decision), {"Content-Type": "application/json"})[0], 201)
        status, exported = self.request("GET", f"/api/fields/{field['id']}/export")
        self.assertEqual(status, 200)
        self.assertEqual(exported["decisions"][0]["decision"], "shortlist")
        self.assertTrue(exported["analysis_current"])
        rerun = self.store.add_job(field["id"])
        status, exported = self.request("GET", f"/api/fields/{field['id']}/export")
        self.assertEqual(status, 200)
        self.assertEqual(exported["latest_job"]["id"], rerun["id"])
        self.assertFalse(exported["analysis_current"])

    def test_rejects_invalid_image_and_decision(self):
        self.assertEqual(self.request("POST", "/api/fields", b"not an image", {"X-Filename": "bad.png"})[0], 400)
        _, field = self.upload()
        self.assertEqual(self.request("GET", "/api/fields/../../etc/passwd")[0], 404)
        self.assertEqual(self.request("POST", f"/api/fields/{field['id']}/decisions", b"{}", {"Content-Type": "application/json"})[0], 400)

    def test_authentication_and_readiness(self):
        protected = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(self.store, "test-token"))
        thread = threading.Thread(target=protected.serve_forever, daemon=True)
        thread.start()
        try:
            connection = HTTPConnection("127.0.0.1", protected.server_port, timeout=5)
            connection.request("GET", "/api/fields")
            self.assertEqual(connection.getresponse().status, 401)
            connection.close()
            connection = HTTPConnection("127.0.0.1", protected.server_port, timeout=5)
            connection.request("GET", "/ready", headers={"Authorization": "Bearer test-token"})
            self.assertEqual(connection.getresponse().status, 200)
            connection.close()
        finally:
            protected.shutdown()
            protected.server_close()
            thread.join(timeout=5)

    def test_upload_limit_and_content_deduplication(self):
        _, first = self.upload()
        _, second = self.upload()
        self.assertNotEqual(first["id"], second["id"])
        self.assertEqual(first["image_path"], second["image_path"])
        self.assertEqual(len(list((Path(self.temp.name) / "images").glob("*.png"))), 1)
        self.assertEqual(len(list((Path(self.temp.name) / "images").glob("*.preview.jpg"))), 1)
        status, preview = self.request("GET", f"/api/fields/{first['id']}/preview")
        self.assertEqual(status, 200)
        with Image.open(io.BytesIO(preview)) as image:
            self.assertEqual(image.format, "JPEG")
            self.assertEqual(image.size, (32, 24))
        self.assertEqual(self.request("POST", "/api/fields", b"", {"X-Filename": "huge.png", "Content-Length": str(101 * 1024 * 1024)})[0], 413)

    def test_tiff_preview_can_be_regenerated(self):
        image = Image.new("I;16", (64, 32))
        for x in range(64):
            image.putpixel((x, 0), x * 1000)
        buffer = io.BytesIO()
        image.save(buffer, format="TIFF")
        status, field = self.request("POST", "/api/fields", buffer.getvalue(), {"X-Filename": "field.tiff"})
        self.assertEqual(status, 201)
        preview = Path(self.temp.name) / "images" / f"{field['sha256']}.preview.jpg"
        self.assertTrue(preview.is_file())
        preview.unlink()
        status, payload = self.request("GET", f"/api/fields/{field['id']}/preview")
        self.assertEqual(status, 200)
        with Image.open(io.BytesIO(payload)) as rendered:
            self.assertEqual(rendered.mode, "L")
            low, high = rendered.getextrema()
            self.assertLess(low, high)

    def test_concurrent_job_requests_create_one_active_job(self):
        _, field = self.upload()
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(lambda _: self.request("POST", f"/api/fields/{field['id']}/jobs")[0], range(2)))
        self.assertEqual(sorted(outcomes), [201, 400])
        self.assertEqual(len(self.store.list_jobs(field["id"])), 1)

    def test_concurrent_workers_claim_distinct_jobs_and_report_queue(self):
        fields = [self.upload()[1] for _ in range(3)]
        jobs = [self.store.add_job(field["id"]) for field in fields]
        status, summary = self.request("GET", "/api/status")
        self.assertEqual(status, 200)
        self.assertEqual(summary["jobs"], {"queued": 3, "running": 0, "succeeded": 0, "failed": 0})
        with ThreadPoolExecutor(max_workers=3) as pool:
            claimed = list(pool.map(lambda _: self.store.claim_job(), range(3)))
        self.assertEqual({job["id"] for job in claimed}, {job["id"] for job in jobs})
        self.assertEqual(self.request("GET", "/api/status")[1]["jobs"]["running"], 3)
        self.assertIsNone(self.store.claim_job())
        self.store.finish_job(jobs[0]["id"], None, None, "synthetic failure")
        self.assertEqual(self.store.job_counts()["failed"], 1)
        retried = self.store.add_job(fields[0]["id"])
        self.assertEqual(self.store.job_counts()["failed"], 0)
        self.assertEqual(self.store.job_counts()["queued"], 1)
        self.assertEqual(self.store.claim_job()["id"], retried["id"])

    def test_encoded_unicode_filename(self):
        buffer = io.BytesIO()
        Image.new("L", (8, 8), color=100).save(buffer, format="PNG")
        status, field = self.request("POST", "/api/fields", buffer.getvalue(), {"X-Filename-Encoded": "pl%C3%A5t.png"})
        self.assertEqual(status, 201)
        self.assertEqual(field["filename"], "plåt.png")

    def test_rejects_future_database_schema(self):
        with sqlite3.connect(self.store.db_path) as db:
            db.execute("PRAGMA user_version=999")
        with self.assertRaisesRegex(RuntimeError, "Unsupported database schema"):
            Store(Path(self.temp.name))

    def test_worker_records_model_provenance_and_result(self):
        _, field = self.upload()
        job = self.store.add_job(field["id"])
        self.store.claim_job()
        model = Path(self.temp.name) / "model.pth"
        model.write_bytes(b"synthetic model fixture")

        def fake_analysis(command, **_kwargs):
            output = Path(command[command.index("--output") + 1])
            output.mkdir(parents=True, exist_ok=True)
            (output / "plate_report.json").write_text(json.dumps([{
                "image_id": "field", "ranked_colonies": [{"colony_id": "field_colony_001"}],
            }]), encoding="utf-8")
            return subprocess.CompletedProcess(command, 0, "", "")

        with patch("platform_service.server.subprocess.run", side_effect=fake_analysis):
            process_one_job(self.store, job, model)
        self.assertEqual(self.store.list_jobs(field["id"])[0]["status"], "succeeded")
        analysis = self.store.latest_analysis(field["id"])
        self.assertEqual(len(analysis["model_sha256"]), 64)
        self.assertEqual(analysis["report"]["ranked_colonies"][0]["colony_id"], "field_colony_001")


if __name__ == "__main__":
    unittest.main()
