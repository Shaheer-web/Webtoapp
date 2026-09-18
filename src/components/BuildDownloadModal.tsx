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
  Globe,
  Copy,
  Check,
  Loader2
} from "lucide-react";
import { AppProject, DownloadNotification } from "../types";
import { copyToClipboard } from "../utils/downloadHelper";
import { getWebsiteFaviconUrl, getWebsiteFallbackIcon } from "../utils/iconHelper";
import { buildAndDownloadApp } from "../utils/clientAppBuilder";

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
  const [copiedFormat, setCopiedFormat] = useState<"exe" | "apk" | null>(null);

  if (!isOpen || !app) return null;

  const cleanName = app.name.trim() || "WebApp";
  const directExeUrl = `/api/download-app?type=exe&url=${encodeURIComponent(app.url)}&appName=${encodeURIComponent(cleanName)}&iconUrl=${encodeURIComponent(app.iconUrl || "")}`;
  const directApkUrl = `/api/download-app?type=apk&url=${encodeURIComponent(app.url)}&appName=${encodeURIComponent(cleanName)}&iconUrl=${encodeURIComponent(app.iconUrl || "")}`;

  const handleCopyLink = async (type: "exe" | "apk") => {
    const relUrl = type === "exe" ? directExeUrl : directApkUrl;
    const fullUrl = `${window.location.origin}${relUrl}`;
    const success = await copyToClipboard(fullUrl);
    if (success) {
      setCopiedFormat(type);
      setTimeout(() => setCopiedFormat(null), 2500);
      if (onNotify) {
        onNotify({
          type: "completed",
          title: "Link Copied!",
          message: `Direct ${type.toUpperCase()} download link copied to clipboard. You can paste it into any browser or send it to your phone.`,
          appName: cleanName,
          format: type.toUpperCase() as "EXE" | "APK",
        });
      }
    }
  };

  const websiteIcon = app.iconUrl || getWebsiteFaviconUrl(app.url) || getWebsiteFallbackIcon(app.url);

  const handleDownload = async (type: "exe" | "apk") => {
    setDownloading(type);
    const formatLabel = type === "exe" ? "EXE" : "APK";
    const fileName = type === "exe" ? `${cleanName}.exe` : `${cleanName}.apk`;

    try {
      await buildAndDownloadApp(type, app.url, cleanName, app.iconUrl);
      onBuildSuccess(app.id);

      if (onNotify) {
        onNotify({
          type: "completed",
          title: `Download Started: ${fileName}`,
          message: `${cleanName} (${formatLabel}) binary generated and download started.`,
          appName: cleanName,
          format: formatLabel,
        });
      }
    } catch (err: any) {
      console.error("Download failed:", err);
      if (onNotify) {
        onNotify({
          type: "error",
          title: "Download Failed",
          message: err?.message || "Could not generate download file. Please try again.",
          appName: cleanName,
          format: formatLabel,
        });
      }
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            {websiteIcon ? (
              <img
                src={websiteIcon}
                alt={app.name}
                className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getWebsiteFallbackIcon(app.url);
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                <Globe className="w-4 h-4" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">
                Download: {app.name}
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

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 px-1">
              <button
                type="button"
                onClick={() => handleDownload("exe")}
                className="text-sky-600 hover:text-sky-800 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Instant direct file download</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink("exe")}
                className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedFormat === "exe" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied link</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy link</span>
                  </>
                )}
              </button>
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

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 px-1">
              <button
                type="button"
                onClick={() => handleDownload("apk")}
                className="text-emerald-600 hover:text-emerald-800 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Instant direct file download</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink("apk")}
                className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedFormat === "apk" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600 font-medium">Copied link</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy link</span>
                  </>
                )}
              </button>
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
