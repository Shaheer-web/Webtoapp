import React, { useState, useEffect } from "react";
import { Wrench, CheckCircle2, XCircle, RefreshCw, ExternalLink, Terminal, Copy, Check } from "lucide-react";
import { SystemDiagnostics, SystemTool } from "../types";

export const DiagnosticsView: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const fetchDiagnostics = () => {
    setLoading(true);
    fetch("/api/check-dependencies")
      .then((res) => res.json())
      .then((data) => setDiagnostics(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              System Dependency Checker &amp; Toolchain Inspector
            </h2>
            <p className="text-xs text-slate-400">
              Verifies compilers, SDKs, and runtimes required for Windows .exe and Android .apk generation
            </p>
          </div>
        </div>

        <button
          id="refresh-diagnostics-btn"
          type="button"
          onClick={fetchDiagnostics}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Scan System Again</span>
        </button>
      </div>

      {/* Dependency Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {diagnostics &&
          (Object.entries(diagnostics) as [string, SystemTool][]).map(([key, tool]) => (
            <div
              key={key}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-200">
                    {tool.name}
                  </span>
                  {tool.installed ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[11px] font-semibold border border-rose-500/20">
                      <XCircle className="w-3 h-3" />
                      <span>Missing</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 mb-2">{tool.purpose}</p>

                {tool.version && (
                  <div className="text-[11px] font-mono text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800/80 truncate">
                    Version: {tool.version}
                  </div>
                )}
              </div>

              {tool.downloadUrl && !tool.installed && (
                <a
                  href={tool.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-sky-400 hover:text-sky-300 font-semibold"
                >
                  <span>Download / Setup Guide</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
      </div>

      {/* One-click install commands */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span>Quick Install Commands for Missing Tools</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Windows Setup */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-sky-400">Windows (winget &amp; npm)</span>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800 text-xs font-mono text-slate-300">
                <span className="truncate">winget install OpenJS.NodeJS.LTS</span>
                <button
                  onClick={() => copyCommand("winget install OpenJS.NodeJS.LTS")}
                  className="ml-2 text-slate-400 hover:text-white"
                >
                  {copiedCmd === "winget install OpenJS.NodeJS.LTS" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800 text-xs font-mono text-slate-300">
                <span className="truncate">winget install EclipseAdoptium.Temurin.17.JDK</span>
                <button
                  onClick={() => copyCommand("winget install EclipseAdoptium.Temurin.17.JDK")}
                  className="ml-2 text-slate-400 hover:text-white"
                >
                  {copiedCmd === "winget install EclipseAdoptium.Temurin.17.JDK" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800 text-xs font-mono text-slate-300">
                <span className="truncate">npm install -g nativefier @bubblewrap/cli</span>
                <button
                  onClick={() => copyCommand("npm install -g nativefier @bubblewrap/cli")}
                  className="ml-2 text-slate-400 hover:text-white"
                >
                  {copiedCmd === "npm install -g nativefier @bubblewrap/cli" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* macOS / Linux Setup */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-emerald-400">macOS &amp; Linux (brew &amp; apt)</span>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800 text-xs font-mono text-slate-300">
                <span className="truncate">brew install node openjdk@17</span>
                <button
                  onClick={() => copyCommand("brew install node openjdk@17")}
                  className="ml-2 text-slate-400 hover:text-white"
                >
                  {copiedCmd === "brew install node openjdk@17" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800 text-xs font-mono text-slate-300">
                <span className="truncate">sudo apt install nodejs npm openjdk-17-jdk</span>
                <button
                  onClick={() => copyCommand("sudo apt install nodejs npm openjdk-17-jdk")}
                  className="ml-2 text-slate-400 hover:text-white"
                >
                  {copiedCmd === "sudo apt install nodejs npm openjdk-17-jdk" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800 text-xs font-mono text-slate-300">
                <span className="truncate">npm install -g nativefier @bubblewrap/cli</span>
                <button
                  onClick={() => copyCommand("npm install -g nativefier @bubblewrap/cli")}
                  className="ml-2 text-slate-400 hover:text-white"
                >
                  {copiedCmd === "npm install -g nativefier @bubblewrap/cli" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
