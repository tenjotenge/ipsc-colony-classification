from __future__ import annotations

import cv2
import numpy as np


STD_THRESHOLD = 10.0
EDGE_THRESHOLD = 5.0


def keep_tile(image: np.ndarray) -> bool:
    if image is None:
        return False

    std_value = float(np.std(image))
    if std_value < STD_THRESHOLD:
        return False

    edges = cv2.Canny(image, 50, 150)
    return float(edges.mean()) >= EDGE_THRESHOLD
