from __future__ import annotations

import random
from pathlib import Path

import torch
from PIL import Image
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms

from pipeline_utils import project_root
from train import CLASS_NAMES, build_model


MODEL_PATH = Path("model.pth")
DATASET_IMAGES_DIR = Path("dataset/images")


class InferenceDataset(Dataset):
    def __init__(self, image_paths: list[Path]) -> None:
        self.image_paths = image_paths
        self.transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
            ]
        )

    def __len__(self) -> int:
        return len(self.image_paths)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, str]:
        image_path = self.image_paths[index]
        with Image.open(image_path) as image:
            tensor = self.transform(image.convert("L"))
        return tensor, image_path.name


def main() -> None:
    root = project_root()
    model_path = root / MODEL_PATH
    images_dir = root / DATASET_IMAGES_DIR

    if not model_path.exists():
        print("infer: model.pth not found")
        return

    image_paths = [path for path in images_dir.glob("*.png") if path.is_file()]
    if not image_paths:
        print("infer: no dataset images found")
        return

    sample_paths = random.sample(image_paths, k=min(10, len(image_paths)))
    dataset = InferenceDataset(sample_paths)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_model().to(device)
    checkpoint = torch.load(model_path, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    dataloader = DataLoader(
        dataset,
        batch_size=min(10, len(dataset)),
        shuffle=False,
        num_workers=0,
        pin_memory=device.type == "cuda",
    )

    with torch.no_grad():
        for batch_images, batch_names in dataloader:
            batch_images = batch_images.to(device, non_blocking=device.type == "cuda")
            outputs = model(batch_images)
            predictions = outputs.argmax(dim=1).cpu().tolist()

            for image_name, prediction in zip(batch_names, predictions):
                print(f"infer: {image_name} -> {CLASS_NAMES[prediction]}")


if __name__ == "__main__":
    main()
