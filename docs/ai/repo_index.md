# Repo Index

# Core Pipeline

## convert_to_png.py
Responsibility:
- image conversion

Dependencies:
- OpenCV/PIL

---

## tile_images.py
Responsibility:
- multi-scale tile generation
- overlap/jitter anchors

Dependencies:
- multiscale.py

Interactions:
- preprocessing
- dataset generation

---

## multiscale.py
Responsibility:
- scale coordination
- anchor generation

---

## filter_tiles.py
Responsibility:
- tile quality filtering

Dependencies:
- tile_quality.py

---

# Dataset System

## generate_labels.py
Responsibility:
- weak labels
- metadata
- manual label merge

Dependencies:
- dataset_core.py

---

## dataset_core.py
Responsibility:
- sample lifecycle
- weighting
- metadata logic

High-risk refactor zone.

---

# Training

## train.py
Responsibility:
- training orchestration
- ranking loss
- consistency loss
- refinement integration

Dependencies:
- model_core.py
- dataset_core.py

Critical subsystem.

---

## model_core.py
Responsibility:
- model definitions
- embedding outputs

---

# Embeddings

## embedding_extractor.py
Responsibility:
- latent extraction

Outputs:
- embeddings.npy

---

## embedding_analysis.py
Responsibility:
- clustering
- overlap analysis
- hard mining

Critical diagnostics layer.

---

# Inference

## model_inference.py
Responsibility:
- batched inference
- calibrated scoring

---

## infer.py
Responsibility:
- sample inference testing

---

# Colony Analysis

## colony_analysis.py
Responsibility:
- clustering
- colony scoring
- overlays

Dependencies:
- model_inference.py

---

## run_analysis.py
Responsibility:
- full analysis orchestration

---

# Diagnostics

## diagnostics/*
Responsibilities:
- perturbation tests
- entropy analysis
- artifact detection
- comparison views

---

# Calibration

## calibration.py
Responsibility:
- temperature scaling

Outputs:
- calibration.json

---

# Monitoring

## pilot_monitoring.py
Responsibility:
- convergence tracking
- readiness scoring

Outputs:
- pilot_readiness_report.json

---

# Orchestration

## run_pipeline.py
Responsibility:
- staged execution
- iterative loop orchestration

Primary system entrypoint.

---

# Planned Frontend (not implemented)

INFERRED planned structure:

frontend/
  src/
    renderer/
    overlays/
    views/
    store/
    api/

Status:
- planned only

---

# Domain Robustness Subsystem

## domain_utils.py
Responsibility:
- domain identity generation
- acquisition-profile metadata
- domain statistics

Dependencies:
- dataset metadata
- embedding analysis
- validation systems

Interactions:
- training
- retrieval
- pilot reporting

---

## domain_validation.py (inferred/likely)
Responsibility:
- leave-one-domain-out evaluation
- cross-domain robustness testing

Outputs:
- domain robustness metrics
- held-out validation reports

Status:
- partially implemented

---

# Retrieval Interpretability Subsystem

## retrieval layer (filename may vary)
Responsibility:
- nearest-neighbor embedding retrieval
- similarity evidence generation

Outputs:
- retrieval_reports/
- embedding_neighbors.json

Purpose:
- interpretability
- shortcut-learning inspection

---

# Consensus Ranking Subsystem

## consensus scoring layer (filename may vary)
Responsibility:
- multi-signal colony ranking

Combines:
- confidence
- entropy
- perturbation stability
- retrieval consistency
- embedding trust

Purpose:
- operational trust ranking

---

# Full Validation Orchestration

## run_pipeline.py --full-validation

Responsibilities:
- iterative loop
- domain validation
- retrieval analysis
- calibration evaluation
- pilot reporting

Status:
- partially validated
- stabilization still required