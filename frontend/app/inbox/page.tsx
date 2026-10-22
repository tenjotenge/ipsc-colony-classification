"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FieldRecord, PlatformStatus, platformJson } from "@/lib/platform/types";

export default function InboxPage() {
  const [fields, setFields] = useState<FieldRecord[]>([]);
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [result, platformStatus] = await Promise.all([
        platformJson<{ fields: FieldRecord[] }>("fields"), platformJson<PlatformStatus>("status"),
      ]);
      setFields(result.fields);
      setStatus(platformStatus);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load fields");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void refresh());
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function importField(file: File) {
    if (file.size > 100 * 1024 * 1024) { setError("Choose an image under 100 MB."); return; }
    setBusy(true);
    setError("");
    try {
      await platformJson<FieldRecord>("fields", {
        method: "POST",
        body: file,
        headers: { "X-Filename-Encoded": encodeURIComponent(file.name), "Content-Type": "application/octet-stream" },
      });
      await refresh();
      if (input.current) input.current.value = "";
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-[#08111c] px-5 py-8 text-slate-100 sm:px-10">
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div><div className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Colony Atlas</div><h1 className="mt-2 text-3xl font-semibold">Field inbox</h1><p className="mt-2 text-sm text-slate-400">Import a microscopy field, run analysis, and review its candidates.</p></div>
        <Link href="/workspace" className="text-xs text-slate-400 underline underline-offset-4 hover:text-white">Explore synthetic demo</Link>
      </header>
      <section className="mt-8 rounded-2xl border border-teal-300/20 bg-teal-300/[0.06] p-5">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div><h2 className="text-lg font-semibold">Import image</h2><p className="mt-1 text-sm text-slate-400">PNG, JPEG, or TIFF · up to 100 MB per field</p></div>
          <label className={`cursor-pointer rounded-lg bg-teal-300 px-5 py-2.5 text-sm font-semibold text-slate-950 ${busy ? "opacity-50" : "hover:bg-teal-200"}`}>
            {busy ? "Importing…" : "Choose image"}<input ref={input} type="file" accept="image/png,image/jpeg,image/tiff,.tif,.tiff" className="sr-only" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void importField(file); }} />
          </label>
        </div>
      </section>
      {error && <div role="alert" className="mt-5 rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}
      {status && <section aria-label="Analysis queue" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-white/10 bg-white/[0.025] px-5 py-3 text-xs text-slate-300">
        <span>{status.jobs.queued} queued</span><span>{status.jobs.running} running</span><span>{status.jobs.failed} failed</span>
        <span className="ml-auto text-slate-500">{status.workers} {status.workers === 1 ? "worker" : "workers"}{!status.worker_available && " · unavailable"}</span>
      </section>}
      {status && !status.model_installed && <p role="status" className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">A model is not installed yet. You can import fields, but an administrator must add model.pth before analysis can run.</p>}
      <section className="mt-9"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Fields</h2><span className="text-xs text-slate-500">{fields.length} imported</span></div>
        {fields.length === 0 ? <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-400">No fields yet. Import an image to begin.</div> :
          <div className="space-y-2">{fields.map((field) => <Link key={field.id} href={`/fields/${field.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-5 py-4 hover:border-teal-300/40 hover:bg-white/[0.05]">
            <div className="min-w-0"><div className="truncate font-medium">{field.filename}</div><div className="mt-1 text-xs text-slate-500">{field.width} × {field.height} px · imported {new Date(field.created_at).toLocaleString()}</div></div>
            <div className="flex items-center gap-4"><span className="rounded-full border border-white/15 px-2.5 py-1 text-xs capitalize text-slate-300">{field.latest_status ?? "Awaiting analysis"}</span><span aria-hidden className="text-teal-300">→</span></div>
          </Link>)}</div>}
      </section>
      <p className="mt-10 text-xs leading-relaxed text-slate-500">Research workflow. The current model has no biological validation; review every suggested candidate against the source image.</p>
    </div>
  </main>;
}
