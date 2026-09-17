import React, { useRef, useEffect, useState } from "react";
import { Terminal, Trash2, Copy, Download, Pause, Play, Check } from "lucide-react";
import { LogItem } from "../types";

interface TerminalConsoleProps {
  logs: LogItem[];
  progress: number;
  stageName: string;
  isBuilding: boolean;
  onClearLogs: () => void;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  logs,
  progress,
  stageName,
  isBuilding,
  onClearLogs,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<"all" | "error" | "warn" | "cmd">("all");

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const rawText = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.text}`).join("\n");
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const rawText = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.text}`).join("\n");
    const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `web2app-build-log-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    if (filter === "error") return log.level === "error";
    if (filter === "warn") return log.level === "warn";
    if (filter === "cmd") return log.level === "cmd";
    return true;
  });

  const getLevelColor = (level: LogItem["level"]) => {
    switch (level) {
      case "error":
        return "text-rose-400 font-semibold";
      case "warn":
        return "text-amber-400";
      case "success":
        return "text-emerald-400 font-semibold";
      case "cmd":
        return "text-sky-300 font-mono";
      default:
        return "text-slate-300";
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md flex flex-col h-full min-h-[420px]">
      {/* Console Top Header */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Real-Time Compilation Stream
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
            {logs.length} entries
          </span>
          {isBuilding && (
            <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Streaming stdout</span>
            </span>
          )}
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center space-x-1.5 text-xs">
          {/* Filter pills */}
          <div className="flex items-center space-x-1 bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-[11px]">
            <button
              onClick={() => setFilter("all")}
              className={`px-1.5 py-0.5 rounded ${filter === "all" ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-slate-200"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("cmd")}
              className={`px-1.5 py-0.5 rounded ${filter === "cmd" ? "bg-slate-800 text-sky-400 font-medium" : "text-slate-400 hover:text-slate-200"}`}
            >
              Cmds
            </button>
            <button
              onClick={() => setFilter("warn")}
              className={`px-1.5 py-0.5 rounded ${filter === "warn" ? "bg-slate-800 text-amber-400 font-medium" : "text-slate-400 hover:text-slate-200"}`}
            >
              Warns
            </button>
            <button
              onClick={() => setFilter("error")}
              className={`px-1.5 py-0.5 rounded ${filter === "error" ? "bg-slate-800 text-rose-400 font-medium" : "text-slate-400 hover:text-slate-200"}`}
            >
              Errors
            </button>
          </div>

          <button
            id="toggle-autoscroll-btn"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded hover:bg-slate-800 transition-colors ${autoScroll ? "text-sky-400" : "text-slate-500"}`}
            title={autoScroll ? "Pause autoscroll" : "Enable autoscroll"}
          >
            {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            id="copy-logs-btn"
            onClick={handleCopy}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Copy logs to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            id="export-logs-btn"
            onClick={handleExport}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Export log file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            id="clear-logs-btn"
            onClick={onClearLogs}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress & Stage Status Bar */}
      <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-300 font-medium truncate">
            {stageName || "Idle. Ready to compile."}
          </span>
          <span className="font-mono text-sky-400 font-bold ml-2 shrink-0">
            {progress}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 select-text bg-[#030712]"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 text-center py-12">
            <div>
              <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
              <p>Log output stream will appear here in real-time.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                Subprocess pipes: stdout &amp; stderr are captured asynchronously without blocking the UI.
              </p>
            </div>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2.5 hover:bg-slate-900/40 px-1 py-0.5 rounded">
              <span className="text-slate-600 select-none text-[10px] shrink-0 pt-0.5">
                {log.timestamp}
              </span>
              <span
                className={`text-[10px] font-bold px-1 rounded uppercase tracking-wider shrink-0 select-none ${
                  log.level === "error"
                    ? "bg-rose-500/20 text-rose-400"
                    : log.level === "warn"
                    ? "bg-amber-500/20 text-amber-400"
                    : log.level === "success"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : log.level === "cmd"
                    ? "bg-sky-500/20 text-sky-400"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {log.level}
              </span>
              <span className={`break-all ${getLevelColor(log.level)}`}>
                {log.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
