from __future__ import annotations

import argparse
from pathlib import Path

import json

from colony_analysis import TOP_K_DEFAULT, analyze_plate_folder, iter_input_images, load_model_for_analysis, load_normalized_plate
from diagnostics.perturbation_tests import run_perturbation_suite
from pipeline_utils import ensure_directories


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run plate-level colony analysis and export ranked candidates."
    )
    parser.add_argument("--input", required=True, help="Input folder containing microscopy plate images.")
    parser.add_argument("--output", required=True, help="Output folder for reports and visuals.")
    parser.add_argument("--top-k", type=int, default=TOP_K_DEFAULT, help="Number of ranked colonies per image.")
    parser.add_argument("--debug", action="store_true", help="Run diagnostic perturbation and artifact analysis.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_dir = Path(args.input)
    output_dir = Path(args.output)
    top_k = max(1, args.top_k)

    model, device = load_model_for_analysis()
    analyze_plate_folder(
        input_dir=input_dir,
        output_dir=output_dir,
        top_k=top_k,
        model=model,
        device=device,
    )

    if not args.debug:
        return

    diagnostics_output_dir = output_dir / "diagnostics" / "output"
    ensure_directories([diagnostics_output_dir])

    diagnostic_reports = []
    for image_path in iter_input_images(input_dir):
        image = load_normalized_plate(image_path)
        if image is None:
            print(f"run_analysis: skipped debug for corrupt image {image_path.as_posix()}")
            continue
        image_id = image_path.relative_to(input_dir).with_suffix("").as_posix().replace("/", "__")
        report = run_perturbation_suite(
            image_id=image_id,
            image=image,
            model=model,
            device=device,
            output_dir=output_dir,
            top_k=top_k,
        )
        diagnostic_reports.append(report)
        print(
            f"run_analysis: debug image={image_id} stability={report['stability_score']:.4f} "
            f"flags={len(report['warning_flags'])}"
        )

    with (diagnostics_output_dir / "diagnostics_summary.json").open("w", encoding="utf-8") as handle:
        json.dump(diagnostic_reports, handle, indent=2)


if __name__ == "__main__":
    main()
