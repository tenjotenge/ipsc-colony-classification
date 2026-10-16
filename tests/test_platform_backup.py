import fcntl
import subprocess
import sys
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from platform_service.backup import backup, restore, verified_members
from platform_service.store import Store


class BackupTests(unittest.TestCase):
    def test_backup_verify_and_restore(self):
        with TemporaryDirectory() as directory:
            base = Path(directory)
            root = base / "live"
            store = Store(root)
            (root / "images").mkdir()
            (root / "images" / "sample.png").write_bytes(b"synthetic-image-bytes")
            field = store.add_field("sample.png", "images/sample.png", "digest", 10, 10)
            archive = base / "backup.tar.gz"
            backup(root, archive)
            self.assertEqual(set(verified_members(archive)), {"atlas.sqlite3", "images/sample.png"})
            restored = base / "restored"
            restore(archive, restored)
            self.assertEqual(Store(restored).get_field(field["id"])["filename"], "sample.png")
            self.assertEqual((restored / "images" / "sample.png").read_bytes(), b"synthetic-image-bytes")
            with self.assertRaises(FileExistsError):
                restore(archive, restored)

    def test_online_backup_includes_only_committed_outputs(self):
        with TemporaryDirectory() as directory:
            base = Path(directory)
            root = base / "live"
            store = Store(root)
            (root / "images").mkdir()
            (root / "images" / "sample.png").write_bytes(b"image")
            field = store.add_field("sample.png", "images/sample.png", "digest", 1, 1)
            completed = store.add_job(field["id"])
            store.claim_job()
            completed_output = root / "jobs" / completed["id"] / "output"
            completed_output.mkdir(parents=True)
            (completed_output / "plate_report.json").write_text("[]")
            store.finish_job(completed["id"], {}, "model-digest")
            running = store.add_job(field["id"])
            store.claim_job()
            running_output = root / "jobs" / running["id"] / "output"
            running_output.mkdir(parents=True)
            (running_output / "partial.txt").write_text("incomplete")
            with (root / ".service.lock").open("w") as lock:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                archive = base / "backup.tar.gz"
                backup(root, archive)
            members = set(verified_members(archive))
            self.assertIn(f"jobs/{completed['id']}/output/plate_report.json", members)
            self.assertNotIn(f"jobs/{running['id']}/output/partial.txt", members)
            restored = base / "restored"
            restore(archive, restored)
            self.assertEqual(Store(restored).list_jobs(field["id"])[0]["status"], "queued")

    def test_scheduled_command_creates_verified_archive(self):
        with TemporaryDirectory() as directory:
            base = Path(directory)
            Store(base / "live")
            result = subprocess.run([sys.executable, "-m", "platform_service.backup", "scheduled",
                                     "--data-dir", str(base / "live"), "--backup-dir", str(base / "backups")],
                                    capture_output=True, text=True, check=True)
            archive, = (base / "backups").glob("atlas-*.tar.gz")
            self.assertIn(str(archive), result.stdout)
            self.assertEqual(verified_members(archive), ["atlas.sqlite3"])


if __name__ == "__main__":
    unittest.main()
