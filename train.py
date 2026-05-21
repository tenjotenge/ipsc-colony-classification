from __future__ import annotations

import json
import math
import os
import random
from pathlib import Path

import cv2
import numpy as np
import torch
from PIL import Image
from torch import nn
from torch.utils.data import DataLoader, Dataset, WeightedRandomSampler
from torchvision import models, transforms

from pipeline_utils import (
    directory_signature,
    file_signature,
    marker_path,
    project_root,
    save_marker,
    stage_is_cached,
)


DATASET_IMAGES_DIR = Path("dataset/images")
LABELS_PATH = Path("dataset/labels.json")
MANUAL_IMAGES_DIR = Path("manual_labels/images")
MANUAL_LABELS_PATH = Path("manual_labels/labels.json")
MODEL_PATH = Path("model.pth")
STAGE_NAME = "train"
STAGE_VERSION = "4"
CLASS_NAMES = ["bad", "likely_good", "uncertain"]
CLASS_TO_INDEX = {name: index for index, name in enumerate(CLASS_NAMES)}
CLASS_QUALITY = {"bad": 0.0, "uncertain": 0.5, "likely_good": 1.0}


def soft_target_from_std(pixel_std: float) -> torch.Tensor:
    bad_gate = 1.0 / (1.0 + math.exp((pixel_std - 25.0) / 4.0))
    good_gate = 1.0 / (1.0 + math.exp((50.0 - pixel_std) / 4.0))
    uncertain_gate = max(0.0, 1.0 - bad_gate - good_gate)
    distribution = np.array([bad_gate, good_gate, uncertain_gate], dtype=np.float32)
    distribution = np.clip(distribution, 1e-6, None)
    distribution /= distribution.sum()
    return torch.tensor([distribution[0], distribution[1], distribution[2]], dtype=torch.float32)


def hard_soft_target(label: str) -> torch.Tensor:
    target = torch.zeros(len(CLASS_NAMES), dtype=torch.float32)
    target[CLASS_TO_INDEX[label]] = 1.0
    return target


class SpatialAugment:
    def __call__(self, image: Image.Image) -> Image.Image:
        array = np.array(image.convert("L"), dtype=np.uint8)
        height, width = array.shape[:2]
        pad_top = random.randint(0, max(4, height // 8))
        pad_bottom = random.randint(0, max(4, height // 8))
        pad_left = random.randint(0, max(4, width // 8))
        pad_right = random.randint(0, max(4, width // 8))
        array = cv2.copyMakeBorder(
            array,
            pad_top,
            pad_bottom,
            pad_left,
            pad_right,
            borderType=cv2.BORDER_REFLECT101,
        )

        padded_height, padded_width = array.shape[:2]
        crop_x = random.randint(0, max(0, padded_width - width))
        crop_y = random.randint(0, max(0, padded_height - height))
        array = array[crop_y : crop_y + height, crop_x : crop_x + width]

        scale = random.uniform(0.9, 1.1)
        scaled_width = max(64, int(width * scale))
        scaled_height = max(64, int(height * scale))
        array = cv2.resize(array, (scaled_width, scaled_height), interpolation=cv2.INTER_LINEAR)
        if scaled_height < height or scaled_width < width:
            extra_top = random.randint(0, max(1, height - scaled_height))
            extra_bottom = max(0, height - scaled_height - extra_top)
            extra_left = random.randint(0, max(1, width - scaled_width))
            extra_right = max(0, width - scaled_width - extra_left)
            array = cv2.copyMakeBorder(
                array,
                extra_top,
                extra_bottom,
                extra_left,
                extra_right,
                borderType=cv2.BORDER_REFLECT101,
            )
        if array.shape[0] > height or array.shape[1] > width:
            crop_x = random.randint(0, max(0, array.shape[1] - width))
            crop_y = random.randint(0, max(0, array.shape[0] - height))
            array = array[crop_y : crop_y + height, crop_x : crop_x + width]

        if random.random() < 0.5:
            array = cv2.flip(array, 1)
        if random.random() < 0.5:
            array = cv2.flip(array, 0)

        angle = random.uniform(-180.0, 180.0)
        shift_x = random.uniform(-0.1, 0.1) * width
        shift_y = random.uniform(-0.1, 0.1) * height
        matrix = cv2.getRotationMatrix2D((width / 2.0, height / 2.0), angle, 1.0)
        matrix[0, 2] += shift_x
        matrix[1, 2] += shift_y
        array = cv2.warpAffine(
            array,
            matrix,
            (width, height),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REFLECT101,
        )
        return Image.fromarray(array, mode="L")


class TileDataset(Dataset):
    def __init__(self, weak_images_dir: Path, weak_labels_path: Path, manual_images_dir: Path, manual_labels_path: Path) -> None:
        self.weak_images_dir = weak_images_dir
        self.manual_images_dir = manual_images_dir
        self.augment = SpatialAugment()
        self.resize_to_tensor = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
            ]
        )

        with weak_labels_path.open("r", encoding="utf-8") as handle:
            weak_items = json.load(handle)

        manual_items: list[dict[str, object]] = []
        if manual_labels_path.exists():
            with manual_labels_path.open("r", encoding="utf-8") as handle:
                manual_items = json.load(handle)

        merged: dict[str, dict[str, object]] = {}
        for item in weak_items:
            self._append_sample(merged, item, source_type="weak")
        for item in manual_items:
            self._append_sample(merged, item, source_type="manual", override=True)

        self.samples = list(merged.values())

    def _append_sample(
        self,
        merged: dict[str, dict[str, object]],
        item: dict[str, object],
        source_type: str,
        override: bool = False,
    ) -> None:
        if not (
            isinstance(item, dict)
            and item.get("image")
            and item.get("label") in CLASS_TO_INDEX
        ):
            return

        image_name = str(item["image"])
        images_root = self.manual_images_dir if source_type == "manual" else self.weak_images_dir
        image_path = images_root / image_name
        if not image_path.is_file():
            return

        try:
            with Image.open(image_path) as image:
                image.verify()
        except Exception:
            return

        sample = dict(item)
        sample["source_type"] = source_type
        sample["image_root"] = str(images_root)
        sample["pixel_std"] = float(sample.get("pixel_std", 0.0))
        sample["quality_score"] = float(sample.get("quality_score", CLASS_QUALITY[str(sample["label"])]))
        sample["edge_distance"] = int(sample.get("edge_distance", 0))
        sample["edge_tile"] = bool(sample.get("edge_tile", False))
        sample["soft_target"] = hard_soft_target(str(sample["label"])) if source_type == "manual" else soft_target_from_std(sample["pixel_std"])
        sample["rank_target"] = 0.8 * sample["quality_score"] + 0.2 * CLASS_QUALITY[str(sample["label"])]
        sample["loss_weight"] = float(sample.get("loss_weight", 3.0 if source_type == "manual" else 1.0))
        merged_key = image_name
        if override or merged_key not in merged:
            merged[merged_key] = sample

    def __len__(self) -> int:
        return len(self.samples)

    def sampling_weights(self) -> list[float]:
        class_counts = {name: 0 for name in CLASS_NAMES}
        for sample in self.samples:
            class_counts[str(sample["label"])] += 1

        weights: list[float] = []
        for sample in self.samples:
            label = str(sample["label"])
            class_weight = len(self.samples) / max(class_counts[label], 1)
            quality_weight = 0.75 + 1.6 * float(sample["quality_score"])
            edge_penalty = 0.35 if bool(sample["edge_tile"]) else 1.0
            background_penalty = 0.25 if label == "bad" and str(sample["source_type"]) == "weak" else 1.0
            uncertain_penalty = 0.45 if label == "uncertain" and str(sample["source_type"]) == "weak" else 1.0
            manual_boost = 5.0 if str(sample["source_type"]) == "manual" else 1.0
            std_boost = min(1.5, 0.8 + float(sample["pixel_std"]) / 55.0)
            weights.append(
                class_weight
                * quality_weight
                * edge_penalty
                * background_penalty
                * uncertain_penalty
                * manual_boost
                * std_boost
            )
        return weights

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor, torch.Tensor, int, float, float]:
        sample = self.samples[index]
        image_root = Path(str(sample["image_root"]))
        image_path = image_root / str(sample["image"])

        with Image.open(image_path) as image:
            image = image.convert("L")
            weak_view = self.resize_to_tensor(self.augment(image))
            aug_view = self.resize_to_tensor(self.augment(image))

        label_index = CLASS_TO_INDEX[str(sample["label"])]
        return (
            weak_view,
            aug_view,
            sample["soft_target"].clone(),
            label_index,
            float(sample["rank_target"]),
            float(sample["loss_weight"]),
        )


def build_model() -> nn.Module:
    try:
        weights = models.ResNet18_Weights.DEFAULT
        model = models.resnet18(weights=weights)
    except Exception:
        model = models.resnet18(weights=None)

    original_conv = model.conv1
    model.conv1 = nn.Conv2d(
        1,
        original_conv.out_channels,
        kernel_size=original_conv.kernel_size,
        stride=original_conv.stride,
        padding=original_conv.padding,
        bias=False,
    )

    with torch.no_grad():
        model.conv1.weight.copy_(original_conv.weight.mean(dim=1, keepdim=True))

    model.fc = nn.Linear(model.fc.in_features, len(CLASS_NAMES))
    return model


def weighted_soft_cross_entropy(logits: torch.Tensor, soft_targets: torch.Tensor, loss_weights: torch.Tensor) -> torch.Tensor:
    log_probs = torch.log_softmax(logits, dim=1)
    per_sample = -(soft_targets * log_probs).sum(dim=1)
    return (per_sample * loss_weights).sum() / torch.clamp(loss_weights.sum(), min=1e-6)


def consistency_loss(logits_a: torch.Tensor, logits_b: torch.Tensor) -> torch.Tensor:
    probs_a = torch.softmax(logits_a, dim=1)
    probs_b = torch.softmax(logits_b, dim=1)
    return torch.mean((probs_a - probs_b) ** 2)


def ranking_loss(logits: torch.Tensor, rank_targets: torch.Tensor, loss_weights: torch.Tensor) -> torch.Tensor:
    quality_logit = logits[:, CLASS_TO_INDEX["likely_good"]] - logits[:, CLASS_TO_INDEX["bad"]]
    best_indices = torch.nonzero(rank_targets >= 0.85, as_tuple=False).flatten()
    worst_indices = torch.nonzero(rank_targets <= 0.15, as_tuple=False).flatten()

    if best_indices.numel() == 0 or worst_indices.numel() == 0:
        return torch.tensor(0.0, device=logits.device)

    pair_count = min(best_indices.numel(), worst_indices.numel(), 16)
    best_indices = best_indices[:pair_count]
    worst_indices = worst_indices[:pair_count]
    margin = 0.6
    diffs = quality_logit[best_indices] - quality_logit[worst_indices]
    pair_weights = 0.5 * (loss_weights[best_indices] + loss_weights[worst_indices])
    penalties = torch.relu(margin - diffs)
    return (penalties * pair_weights).sum() / torch.clamp(pair_weights.sum(), min=1e-6)


def main() -> None:
    root = project_root()
    images_dir = root / DATASET_IMAGES_DIR
    labels_path = root / LABELS_PATH
    manual_images_dir = root / MANUAL_IMAGES_DIR
    manual_labels_path = root / MANUAL_LABELS_PATH
    model_path = root / MODEL_PATH
    train_marker = marker_path(root, STAGE_NAME)

    if not images_dir.exists() or not labels_path.exists():
        print("train: dataset missing, skipping")
        return

    input_signature_data = {
        "images": directory_signature(images_dir, {".png"}),
        "labels": file_signature(labels_path),
        "manual_images": directory_signature(manual_images_dir, {".png"}),
        "manual_labels": file_signature(manual_labels_path),
    }
    config = {
        "epochs": 3,
        "batch_size": 32,
        "optimizer": "adam",
        "architecture": "resnet18_1ch",
        "hybrid_training": True,
        "manual_override": True,
        "manual_loss_weight": 5.0,
        "consistency_loss": True,
        "pairwise_ranking": "high_vs_low_contrast",
    }

    if stage_is_cached(
        train_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        config=config,
        required_paths=[model_path],
    ):
        print("train: cached")
        return

    dataset = TileDataset(images_dir, labels_path, manual_images_dir, manual_labels_path)
    if len(dataset) == 0:
        print("train: no labeled images found, skipping")
        return

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if device.type == "cuda":
        torch.backends.cudnn.benchmark = True
    num_workers = 0 if os.name == "nt" else min(8, os.cpu_count() or 0)
    batch_size = 32
    sampler = WeightedRandomSampler(
        weights=torch.tensor(dataset.sampling_weights(), dtype=torch.double),
        num_samples=len(dataset),
        replacement=True,
    )
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        sampler=sampler,
        num_workers=num_workers,
        pin_memory=device.type == "cuda",
        persistent_workers=num_workers > 0,
    )

    model = build_model().to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-4)

    model.train()
    final_epoch_loss = 0.0
    final_epoch_acc = 0.0
    for epoch in range(3):
        running_loss = 0.0
        total = 0
        correct = 0
        batch_count = len(dataloader)

        for batch_index, (weak_views, aug_views, soft_targets, batch_labels, rank_targets, loss_weights) in enumerate(dataloader, start=1):
            weak_views = weak_views.to(device, non_blocking=device.type == "cuda")
            aug_views = aug_views.to(device, non_blocking=device.type == "cuda")
            soft_targets = soft_targets.to(device, non_blocking=device.type == "cuda")
            batch_labels = batch_labels.to(device, non_blocking=device.type == "cuda")
            rank_targets = rank_targets.to(device, non_blocking=device.type == "cuda")
            loss_weights = loss_weights.to(device, non_blocking=device.type == "cuda")

            optimizer.zero_grad()
            outputs_weak = model(weak_views)
            outputs_aug = model(aug_views)

            classification_loss = 0.5 * (
                weighted_soft_cross_entropy(outputs_weak, soft_targets, loss_weights)
                + weighted_soft_cross_entropy(outputs_aug, soft_targets, loss_weights)
            )
            pairwise_loss = ranking_loss(outputs_weak, rank_targets, loss_weights)
            consistency = consistency_loss(outputs_weak, outputs_aug)
            loss = classification_loss + (0.25 * pairwise_loss) + (0.6 * consistency)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * weak_views.size(0)
            predictions = outputs_weak.argmax(dim=1)
            total += batch_labels.size(0)
            correct += (predictions == batch_labels).sum().item()

            if batch_index % 10 == 0 or batch_index == batch_count:
                print(
                    f"train: epoch {epoch + 1}/3 batch {batch_index}/{batch_count} "
                    f"loss={loss.item():.4f} cls={classification_loss.item():.4f} "
                    f"rank={pairwise_loss.item():.4f} cons={consistency.item():.4f}"
                )

        final_epoch_loss = running_loss / max(total, 1)
        final_epoch_acc = correct / max(total, 1)
        print(
            f"train: epoch_summary {epoch + 1}/3 "
            f"loss={final_epoch_loss:.4f} acc={final_epoch_acc:.4f} samples={total}"
        )

    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "classes": CLASS_NAMES,
        },
        model_path,
    )
    save_marker(
        train_marker,
        stage_name=STAGE_NAME,
        stage_version=STAGE_VERSION,
        input_signature_data=input_signature_data,
        output_signature_data=file_signature(model_path),
        config=config,
        summary={"final_epoch_loss": final_epoch_loss, "final_epoch_acc": final_epoch_acc},
    )
    print(f"train: saved model to {MODEL_PATH.as_posix()}")


if __name__ == "__main__":
    main()
