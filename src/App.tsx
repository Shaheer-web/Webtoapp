import React, { useState, useEffect } from "react";
import { Plus, Sparkles, Layers, History, CheckCircle2, Monitor, Smartphone, Download, ExternalLink } from "lucide-react";
import { AppProject, DashboardView, DownloadNotification, ECHO_LOGO_URL } from "./types";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { AppCard } from "./components/AppCard";
import { QuickAppModal } from "./components/QuickAppModal";
import { BuildDownloadModal } from "./components/BuildDownloadModal";
import { EditAppModal } from "./components/EditAppModal";
import { DownloadNotificationToast } from "./components/DownloadNotificationToast";

// Initial apps: strictly empty by default (no pre-added apps)
const INITIAL_APPS: AppProject[] = [];

export default function App() {
  const [currentView, setCurrentView] = useState<DashboardView>("apps");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<DownloadNotification[]>([]);

  const addNotification = (notif: Omit<DownloadNotification, "id" | "timestamp">) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newNotif: DownloadNotification = {
      ...notif,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 3)]);

    // Auto-dismiss completed after 6 seconds
    if (notif.type === "completed" || notif.type === "error") {
      setTimeout(() => {
        dismissNotification(id);
      }, 6000);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // App project storage with localStorage persistence (clearing any legacy sample apps)
  const [apps, setApps] = useState<AppProject[]>(() => {
    try {
      const saved = localStorage.getItem("websktop_apps");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (a) => a.id !== "app-discord" && a.id !== "app-mcmods"
          );
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_APPS;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("websktop_apps", JSON.stringify(apps));
    } catch {
      // Ignore
    }
  }, [apps]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [buildTargetApp, setBuildTargetApp] = useState<AppProject | null>(null);
  const [editTargetApp, setEditTargetApp] = useState<AppProject | null>(null);

  // Inline Quick Convert state for empty view (like webtoapp)
  const [quickUrl, setQuickUrl] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickIconUrl, setQuickIconUrl] = useState("");
  const [quickValidating, setQuickValidating] = useState(false);

  // Probe URL to auto-fill title and icon
  const handleQuickUrlBlur = async () => {
    const trimmed = quickUrl.trim();
    if (!trimmed) return;

    let formatted = trimmed;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = "https://" + formatted;
      setQuickUrl(formatted);
    }

    setQuickValidating(true);
    try {
      const res = await fetch("/api/validate-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formatted }),
      });
      const data = await res.json();
      if (data.valid) {
        if (data.title && !quickName) {
          setQuickName(data.title.slice(0, 24));
        }
        if (data.faviconUrl && !quickIconUrl) {
          setQuickIconUrl(data.faviconUrl);
        }
      }
    } catch {
      // Best effort
    } finally {
      setQuickValidating(false);
    }
  };

  const handleQuickConvert = (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = quickUrl.trim();
    if (!rawUrl) return;

    let validUrl = rawUrl;
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl;
    }

    let finalName = quickName.trim();
    if (!finalName) {
      try {
        finalName = new URL(validUrl).hostname;
      } catch {
        finalName = "Web App";
      }
    }

    const newApp: AppProject = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: finalName,
      url: validUrl,
      iconUrl: quickIconUrl.trim() || ECHO_LOGO_URL,
      description: "Official converted application",
      status: "completed",
      buildCount: 1,
      lastBuilt: "Just now",
      createdAt: new Date().toLocaleDateString(),
    };

    setApps((prev) => [newApp, ...prev]);
    setBuildTargetApp(newApp);

    addNotification({
      type: "completed",
      title: "App Created!",
      message: `${finalName} has been configured. Choose Windows (.EXE) or Android (.APK) to download.`,
      appName: finalName,
      format: "EXE",
    });

    // Reset inline inputs
    setQuickUrl("");
    setQuickName("");
    setQuickIconUrl("");
  };

  // Handlers
  const handleCreateApp = (newApp: AppProject) => {
    setApps((prev) => [newApp, ...prev]);
    // Automatically open build modal for immediate download!
    setBuildTargetApp(newApp);

    addNotification({
      type: "completed",
      title: "App Created!",
      message: `${newApp.name} is ready. Select your format to download.`,
      appName: newApp.name,
      format: "EXE",
    });
  };

  const handleUpdateApp = (updated: AppProject) => {
    setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleDeleteApp = (id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
  };

  const handleBuildSuccess = (appId: string) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? {
              ...a,
              buildCount: a.buildCount + 1,
              lastBuilt: "Just now",
              status: "completed",
            }
          : a
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        appsCount={apps.length}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {/* Main Content Area (offset by sidebar on large screens) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <TopNav
          currentView={currentView}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* View 1: My Apps (Matches screenshot) */}
        {currentView === "apps" && (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  My Apps
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {apps.length} {apps.length === 1 ? "app" : "apps"} — unlimited builds, no restrictions.
                </p>
              </div>

              {/* Quick App Creation Button (Matches screenshot) */}
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Quick App Creation</span>
              </button>
            </div>

            {/* Apps Grid */}
            {apps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {apps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onBuild={(target) => setBuildTargetApp(target)}
                    onSettings={(target) => setEditTargetApp(target)}
                    onDelete={(id) => handleDeleteApp(id)}
                    onNotify={addNotification}
                  />
                ))}
              </div>
            ) : (
              /* Instant Echo Web-to-App Converter Card */
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden max-w-2xl mx-auto my-4">
                <div className="p-6 sm:p-8 bg-gradient-to-b from-sky-50/50 to-white border-b border-slate-100 text-center">
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-900 text-xs font-semibold mb-3 border border-sky-200 shadow-xs">
                    <img
                      src={ECHO_LOGO_URL}
                      alt="Echo Converter"
                      className="w-4 h-4 rounded-md object-contain bg-white"
                    />
                    <span>Echo Converter — URL to EXE, APK &amp; Web to App</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    Convert Any Website URL into Windows (.EXE) &amp; Android (.APK)
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-2">
                    The ultimate URL to App, URL to EXE, and URL to APK converter. Turn web links into native desktop executables and signed Android apps.
                  </p>
                </div>

                <form onSubmit={handleQuickConvert} className="p-6 sm:p-8 space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Website URL <span className="text-sky-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={quickUrl}
                        onChange={(e) => setQuickUrl(e.target.value)}
                        onBlur={handleQuickUrlBlur}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      />
                      {quickValidating && (
                        <div className="absolute right-3.5 top-3.5 text-xs text-sky-600 flex items-center space-x-1 font-medium">
                          <span>Checking...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      App Name
                    </label>
                    <input
                      type="text"
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      placeholder="My Web App"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        App Icon
                      </label>
                      <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {quickIconUrl ? "Custom Favicon Found" : "Echo Pre-Logo (Default)"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <img
                        src={quickIconUrl || ECHO_LOGO_URL}
                        alt="Echo Pre-Logo"
                        className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = ECHO_LOGO_URL;
                        }}
                      />
                      <input
                        type="text"
                        value={quickIconUrl}
                        onChange={(e) => setQuickIconUrl(e.target.value)}
                        placeholder="Icon URL (optional - auto-defaults to Echo pre-logo)"
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Convert URL &amp; Download Official .EXE / .APK</span>
                  </button>

                  <div className="pt-2 flex items-center justify-center space-x-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Direct .EXE Executable</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Signed .APK Package</span>
                    </span>
                    <span>•</span>
                    <span>No ZIP Archives</span>
                  </div>
                </form>
              </div>
            )}
          </main>
        )}

        {/* View 2: View Builds History */}
        {currentView === "builds" && (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Build History</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                All generated packages with direct re-download links.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {apps.map((app) => (
                  <div key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {app.iconUrl ? (
                        <img src={app.iconUrl} alt={app.name} className="w-10 h-10 rounded-xl object-contain bg-slate-50 border p-1" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
                          {app.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{app.name}</span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                            Build #{app.buildCount}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 truncate block max-w-xs sm:max-w-md">{app.url}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end sm:self-auto">
                      <button
                        onClick={() => setBuildTargetApp(app)}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-1.5 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Packages</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* View 3: Account & Engine Settings */}
        {currentView === "settings" && (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Account &amp; Engine</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Websktop architecture and free tier settings.
              </p>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Plan</span>
                  <span className="font-bold text-base text-slate-900">Websktop Unlimited Tier</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Active (Free Forever)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900">
                    <Monitor className="w-4 h-4 text-sky-600" />
                    <span>Windows Executable Engine</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Standalone borderless app launcher using Microsoft Edge &amp; Chrome engines. Runs on 100% of Windows PCs.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Android APK Engine</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Google Trusted Web Activity (TWA) framework. Full-screen mobile app with native push &amp; offline cache.
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Mobile floating "+ Quick App" button for easy mobile thumb access */}
        <div className="fixed bottom-5 right-5 lg:hidden z-20">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-13 h-13 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-lg shadow-sky-600/30 active:scale-95 transition-transform"
            aria-label="Create App"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Modal 1: Quick App Creation */}
      <QuickAppModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateApp={handleCreateApp}
      />

      {/* Modal 2: Build & Download Package */}
      <BuildDownloadModal
        app={buildTargetApp}
        isOpen={Boolean(buildTargetApp)}
        onClose={() => setBuildTargetApp(null)}
        onBuildSuccess={handleBuildSuccess}
        onNotify={addNotification}
      />

      {/* Modal 3: Settings & Edit App */}
      <EditAppModal
        app={editTargetApp}
        isOpen={Boolean(editTargetApp)}
        onClose={() => setEditTargetApp(null)}
        onSave={handleUpdateApp}
        onDelete={handleDeleteApp}
      />

      {/* Global Download Notifications Toast */}
      <DownloadNotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
