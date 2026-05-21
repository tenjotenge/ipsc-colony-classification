# Decision Log

# Phase 1 — Initial Pipeline
Decision:
- build tile-based colony classifier

Reasoning:
- fastest operational prototype path

Rejected:
- segmentation-first approach

Implication:
- later spatial coherence issues

---

# Phase 2 — Weak Labels
Decision:
- use weak/synthetic labels initially

Reasoning:
- insufficient manual annotations

Rejected:
- waiting for expert labels

Implication:
- morphology validity concerns later

---

# Phase 3 — Spatial Coherence Push
Decision:
- move to overlapping multi-scale tiles

Reasoning:
- colonies spanned many tiles
- model lacked spatial understanding

Rejected:
- simple tile enlargement only

Implication:
- major stability improvements

---

# Phase 4 — Robustness Layer
Decision:
- add perturbation testing + diagnostics

Reasoning:
- needed trust signals
- needed artifact detection

Rejected:
- relying on validation loss only

Implication:
- exposed edge/corner issues honestly

---

# Phase 5 — Embedding Systems
Decision:
- add embedding extraction + clustering

Reasoning:
- inspect latent structure
- enable hard mining

Rejected:
- black-box-only operation

Implication:
- discovered overlap/collapse risks

---

# Phase 6 — Iterative Refinement
Decision:
- iterative hard-example lifecycle loops

Reasoning:
- improve difficult-region discrimination

Rejected:
- static retraining

Implication:
- pipeline complexity increased significantly

---

# Phase 7 — Calibration + Pilot Layer
Decision:
- add temperature scaling + pilot readiness

Reasoning:
- confidence needed semantic meaning

Rejected:
- raw logits as trust signals

Implication:
- deployment confidence became uncertainty-aware

---

# Phase 8 — Frontend Philosophy
Decision:
- GIS/pathology-style spatial viewer

Reasoning:
- microscopy workflows are spatial

Rejected:
- dashboard UI
- Streamlit productization

Implication:
- React + PixiJS chosen

---

# Current Phase — Domain Robustness
Decision:
- prioritize domain robustness + disentanglement

Reasoning:
- remaining bottleneck is representation validity

Rejected:
- further generic CNN optimization

Implication:
- future focus on validation + interpretability

---

# Latest Robustness-Layer Failure Modes

## Stale Embedding Metadata Poisoning

Observed issue:
- cached embedding metadata contained stale NaN uncertainty fields

Impact:
- non-finite sampler weights
- destabilized training/refinement loops

Mitigation:
- defensive dataset-loader sanitation
- sampler hardening

Future sessions should:
- treat cached metadata defensively
- validate uncertainty fields before weighting

---

## Cross-Domain Leakage Risk

Observed conceptual issue:
- refinement metadata mined globally can contaminate held-out domain validation

Mitigation:
- validation-aware dataset construction
- domain-isolated refinement handling

Important:
future validation logic must preserve strict domain isolation.

---

## Domain Weight Explosion

Observed issue:
- richer domain-aware weighting caused some sample weights to become non-finite

Likely causes:
- pathological uncertainty values
- unstable normalization
- sparse-domain edge cases

Important:
all weighting paths should:
- clamp aggressively
- sanitize NaNs/Infs
- tolerate sparse domains

---

## Small-Domain Entropy Instability

Observed issue:
- divide-by-zero in normalized entropy metrics for homogeneous/single-domain clusters

Mitigation:
- defensive normalization logic

Future metrics should:
- assume tiny-domain edge cases can occur frequently.