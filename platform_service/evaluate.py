"""Compare frozen platform exports with independent, exhaustive expert boxes."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path


def box(value: dict, width: int, height: int) -> tuple[float, float, float, float]:
    try:
        x, y, w, h = (float(value[key]) for key in ("x", "y", "width", "height"))
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("Every box needs numeric x, y, width, and height") from exc
    if not all(math.isfinite(number) for number in (x, y, w, h)) or x < 0 or y < 0 or w <= 0 or h <= 0 or x + w > width or y + h > height:
        raise ValueError("Box must be finite, positive, and inside its source image")
    return x, y, w, h


def iou(left: tuple[float, float, float, float], right: tuple[float, float, float, float]) -> float:
    x1 = max(left[0], right[0])
    y1 = max(left[1], right[1])
    x2 = min(left[0] + left[2], right[0] + right[2])
    y2 = min(left[1] + left[3], right[1] + right[3])
    overlap = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    return overlap / (left[2] * left[3] + right[2] * right[3] - overlap)


def ratio(numerator: int, denominator: int) -> float | None:
    return numerator / denominator if denominator else None


def evaluate(exports: list[dict], truth: dict, top_k: int = 5, min_iou: float = 0.5) -> dict:
    if top_k < 1 or not 0 < min_iou <= 1:
        raise ValueError("top_k must be positive and min_iou must be in (0, 1]")
    if truth.get("schema_version") != 1 or not isinstance(truth.get("fields"), list):
        raise ValueError("Expected truth schema_version 1 with a fields array")
    if not isinstance(exports, list) or not exports:
        raise ValueError("Expected a nonempty array of platform field exports")
    by_id: dict[str, dict] = {}
    digests: set[str] = set()
    models: set[str] = set()
    for record in exports:
        field = record.get("field") or {}
        field_id, digest = field.get("id"), field.get("sha256")
        analysis = record.get("analysis") or {}
        if not isinstance(field_id, str) or not isinstance(digest, str) or not digest:
            raise ValueError("Every export needs a field ID and source checksum")
        if field_id in by_id or digest in digests:
            raise ValueError("Duplicate field ID or source image in exports")
        if record.get("analysis_current") is not True or not analysis.get("model_sha256"):
            raise ValueError(f"Field {field_id} has no current, provenance-recorded analysis")
        if record.get("latest_job", {}).get("id") != analysis.get("job_id"):
            raise ValueError(f"Field {field_id} export does not match its latest job")
        by_id[field_id] = record
        digests.add(digest)
        models.add(analysis["model_sha256"])
    if len(models) != 1:
        raise ValueError("Exports from different model checksums must be evaluated separately")

    truth_by_id: dict[str, dict] = {}
    for item in truth["fields"]:
        field_id = item.get("field_id")
        if not isinstance(field_id, str) or field_id in truth_by_id:
            raise ValueError("Truth field IDs must be unique strings")
        truth_by_id[field_id] = item
    if set(by_id) != set(truth_by_id):
        raise ValueError("Truth and exports must contain exactly the same field IDs")

    per_field = []
    totals = {"predictions_at_k": 0, "expert_colonies": 0, "expert_suitable": 0,
              "matched_colonies_at_k": 0, "matched_suitable_at_k": 0}
    for field_id, record in by_id.items():
        field = record["field"]
        width, height = field["width"], field["height"]
        reference = truth_by_id[field_id]
        if reference.get("sha256") != field["sha256"]:
            raise ValueError(f"Source checksum mismatch for field {field_id}")
        annotations = reference.get("annotations")
        predictions = (record["analysis"].get("report") or {}).get("ranked_colonies")
        if not isinstance(annotations, list) or not isinstance(predictions, list):
            raise ValueError(f"Field {field_id} needs annotation and ranked_colonies arrays")
        labels = [annotation.get("suitability") for annotation in annotations]
        if any(label not in {"suitable", "unsuitable", "uncertain"} for label in labels):
            raise ValueError("Expert suitability must be suitable, unsuitable, or uncertain")
        expert_boxes = [box(item, width, height) for item in annotations]
        prediction_boxes = [box(item, width, height) for item in predictions[:top_k]]
        used: set[int] = set()
        matched = 0
        matched_suitable = 0
        for prediction in prediction_boxes:
            options = [(iou(prediction, expert), index) for index, expert in enumerate(expert_boxes) if index not in used]
            if not options:
                continue
            score, index = max(options)
            if score >= min_iou:
                used.add(index)
                matched += 1
                matched_suitable += labels[index] == "suitable"
        counts = {"predictions_at_k": len(prediction_boxes), "expert_colonies": len(expert_boxes),
                  "expert_suitable": labels.count("suitable"), "matched_colonies_at_k": matched,
                  "matched_suitable_at_k": matched_suitable}
        for key in totals:
            totals[key] += counts[key]
        per_field.append({"field_id": field_id, **counts})

    return {"model_sha256": models.pop(), "parameters": {"top_k": top_k, "min_iou": min_iou},
            "fields": per_field, "aggregate": {**totals,
                "colony_precision_at_k": ratio(totals["matched_colonies_at_k"], totals["predictions_at_k"]),
                "colony_recall_at_k": ratio(totals["matched_colonies_at_k"], totals["expert_colonies"]),
                "suitable_yield_at_k": ratio(totals["matched_suitable_at_k"], totals["predictions_at_k"]),
                "suitable_recall_at_k": ratio(totals["matched_suitable_at_k"], totals["expert_suitable"])}}


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate frozen platform exports against independent expert boxes")
    parser.add_argument("--exports", type=Path, required=True, help="JSON array of /api/fields/{id}/export responses")
    parser.add_argument("--truth", type=Path, required=True, help="Expert annotation JSON (see docs/validation.md)")
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--min-iou", type=float, default=0.5)
    args = parser.parse_args()
    result = evaluate(json.loads(args.exports.read_text(encoding="utf-8")),
                      json.loads(args.truth.read_text(encoding="utf-8")), args.top_k, args.min_iou)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
