# Preparing independent model evaluation

The software can compare frozen platform exports with expert annotations, but this repository has no expert-labelled microscopy dataset. Synthetic images and technician decisions made after viewing model suggestions are **not** independent ground truth. The evaluator reports geometric agreement and top-rank capture; it does not establish biological suitability or safe laboratory use on its own.

## Collect and freeze the evidence

Before inspecting model output, agree with a partner lab on what makes a colony suitable, unsuitable, or uncertain. Have qualified reviewers mark **every colony** in each evaluation field with a bounding box and one of those labels. Record the source image, acquisition protocol, plate, donor or line, date, site, and reviewer identities in a protected study manifest. Resolve disagreements using a prespecified process, and retain the original reviewer annotations separately.

Choose held-out fields by biological and acquisition grouping, not by random tiles from the same source. Keep training, tuning, and evaluation groups separate at least by plate and donor or line; use a separate site when testing transfer across labs. Freeze the model file and its SHA-256 before running the held-out set. Do not change thresholds or choose a better checkpoint after reading the held-out results.

Export each analyzed field from `/api/fields/{id}/export` and collect the response objects into one JSON array. The evaluator requires the latest job to be successful, its analysis to be current, one model checksum across the set, and an exact match between exported field IDs and expert records. It also checks each source checksum so a label cannot silently attach to a different image.

The independent expert file has this structure (illustrative coordinates and checksums):

```json
{
  "schema_version": 1,
  "fields": [
    {
      "field_id": "exported-field-id",
      "sha256": "source-image-sha256-from-export",
      "annotations": [
        {"x": 120, "y": 80, "width": 90, "height": 75, "suitability": "suitable"},
        {"x": 360, "y": 140, "width": 100, "height": 90, "suitability": "uncertain"}
      ]
    }
  ]
}
```

Coordinates use original source pixels and `x, y` are the top-left corner. Accepted suitability values are `suitable`, `unsuitable`, and `uncertain`. Empty annotation arrays are valid only for genuinely colony-free fields; incomplete field annotation will make precision and yield misleading. Keep identifiable source images and expert files out of Git.

```bash
.venv/bin/python -m platform_service.evaluate --exports frozen-exports.json --truth expert-boxes.json --top-k 5 --min-iou 0.5 > evaluation.json
```

Predictions are matched to at most one expert box in rank order using intersection-over-union (IoU). At the chosen `top-k`, **colony precision** is matched predictions divided by displayed predictions, and **colony recall** is matched expert boxes divided by all expert boxes. **Suitable yield** is predictions matched to suitable boxes divided by displayed predictions; **suitable recall** is matched suitable boxes divided by all suitable boxes. An `uncertain` box counts as a colony for localization but not as suitable. Undefined ratios are returned as `null`, not zero. The output includes raw counts, parameters, per-field counts, and the model checksum.

Choose IoU and top-k values before opening the held-out results. Report uncertainty intervals, reviewer agreement, site and acquisition strata, failure examples, and operating time separately. This tool does not compute confidence intervals, diagnose selection bias, establish a pass threshold, or replace a prospective study with lab technicians. Do not describe a model as biologically validated from this output alone.
