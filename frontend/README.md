# iPSC Colony Analysis Frontend

Scientific microscopy analysis workstation for iPSC colony evaluation.

## Architecture

This is a viewer-centric scientific analysis tool, not a generic dashboard.

### Core Principles

- **Viewer-Centric**: Microscopy viewer is the primary surface
- **Evidence-Driven**: Every visualization exposes underlying evidence
- **Uncertainty-First**: Uncertainty is first-class, never hidden
- **Performance-First**: Canvas/WebGL rendering, viewport-aware culling
- **Backend-Agnostic**: Normalization layer protects from schema evolution

### Key Subsystems

1. **Workspace State Machine**: Mode-based UI adaptation (explore, review, validate, compare, calibration, retrieval)
2. **Overlay Engine**: Canvas-based rendering with z-index ordering, viewport transforms, render scheduling
3. **Normalization Layer**: Transforms raw backend JSON to stable frontend domain models
4. **Artifact Registry**: Standardized artifact management (images, overlays, reports, embeddings)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Scientific Language

This interface uses scientific terminology:
- "calibrated score" (not "AI confidence")
- "retrieval consistency" (not "smart detection")
- "perturbation stability" (not "certainty")
- "domain agreement" (not "cross-domain accuracy")
- "uncertainty estimate" (not "confidence interval")
- "consensus rank" (not "model score")

## Design Aesthetic

Target: Scientific instrumentation, microscopy software, radiology review systems.

Avoid: Startup dashboards, consumer AI apps, generic admin panels.
