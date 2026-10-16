from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase
from unittest.mock import patch

from run_pipeline import check_ready


class PipelineReadinessTests(TestCase):
    def test_reports_missing_dependencies_before_input(self):
        with TemporaryDirectory() as directory:
            with patch("run_pipeline.importlib.util.find_spec", return_value=None):
                with self.assertRaisesRegex(SystemExit, "missing Python packages"):
                    check_ready(Path(directory))

    def test_requires_an_input_image(self):
        with TemporaryDirectory() as directory:
            with patch("run_pipeline.importlib.util.find_spec", return_value=object()):
                with self.assertRaisesRegex(SystemExit, "no microscopy images"):
                    check_ready(Path(directory))

    def test_accepts_supported_image_extension(self):
        with TemporaryDirectory() as directory:
            raw = Path(directory) / "raw"
            raw.mkdir()
            (raw / "field.TIFF").write_bytes(b"fixture")
            with patch("run_pipeline.importlib.util.find_spec", return_value=object()):
                check_ready(Path(directory))
