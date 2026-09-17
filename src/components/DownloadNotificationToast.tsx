import React from "react";
import { DownloadNotification } from "../types";
import { CheckCircle2, RefreshCw, AlertCircle, X, Download, Monitor, Smartphone } from "lucide-react";

interface DownloadNotificationToastProps {
  notifications: DownloadNotification[];
  onDismiss: (id: string) => void;
}

export const DownloadNotificationToast: React.FC<DownloadNotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div
      id="download-notification-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {notifications.map((notif) => {
        const isProgress = notif.type === "preparing" || notif.type === "downloading";
        const isSuccess = notif.type === "completed";
        const isError = notif.type === "error";

        return (
          <div
            key={notif.id}
            id={`download-notification-${notif.id}`}
            className={`pointer-events-auto rounded-xl border p-4 shadow-xl transition-all animate-in slide-in-from-bottom-5 duration-200 ${
              isSuccess
                ? "bg-emerald-900/95 text-white border-emerald-700/60 shadow-emerald-950/20"
                : isError
                ? "bg-rose-900/95 text-white border-rose-700/60 shadow-rose-950/20"
                : "bg-slate-900/95 text-white border-slate-700/70 shadow-slate-950/30"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSuccess
                      ? "bg-emerald-500/20 text-emerald-300"
                      : isError
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-sky-500/20 text-sky-300"
                  }`}
                >
                  {isProgress && <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />}
                  {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-slate-100">{notif.title}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                        notif.format === "EXE"
                          ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {notif.format}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">{notif.timestamp}</span>
                </div>
              </div>

              <button
                onClick={() => onDismiss(notif.id)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isProgress && (
              <div className="mt-3 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <div className="bg-sky-400 h-1 rounded-full animate-pulse w-full" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
