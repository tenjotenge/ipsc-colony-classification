export interface DemoColony {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  uncertainty: number;
  tileCount: number;
  note: string;
}

// Illustrative fixture for the standalone interface. These values are not model output.
export const DEMO_COLONIES: DemoColony[] = [
  {
    id: "C-01", name: "Candidate 01", x: 108, y: 116, width: 405, height: 420,
    score: 0.87, uncertainty: 0.12, tileCount: 14,
    note: "Compact boundary and consistent interior texture in the sample image.",
  },
  {
    id: "C-02", name: "Candidate 02", x: 568, y: 136, width: 334, height: 332,
    score: 0.68, uncertainty: 0.24, tileCount: 10,
    note: "Smaller region with a less regular edge in the sample image.",
  },
  {
    id: "C-03", name: "Candidate 03", x: 344, y: 524, width: 427, height: 447,
    score: 0.42, uncertainty: 0.41, tileCount: 17,
    note: "Diffuse interior and a broad boundary in the sample image.",
  },
];

export const DEMO_IMAGE_SIZE = 1024;
