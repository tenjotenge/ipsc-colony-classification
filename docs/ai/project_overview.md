# Project Overview

## Purpose
iPSC colony analysis + ranking system for microscopy imagery.

Primary goal:
- identify/rank high-quality colonies from microscopy plates
- produce spatially coherent heatmaps + colony candidates
- evolve into lab-facing decision-support tooling

NOT intended as:
- generic image classifier
- segmentation-first system
- notebook research prototype

Current emphasis:
- morphology-aware ranking
- robustness
- trustworthiness
- calibration
- spatial reasoning
- pilot-grade operational reliability

---

# Core Goals

## Near-term
- reach credible pilot readiness for small labs
- reduce shortcut learning/artifact dependence
- improve morphology discrimination
- improve uncertainty realism
- improve domain robustness
- maintain strong spatial coherence

## Mid-term
- frontend/UI for lab workflows
- deployment-ready inference pipeline
- trust-focused review workflows
- cross-domain validation

## Long-term
- industrial-grade biological decision support
- multi-lab robustness
- biologically validated ranking quality
- downstream outcome correlation

---

# Current Stack

## ML/Backend
- Python
- PyTorch
- OpenCV
- NumPy
- PIL
- FastAPI (planned)
- Uvicorn (planned)

## Frontend (planned)
- React
- TypeScript
- Vite
- PixiJS
- Zustand
- TailwindCSS

---

# Major Systems

## Existing
- preprocessing pipeline
- multi-scale tiling
- weak-label generation
- manual-label integration
- training pipeline
- embedding extraction
- embedding diagnostics
- hard-example mining
- calibration
- iterative refinement
- perturbation testing
- colony clustering/ranking
- plate analysis
- pilot readiness reporting

## Planned
- cross-domain validation
- retrieval-based interpretability
- consensus ranking
- frontend spatial viewer
- domain robustness scoring
- latent stability tracking

---

# Design Philosophy

## Core principles
- preserve spatial coherence
- prioritize robustness over benchmark chasing
- expose uncertainty honestly
- avoid opaque confidence
- favor iterative refinement over architecture churn
- minimize overengineering
- prefer composable pipeline stages

## Product philosophy
- scientific trust > flashy UX
- explainability > raw score maximization
- operational consistency > peak metrics
- spatial decision-support tool, not dashboard

---

# Operational Priorities

1. morphology discrimination
2. entropy reduction
3. domain robustness
4. calibration realism
5. interpretability
6. pilot readiness
7. frontend

---

# Intended End-State Vision

A microscopy analysis platform that:
- ingests plate imagery
- spatially ranks colony quality
- exposes confidence/uncertainty
- generalizes across labs/domains
- supports operational colony review workflows
- behaves like pathology/GIS tooling rather than research scripts