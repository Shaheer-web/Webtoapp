import React, { useState } from "react";
import {
  X,
  Monitor,
  Smartphone,
  Download,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Globe,
  Copy,
  Check,
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
  isDark?: boolean;
}

export const BuildDownloadModal: React.FC<BuildDownloadModalProps> = ({
  app,
  isOpen,
  onClose,
  onBuildSuccess,
  onNotify,
  isDark = false,
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
          message: `Direct ${type.toUpperCase()} download link copied to clipboard.`,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl max-w-md w-full border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? "bg-[#141416] border-[#2A2A2E] text-[#E5E3DF]"
            : "bg-[#FFFFFF] border-[#E8E1D5] text-[#22201E]"
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark
              ? "bg-[#1A1A1D] border-[#262629]"
              : "bg-[#F7F4EE] border-[#EAE3D6]"
          }`}
        >
          <div className="flex items-center space-x-3">
            {websiteIcon ? (
              <img
                src={websiteIcon}
                alt={app.name}
                className={`w-9 h-9 rounded-xl object-contain p-1 border shrink-0 ${
                  isDark ? "bg-[#252528] border-[#333336]" : "bg-white border-[#E8E1D5]"
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getWebsiteFallbackIcon(app.url);
                }}
              />
            ) : (
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  isDark ? "bg-[#252528] border-[#333336] text-[#A5A19B]" : "bg-white border-[#E8E1D5] text-[#7A746B]"
                }`}
              >
                <Globe className="w-4 h-4 text-[#E28A74]" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base leading-tight">
                Download: {app.name}
              </h3>
              <span className={`text-[11px] truncate max-w-[220px] block ${isDark ? "text-[#938F8A]" : "text-[#7B756D]"}`}>
                {app.url}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              isDark ? "text-[#938F8A] hover:text-white hover:bg-[#252528]" : "text-[#7B756D] hover:text-black hover:bg-[#EAE3D6]"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Status banner */}
          <div
            className={`border rounded-xl p-3 flex items-center space-x-2.5 text-xs ${
              isDark
                ? "bg-[#1D2B22] border-[#2C4A36] text-[#86EFAC]"
                : "bg-[#EEF7F2] border-[#C8E8D5] text-[#1B663E]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
            <div>
              <span className="font-bold block">100% Official Binaries (No ZIP Files)</span>
              <span className="opacity-90">Compiled natively. Instant direct downloads:</span>
            </div>
          </div>

          {/* Action 1: Windows .EXE */}
          <div
            className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 ${
              isDark
                ? "bg-[#1A1A1D] border-[#28282C]"
                : "bg-[#FAF7F2] border-[#EAE3D6]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-1.5 font-bold text-sm">
                  <Monitor className="w-4 h-4 text-[#E28A74]" />
                  <span>Windows Standalone Executable</span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? "text-[#938F8A]" : "text-[#7B756D]"}`}>
                  Direct .EXE binary with embedded custom icon. Runs in standalone window without browser tabs.
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDark
                    ? "bg-[#331E19] text-[#E58C77]"
                    : "bg-[#F3DDD5] text-[#BD583F]"
                }`}
              >
                .EXE
              </span>
            </div>

            <button
              onClick={() => handleDownload("exe")}
              disabled={downloading === "exe"}
              className="w-full py-2.5 px-4 bg-[#E28A74] hover:bg-[#D47963] active:bg-[#C26B56] text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer disabled:opacity-75"
            >
              {downloading === "exe" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Building Windows .EXE...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Download Windows .EXE</span>
                </>
              )}
            </button>

            <div
              className={`flex items-center justify-between text-[11px] pt-1 border-t px-1 ${
                isDark ? "border-[#28282C]" : "border-[#EAE3D6]"
              }`}
            >
              <button
                type="button"
                onClick={() => handleDownload("exe")}
                className="text-[#E28A74] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Instant direct file download</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink("exe")}
                className={`inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  isDark ? "text-[#938F8A] hover:text-white" : "text-[#7B756D] hover:text-black"
                }`}
              >
                {copiedFormat === "exe" ? (
                  <>
                    <Check className="w-3 h-3 text-[#22C55E]" />
                    <span className="text-[#22C55E] font-medium">Copied link</span>
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
          <div
            className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 ${
              isDark
                ? "bg-[#1A1A1D] border-[#28282C]"
                : "bg-[#FAF7F2] border-[#EAE3D6]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-1.5 font-bold text-sm">
                  <Smartphone className="w-4 h-4 text-[#E28A74]" />
                  <span>Android Signed Package</span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? "text-[#938F8A]" : "text-[#7B756D]"}`}>
                  Signed .APK package ready for direct installation on Android devices.
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isDark
                    ? "bg-[#331E19] text-[#E58C77]"
                    : "bg-[#F3DDD5] text-[#BD583F]"
                }`}
              >
                .APK
              </span>
            </div>

            <button
              onClick={() => handleDownload("apk")}
              disabled={downloading === "apk"}
              className="w-full py-2.5 px-4 bg-[#E28A74] hover:bg-[#D47963] active:bg-[#C26B56] text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer disabled:opacity-75"
            >
              {downloading === "apk" ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Building Signed .APK...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Download Android .APK</span>
                </>
              )}
            </button>

            <div
              className={`flex items-center justify-between text-[11px] pt-1 border-t px-1 ${
                isDark ? "border-[#28282C]" : "border-[#EAE3D6]"
              }`}
            >
              <button
                type="button"
                onClick={() => handleDownload("apk")}
                className="text-[#E28A74] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Instant direct file download</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyLink("apk")}
                className={`inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  isDark ? "text-[#938F8A] hover:text-white" : "text-[#7B756D] hover:text-black"
                }`}
              >
                {copiedFormat === "apk" ? (
                  <>
                    <Check className="w-3 h-3 text-[#22C55E]" />
                    <span className="text-[#22C55E] font-medium">Copied link</span>
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
          <div
            className={`pt-1 flex items-center justify-between text-xs ${
              isDark ? "text-[#938F8A]" : "text-[#7B756D]"
            }`}
          >
            <a
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[#E28A74] hover:underline inline-flex items-center gap-1 font-medium transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Preview website</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <span>100% Free &amp; Unlimited</span>
          </div>
        </div>
      </div>
    </div>
  );
};
