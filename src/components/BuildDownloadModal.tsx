import React, { useState } from "react";
import {
  X,
  Monitor,
  Smartphone,
  Download,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Globe
} from "lucide-react";
import { AppProject, DownloadNotification, ECHO_LOGO_URL } from "../types";
import { downloadFileBlob, triggerDirectDownload } from "../utils/downloadHelper";

interface BuildDownloadModalProps {
  app: AppProject | null;
  isOpen: boolean;
  onClose: () => void;
  onBuildSuccess: (appId: string) => void;
  onNotify?: (notif: Omit<DownloadNotification, "id" | "timestamp">) => void;
}

export const BuildDownloadModal: React.FC<BuildDownloadModalProps> = ({
  app,
  isOpen,
  onClose,
  onBuildSuccess,
  onNotify,
}) => {
  const [downloading, setDownloading] = useState<"exe" | "apk" | null>(null);

  if (!isOpen || !app) return null;

  const handleDownload = async (type: "exe" | "apk") => {
    setDownloading(type);
    const formatLabel = type === "exe" ? "EXE" : "APK";
    const cleanName = app.name.trim() || "WebApp";

    // Notify user that compiling/download has started
    if (onNotify) {
      onNotify({
        type: "preparing",
        title: `Generating ${formatLabel}...`,
        message: `Compiling ${cleanName} into direct ${formatLabel} package. Download will start automatically.`,
        appName: cleanName,
        format: formatLabel,
      });
    }

    try {
      const endpoint = type === "exe" ? "/api/generate-exe" : "/api/generate-apk";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: app.url,
          appName: cleanName,
          packageId: `com.${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "")}.app`,
          iconUrl: app.iconUrl,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Download generation failed");
      }

      const blob = await res.blob();
      const fileName = type === "exe" ? `${cleanName}.exe` : `${cleanName}.apk`;
      downloadFileBlob(blob, fileName);

      onBuildSuccess(app.id);

      // Notify download complete
      if (onNotify) {
        onNotify({
          type: "completed",
          title: `Downloaded ${fileName}`,
          message: `${cleanName} (${formatLabel}) was compiled and downloaded directly to your device!`,
          appName: cleanName,
          format: formatLabel,
        });
      }
    } catch (err: any) {
      console.warn("Primary download encountered issue, invoking direct fallback link:", err);
      // Fallback: direct GET route that forces browser-level attachment download
      try {
        const fallbackUrl = `/api/download-app?type=${type}&url=${encodeURIComponent(app.url)}&appName=${encodeURIComponent(cleanName)}&iconUrl=${encodeURIComponent(app.iconUrl || "")}`;
        const fileName = type === "exe" ? `${cleanName}.exe` : `${cleanName}.apk`;
        triggerDirectDownload(fallbackUrl, fileName);

        onBuildSuccess(app.id);

        if (onNotify) {
          onNotify({
            type: "completed",
            title: `Download Started`,
            message: `${cleanName} (${formatLabel}) download triggered directly. Please check your browser downloads folder!`,
            appName: cleanName,
            format: formatLabel,
          });
        }
      } catch (fallbackErr: any) {
        if (onNotify) {
          onNotify({
            type: "error",
            title: "Download Issue",
            message: err.message || "Failed to download app binary. Please use the direct link below.",
            appName: cleanName,
            format: formatLabel,
          });
        }
      }
    } finally {
      setDownloading(null);
    }
  };

  const directExeUrl = `/api/download-app?type=exe&url=${encodeURIComponent(app.url)}&appName=${encodeURIComponent(app.name || "WebApp")}&iconUrl=${encodeURIComponent(app.iconUrl || "")}`;
  const directApkUrl = `/api/download-app?type=apk&url=${encodeURIComponent(app.url)}&appName=${encodeURIComponent(app.name || "WebApp")}&iconUrl=${encodeURIComponent(app.iconUrl || "")}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <img
              src={app.iconUrl || ECHO_LOGO_URL}
              alt={app.name}
              className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = ECHO_LOGO_URL;
              }}
            />
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Build & Download: {app.name}
              </h3>
              <span className="text-[11px] text-slate-500 truncate max-w-[220px] block">
                {app.url}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status banner */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">100% Official Binaries (No ZIP Files)</span>
              <span className="text-emerald-700">Compiled on-demand. Click below to download directly:</span>
            </div>
          </div>

          {/* Action 1: Windows .EXE */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-1.5 font-bold text-sm text-slate-900">
                  <Monitor className="w-4 h-4 text-sky-600" />
                  <span>Windows 64-bit Application</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct .EXE binary. Double click to run standalone on any Windows PC.
                </p>
              </div>
              <span className="text-[11px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                .EXE
              </span>
            </div>

            <button
              onClick={() => handleDownload("exe")}
              disabled={downloading === "exe"}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-xs cursor-pointer disabled:opacity-75"
            >
              {downloading === "exe" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Windows .EXE...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Windows .EXE</span>
                </>
              )}
            </button>
            <div className="text-center">
              <a
                href={directExeUrl}
                download={`${app.name || "WebApp"}.exe`}
                className="text-[11px] text-slate-400 hover:text-sky-600 transition-colors inline-block"
              >
                Direct browser download link (if popup blocked)
              </a>
            </div>
          </div>

          {/* Action 2: Android .APK */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-1.5 font-bold text-sm text-slate-900">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Android Signed Package</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official signed .APK. Direct install on any Android phone or tablet.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                .APK
              </span>
            </div>

            <button
              onClick={() => handleDownload("apk")}
              disabled={downloading === "apk"}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-xs cursor-pointer disabled:opacity-75"
            >
              {downloading === "apk" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Signed .APK...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Android .APK</span>
                </>
              )}
            </button>
            <div className="text-center">
              <a
                href={directApkUrl}
                download={`${app.name || "WebApp"}.apk`}
                className="text-[11px] text-slate-400 hover:text-emerald-600 transition-colors inline-block"
              >
                Direct browser download link (if popup blocked)
              </a>
            </div>
          </div>

          {/* Live Preview Link */}
          <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-sky-600 inline-flex items-center gap-1 font-medium"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Preview website</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <span className="text-slate-400">100% Free & Unlimited</span>
          </div>
        </div>
      </div>
    </div>
  );
};
