# Context Bootstrap Prompt

You are entering an existing advanced microscopy ML repository.

Before making ANY changes:

1. Read ONLY these files first:
- /docs/ai/project_overview.md
- /docs/ai/current_state.md
- /docs/ai/architecture.md
- /docs/ai/handoff_summary.md
- /docs/ai/active_tasks.md

2. Then inspect:
- run_pipeline.py
- train.py
- dataset_core.py
- embedding_analysis.py
- colony_analysis.py

3. BEFORE coding:
- summarize current architecture
- summarize current bottlenecks
- summarize current implementation maturity
- identify whether requested work already partially exists

4. DO NOT:
- redesign architecture
- rewrite major systems
- introduce unnecessary abstractions
- remove diagnostics
- hide uncertainty
- optimize only for benchmark metrics

5. Prefer:
- surgical modifications
- additive improvements
- robustness
- interpretability
- calibration realism
- domain generalization
- morphology disentanglement

6. Current major bottlenecks:
- high validation entropy
- embedding overlap
- domain robustness
- biological validity uncertainty

7. Important:
High perturbation stability DOES NOT imply biological correctness.

8. Treat partially executed prompts carefully:
Some planned robustness systems may already exist partially.
Verify implementation before adding new systems.

9. Minimize token usage:
- inspect only relevant subsystems
- avoid broad repo scans unless required
- prefer concise summaries

10. When proposing changes:
- explain expected impact
- explain risks
- explain interaction with iterative loop
- avoid architecture churn

---

# Latest Context Update

A major robustness/interpretability expansion was partially completed.

Likely implemented already:
- domain-aware metadata
- leave-one-domain-out validation
- retrieval interpretability
- consensus ranking
- domain-aware embeddings
- domain-confusion regularization
- full-validation orchestration

Before implementing ANY new robustness systems:
- verify whether they already exist partially
- inspect latest runtime state
- inspect compile/runtime validation status

Current likely bottleneck:
- stabilization and validation
NOT architecture creation.

Future sessions should prioritize:
1. runtime stabilization
2. metric inspection
3. robustness evaluation
4. evidence generation
before adding additional systems.