"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { DEMO_COLONIES, type DemoColony } from "@/lib/demo/plate";
import { useUIStore } from "@/lib/workspace/UIStore";

const MicroscopyViewer = dynamic(
  () => import("@/components/viewer/MicroscopyViewer").then((module) => module.MicroscopyViewer),
  { ssr: false }
);

function ScoreBar({ value }: { value: number }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-slate-700/70"><div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-300" style={{ width: `${Math.round(value * 100)}%` }} /></div>;
}

function CandidateCard({ colony, selected, onClick }: { colony: DemoColony; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full rounded-xl border p-3 text-left transition-colors ${selected ? "border-teal-400/60 bg-teal-400/10" : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.045]"}`}>
      <div className="flex items-start justify-between gap-2">
        <div><div className="text-[10px] font-semibold tracking-[0.14em] text-teal-300">{colony.id}</div><div className="mt-1 text-sm font-medium text-slate-100">{colony.name}</div></div>
        <div className="font-mono text-xl font-semibold text-slate-100">{Math.round(colony.score * 100)}<span className="text-xs text-slate-400">/100</span></div>
      </div>
      <div className="mt-3"><ScoreBar value={colony.score} /></div>
      <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>{colony.tileCount} tiles</span><span>uncertainty {colony.uncertainty.toFixed(2)}</span></div>
    </button>
  );
}

export default function WorkspacePage() {
  const [selectedId, setSelectedId] = useState(DEMO_COLONIES[0].id);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const mode = useUIStore((state) => state.mode);
  const setMode = useUIStore((state) => state.setMode);
  const showRegions = useUIStore((state) => state.overlayVisibility.colonyBoundingBoxes);
  const toggleOverlay = useUIStore((state) => state.toggleOverlay);
  const selected = DEMO_COLONIES.find((colony) => colony.id === selectedId) ?? DEMO_COLONIES[0];

  return (
    <WorkspaceShell
      leftPanel={<div className="space-y-6 p-5">
        <div><div className="text-[10px] font-semibold tracking-[0.18em] text-teal-300">ACTIVE FIELD</div><h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-100">Plate overview</h2><p className="mt-1 text-xs leading-relaxed text-slate-400">A sample field for exploring spatial candidate ranking and review interactions.</p></div>
        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3.5">
          <div className="flex justify-between text-xs"><span className="text-slate-400">Field ID</span><span className="font-mono text-slate-100">DEMO-PLATE-01</span></div>
          <div className="mt-2 flex justify-between text-xs"><span className="text-slate-400">Image</span><span className="font-mono text-slate-100">1024 × 1024 px</span></div>
          <div className="mt-2 flex justify-between text-xs"><span className="text-slate-400">Candidates</span><span className="font-mono text-teal-300">03 regions</span></div>
        </div>
        <div><div className="mb-3 flex justify-between"><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ranked candidates</h3><span className="font-mono text-[11px] text-slate-500">01 — 03</span></div><div className="space-y-2.5">{DEMO_COLONIES.map((colony) => <CandidateCard key={colony.id} colony={colony} selected={colony.id === selectedId} onClick={() => setSelectedId(colony.id)} />)}</div></div>
        <div className="border-t border-white/10 pt-4"><div className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Display layers</div><button onClick={() => toggleOverlay("colonyBoundingBoxes")} className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2 text-left text-xs text-slate-200"><span>Candidate boundaries</span><span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${showRegions ? "bg-teal-400/15 text-teal-300" : "bg-slate-700 text-slate-400"}`}>{showRegions ? "ON" : "OFF"}</span></button></div>
      </div>}
      rightPanel={<div className="space-y-5 p-5">
        <div className="flex items-start justify-between"><div><div className="text-[10px] font-semibold tracking-[0.18em] text-teal-300">REGION DETAIL</div><h2 className="mt-2 text-xl font-semibold text-slate-100">{selected.name}</h2><div className="mt-1 font-mono text-xs text-slate-500">{selected.id} · rank {DEMO_COLONIES.indexOf(selected) + 1} of {DEMO_COLONIES.length}</div></div><span className="rounded-md border border-teal-300/30 bg-teal-300/10 px-2 py-1 font-mono text-xs text-teal-200">SAMPLE</span></div>
        <div className="rounded-2xl border border-teal-300/20 bg-gradient-to-br from-teal-400/10 to-slate-900 p-4"><div className="text-xs text-slate-400">Illustrative ranking score</div><div className="mt-2 flex items-end gap-1"><span className="font-mono text-5xl font-semibold tracking-tight text-slate-50">{Math.round(selected.score * 100)}</span><span className="pb-1 font-mono text-lg text-slate-400">/100</span></div><div className="mt-4"><ScoreBar value={selected.score} /></div></div>
        <div className="grid grid-cols-2 gap-2.5"><div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="text-[11px] text-slate-400">Uncertainty</div><div className="mt-1 font-mono text-xl text-slate-100">{selected.uncertainty.toFixed(2)}</div></div><div className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="text-[11px] text-slate-400">Supporting tiles</div><div className="mt-1 font-mono text-xl text-slate-100">{selected.tileCount}</div></div></div>
        <div className="border-t border-white/10 pt-4"><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Region notes</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">{selected.note}</p></div>
        {mode === "review" ? <div className="rounded-xl border border-teal-300/20 bg-teal-400/5 p-3.5"><div className="text-xs font-semibold text-slate-100">Review decision</div><p className="mt-1 text-xs text-slate-400">Local demo decision for {selected.id}. No data is submitted.</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setDecisions({ ...decisions, [selected.id]: "Shortlisted" })} className="rounded-lg bg-teal-400 px-3 py-2 text-xs font-semibold text-slate-950">Shortlist</button><button onClick={() => setDecisions({ ...decisions, [selected.id]: "Flagged" })} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200">Flag for review</button></div>{decisions[selected.id] && <div className="mt-3 text-xs text-teal-300">{decisions[selected.id]} in this session</div>}</div>
        : mode === "compare" ? <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5"><div className="text-xs font-semibold text-slate-100">Candidate comparison</div><div className="mt-3 space-y-3">{DEMO_COLONIES.map((colony) => <div key={colony.id}><div className="mb-1 flex justify-between font-mono text-[11px] text-slate-400"><span>{colony.id}</span><span>{Math.round(colony.score * 100)}</span></div><ScoreBar value={colony.score} /></div>)}</div></div>
        : mode === "validate" || mode === "calibration" || mode === "retrieval" ? <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 text-xs leading-relaxed text-slate-400">{mode[0].toUpperCase() + mode.slice(1)} workspace preview. This demo does not include measured {mode} artifacts.</div>
        : <button onClick={() => setMode("review")} className="w-full rounded-lg border border-teal-300/30 bg-teal-300/10 px-3 py-2.5 text-xs font-semibold text-teal-200 hover:bg-teal-300/20">Open review workflow →</button>}
        <p className="border-t border-white/10 pt-4 text-[11px] leading-relaxed text-slate-500">All imagery, regions, scores, and notes on this screen are synthetic examples. They do not represent biological measurements.</p>
      </div>}
      bottomPanel={<div className="p-4 text-sm text-slate-400">Demo field · Select a candidate to inspect its sample ranking and region notes.</div>}
    >
      <div className="relative h-full w-full overflow-hidden bg-[#080f19]">
        <MicroscopyViewer imageUrl="/demo-plate.png" regions={DEMO_COLONIES} selectedRegionId={selectedId} showRegions={showRegions} onRegionSelect={setSelectedId} />
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/10 bg-[#081522]/90 px-3 py-1.5 font-mono text-[11px] text-slate-300">1024 × 1024 px · 3 candidate regions</div>
      </div>
    </WorkspaceShell>
  );
}
