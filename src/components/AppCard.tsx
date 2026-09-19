import React, { useState } from "react";
import { Globe, Wrench, Settings, Clock, ExternalLink, Monitor, Smartphone, Download, Trash2, RefreshCw } from "lucide-react";
import { AppProject, DownloadNotification } from "../types";
import { getWebsiteFaviconUrl, getWebsiteFallbackIcon } from "../utils/iconHelper";
import { buildAndDownloadApp } from "../utils/clientAppBuilder";

interface AppCardProps {
  app: AppProject;
  onBuild: (app: AppProject) => void;
  onSettings: (app: AppProject) => void;
  onDelete?: (id: string) => void;
  onNotify?: (notif: Omit<DownloadNotification, "id" | "timestamp">) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onBuild, onSettings, onDelete, onNotify }) => {
  const [downloading, setDownloading] = useState<"exe" | "apk" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const websiteIcon = app.iconUrl || getWebsiteFaviconUrl(app.url) || getWebsiteFallbackIcon(app.url);

  const handleDirectDownload = async (type: "exe" | "apk") => {
    setDownloading(type);
    const formatLabel = type === "exe" ? "EXE" : "APK";
    const cleanName = app.name.trim() || "WebApp";
    const fileName = type === "exe" ? `${cleanName}.exe` : `${cleanName}.apk`;

    try {
      await buildAndDownloadApp(type, app.url, cleanName, app.iconUrl);

      if (onNotify) {
        onNotify({
          type: "completed",
          title: `Download Started: ${fileName}`,
          message: `${cleanName} (${formatLabel}) download completed.`,
          appName: cleanName,
          format: formatLabel,
        });
      }
    } catch (err: any) {
      console.error("Direct download failed:", err);
      if (onNotify) {
        onNotify({
          type: "error",
          title: "Download Failed",
          message: err?.message || "Could not generate download file.",
          appName: cleanName,
          format: formatLabel,
        });
      }
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-shadow flex flex-col justify-between space-y-4">
      <div>
        {/* Card Header: App Name & Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2.5">
            {websiteIcon ? (
              <img
                src={websiteIcon}
                alt={app.name}
                className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getWebsiteFallbackIcon(app.url);
                }}
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                <Globe className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight truncate max-w-[170px]">
                {app.name}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Ready for download</span>
            </div>
          </div>

          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Official</span>
          </span>
        </div>

        {/* URL field */}
        <div className="flex items-start space-x-1.5 text-xs text-slate-500 mb-3 break-all line-clamp-2">
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <a
            href={app.url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-sky-600 hover:underline inline-flex items-center gap-1"
          >
            <span>{app.url}</span>
            <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        </div>

        {/* Description if present */}
        {app.description && (
          <p className="text-xs text-slate-500 font-medium mb-3 line-clamp-2">
            {app.description}
          </p>
        )}

        {/* Direct Download Buttons */}
        <div className="grid grid-cols-2 gap-2 my-2">
          <button
            type="button"
            onClick={() => handleDirectDownload("exe")}
            disabled={downloading === "exe"}
            className="py-2 px-2.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Download Windows 64-bit .EXE"
          >
            {downloading === "exe" ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-sky-600" />
            )}
            <span>Windows .EXE</span>
          </button>

          <button
            type="button"
            onClick={() => handleDirectDownload("apk")}
            disabled={downloading === "apk"}
            className="py-2 px-2.5 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Download Android Signed .APK"
          >
            {downloading === "apk" ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>Android .APK</span>
          </button>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-2 border-t border-slate-100">
        {confirmDelete ? (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg p-2 animate-in fade-in duration-150">
            <span className="text-[11px] font-semibold text-rose-800">
              Delete project?
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onDelete) onDelete(app.id);
                  setConfirmDelete(false);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded cursor-pointer transition-colors shadow-2xs"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 text-[11px] font-medium rounded border border-slate-200 cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onBuild(app)}
              className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Build & Options</span>
            </button>

            <button
              onClick={() => onSettings(app)}
              className="py-2 px-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 flex items-center justify-center space-x-1 transition-colors cursor-pointer"
              title="App Settings"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="py-2 px-2.5 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs font-semibold rounded-lg border border-slate-200 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                title="Delete App"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
