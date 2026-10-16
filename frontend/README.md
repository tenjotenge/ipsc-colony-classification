# Colony Atlas interface

This Next.js application is a spatial review prototype for the iPSC Colony Classification pipeline. It provides a zoomable plate viewer, candidate selection, ranking cards, and local review interactions.

The bundled plate image, candidate boundaries, scores, and notes are synthetic examples. The interface does not yet read reports from the Python pipeline. Validation, calibration, and retrieval screens are previews without measured artifacts.

## Run

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Run `npm run build` to verify the production build.

The viewer uses OpenSeadragon with bundled control icons. Its state and overlays live in `components/viewer/` and `lib/workspace/`; the standalone demonstration fixture is in `lib/demo/plate.ts`.
