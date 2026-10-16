import io
import json
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image

from platform_service.server import make_handler
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

    def test_rejects_invalid_image_and_decision(self):
        self.assertEqual(self.request("POST", "/api/fields", b"not an image", {"X-Filename": "bad.png"})[0], 400)
        _, field = self.upload()
        self.assertEqual(self.request("GET", "/api/fields/../../etc/passwd")[0], 404)
        self.assertEqual(self.request("POST", f"/api/fields/{field['id']}/decisions", b"{}", {"Content-Type": "application/json"})[0], 400)


if __name__ == "__main__":
    unittest.main()
