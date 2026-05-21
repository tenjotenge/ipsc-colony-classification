from __future__ import annotations

import csv
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path

import cv2
import numpy as np

from convert_to_png import normalize_to_uint8
from model_inference import TilePrediction, load_trained_model, predict_tiles
from pipeline_utils import IMAGE_EXTENSIONS, ensure_directories, project_root
from tile_quality import keep_tile


TILE_SIZE = 256
STRIDE = 256
NEIGHBOR_GAP = 64
TOP_K_DEFAULT = 10


@dataclass(frozen=True)
class ColonyRegion:
    colony_id: str
    image_id: str
    x: int
    y: int
    width: int
    height: int
    tile_count: int
    max_score: float
    weighted_average_score: float
    density_weight: float
    colony_score: float


@dataclass(frozen=True)
class AnalysisResult:
    image_id: str
    image: np.ndarray
    tile_predictions: list[TilePrediction]
    colonies: list[ColonyRegion]
    heatmap: np.ndarray


def iter_input_images(input_root: Path) -> list[Path]:
    return sorted(
        [
            path
            for path in input_root.rglob("*")
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        ],
        key=lambda path: path.as_posix(),
    )


def load_normalized_plate(image_path: Path) -> np.ndarray | None:
    image = cv2.imread(str(image_path), cv2.IMREAD_UNCHANGED)
    if image is None:
        return None
    try:
        return normalize_to_uint8(image)
    except Exception:
        return None


def load_model_for_analysis() -> tuple[object, object]:
    root = project_root()
    model_path = root / "model.pth"
    return load_trained_model(model_path)


def extract_candidate_tiles(image: np.ndarray) -> tuple[list[np.ndarray], list[tuple[int, int, int, int]]]:
    height, width = image.shape[:2]
    tiles: list[np.ndarray] = []
    coords: list[tuple[int, int, int, int]] = []

    if height < TILE_SIZE or width < TILE_SIZE:
        return tiles, coords

    for y in range(0, height - TILE_SIZE + 1, STRIDE):
        for x in range(0, width - TILE_SIZE + 1, STRIDE):
            tile = image[y : y + TILE_SIZE, x : x + TILE_SIZE]
            if not keep_tile(tile):
                continue
            tiles.append(tile)
            coords.append((x, y, TILE_SIZE, TILE_SIZE))

    return tiles, coords


def box_gap(a: TilePrediction, b: TilePrediction) -> tuple[int, int]:
    gap_x = max(0, max(a.x, b.x) - min(a.x + a.width, b.x + b.width))
    gap_y = max(0, max(a.y, b.y) - min(a.y + a.height, b.y + b.height))
    return gap_x, gap_y


def cluster_tiles(image_id: str, tile_predictions: list[TilePrediction]) -> list[ColonyRegion]:
    if not tile_predictions:
        return []

    sorted_tiles = sorted(tile_predictions, key=lambda item: (item.y, item.x))
    bucket_size = TILE_SIZE
    search_radius = max(1, math.ceil((TILE_SIZE + NEIGHBOR_GAP) / bucket_size))
    buckets: dict[tuple[int, int], list[int]] = {}
    parent = list(range(len(sorted_tiles)))

    def find(index: int) -> int:
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    def union(left: int, right: int) -> None:
        left_root = find(left)
        right_root = find(right)
        if left_root != right_root:
            parent[right_root] = left_root

    for index, tile in enumerate(sorted_tiles):
        grid_x = tile.x // bucket_size
        grid_y = tile.y // bucket_size
        for offset_y in range(-search_radius, search_radius + 1):
            for offset_x in range(-search_radius, search_radius + 1):
                for other_index in buckets.get((grid_x + offset_x, grid_y + offset_y), []):
                    gap_x, gap_y = box_gap(tile, sorted_tiles[other_index])
                    if gap_x <= NEIGHBOR_GAP and gap_y <= NEIGHBOR_GAP:
                        union(index, other_index)
        buckets.setdefault((grid_x, grid_y), []).append(index)

    grouped: dict[int, list[TilePrediction]] = {}
    for index, tile in enumerate(sorted_tiles):
        grouped.setdefault(find(index), []).append(tile)

    colonies: list[ColonyRegion] = []
    for colony_index, tiles in enumerate(grouped.values(), start=1):
        min_x = min(tile.x for tile in tiles)
        min_y = min(tile.y for tile in tiles)
        max_x = max(tile.x + tile.width for tile in tiles)
        max_y = max(tile.y + tile.height for tile in tiles)

        max_score = max(tile.likely_good_score for tile in tiles)
        confidence_weights = [max(tile.confidence, 1e-6) for tile in tiles]
        weighted_average_score = float(
            np.average(
                [tile.likely_good_score for tile in tiles],
                weights=confidence_weights,
            )
        )
        density_weight = min(1.0, math.log1p(len(tiles)) / math.log(10.0))
        colony_score = (0.5 * max_score) + (0.4 * weighted_average_score) + (0.1 * density_weight)

        colonies.append(
            ColonyRegion(
                colony_id=f"{image_id}_colony_{colony_index:03d}",
                image_id=image_id,
                x=min_x,
                y=min_y,
                width=max_x - min_x,
                height=max_y - min_y,
                tile_count=len(tiles),
                max_score=max_score,
                weighted_average_score=weighted_average_score,
                density_weight=density_weight,
                colony_score=colony_score,
            )
        )

    return sorted(colonies, key=lambda item: (-item.colony_score, item.y, item.x))


def build_heatmap(image_shape: tuple[int, int], tile_predictions: list[TilePrediction]) -> np.ndarray:
    heatmap = np.zeros(image_shape, dtype=np.float32)
    counts = np.zeros(image_shape, dtype=np.float32)

    for tile in tile_predictions:
        heatmap[tile.y : tile.y + tile.height, tile.x : tile.x + tile.width] += tile.likely_good_score
        counts[tile.y : tile.y + tile.height, tile.x : tile.x + tile.width] += 1.0

    np.divide(heatmap, np.maximum(counts, 1.0), out=heatmap)
    return heatmap


def analyze_image_array(
    image_id: str,
    image: np.ndarray,
    model: object,
    device: object,
    batch_size: int = 64,
) -> AnalysisResult:
    tiles, coords = extract_candidate_tiles(image)
    if not tiles:
        return AnalysisResult(
            image_id=image_id,
            image=image,
            tile_predictions=[],
            colonies=[],
            heatmap=np.zeros(image.shape[:2], dtype=np.float32),
        )

    raw_predictions = predict_tiles(model, device, tiles, batch_size=batch_size)
    tile_predictions = [
        TilePrediction(
            x=x,
            y=y,
            width=width,
            height=height,
            predicted_label=str(prediction["predicted_label"]),
            confidence=float(prediction["confidence"]),
            likely_good_score=float(prediction["likely_good_score"]),
            uncertain_score=float(prediction["uncertain_score"]),
            bad_score=float(prediction["bad_score"]),
        )
        for prediction, (x, y, width, height) in zip(raw_predictions, coords)
    ]
    colonies = cluster_tiles(image_id, tile_predictions)
    heatmap = build_heatmap(image.shape[:2], tile_predictions)
    return AnalysisResult(
        image_id=image_id,
        image=image,
        tile_predictions=tile_predictions,
        colonies=colonies,
        heatmap=heatmap,
    )


def ranked_colony_dicts(colonies: list[ColonyRegion], top_k: int) -> list[dict[str, object]]:
    return [asdict(colony) for colony in colonies[:top_k]]


def render_visual(image: np.ndarray, heatmap: np.ndarray, colonies: list[ColonyRegion], top_k: int) -> tuple[np.ndarray, np.ndarray]:
    heatmap_uint8 = np.clip(heatmap * 255.0, 0, 255).astype(np.uint8)
    color_map = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)
    base_bgr = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    overlay = cv2.addWeighted(base_bgr, 0.6, color_map, 0.4, 0.0)

    for rank, colony in enumerate(colonies[:top_k], start=1):
        cv2.rectangle(
            overlay,
            (colony.x, colony.y),
            (colony.x + colony.width, colony.y + colony.height),
            (0, 255, 0),
            2,
        )
        label = f"{rank}:{colony.colony_score:.3f}"
        cv2.putText(
            overlay,
            label,
            (colony.x, max(20, colony.y + 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )

    return overlay, color_map


def save_visual(image_id: str, image: np.ndarray, heatmap: np.ndarray, colonies: list[ColonyRegion], output_dir: Path, top_k: int) -> None:
    ensure_directories([output_dir])
    overlay, color_map = render_visual(image, heatmap, colonies, top_k)
    cv2.imwrite(str(output_dir / f"{image_id}_overlay.png"), overlay)
    cv2.imwrite(str(output_dir / f"{image_id}_heatmap.png"), color_map)


def export_reports(report_items: list[dict[str, object]], output_dir: Path) -> None:
    ensure_directories([output_dir])
    json_path = output_dir / "plate_report.json"
    csv_path = output_dir / "plate_report.csv"

    with json_path.open("w", encoding="utf-8") as handle:
        json.dump(report_items, handle, indent=2)

    with csv_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "image_id",
                "colony_id",
                "rank",
                "colony_score",
                "x",
                "y",
                "width",
                "height",
                "tile_count",
                "max_score",
                "weighted_average_score",
                "density_weight",
            ]
        )
        for item in report_items:
            for rank, colony in enumerate(item["ranked_colonies"], start=1):
                writer.writerow(
                    [
                        item["image_id"],
                        colony["colony_id"],
                        rank,
                        colony["colony_score"],
                        colony["x"],
                        colony["y"],
                        colony["width"],
                        colony["height"],
                        colony["tile_count"],
                        colony["max_score"],
                        colony["weighted_average_score"],
                        colony["density_weight"],
                    ]
                )


def analyze_plate_folder(
    input_dir: Path,
    output_dir: Path,
    top_k: int = TOP_K_DEFAULT,
    model: object | None = None,
    device: object | None = None,
) -> list[dict[str, object]]:
    if model is None or device is None:
        model, device = load_model_for_analysis()

    image_paths = iter_input_images(input_dir)
    if not image_paths:
        raise SystemExit("run_analysis: no input images found")

    visuals_dir = output_dir / "visuals"
    ensure_directories([output_dir, visuals_dir])

    report_items: list[dict[str, object]] = []
    for image_path in image_paths:
        image = load_normalized_plate(image_path)
        if image is None:
            print(f"run_analysis: skipped corrupt image {image_path.as_posix()}")
            continue

        image_id = image_path.relative_to(input_dir).with_suffix("").as_posix().replace("/", "__")
        result = analyze_image_array(image_id=image_id, image=image, model=model, device=device)
        ranked_colonies = ranked_colony_dicts(result.colonies, top_k)
        save_visual(image_id, result.image, result.heatmap, result.colonies, visuals_dir, top_k)
        report_items.append({"image_id": image_id, "ranked_colonies": ranked_colonies})
        print(
            f"run_analysis: image={image_id} tiles={len(result.tile_predictions)} "
            f"colonies={len(result.colonies)} top_score={(result.colonies[0].colony_score if result.colonies else 0.0):.4f}"
        )

    export_reports(report_items, output_dir)
    return report_items
