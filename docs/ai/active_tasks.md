# Active Tasks

# 1 — Cross-domain validation stabilization

Status:
- structurally implemented
- partially validated

Objective:
- validate true domain robustness
- prevent acquisition-artifact dependence
- stress-test morphology generalization

Dependencies:
- domain metadata
- domain-aware embeddings
- validation orchestration

Risk:
- extremely high

Complexity:
- high

Current issues:
- sampler stability
- NaN uncertainty metadata
- runtime validation completeness

Next action:
- complete non-smoke full-validation runs
- inspect held-out-domain metrics
- verify no leakage paths
---

# 2 — Morphology disentanglement

Status:
- unresolved

Objective:
- improve morphology separation
- reduce cluster overlap

Dependencies:
- embeddings
- hard negatives
- calibration

Risk:
- very high

Complexity:
- very high

Next action:
- domain-aware embedding diagnostics
- hard-negative realism

---

# 3 — Entropy realism

Status:
- unresolved

Objective:
- reduce meaningless uncertainty
- separate uncertainty types

Dependencies:
- calibration
- diagnostics

Risk:
- medium-high

Complexity:
- high

Next action:
- uncertainty decomposition

---

# 4 — Retrieval interpretability

Status:
- planned

Objective:
- expose nearest-neighbor evidence
- visually reveal shortcut learning

Dependencies:
- embeddings

Risk:
- medium

Complexity:
- medium-high

Next action:
- retrieval_reports pipeline

---

# 5 — Cross-cycle latent stability

Status:
- planned

Objective:
- detect oscillation/collapse

Dependencies:
- iterative loop

Risk:
- medium

Complexity:
- medium

Next action:
- embedding drift metrics

---

# 6 — Frontend foundation

Status:
- planned

Objective:
- spatial microscopy viewer

Dependencies:
- backend output stabilization

Risk:
- medium

Complexity:
- high

Next action:
- React/Vite/PixiJS scaffold

---

# 7 — External validation

Status:
- not started

Objective:
- real-world robustness evidence

Dependencies:
- data acquisition

Risk:
- extremely high

Complexity:
- very high

Next action:
- collect unseen datasets

---

# 8 — Biological validation

Status:
- absent

Objective:
- correlate rankings with expert preference

Dependencies:
- human/domain input

Risk:
- existential

Complexity:
- very high

Next action:
- future lab collaboration