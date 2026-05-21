# Current State

# What Works

## Stable
- preprocessing pipeline
- multi-scale tiling
- overlapping spatial anchors
- weak-label generation
- manual-label integration
- training loop
- inference
- colony clustering
- heatmap generation
- perturbation diagnostics
- embedding extraction
- embedding clustering
- iterative retraining loop
- calibration
- pilot reporting

## Metrics improved significantly
- edge bias
- corner bias
- center offset
- perturbation stability

Stability reached ~0.99 in capped validation runs.

---

# Partially Working

## Morphology discrimination
Improved but unresolved.

Current issue:
- embeddings still overlap
- subtle morphology separation weak

## Calibration
Functional but moderate quality only.

## Trust scoring
Infrastructure exists but biological validity not proven.

---

# Broken / Unresolved

## High validation entropy
Still flagged.

## Embedding collapse risk
Still flagged.

## Cluster overlap risk
Still flagged.

## Cross-domain robustness
Not implemented yet.

## Biological validation
Absent.

No:
- expert agreement testing
- downstream assay correlation
- external operational validation

---

# Current Priorities

1. domain robustness
2. morphology disentanglement
3. entropy realism
4. retrieval interpretability
5. hard-negative realism
6. cross-cycle latent analysis
7. frontend after robustness work

---

# Active Focus

Latest planned work:
- cross-domain validation
- domain-adversarial regularization
- retrieval-based interpretability
- consensus scoring
- uncertainty decomposition

Prompt partially executed before usage limit interruption.

Treat these systems as PLANNED/PARTIAL unless verified.

---

# Technical Debt Hotspots

## Label quality
Weak labels still dominant.

## Dataset assumptions
Potential shortcut-learning risk remains.

## Embedding space
Still partially entangled.

## File-based orchestration
Scaling may become difficult later.

---

# Unstable Areas

## Entropy systems
Still evolving.

## Embedding lifecycle logic
Recently modified heavily.

## Iterative loop convergence
Not yet proven across long runs.

## Hard-example mining
May overfocus on artifacts.

---

# Known Bottlenecks

Not architecture anymore.

Current bottlenecks:
- representation validity
- biological realism
- domain generalization
- external validation

---

# Robustness Layer Expansion (Latest Phase)

The partially interrupted "cross-domain robustness + interpretability" phase progressed substantially further than initially assumed.

Implemented or mostly implemented:

- domain-aware metadata layer
- domain-aware dataset handling
- domain-aware embedding metadata
- lightweight domain-confusion training objective
- leave-one-domain-out validation framework
- retrieval-based interpretability layer
- consensus-style colony ranking
- upgraded pilot-readiness integration
- full-validation orchestration mode

New orchestration target:
python run_pipeline.py --full-validation

Purpose:
- simulate cross-lab robustness
- expose domain leakage
- validate morphology-vs-domain separation
- improve operational trust scoring

---

# Current Runtime State

Most new systems appear structurally integrated.

Current unresolved issues are primarily:
- runtime stabilization
- metric convergence validation
- sampler robustness
- stale metadata handling
- non-finite weighting protection

The interruption occurred AFTER:
- compile validation
- partial smoke validation
- orchestration integration

The interruption occurred DURING:
- defensive stabilization around NaN uncertainty metadata and sampler weights

This means:
- architecture work is mostly complete
- stabilization/evaluation work remains

---

# Current Highest Priorities (Updated)

1. stabilize domain-aware weighting
2. validate full-validation orchestration
3. inspect domain-separation metrics
4. inspect retrieval consistency
5. inspect entropy decomposition behavior
6. verify latent stability across cycles
7. perform longer non-smoke validation runs

---

# Important Context Shift

The project is no longer primarily:
- adding systems

It is now primarily:
- validating
- stabilizing
- stress testing
- proving robustness

This is an important maturity transition.