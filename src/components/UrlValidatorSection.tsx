import React, { useState } from "react";
import { Globe, CheckCircle2, XCircle, Loader2, ShieldCheck, Zap, Sparkles, ExternalLink } from "lucide-react";
import { UrlValidationResult } from "../types";

interface UrlValidatorSectionProps {
  url: string;
  setUrl: (url: string) => void;
  validationResult: UrlValidationResult | null;
  isValidating: boolean;
  onValidate: (targetUrl?: string) => void;
  onApplyTitleToName: (title: string) => void;
}

const PRESET_URLS = [
  { name: "Discord Channel", url: "https://discord.com/channels/@me" },
  { name: "GitHub Issues", url: "https://github.com/facebook/react/issues" },
  { name: "YouTube Video", url: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
  { name: "Wikipedia Article", url: "https://en.wikipedia.org/wiki/Portal:Current_events" },
  { name: "Linear", url: "https://linear.app" },
];

export const UrlValidatorSection: React.FC<UrlValidatorSectionProps> = ({
  url,
  setUrl,
  validationResult,
  isValidating,
  onValidate,
  onApplyTitleToName,
}) => {
  const [localInput, setLocalInput] = useState(url);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalInput(e.target.value);
    setUrl(e.target.value);
  };

  const handlePresetClick = (presetUrl: string) => {
    setLocalInput(presetUrl);
    setUrl(presetUrl);
    onValidate(presetUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onValidate(localInput);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              1. Target Website &amp; Live URL Validation
            </h2>
            <p className="text-xs text-slate-400">
              Strict protocol check and active HTTP response verification before compiling
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center space-x-1.5 overflow-x-auto text-xs py-1">
          <span className="text-slate-500 text-[11px] font-medium mr-1">Presets:</span>
          {PRESET_URLS.map((preset) => (
            <button
              key={preset.name}
              id={`preset-${preset.name.toLowerCase().replace(/\s+/g, "-")}`}
              type="button"
              onClick={() => handlePresetClick(preset.url)}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors text-[11px]"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              id="target-url-input"
              type="text"
              value={localInput}
              onChange={handleInputChange}
              placeholder="e.g. discord.com/channel, github.com/user/repo, or any web link"
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 font-mono transition-colors outline-none"
            />
          </div>

          <button
            id="validate-url-btn"
            type="submit"
            disabled={isValidating || !localInput.trim()}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-sky-500/10 whitespace-nowrap"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Pinging Server...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Validate &amp; Inspect</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Validation Result Feedback Card */}
      {validationResult && (
        <div
          className={`mt-4 rounded-lg p-3.5 border transition-all text-xs ${
            validationResult.valid
              ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
              : "bg-rose-950/20 border-rose-800/40 text-rose-300"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start space-x-2.5">
              {validationResult.valid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center space-x-2 font-medium flex-wrap gap-y-1">
                  <span className="font-semibold text-slate-200">
                    {validationResult.message}
                  </span>
                  {validationResult.valid && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {validationResult.status >= 200 && validationResult.status < 400
                        ? `HTTP ${validationResult.status}`
                        : "Deep Route Verified"}
                    </span>
                  )}
                  {validationResult.isDeepLink && (
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-medium border border-sky-500/30">
                      Deep Link / Subpath
                    </span>
                  )}
                  {validationResult.latencyMs > 0 && (
                    <span className="text-slate-400 text-[11px]">
                      ({validationResult.latencyMs}ms latency)
                    </span>
                  )}
                </div>

                {validationResult.valid && validationResult.title && (
                  <div className="mt-1 flex items-center space-x-2 text-slate-300">
                    <span>Page Title:</span>
                    <strong className="text-white font-medium">
                      "{validationResult.title}"
                    </strong>
                    <button
                      id="apply-title-btn"
                      type="button"
                      onClick={() => onApplyTitleToName(validationResult.title!)}
                      className="ml-2 inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300 underline font-medium"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Use as App Name</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Live badges */}
            {validationResult.valid && (
              <div className="flex items-center space-x-2 shrink-0">
                {validationResult.ssl && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SSL/HTTPS Secure</span>
                  </span>
                )}
                {validationResult.faviconUrl && (
                  <img
                    src={validationResult.faviconUrl}
                    alt="Favicon"
                    className="w-4 h-4 rounded bg-slate-800 p-0.5"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                )}
                <a
                  href={validationResult.finalUrl || localInput}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
