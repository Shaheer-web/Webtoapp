import React from "react";
import { Download, Code2, Cpu, Wrench, Sparkles } from "lucide-react";
import { ActiveTab } from "../types";

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 ring-1 ring-white/10">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                Web2App Builder
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-full">
                Desktop &amp; Mobile
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Compile URLs to Windows <code className="text-sky-300">.exe</code> &amp; Android <code className="text-emerald-300">.apk</code>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-sm overflow-x-auto">
          <button
            id="tab-builder-btn"
            onClick={() => setActiveTab("builder")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
              activeTab === "builder"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Builder</span>
          </button>

          <button
            id="tab-python-btn"
            onClick={() => setActiveTab("python-code")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
              activeTab === "python-code"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python Script (.py)</span>
          </button>

          <button
            id="tab-diagnostics-btn"
            onClick={() => setActiveTab("diagnostics")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
              activeTab === "diagnostics"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>System Diagnostics</span>
          </button>

          <button
            id="tab-architecture-btn"
            onClick={() => setActiveTab("architecture")}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all text-xs whitespace-nowrap ${
              activeTab === "architecture"
                ? "bg-sky-500 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Architecture &amp; Docs</span>
          </button>
        </div>

        {/* Direct Download Actions */}
        <div className="flex items-center space-x-2">
          <a
            id="download-script-btn"
            href="/api/download-python-script"
            download="web2app_builder.py"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-sm"
            title="Download complete standalone PyQt6 script"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>web2app_builder.py</span>
          </a>
        </div>
      </div>
    </header>
  );
};
