# Conventions

# Coding Philosophy

- preserve existing pipeline structure
- prefer additive changes over rewrites
- avoid architectural churn
- avoid premature microservices
- optimize for trustworthiness + robustness
- avoid benchmark fetishism

---

# Architectural Constraints

DO NOT:
- redesign model stack casually
- replace core pipeline wholesale
- add segmentation-first systems
- introduce distributed infra prematurely
- overengineer backend

PREFER:
- surgical modifications
- layered improvements
- modular diagnostics
- composable stages

---

# Naming Conventions

Generally:
- snake_case
- explicit file naming
- stage-oriented script names

Examples:
- run_analysis.py
- embedding_analysis.py
- pilot_monitoring.py

---

# Repository Organization Philosophy

Filesystem-driven pipeline.

Artifacts stored explicitly:
- intermediate outputs
- diagnostics
- embeddings
- reports

Favor inspectability over abstraction.

---

# API Conventions (planned)

FastAPI JSON endpoints.

Responses should expose:
- spatial coordinates
- confidence
- entropy
- trust metrics
- cluster metadata

---

# Performance Expectations

Critical:
- large-image handling
- batched inference
- cached stages
- minimal duplicate writes

Frontend expectations:
- GPU rendering
- smooth zoom/pan
- scalable overlays

---

# Things Future AI Sessions Should Avoid

- large rewrites
- replacing proven systems
- deleting diagnostics
- hiding uncertainty
- inflating confidence
- blindly optimizing metrics
- assuming biological validity

---

# Rejected / Avoided Patterns

Rejected:
- Streamlit-first productization
- dashboard-style UI
- segmentation pivot
- excessive backend complexity
- SSR-heavy frontend
- SVG-heavy rendering

Preferred:
- spatial viewer paradigm
- GIS/pathology-tool behavior
- explainability-focused UX