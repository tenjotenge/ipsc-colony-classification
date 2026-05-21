# Architecture

# High-Level Architecture

Raw microscopy images
    ↓
preprocessing
    ↓
multi-scale tiling
    ↓
tile filtering / metadata generation
    ↓
weak/manual label generation
    ↓
training
    ↓
embedding extraction
    ↓
embedding analysis + hard mining
    ↓
iterative retraining
    ↓
calibration
    ↓
plate inference
    ↓
colony clustering/ranking
    ↓
diagnostics + reporting

---

# Major Components

## Preprocessing
Files:
- convert_to_png.py
- tile_images.py
- filter_tiles.py
- multiscale.py

Responsibilities:
- image conversion
- multi-scale tile extraction
- overlap/jitter generation
- tile quality filtering

Outputs:
- processed/
- tiles/
- tiles_clean/

---

## Dataset Generation
Files:
- generate_labels.py
- dataset_core.py

Responsibilities:
- weak labels
- metadata generation
- manual-label integration
- sample weighting
- edge metadata
- entropy-aware sampling

Outputs:
- dataset/images/
- dataset/labels.json

---

## Training
Files:
- train.py
- model_core.py

Responsibilities:
- training loop
- consistency loss
- ranking loss
- entropy-aware weighting
- hard-example integration
- calibration integration

Outputs:
- model.pth
- checkpoints/

---

## Embedding System
Files:
- embedding_extractor.py
- embedding_analysis.py

Responsibilities:
- latent extraction
- clustering
- ambiguity analysis
- hard mining
- latent diagnostics

Outputs:
- embeddings.npy
- embeddings_metadata.json
- embedding_analysis.json
- hard_examples/

---

## Inference
Files:
- model_inference.py
- infer.py

Responsibilities:
- batched inference
- multi-scale aggregation
- calibrated scoring

---

## Colony Analysis
Files:
- colony_analysis.py
- run_analysis.py

Responsibilities:
- colony clustering
- heatmap generation
- overlay generation
- trust scoring
- diagnostics orchestration

Outputs:
- plate_report.json
- plate_report.csv
- visuals/

---

## Diagnostics
Files:
- diagnostics/*
- perturbation_tests.py
- heatmap_analysis.py
- compare_variants.py

Responsibilities:
- perturbation consistency
- artifact detection
- entropy analysis
- edge/corner bias detection
- stability analysis

---

## Calibration
Files:
- calibration.py

Responsibilities:
- temperature scaling
- calibrated confidence

Outputs:
- calibration.json

---

## Pilot Monitoring
Files:
- pilot_monitoring.py

Responsibilities:
- convergence tracking
- cycle metrics
- deployment confidence
- pilot readiness reporting

Outputs:
- pilot_readiness_report.json

---

# Orchestration Structure

Primary orchestrator:
- run_pipeline.py

Supports:
- staged execution
- cached stages
- iterative loops
- validation cycles

Current iterative flow:
train
→ embed
→ calibrate
→ analyze
→ rebuild hard examples
→ validate
→ snapshot
→ repeat

---

# Persistence Layers

Filesystem-centric.

Persistent outputs:
- processed/
- tiles/
- dataset/
- checkpoints/
- iterative_runs/
- diagnostics/
- embeddings/
- results/

No DB currently.

---

# Stateless vs Stateful

## Mostly stateless
- preprocessing
- inference
- diagnostics

## Stateful
- iterative refinement
- checkpoints
- lifecycle metadata
- hard-example memory
- convergence tracking

---

# Dependency Map

OpenCV/PIL
    ↓
preprocessing

PyTorch
    ↓
training/inference

NumPy
    ↓
embeddings/diagnostics

Filesystem artifacts
    ↓
cross-stage communication

No distributed systems currently.

---

# Domain Robustness Layer (Latest Phase)

## domain_utils.py
Responsibility:
- derive stable domain identities
- compute domain metadata
- brightness/contrast/texture profiling
- shared domain-key generation

Purpose:
- unify notion of "domain" across:
  - training
  - embeddings
  - validation
  - retrieval
  - reporting

---

# Cross-Domain Validation

New subsystem:
- leave-one-domain-out validation

Purpose:
- simulate cross-lab/domain shift
- expose acquisition-artifact dependence

Validation dimensions may include:
- source dataset
- brightness profile
- contrast profile
- texture profile
- acquisition origin

Important:
validation runs explicitly attempt to prevent refinement leakage from held-out domains.

---

# Retrieval Interpretability Layer

New subsystem:
- embedding-neighbor retrieval

Purpose:
- nearest-neighbor interpretability
- cross-domain similarity inspection
- shortcut-learning detection

Expected outputs:
- retrieval_reports/
- embedding_neighbors.json

Retrieval is intentionally post-hoc and does not alter core inference.

---

# Consensus Ranking Layer

New subsystem:
- consensus-style colony scoring

Combines:
- calibrated confidence
- perturbation stability
- entropy penalties
- embedding trust
- cross-scale consistency
- retrieval consistency

Purpose:
- approximate multi-expert agreement behavior
- reduce false-positive dominance

---

# Full Validation Orchestration

run_pipeline.py now partially supports:

python run_pipeline.py --full-validation

Intended orchestration:
- iterative refinement
- domain validation
- retrieval analysis
- calibration evaluation
- pilot scoring
- robustness reporting

Status:
- structurally integrated
- runtime stabilization still ongoing