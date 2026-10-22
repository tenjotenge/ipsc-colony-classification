import unittest

from platform_service.evaluate import evaluate


def fixture():
    exported = [{
        "field": {"id": "field-1", "sha256": "image-digest", "width": 100, "height": 100},
        "latest_job": {"id": "job-1", "status": "succeeded"},
        "analysis_current": True,
        "analysis": {"job_id": "job-1", "model_sha256": "model-digest", "report": {"ranked_colonies": [
            {"x": 0, "y": 0, "width": 20, "height": 20},
            {"x": 50, "y": 50, "width": 10, "height": 10},
        ]}},
    }]
    truth = {"schema_version": 1, "fields": [{"field_id": "field-1", "sha256": "image-digest", "annotations": [
        {"x": 0, "y": 0, "width": 20, "height": 20, "suitability": "suitable"},
        {"x": 70, "y": 70, "width": 10, "height": 10, "suitability": "unsuitable"},
    ]}]}
    return exported, truth


class EvaluationTests(unittest.TestCase):
    def test_ranked_localization_and_suitability_counts(self):
        exported, truth = fixture()
        result = evaluate(exported, truth, top_k=2)
        aggregate = result["aggregate"]
        self.assertEqual(aggregate["colony_precision_at_k"], 0.5)
        self.assertEqual(aggregate["colony_recall_at_k"], 0.5)
        self.assertEqual(aggregate["suitable_yield_at_k"], 0.5)
        self.assertEqual(aggregate["suitable_recall_at_k"], 1.0)

    def test_rejects_stale_results_or_changed_source(self):
        exported, truth = fixture()
        exported[0]["analysis_current"] = False
        with self.assertRaisesRegex(ValueError, "current"):
            evaluate(exported, truth)
        exported[0]["analysis_current"] = True
        truth["fields"][0]["sha256"] = "other-image"
        with self.assertRaisesRegex(ValueError, "checksum mismatch"):
            evaluate(exported, truth)

    def test_rejects_boxes_outside_image(self):
        exported, truth = fixture()
        truth["fields"][0]["annotations"][0]["width"] = 101
        with self.assertRaisesRegex(ValueError, "inside"):
            evaluate(exported, truth)


if __name__ == "__main__":
    unittest.main()
