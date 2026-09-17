import React from "react";
import { Cpu, Layers, ShieldCheck, Terminal, Smartphone, Monitor, CheckCircle, ArrowRight } from "lucide-react";

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              System Architecture &amp; Compilation Engineering
            </h2>
            <p className="text-xs text-slate-400">
              Technical deep dive into the cross-platform packaging engines, threading model, and subprocess piping
            </p>
          </div>
        </div>
      </div>

      {/* 2-Column Architecture breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Windows Architecture */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
            <Monitor className="w-4 h-4" />
            <span>Windows .EXE Packaging Backends</span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200">
                  Primary: Nativefier (Electron Engine)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 font-mono">
                  Node.js / npx
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bundles a lightweight Chromium + Node.js runtime directly into the Windows executable.
                Guarantees 100% web API compatibility, IndexedDB, Service Workers, WebRTC, and hardware-accelerated WebGL.
              </p>
              <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                $ npx nativefier "https://..." --platform windows --arch x64 --maximize
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200">
                  Alternative: PyInstaller + PyWebView
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-mono">
                  Pure Python
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamically writes a Python script wrapping Microsoft Edge WebView2, then compiles it via PyInstaller into a single <code className="text-sky-300">.exe</code> (~15MB vs ~70MB for Electron).
              </p>
              <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                $ pyinstaller --noconsole --onefile app_launcher.py
              </div>
            </div>
          </div>
        </div>

        {/* Android Architecture */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <Smartphone className="w-4 h-4" />
            <span>Android .APK Packaging Backends</span>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200">
                  Primary: Bubblewrap CLI (Trusted Web Activity)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-mono">
                  Google TWA Standard
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Google's official standard for publishing PWAs to Google Play. Uses Android Chrome Custom Tabs to run the web app in full-screen with native performance, zero WebView memory overhead, and shared browser cookies.
              </p>
              <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                $ npx @bubblewrap/cli init --manifest=twa-manifest.json && bubblewrap build
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-200">
                  Alternative: Capacitor CLI
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-sky-500/10 text-sky-400 font-mono">
                  Hybrid Container
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scaffolds an Android Studio Gradle project with a native Android WebView wrapper, pointing <code className="text-sky-300">server.url</code> directly to the target web address.
              </p>
              <div className="bg-slate-900 p-2 rounded text-[11px] font-mono text-slate-300 border border-slate-800">
                $ npx cap add android && ./gradlew assembleDebug
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asynchronous Execution Model */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
          <Terminal className="w-4 h-4" />
          <span>Non-Blocking Asynchronous Execution Architecture</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Standard desktop GUI frameworks (PyQt6 / Tkinter) run a single-threaded event loop (<code className="text-sky-300">exec()</code> / <code className="text-sky-300">mainloop()</code>).
          Running compilation commands synchronously on the main thread causes the operating system window manager to flag the application as <strong>"Not Responding"</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>1. Main GUI Thread</span>
            </span>
            <p className="text-slate-400">
              Handles user interactions, UI redrawing, progress bar animations, and user cancellations without ever freezing.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>2. QThread Worker</span>
            </span>
            <p className="text-slate-400">
              Spawns in a distinct OS thread. Dispatches subprocess commands and controls pipeline stages without blocking the GUI.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <span className="font-bold text-slate-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>3. pyqtSignal Pipe</span>
            </span>
            <p className="text-slate-400">
              Streams stdout and stderr line-by-line across thread boundaries safely via Qt's thread-safe signal/slot queuing system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
