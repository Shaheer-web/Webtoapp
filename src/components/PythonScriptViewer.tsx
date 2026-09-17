import React, { useState, useEffect } from "react";
import { Download, Copy, Check, Terminal, FileCode, Search, Sparkles, BookOpen } from "lucide-react";

export const PythonScriptViewer: React.FC = () => {
  const [code, setCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"code" | "instructions" | "requirements">("code");

  useEffect(() => {
    fetch("/api/python-code")
      .then((res) => res.json())
      .then((data) => {
        if (data.code) {
          setCode(data.code);
        }
      })
      .catch((err) => console.error("Error loading code:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeLines = code.split("\n");
  const filteredLines = searchQuery
    ? codeLines.filter((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
    : codeLines;

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-100">
                web2app_builder.py
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                100% Production Ready
              </span>
              <span className="text-xs text-slate-500">({codeLines.length} lines)</span>
            </div>
            <p className="text-xs text-slate-400">
              Complete, self-contained single script. Runs with PyQt6 (or automatic Tkinter fallback).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab("code")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeSubTab === "code"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Python Code
            </button>
            <button
              onClick={() => setActiveSubTab("instructions")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeSubTab === "instructions"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Quickstart Guide
            </button>
            <button
              onClick={() => setActiveSubTab("requirements")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeSubTab === "requirements"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              requirements.txt
            </button>
          </div>

          <button
            id="copy-python-code-btn"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Script</span>
              </>
            )}
          </button>

          <a
            id="download-py-file-btn"
            href="/api/download-python-script"
            download="web2app_builder.py"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-all shadow-md shadow-sky-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .py</span>
          </a>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeSubTab === "code" && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          {/* Code Search & Filter Bar */}
          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="font-mono text-sky-400">python web2app_builder.py</span>
            </div>
            <div className="relative w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search function, class, command..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md pl-7 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2 pointer-events-none" />
            </div>
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="p-4 overflow-x-auto max-h-[620px] font-mono text-xs leading-relaxed select-text bg-[#020617]">
            {loading ? (
              <div className="py-20 text-center text-slate-500">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Loading Python source code...</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <tbody>
                  {filteredLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="w-12 pr-4 text-right select-none text-slate-600 border-r border-slate-800/80 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="pl-4 text-slate-300 whitespace-pre">
                        {renderSyntaxHighlit(line)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "instructions" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-slate-100">
              Step-by-Step Execution Guide
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="font-semibold text-sm text-slate-200">
                Install Python Packages
              </h4>
              <p className="text-xs text-slate-400">
                Install PyQt6 and requests via pip. For pure-Python fallback, install pywebview.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-sky-300 select-all">
                pip install PyQt6 requests pywebview pyinstaller
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="font-semibold text-sm text-slate-200">
                Install Build Toolchains
              </h4>
              <p className="text-xs text-slate-400">
                Install Node.js (for Nativefier &amp; Bubblewrap) and OpenJDK 17+ (for Android APKs).
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 select-all">
                npm install -g nativefier @bubblewrap/cli
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="font-semibold text-sm text-slate-200">
                Launch GUI Application
              </h4>
              <p className="text-xs text-slate-400">
                Execute the single-file script. The GUI launches immediately with live progress.
              </p>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-xs text-sky-300 select-all">
                python web2app_builder.py
              </div>
            </div>
          </div>

          {/* OS-specific command tabs */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Environment Variables for Android SDK &amp; Java
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <span className="text-slate-500 text-[11px] block font-sans">
                  Windows (PowerShell)
                </span>
                <p className="text-sky-300">$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17..."</p>
                <p className="text-sky-300">$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"</p>
                <p className="text-slate-400">python web2app_builder.py</p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs space-y-1">
                <span className="text-slate-500 text-[11px] block font-sans">
                  macOS / Linux (Bash/Zsh)
                </span>
                <p className="text-sky-300">export JAVA_HOME=$(/usr/libexec/java_home -v 17)</p>
                <p className="text-sky-300">export ANDROID_HOME=$HOME/Library/Android/sdk</p>
                <p className="text-slate-400">python3 web2app_builder.py</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "requirements" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">requirements.txt</h3>
              <p className="text-xs text-slate-400">Standard pip dependencies definition</p>
            </div>
            <a
              href="/api/download-requirements"
              download="requirements.txt"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download requirements.txt</span>
            </a>
          </div>

          <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 select-all">
{`# Web2App Executable & APK Builder Requirements
# Install with: pip install -r requirements.txt

PyQt6>=6.5.0
requests>=2.31.0

# Optional engines for pure-Python fallback:
pywebview>=4.4.0
pyinstaller>=6.3.0`}
          </pre>
        </div>
      )}
    </div>
  );
};

// Simple lightweight syntax colorizer for the browser viewer
function renderSyntaxHighlit(line: string) {
  if (line.trim().startsWith("#")) {
    return <span className="text-slate-500 italic">{line}</span>;
  }
  if (line.trim().startsWith('"""') || line.trim().startsWith("'''")) {
    return <span className="text-amber-300/80 italic">{line}</span>;
  }

  // Keywords colorization
  const keywords = ["class", "def", "import", "from", "return", "if", "else", "elif", "try", "except", "finally", "while", "for", "in", "as", "with", "super", "True", "False", "None"];
  const parts = line.split(/(\b[a-zA-Z_]\w*\b|".*?"|'.*?'|[()\[\]{}:,])/g);

  return parts.map((part, i) => {
    if (keywords.includes(part)) {
      return (
        <span key={i} className="text-sky-400 font-semibold">
          {part}
        </span>
      );
    }
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
      return (
        <span key={i} className="text-emerald-300">
          {part}
        </span>
      );
    }
    if (/^\d+$/.test(part)) {
      return (
        <span key={i} className="text-amber-400">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
