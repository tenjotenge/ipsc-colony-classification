from __future__ import annotations

from dataclasses import dataclass
from os import PathLike
from typing import Iterable

import numpy as np
import torch
from torchvision import transforms

from train import CLASS_NAMES, build_model


@dataclass(frozen=True)
class TilePrediction:
    x: int
    y: int
    width: int
    height: int
    predicted_label: str
    confidence: float
    likely_good_score: float
    uncertain_score: float
    bad_score: float


def load_trained_model(model_path: str | bytes | PathLike[str] | PathLike[bytes]) -> tuple[torch.nn.Module, torch.device]:
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model().to(device)
    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model, device


def default_inference_transform() -> transforms.Compose:
    return transforms.Compose(
        [
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
        ]
    )


def predict_tiles(
    model: torch.nn.Module,
    device: torch.device,
    tile_arrays: Iterable[np.ndarray],
    batch_size: int = 64,
) -> list[dict[str, float | str]]:
    transform = default_inference_transform()
    tensors = [transform(tile) for tile in tile_arrays]
    if not tensors:
        return []

    results: list[dict[str, float | str]] = []
    with torch.no_grad():
        for start in range(0, len(tensors), batch_size):
            batch = torch.stack(tensors[start : start + batch_size]).to(
                device,
                non_blocking=device.type == "cuda",
            )
            probabilities = torch.softmax(model(batch), dim=1).cpu().numpy()

            for probs in probabilities:
                predicted_index = int(np.argmax(probs))
                results.append(
                    {
                        "predicted_label": CLASS_NAMES[predicted_index],
                        "confidence": float(probs[predicted_index]),
                        "likely_good_score": float(probs[CLASS_NAMES.index("likely_good")]),
                        "uncertain_score": float(probs[CLASS_NAMES.index("uncertain")]),
                        "bad_score": float(probs[CLASS_NAMES.index("bad")]),
                    }
                )

    return results
