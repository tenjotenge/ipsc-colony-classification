# Pitfalls

# Recurring Bugs

## Corner/edge activation bias
Historically severe.
Improved substantially but still monitored.

## Entropy inflation
Persistent unresolved issue.

## Embedding overlap
Still occurring between morphology groups.

---

# Hidden Assumptions

## Weak labels
System still heavily depends on synthetic/weak labels.

## Stability != correctness
Very important.

High perturbation stability may still converge on wrong abstractions.

---

# Environment Issues

## Windows multiprocessing
Caused loader/process issues.

Workarounds added:
- Windows-safe training path
- cached image loading

---

# Tooling Quirks

## OpenCV dependency
Initial pipeline blocked until cv2 installed.

## Large dataset size
Multi-scale tiling exploded tile count:
~422k+ tiles.

Disk + runtime heavy.

---

# Known Failure Modes

## Shortcut learning
Model may learn:
- illumination
- borders
- texture artifacts
instead of morphology.

## Embedding collapse
Representations may compress excessively.

## Cluster overlap
Morphology boundaries still ambiguous.

## Hard-negative overfitting
Mining may reinforce artifacts.

---

# Edge Cases

- partial colonies
- edge colonies
- lighting gradients
- debris mimicking colonies
- microscopy domain shifts
- microscope-specific textures

---

# Previous AI Failure Patterns

## Overfocusing on raw metrics
Improved metrics without improving morphology understanding.

## Insufficient spatial context
Fixed partially via multi-scale approach.

## Excessive architecture churn
Avoided later intentionally.

---

# Dangerous Refactor Zones

- train.py
- dataset_core.py
- embedding lifecycle logic
- iterative orchestration
- calibration integration

These are tightly coupled now.
Modify carefully.

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