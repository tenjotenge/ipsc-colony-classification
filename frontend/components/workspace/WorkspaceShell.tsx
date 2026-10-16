"use client";

import React, { useState } from "react";
import { WorkspaceModeSelector } from "../shared/WorkspaceModeSelector";
import { useUIStore } from "@/lib/workspace/UIStore";

interface WorkspaceShellProps {
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  children?: React.ReactNode;
}

export const WorkspaceShell: React.FC<WorkspaceShellProps> = ({
  leftPanel,
  rightPanel,
  bottomPanel,
  children,
}) => {
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);
  const [bottomVisible, setBottomVisible] = useState(false);
  const mode = useUIStore((state) => state.mode);
  const setMode = useUIStore((state) => state.setMode);

  return (
    <div className="flex flex-col h-screen min-w-[1040px] bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-border panel-header">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-teal-400/15 border border-teal-300/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.22em] font-semibold text-teal-300 uppercase">Colony Atlas</div>
              <h1 className="text-sm font-semibold text-foreground">iPSC morphology workspace</h1>
            </div>
          </div>
          <WorkspaceModeSelector currentMode={mode} onModeChange={setMode} />
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-[10px] font-semibold tracking-wide text-amber-200">SYNTHETIC DEMO</span>
          <button
            onClick={() => setLeftVisible(!leftVisible)}
            aria-label="Toggle left panel"
            className="px-2 py-1 text-xs font-medium rounded border border-border hover:bg-secondary transition-colors"
          >
            {leftVisible ? "◀" : "▶"}
          </button>
          <button
            onClick={() => setRightVisible(!rightVisible)}
            aria-label="Toggle right panel"
            className="px-2 py-1 text-xs font-medium rounded border border-border hover:bg-secondary transition-colors"
          >
            {rightVisible ? "▶" : "◀"}
          </button>
          <button
            onClick={() => setBottomVisible(!bottomVisible)}
            aria-label="Toggle bottom panel"
            className="px-2 py-1 text-xs font-medium rounded border border-border hover:bg-secondary transition-colors"
          >
            {bottomVisible ? "▼" : "▲"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        {leftVisible && (
          <aside className="w-[300px] shrink-0 border-r border-border panel overflow-y-auto">
            {leftPanel}
          </aside>
        )}

        {/* Viewer Area */}
        <main className="flex-1 overflow-hidden">
          <div className="w-full h-full bg-background">
            {children}
          </div>
        </main>

        {/* Right Panel */}
        {rightVisible && (
          <aside className="w-[340px] shrink-0 border-l border-border panel overflow-y-auto">
            {rightPanel}
          </aside>
        )}
      </div>

      {/* Bottom Panel */}
      {bottomVisible && (
        <footer className="h-64 border-t border-border panel overflow-y-auto">
          {bottomPanel}
        </footer>
      )}
    </div>
  );
};
