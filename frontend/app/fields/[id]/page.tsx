"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DemoColony } from "@/lib/demo/plate";
import { AnalysisRecord, DecisionRecord, FieldRecord, JobRecord, platformJson } from "@/lib/platform/types";

const MicroscopyViewer = dynamic(() => import("@/components/viewer/MicroscopyViewer").then((m) => m.MicroscopyViewer), { ssr: false });

export default function FieldPage({ params }: { params: Promise<{ id: string }> }) {
  const [fieldId, setFieldId] = useState("");
  const [field, setField] = useState<FieldRecord | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void params.then(({ id }) => setFieldId(id)); }, [params]);
  useEffect(() => { setReviewer(window.localStorage.getItem("atlas-reviewer") ?? ""); }, []);

  const refresh = useCallback(async () => {
    if (!fieldId) return;
    try {
      const [f, j, d] = await Promise.all([
        platformJson<FieldRecord>(`fields/${fieldId}`),
        platformJson<{ jobs: JobRecord[] }>(`fields/${fieldId}/jobs`),
        platformJson<{ decisions: DecisionRecord[] }>(`fields/${fieldId}/decisions`),
      ]);
      setField(f); setJobs(j.jobs); setDecisions(d.decisions);
      try { setAnalysis(await platformJson<AnalysisRecord>(`fields/${fieldId}/analysis`)); }
      catch { setAnalysis(null); }
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load field");
    }
  }, [fieldId]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(refresh, 4000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const regions = useMemo<DemoColony[]>(() => (analysis?.report.ranked_colonies ?? []).map((colony, index) => ({
    id: colony.colony_id, name: `Candidate ${String(index + 1).padStart(2, "0")}`,
    x: colony.x, y: colony.y, width: colony.width, height: colony.height,
    score: colony.colony_score, uncertainty: 0, tileCount: colony.tile_count,
    note: "Review the source image before making a decision.",
  })), [analysis]);
  const selected = regions.find((region) => region.id === selectedId) ?? regions[0];
  const latestJob = jobs[0];

  async function startAnalysis() {
    setBusy(true); setError("");
    try { await platformJson(`fields/${fieldId}/jobs`, { method: "POST" }); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to queue analysis"); }
    finally { setBusy(false); }
  }

  async function decide(decision: "shortlist" | "flag" | "reject") {
    if (!analysis || !selected || !reviewer.trim()) { setError("Enter your name before recording a decision."); return; }
    setBusy(true); setError("");
    try {
      await platformJson(`fields/${fieldId}/decisions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: analysis.job_id, colony_id: selected.id, decision, reviewer: reviewer.trim(), note }) });
      window.localStorage.setItem("atlas-reviewer", reviewer.trim());
      setNote(""); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save decision"); }
    finally { setBusy(false); }
  }

  function exportReport() {
    window.open(`/api/platform/fields/${fieldId}/export`, "_blank", "noopener,noreferrer");
  }

  if (!field) return <main className="min-h-screen bg-[#08111c] p-8 text-slate-100"><Link href="/inbox" className="text-teal-300">← Back to inbox</Link><p className="mt-8">{error || "Loading field…"}</p></main>;

  return <main className="flex min-h-screen flex-col bg-[#08111c] text-slate-100">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
      <div><Link href="/inbox" className="text-xs text-teal-300 hover:underline">← Field inbox</Link><h1 className="mt-1 text-lg font-semibold">{field.filename}</h1><p className="text-xs text-slate-500">{field.width} × {field.height} px · source image retained</p></div>
      <div className="flex items-center gap-3"><span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200">Research use · review required</span><button onClick={exportReport} className="rounded-lg border border-white/15 px-3 py-2 text-xs hover:bg-white/10">Export record</button></div>
    </header>
    {error && <div role="alert" className="mx-5 mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</div>}
    <div className="flex flex-1 flex-col lg:flex-row">
      <aside className="w-full shrink-0 border-b border-white/10 p-5 lg:w-72 lg:border-b-0 lg:border-r"><h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Candidates</h2>
        {!analysis && <div className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-slate-400">{latestJob?.status === "running" || latestJob?.status === "queued" ? "Analysis is in progress. This page refreshes automatically." : "Run analysis to see candidate regions."}</div>}
        {regions.length === 0 && analysis && <div className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-slate-400">No candidate regions were found in this field.</div>}
        <div className="mt-4 space-y-2">{regions.map((region) => {
          const latestDecision = [...decisions].reverse().find((item) => item.job_id === analysis?.job_id && item.colony_id === region.id);
          return <button key={region.id} onClick={() => setSelectedId(region.id)} className={`w-full rounded-xl border p-3 text-left ${selected?.id === region.id ? "border-teal-300/50 bg-teal-300/10" : "border-white/10 hover:border-white/25"}`}><div className="flex justify-between gap-2"><span className="text-sm font-medium">{region.name}</span><span className="text-xs text-slate-400">#{regions.indexOf(region) + 1}</span></div><div className="mt-2 text-xs text-slate-400">Ranking score {region.score.toFixed(2)} · {region.tileCount} tiles</div>{latestDecision && <div className="mt-2 text-xs capitalize text-teal-300">{latestDecision.decision} by {latestDecision.reviewer}</div>}</button>;
        })}</div>
      </aside>
      <section className="relative min-h-[450px] flex-1 bg-black lg:min-h-[calc(100vh-90px)]"><MicroscopyViewer imageUrl={`/api/platform/fields/${fieldId}/image`} imageWidth={field.width} regions={regions} selectedRegionId={selected?.id} onRegionSelect={setSelectedId} /><div className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-[#08111c]/90 px-3 py-2 text-xs text-slate-200">Original image · {regions.length} suggested regions</div></section>
      <aside className="w-full shrink-0 border-t border-white/10 p-5 lg:w-80 lg:border-l lg:border-t-0"><h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Review</h2>
        <div className="mt-4 rounded-xl border border-white/10 p-4"><div className="text-sm font-semibold">Analysis status</div><div className="mt-2 text-sm capitalize text-slate-300">{latestJob?.status ?? "Not started"}</div>{latestJob?.error && <p className="mt-2 text-xs leading-relaxed text-rose-300">{latestJob.error}</p>}<button disabled={busy || latestJob?.status === "queued" || latestJob?.status === "running"} onClick={() => void startAnalysis()} className="mt-4 w-full rounded-lg bg-teal-300 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">{latestJob ? "Run analysis again" : "Run analysis"}</button></div>
        {selected && analysis && <div className="mt-5 space-y-4"><div><h3 className="font-semibold">{selected.name}</h3><p className="mt-1 text-xs leading-relaxed text-slate-400">The ranking score is model output, not a validated measure of colony quality. Inspect the image and record your own assessment.</p></div><label className="block text-xs text-slate-300">Your name<input value={reviewer} onChange={(event) => setReviewer(event.target.value)} maxLength={100} className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-teal-300" placeholder="Technician name" /></label><label className="block text-xs text-slate-300">Note (optional)<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} rows={3} className="mt-1.5 w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-teal-300" placeholder="Reason for this decision" /></label><div className="grid grid-cols-2 gap-2"><button disabled={busy} onClick={() => void decide("shortlist")} className="rounded-lg bg-teal-300 px-3 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">Shortlist</button><button disabled={busy} onClick={() => void decide("flag")} className="rounded-lg border border-amber-300/40 px-3 py-2.5 text-sm text-amber-200 disabled:opacity-50">Flag</button><button disabled={busy} onClick={() => void decide("reject")} className="col-span-2 rounded-lg border border-white/15 px-3 py-2.5 text-sm text-slate-300 disabled:opacity-50">Reject candidate</button></div></div>}
        {decisions.length > 0 && <div className="mt-7 border-t border-white/10 pt-5"><h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Decision history</h3><div className="mt-3 space-y-3">{[...decisions].reverse().slice(0, 10).map((item) => <div key={item.id} className="text-xs text-slate-400"><span className="capitalize text-slate-200">{item.decision}</span> · {item.reviewer}<br />{new Date(item.created_at).toLocaleString()}{item.note && <p className="mt-1">{item.note}</p>}</div>)}</div></div>}
      </aside>
    </div>
  </main>;
}
