# Colony Atlas interface

This Next.js application provides a field inbox and spatial review screen for the iPSC Colony Classification pipeline. It imports images through the local Python service, shows analysis jobs and candidate regions, saves technician decisions, and exports records.

The separate `/workspace` route is a synthetic interface demo. Its bundled plate image, candidate boundaries, scores, and notes are illustrative. Validation, calibration, and retrieval views there remain previews without measured artifacts.

## Run

```bash
npm ci
npm run dev
```

Start the Python service from the repository root with `./linux-v1/run.sh service`, then open [http://localhost:3000](http://localhost:3000). Set `ATLAS_API_URL` if the service is not on `127.0.0.1:8765`; set the same `ATLAS_API_TOKEN` on both processes if token authentication is enabled. Run `npm run lint`, `npm run typecheck`, and `npm run build` to verify the frontend.

The viewer uses OpenSeadragon with bundled control icons. Its state and overlays live in `components/viewer/` and `lib/workspace/`; the standalone demonstration fixture is in `lib/demo/plate.ts`.
