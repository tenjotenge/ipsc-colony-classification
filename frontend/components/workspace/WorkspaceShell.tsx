"use client";

import React, { useState } from "react";
import { WorkspaceModeSelector } from "../shared/WorkspaceModeSelector";

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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border panel-header">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-sm font-medium text-foreground">
              iPSC Colony Analysis
            </h1>
          </div>
          <WorkspaceModeSelector />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setLeftVisible(!leftVisible)}
            className="px-2 py-1 text-xs font-medium rounded border border-border hover:bg-secondary transition-colors"
          >
            {leftVisible ? "◀" : "▶"}
          </button>
          <button
            onClick={() => setRightVisible(!rightVisible)}
            className="px-2 py-1 text-xs font-medium rounded border border-border hover:bg-secondary transition-colors"
          >
            {rightVisible ? "▶" : "◀"}
          </button>
          <button
            onClick={() => setBottomVisible(!bottomVisible)}
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
          <aside className="w-80 border-r border-border panel overflow-y-auto">
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
          <aside className="w-96 border-l border-border panel overflow-y-auto">
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
