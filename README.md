# iPSC Colony Classification

A sophisticated microscopy analysis system for induced pluripotent stem cell (iPSC) colony quality assessment and ranking. This project has evolved from a simple tile-based classifier into a comprehensive spatially-coherent analysis pipeline with advanced robustness features, interpretability layers, and a scientific-grade frontend.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Project History](#project-history)
- [Current State](#current-state)
- [Technical Details](#technical-details)
- [Development Philosophy](#development-philosophy)
- [Future Directions](#future-directions)

## Project Overview

### Purpose

This system identifies and ranks high-quality iPSC colonies from microscopy plate imagery, producing spatially coherent heatmaps and colony candidates. It is designed to evolve into a lab-facing decision-support tool for stem cell researchers.

**Primary Goals:**
- Morphology-aware colony ranking
- Robustness across acquisition domains
- Trustworthy uncertainty quantification
- Spatial coherence in predictions
- Pilot-grade operational reliability

**What This Is NOT:**
- A generic image classifier
- A segmentation-first system
- A research notebook prototype
- A dashboard-style application

### Core Principles

- **Preserve spatial coherence** - Colonies exist in spatial context, not as isolated tiles
- **Prioritize robustness over benchmark chasing** - Real-world reliability > synthetic metrics
- **Expose uncertainty honestly** - Never hide model uncertainty from users
- **Avoid opaque confidence** - All scores should be interpretable and calibrated
- **Iterative refinement over architecture churn** - Improve existing systems rather than constant redesign
- **Composable pipeline stages** - Each stage should be inspectable and independently testable

## Architecture

### High-Level Pipeline

```
Raw microscopy images
    ↓
Preprocessing (conversion, normalization)
    ↓
Multi-scale tiling with overlapping spatial anchors
    ↓
Tile filtering and metadata generation
    ↓
Weak/manual label generation
    ↓
Training with consistency and ranking losses
    ↓
Embedding extraction and analysis
    ↓
Hard-example mining and iterative retraining
    ↓
Calibration (temperature scaling)
    ↓
Plate inference with multi-scale aggregation
    ↓
Colony clustering and ranking
    ↓
Diagnostics and reporting
```

### Major Components

#### Preprocessing
- **convert_to_png.py** - Image format conversion
- **tile_images.py** - Multi-scale tile generation with overlap/jitter
- **filter_tiles.py** - Quality-based tile filtering
- **multiscale.py** - Scale coordination and anchor generation

**Outputs:** `processed/`, `tiles/`, `tiles_clean/`

#### Dataset Generation
- **generate_labels.py** - Weak label generation, metadata, manual label integration
- **dataset_core.py** - Sample lifecycle, weighting, metadata logic

**Outputs:** `dataset/images/`, `dataset/labels.json`

#### Training
- **train.py** - Training orchestration with ranking loss, consistency loss, entropy-aware weighting
- **model_core.py** - Model definitions (ResNet18-based with 1-channel input)

**Outputs:** `model.pth`, `checkpoints/`

#### Embedding System
- **embedding_extractor.py** - Latent space extraction
- **embedding_analysis.py** - Clustering, ambiguity analysis, hard mining

**Outputs:** `embeddings.npy`, `embeddings_metadata.json`, `hard_examples/`

#### Inference
- **model_inference.py** - Batched inference with multi-scale aggregation
- **infer.py** - Sample inference testing

#### Colony Analysis
- **colony_analysis.py** - Colony clustering, heatmap generation, overlay generation, trust scoring
- **run_analysis.py** - Full analysis orchestration

**Outputs:** `plate_report.json`, `plate_report.csv`, `visuals/`

#### Diagnostics
- **diagnostics/perturbation_tests.py** - Perturbation consistency testing
- **diagnostics/heatmap_analysis.py** - Artifact detection, entropy analysis
- **diagnostics/compare_variants.py** - Model variant comparison

#### Calibration
- **calibration.py** - Temperature scaling for calibrated confidence

**Outputs:** `calibration.json`

#### Monitoring
- **pilot_monitoring.py** - Convergence tracking, cycle metrics, deployment confidence

**Outputs:** `pilot_readiness_report.json`

### Advanced Subsystems (Partially Implemented)

#### Domain Robustness Layer
- **domain_utils.py** - Domain identity generation, acquisition-profile metadata
- Leave-one-domain-out validation framework
- Domain-aware embeddings and training
- Domain-confusion regularization

**Purpose:** Simulate cross-lab robustness, expose domain leakage, validate morphology-vs-domain separation

#### Retrieval Interpretability Layer
- Nearest-neighbor embedding retrieval
- Similarity evidence generation
- Shortcut-learning inspection

**Outputs:** `retrieval_reports/`, `embedding_neighbors.json`

#### Consensus Ranking Layer
- Multi-signal colony ranking combining:
  - Calibrated confidence
  - Perturbation stability
  - Entropy penalties
  - Embedding trust
  - Cross-scale consistency
  - Retrieval consistency

**Purpose:** Approximate multi-expert agreement behavior, reduce false-positive dominance

### Orchestration

**Primary orchestrator:** `run_pipeline.py`

Supports:
- Staged execution with caching
- Iterative refinement loops
- Validation cycles
- Full-validation mode (`--full-validation`)

Current iterative flow:
```
train → embed → calibrate → analyze → rebuild hard examples → validate → snapshot → repeat
```

### Frontend Architecture

**Stack:** Next.js 15, React 18, TypeScript, PixiJS/OpenSeadragon, Zustand, TailwindCSS

**Core Principles:**
- **Viewer-Centric** - Microscopy viewer is the primary surface
- **Evidence-Driven** - Every visualization exposes underlying evidence
- **Uncertainty-First** - Uncertainty is first-class, never hidden
- **Performance-First** - Canvas/WebGL rendering, viewport-aware culling
- **Backend-Agnostic** - Normalization layer protects from schema evolution

**Key Subsystems:**
1. **Workspace State Machine** - Mode-based UI adaptation (explore, review, validate, compare, calibration, retrieval)
2. **Overlay Engine** - Canvas-based rendering with z-index ordering, viewport transforms, render scheduling
3. **Normalization Layer** - Transforms raw backend JSON to stable frontend domain models
4. **Artifact Registry** - Standardized artifact management (images, overlays, reports, embeddings)

## Installation

### Backend Requirements

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Dependencies:**
- opencv-python
- numpy
- torch
- torchvision
- pillow

### Frontend Requirements

```bash
cd frontend
npm install
```

**Key Dependencies:**
- next 15.0.0
- react 18.3.1
- openseadragon 4.1.0
- pixi.js (via overlay engine)
- zustand 4.5.0
- @tanstack/react-query 5.0.0

## Usage

### Running the Full Pipeline

```bash
# Basic pipeline execution
python run_pipeline.py

# Full validation mode (includes domain validation, retrieval analysis, calibration evaluation)
python run_pipeline.py --full-validation
```

### Individual Stages

```bash
# Preprocessing
python convert_to_png.py
python tile_images.py
python filter_tiles.py

# Dataset generation
python generate_labels.py

# Training
python train.py

# Inference
python model_inference.py

# Colony analysis
python run_analysis.py
```

### Frontend Development

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` for the development server.

### Building for Production

```bash
cd frontend
npm run build
npm start
```

## Project History

### Phase 1: Initial Pipeline
- Built tile-based colony classifier
- **Decision:** Fastest operational prototype path
- **Rejected:** Segmentation-first approach
- **Implication:** Later spatial coherence issues

### Phase 2: Weak Labels
- Implemented weak/synthetic labels
- **Decision:** Insufficient manual annotations available
- **Rejected:** Waiting for expert labels
- **Implication:** Morphology validity concerns later

### Phase 3: Spatial Coherence Push
- Moved to overlapping multi-scale tiles
- **Decision:** Colonies spanned many tiles, model lacked spatial understanding
- **Rejected:** Simple tile enlargement only
- **Implication:** Major stability improvements

### Phase 4: Robustness Layer
- Added perturbation testing + diagnostics
- **Decision:** Needed trust signals and artifact detection
- **Rejected:** Relying on validation loss only
- **Implication:** Exposed edge/corner issues honestly

### Phase 5: Embedding Systems
- Added embedding extraction + clustering
- **Decision:** Inspect latent structure, enable hard mining
- **Rejected:** Black-box-only operation
- **Implication:** Discovered overlap/collapse risks

### Phase 6: Iterative Refinement
- Implemented iterative hard-example lifecycle loops
- **Decision:** Improve difficult-region discrimination
- **Rejected:** Static retraining
- **Implication:** Pipeline complexity increased significantly

### Phase 7: Calibration + Pilot Layer
- Added temperature scaling + pilot readiness
- **Decision:** Confidence needed semantic meaning
- **Rejected:** Raw logits as trust signals
- **Implication:** Deployment confidence became uncertainty-aware

### Phase 8: Frontend Philosophy
- Chose GIS/pathology-style spatial viewer
- **Decision:** Microscopy workflows are spatial
- **Rejected:** Dashboard UI, Streamlit productization
- **Implication:** React + PixiJS chosen

### Current Phase: Domain Robustness
- Prioritizing domain robustness + disentanglement
- **Decision:** Remaining bottleneck is representation validity
- **Rejected:** Further generic CNN optimization
- **Implication:** Future focus on validation + interpretability

## Current State

### What Works (Stable)

- Preprocessing pipeline
- Multi-scale tiling with overlapping spatial anchors
- Weak-label generation with manual-label integration
- Training loop with consistency and ranking losses
- Inference with multi-scale aggregation
- Colony clustering and heatmap generation
- Perturbation diagnostics
- Embedding extraction and clustering
- Iterative retraining loop
- Calibration (temperature scaling)
- Pilot readiness reporting

**Metrics Improved Significantly:**
- Edge bias (substantially reduced)
- Corner bias (substantially reduced)
- Center offset (substantially reduced)
- Perturbation stability (~0.99 in capped validation runs)

### Partially Working

**Morphology Discrimination**
- Improved but unresolved
- Embeddings still overlap
- Subtle morphology separation weak

**Calibration**
- Functional but moderate quality only

**Trust Scoring**
- Infrastructure exists but biological validity not proven

### Broken / Unresolved

**High Validation Entropy**
- Still flagged as a concern

**Embedding Collapse Risk**
- Still flagged as a concern

**Cluster Overlap Risk**
- Still flagged as a concern

**Cross-Domain Robustness**
- Partially implemented structurally
- Runtime stabilization ongoing
- Validation completeness needs verification

**Biological Validation**
- Absent
- No expert agreement testing
- No downstream assay correlation
- No external operational validation

### Current Priorities

1. Domain robustness validation
2. Morphology disentanglement
3. Entropy realism
4. Retrieval interpretability
5. Hard-negative realism
6. Cross-cycle latent analysis
7. Frontend (after robustness work)

### Important Context Shift

The project has largely transitioned from:
- **Feature construction**

To:
- **Robustness validation**
- **Stabilization**
- **Stress testing**
- **Deployment trust evaluation**

This is a major maturity transition. The bottleneck is no longer architecture—it is proving representation validity.

### Latest Robustness-Layer Status

**Implemented or Mostly Implemented:**
- Domain-aware metadata layer
- Domain-aware dataset handling
- Domain-aware embedding metadata
- Lightweight domain-confusion training objective
- Leave-one-domain-out validation framework
- Retrieval-based interpretability layer
- Consensus-style colony ranking
- Upgraded pilot-readiness integration
- Full-validation orchestration mode

**Current Unresolved Issues:**
- Runtime stabilization
- Metric convergence validation
- Sampler robustness
- Stale metadata handling
- Non-finite weighting protection

The interruption occurred AFTER compile validation and partial smoke validation, DURING defensive stabilization around NaN uncertainty metadata and sampler weights. This means architecture work is mostly complete—stabilization/evaluation work remains.

## Technical Details

### Model Architecture

**Base Model:** ResNet18 modified for 1-channel grayscale input
- First conv layer adapted from 3-channel to 1-channel
- Final fc layer outputs 3 classes: `bad`, `likely_good`, `uncertain`

**Training Features:**
- Spatial augmentation (padding, cropping, rotation, flipping)
- Consistency loss between augmented views
- Pairwise ranking loss (high vs low quality contrast)
- Weighted soft cross-entropy with entropy-aware sampling
- Manual label override with higher loss weight

### Loss Functions

**Classification Loss:** Weighted soft cross-entropy
```python
loss = 0.5 * (weighted_ce(weak_views) + weighted_ce(aug_views))
```

**Ranking Loss:** Pairwise margin-based ranking
```python
loss = margin - (quality_logit[best] - quality_logit[worst])
```

**Consistency Loss:** MSE between augmented view predictions
```python
loss = mean((probs_a - probs_b)^2)
```

**Total Loss:**
```python
total_loss = classification + 0.25 * ranking + 0.6 * consistency
```

### Sampling Strategy

Weighted sampling considering:
- Class balance (inverse frequency weighting)
- Quality score (higher quality = higher weight)
- Edge penalty (edge tiles downweighted)
- Background penalty (weak-label "bad" samples downweighted)
- Uncertain penalty (weak-label "uncertain" samples downweighted)
- Manual boost (manual labels 5x weight)
- Standard deviation boost (higher std = higher weight)

### Multi-Scale Tiling

Generates tiles at multiple scales with overlapping anchors to ensure:
- Colonies are captured at appropriate scales
- Spatial coherence is maintained across tile boundaries
- Edge effects are mitigated through overlap

### Calibration

Temperature scaling applied to logits:
```python
calibrated_probs = softmax(logits / temperature)
```

Temperature is optimized on validation set to minimize expected calibration error.

### Domain Metadata

Domain identity derived from:
- Source dataset
- Brightness profile
- Contrast profile
- Texture profile
- Acquisition origin

Used for:
- Domain-aware training
- Leave-one-domain-out validation
- Retrieval interpretability
- Pilot readiness scoring

## Development Philosophy

### Coding Conventions

- **Preserve existing pipeline structure** - Prefer additive changes over rewrites
- **Avoid architectural churn** - System is mature, focus on refinement
- **Optimize for trustworthiness + robustness** - Not benchmark metrics
- **Snake_case naming** - Explicit file naming, stage-oriented script names
- **Filesystem-driven pipeline** - Artifacts stored explicitly for inspectability

### Architectural Constraints

**DO NOT:**
- Redesign model stack casually
- Replace core pipeline wholesale
- Add segmentation-first systems
- Introduce distributed infra prematurely
- Overengineer backend

**PREFER:**
- Surgical modifications
- Layered improvements
- Modular diagnostics
- Composable stages

### Rejected Patterns

- Streamlit-first productization
- Dashboard-style UI
- Segmentation pivot
- Excessive backend complexity
- SSR-heavy frontend
- SVG-heavy rendering

**Preferred:**
- Spatial viewer paradigm
- GIS/pathology-tool behavior
- Explainability-focused UX

### Dangerous Refactor Zones

These areas are tightly coupled—modify carefully:
- `train.py`
- `dataset_core.py`
- Embedding lifecycle logic
- Iterative orchestration
- Calibration integration

## Known Pitfalls

### Recurring Bugs

- **Corner/edge activation bias** - Historically severe, improved but still monitored
- **Entropy inflation** - Persistent unresolved issue
- **Embedding overlap** - Still occurring between morphology groups

### Hidden Assumptions

- **Weak labels** - System still heavily depends on synthetic/weak labels
- **Stability ≠ correctness** - High perturbation stability may still converge on wrong abstractions

### Environment Issues

- **Windows multiprocessing** - Caused loader/process issues; workarounds added with Windows-safe training path and cached image loading
- **Large dataset size** - Multi-scale tiling exploded tile count (~422k+ tiles); disk + runtime heavy

### Known Failure Modes

- **Shortcut learning** - Model may learn illumination, borders, texture artifacts instead of morphology
- **Embedding collapse** - Representations may compress excessively
- **Cluster overlap** - Morphology boundaries still ambiguous
- **Hard-negative overfitting** - Mining may reinforce artifacts

### Latest Robustness-Layer Failure Modes

**Stale Embedding Metadata Poisoning**
- Cached embedding metadata contained stale NaN uncertainty fields
- Impact: Non-finite sampler weights, destabilized training/refinement loops
- Mitigation: Defensive dataset-loader sanitation, sampler hardening

**Cross-Domain Leakage Risk**
- Refinement metadata mined globally can contaminate held-out domain validation
- Mitigation: Validation-aware dataset construction, domain-isolated refinement handling

**Domain Weight Explosion**
- Richer domain-aware weighting caused some sample weights to become non-finite
- Likely causes: Pathological uncertainty values, unstable normalization, sparse-domain edge cases
- Mitigation: Aggressive clamping, NaN/Inf sanitization, sparse domain tolerance

**Small-Domain Entropy Instability**
- Divide-by-zero in normalized entropy metrics for homogeneous/single-domain clusters
- Mitigation: Defensive normalization logic

## Future Directions

### Near-term Priorities

1. **Stabilize domain-aware weighting** - Fix NaN/Inf issues in sampler
2. **Validate full-validation orchestration** - Complete non-smoke validation runs
3. **Inspect domain-separation metrics** - Verify morphology-vs-domain disentanglement
4. **Inspect retrieval consistency** - Validate nearest-neighbor interpretability
5. **Inspect entropy decomposition behavior** - Separate uncertainty types
6. **Verify latent stability across cycles** - Detect oscillation/collapse
7. **Perform longer validation runs** - Stress-test the system

### Mid-term Goals

- Frontend/UI for lab workflows
- Deployment-ready inference pipeline
- Trust-focused review workflows
- Cross-domain validation with external datasets

### Long-term Vision

- Industrial-grade biological decision support
- Multi-lab robustness
- Biologically validated ranking quality
- Downstream outcome correlation

### External Validation (Not Started)

**Objective:** Real-world robustness evidence
**Dependencies:** Data acquisition
**Risk:** Extremely high
**Complexity:** Very high
**Next Action:** Collect unseen datasets

### Biological Validation (Absent)

**Objective:** Correlate rankings with expert preference
**Dependencies:** Human/domain input
**Risk:** Existential
**Complexity:** Very high
**Next Action:** Future lab collaboration

## Scientific Language

This project uses precise scientific terminology:

- "calibrated score" (not "AI confidence")
- "retrieval consistency" (not "smart detection")
- "perturbation stability" (not "certainty")
- "domain agreement" (not "cross-domain accuracy")
- "uncertainty estimate" (not "confidence interval")
- "consensus rank" (not "model score")

## Design Aesthetic

**Target:** Scientific instrumentation, microscopy software, radiology review systems

**Avoid:** Startup dashboards, consumer AI apps, generic admin panels

## License

[Add your license here]

## Citation

[Add citation information if applicable]

## Contact

[Add contact information]
