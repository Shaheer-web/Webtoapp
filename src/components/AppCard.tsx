import React, { useState } from "react";
import { Globe, Settings, ExternalLink, Monitor, Smartphone, Download, Trash2, RefreshCw } from "lucide-react";
import { AppProject, DownloadNotification } from "../types";
import { getWebsiteFaviconUrl, getWebsiteFallbackIcon } from "../utils/iconHelper";
import { buildAndDownloadApp } from "../utils/clientAppBuilder";

interface AppCardProps {
  app: AppProject;
  onBuild: (app: AppProject) => void;
  onSettings: (app: AppProject) => void;
  onDelete?: (id: string) => void;
  onNotify?: (notif: Omit<DownloadNotification, "id" | "timestamp">) => void;
  isDark?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  onBuild,
  onSettings,
  onDelete,
  onNotify,
  isDark = false,
}) => {
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
          message: `${cleanName} (${formatLabel}) download initiated.`,
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
    <div
      className={`rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 border ${
        isDark
          ? "bg-[#18181A] border-[#272729] text-[#E5E3DF] hover:border-[#3A3A3D] shadow-xs"
          : "bg-white border-[#E9E2D6] text-[#22201E] hover:border-[#DFD6C7] shadow-xs"
      }`}
    >
      <div>
        {/* Card Header: App Name & Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3 min-w-0">
            {websiteIcon ? (
              <img
                src={websiteIcon}
                alt={app.name}
                className={`w-9 h-9 rounded-xl object-contain p-1 border shrink-0 ${
                  isDark
                    ? "bg-[#202023] border-[#2E2E32]"
                    : "bg-[#F7F4EE] border-[#E8E1D5]"
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getWebsiteFallbackIcon(app.url);
                }}
              />
            ) : (
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  isDark
                    ? "bg-[#202023] border-[#2E2E32] text-[#A5A19B]"
                    : "bg-[#F7F4EE] border-[#E8E1D5] text-[#7A746B]"
                }`}
              >
                <Globe className="w-4 h-4 text-[#E28A74]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-base tracking-tight truncate">
                {app.name}
              </h3>
              <span
                className={`text-[11px] font-medium block truncate ${
                  isDark ? "text-[#8E8B87]" : "text-[#7B756D]"
                }`}
              >
                Ready for download
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
              isDark
                ? "bg-[#331E19] text-[#E58C77]"
                : "bg-[#F3DDD5] text-[#BD583F]"
            }`}
          >
            <span>Official</span>
          </span>
        </div>

        {/* URL field */}
        <div
          className={`flex items-start space-x-1.5 text-xs mb-3 break-all line-clamp-2 ${
            isDark ? "text-[#9E9B96]" : "text-[#6B655D]"
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-[#E28A74] shrink-0 mt-0.5" />
          <a
            href={app.url}
            target="_blank"
            rel="noreferrer"
            className="hover:underline hover:text-[#E28A74] inline-flex items-center gap-1 transition-colors"
          >
            <span>{app.url}</span>
            <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        </div>

        {/* Description if present */}
        {app.description && (
          <p
            className={`text-xs font-medium mb-3 line-clamp-2 ${
              isDark ? "text-[#8E8B87]" : "text-[#7B756D]"
            }`}
          >
            {app.description}
          </p>
        )}

        {/* Direct Download Buttons */}
        <div className="grid grid-cols-2 gap-2 my-2">
          <button
            type="button"
            onClick={() => handleDirectDownload("exe")}
            disabled={downloading === "exe"}
            className={`py-2 px-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 ${
              isDark
                ? "bg-[#202023] hover:bg-[#28282C] text-[#E5E3DF] border-[#2C2C30]"
                : "bg-[#F9F6F0] hover:bg-white text-[#2D2A27] border-[#E8E1D5]"
            }`}
            title="Download Windows 64-bit .EXE"
          >
            {downloading === "exe" ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E28A74]" />
            ) : (
              <Monitor className="w-3.5 h-3.5 text-[#E28A74]" />
            )}
            <span>Windows .EXE</span>
          </button>

          <button
            type="button"
            onClick={() => handleDirectDownload("apk")}
            disabled={downloading === "apk"}
            className={`py-2 px-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 ${
              isDark
                ? "bg-[#202023] hover:bg-[#28282C] text-[#E5E3DF] border-[#2C2C30]"
                : "bg-[#F9F6F0] hover:bg-white text-[#2D2A27] border-[#E8E1D5]"
            }`}
            title="Download Android Signed .APK"
          >
            {downloading === "apk" ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E28A74]" />
            ) : (
              <Smartphone className="w-3.5 h-3.5 text-[#E28A74]" />
            )}
            <span>Android .APK</span>
          </button>
        </div>
      </div>

      {/* Card Action Footer */}
      <div
        className={`pt-2.5 border-t ${
          isDark ? "border-[#252528]" : "border-[#EDE6D9]"
        }`}
      >
        {confirmDelete ? (
          <div
            className={`flex items-center justify-between rounded-xl p-2 animate-in fade-in duration-150 border ${
              isDark
                ? "bg-[#331E19]/60 border-[#4D241C]"
                : "bg-[#FDECE7] border-[#F2C5BA]"
            }`}
          >
            <span
              className={`text-[11px] font-semibold ${
                isDark ? "text-[#F0A493]" : "text-[#B94B32]"
              }`}
            >
              Delete project?
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => {
                  if (onDelete) onDelete(app.id);
                  setConfirmDelete(false);
                }}
                className="px-2.5 py-1 bg-[#E28A74] hover:bg-[#D47963] text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className={`px-2 py-1 text-[11px] font-medium rounded-lg border cursor-pointer transition-colors ${
                  isDark
                    ? "bg-[#1E1E20] text-[#A5A19B] border-[#2E2E32] hover:bg-[#252528]"
                    : "bg-white text-[#6B655D] border-[#E0D8CB] hover:bg-stone-50"
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onBuild(app)}
              className="flex-1 py-2 px-3 bg-[#E28A74] hover:bg-[#D47963] active:bg-[#C26B56] text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .EXE / .APK</span>
            </button>

            <button
              onClick={() => onSettings(app)}
              className={`py-2 px-2.5 rounded-xl border flex items-center justify-center space-x-1 transition-colors cursor-pointer ${
                isDark
                  ? "bg-[#202023] hover:bg-[#28282C] text-[#C4C0BA] border-[#2C2C30]"
                  : "bg-white hover:bg-stone-50 text-[#6B655D] border-[#E5DFD4]"
              }`}
              title="App Settings"
            >
              <Settings className="w-3.5 h-3.5 text-[#E28A74]" />
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className={`py-2 px-2.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  isDark
                    ? "bg-[#202023] hover:bg-[#331E19] text-[#938F8A] hover:text-[#E28A74] border-[#2C2C30]"
                    : "bg-white hover:bg-[#FDECE7] text-[#9E978F] hover:text-[#C2583F] border-[#E5DFD4]"
                }`}
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
