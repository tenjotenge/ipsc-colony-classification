import fcntl
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

    def test_refuses_backup_while_service_holds_lock(self):
        with TemporaryDirectory() as directory:
            base = Path(directory)
            root = base / "live"
            Store(root)
            with (root / ".service.lock").open("w") as lock:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                with self.assertRaisesRegex(RuntimeError, "Stop the service"):
                    backup(root, base / "backup.tar.gz")


if __name__ == "__main__":
    unittest.main()
