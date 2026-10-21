import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Monitor,
  Smartphone,
  Download,
  Loader2,
  Check,
  RefreshCw,
  Globe,
  Upload,
  ImageIcon,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { AppProject, DashboardView, DownloadNotification, ThemeMode } from "./types";
import { Sidebar } from "./components/Sidebar";
import { TopNav } from "./components/TopNav";
import { AppCard } from "./components/AppCard";
import { QuickAppModal } from "./components/QuickAppModal";
import { BuildDownloadModal } from "./components/BuildDownloadModal";
import { EditAppModal } from "./components/EditAppModal";
import { DownloadNotificationToast } from "./components/DownloadNotificationToast";
import { SapphireLogo } from "./components/SapphireLogo";
import { detectWebsiteBrand, getWebsiteFaviconUrl, getWebsiteFallbackIcon } from "./utils/iconHelper";
import { processImageFile, validateImageFile } from "./utils/imageUploadHelper";

const INITIAL_APPS: AppProject[] = [];

export default function App() {
  const [currentView, setCurrentView] = useState<DashboardView>("apps");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<DownloadNotification[]>([]);

  // Theme state: defaults to light (Warm Sand/Cream), toggleable to dark (Obsidian Onyx)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem("sapphire_theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    return "light";
  });

  const isDark = theme === "dark";

  useEffect(() => {
    try {
      localStorage.setItem("sapphire_theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const addNotification = (notif: Omit<DownloadNotification, "id" | "timestamp">) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newNotif: DownloadNotification = {
      ...notif,
      id,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };

    setNotifications((prev) => [newNotif, ...prev.slice(0, 3)]);

    if (notif.type === "completed" || notif.type === "error") {
      setTimeout(() => {
        dismissNotification(id);
      }, 6000);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // App project storage with localStorage persistence
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
    } catch {}
    return INITIAL_APPS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("websktop_apps", JSON.stringify(apps));
    } catch {}
  }, [apps]);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [buildTargetApp, setBuildTargetApp] = useState<AppProject | null>(null);
  const [editTargetApp, setEditTargetApp] = useState<AppProject | null>(null);

  // Inline Quick Convert state
  const [quickUrl, setQuickUrl] = useState("");
  const [quickName, setQuickName] = useState("");
  const [quickIconUrl, setQuickIconUrl] = useState("");
  const [quickValidating, setQuickValidating] = useState(false);
  const [quickDetected, setQuickDetected] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [isHeroDragging, setIsHeroDragging] = useState(false);
  const [isHeroProcessingIcon, setIsHeroProcessingIcon] = useState(false);

  const quickDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const quickAbortRef = useRef<AbortController | null>(null);
  const userEditedQuickNameRef = useRef(false);
  const userEditedQuickIconRef = useRef(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const handleHeroProcessFile = async (file: File) => {
    setHeroUploadError(null);
    const check = validateImageFile(file);
    if (!check.valid) {
      setHeroUploadError(check.error || "Please select a valid image file.");
      return;
    }

    setIsHeroProcessingIcon(true);
    userEditedQuickIconRef.current = true;
    try {
      const processedUrl = await processImageFile(file);
      setQuickIconUrl(processedUrl);
      setHeroUploadError(null);
    } catch (err: any) {
      console.error("Hero icon error:", err);
      setHeroUploadError(err?.message || "Failed to process image. Try another image.");
    } finally {
      setIsHeroProcessingIcon(false);
    }
  };

  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleHeroProcessFile(file);
      e.target.value = "";
    }
  };

  const handleHeroDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHeroDragging(true);
  };

  const handleHeroDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHeroDragging(false);
  };

  const handleHeroDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHeroDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleHeroProcessFile(file);
    }
  };

  const detectQuickMetadata = async (inputUrl: string, force = false) => {
    const trimmed = inputUrl.trim();
    if (!trimmed || trimmed.length < 3) return;

    if (!force && !trimmed.includes(".") && !trimmed.startsWith("http")) {
      return;
    }

    let formatted = trimmed;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = "https://" + formatted.replace(/^\/\//, "");
    }

    const brand = detectWebsiteBrand(formatted);
    if (brand && (!userEditedQuickNameRef.current || !quickName.trim())) {
      setQuickName(brand.name);
      setQuickDetected(true);
    }

    if (!userEditedQuickIconRef.current) {
      const autoIcon = getWebsiteFaviconUrl(formatted) || getWebsiteFallbackIcon(formatted);
      setQuickIconUrl(autoIcon);
    }

    if (quickAbortRef.current) {
      quickAbortRef.current.abort();
    }
    quickAbortRef.current = new AbortController();

    setQuickValidating(true);
    try {
      const res = await fetch("/api/validate-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formatted }),
        signal: quickAbortRef.current.signal,
      });

      if (!res.ok) return;
      const data = await res.json();

      if (data.valid) {
        const detectedTitle = data.appName || data.title;
        if (detectedTitle && (!userEditedQuickNameRef.current || !quickName.trim())) {
          setQuickName(detectedTitle);
        }

        const detectedFavicon = data.faviconUrl || data.googleFaviconUrl;
        if (detectedFavicon && !userEditedQuickIconRef.current) {
          setQuickIconUrl(detectedFavicon);
        }

        setQuickDetected(true);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("Hero auto-detect note:", err);
      }
    } finally {
      setQuickValidating(false);
    }
  };

  const handleQuickUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuickUrl(val);

    if (quickDebounceRef.current) {
      clearTimeout(quickDebounceRef.current);
    }

    const trimmed = val.trim();
    if (!trimmed) {
      setQuickDetected(false);
      return;
    }

    quickDebounceRef.current = setTimeout(() => {
      detectQuickMetadata(trimmed, false);
    }, 600);
  };

  const handleQuickUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (pasted && (pasted.includes(".") || pasted.startsWith("http"))) {
      let formatted = pasted;
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = "https://" + formatted.replace(/^\/\//, "");
      }

      if (!userEditedQuickIconRef.current) {
        const autoIcon = getWebsiteFaviconUrl(formatted) || getWebsiteFallbackIcon(formatted);
        setQuickIconUrl(autoIcon);
      }

      const brand = detectWebsiteBrand(formatted);
      if (brand && (!userEditedQuickNameRef.current || !quickName.trim())) {
        setQuickName(brand.name);
        setQuickDetected(true);
      }

      if (quickDebounceRef.current) {
        clearTimeout(quickDebounceRef.current);
      }
      setTimeout(() => {
        detectQuickMetadata(pasted, true);
      }, 50);
    }
  };

  const handleQuickUrlBlur = () => {
    if (quickUrl.trim()) {
      detectQuickMetadata(quickUrl, true);
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
        const brand = detectWebsiteBrand(validUrl);
        if (brand) {
          finalName = brand.name;
        } else {
          finalName = new URL(validUrl).hostname;
        }
      } catch {
        finalName = "Web App";
      }
    }

    const autoDetectedIcon = getWebsiteFaviconUrl(validUrl) || getWebsiteFallbackIcon(validUrl);

    const newApp: AppProject = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: finalName,
      url: validUrl,
      iconUrl: quickIconUrl.trim() || autoDetectedIcon,
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

    setQuickUrl("");
    setQuickName("");
    setQuickIconUrl("");
    userEditedQuickNameRef.current = false;
    userEditedQuickIconRef.current = false;
  };

  const handleCreateApp = (newApp: AppProject) => {
    setApps((prev) => {
      const next = [newApp, ...prev];
      try {
        localStorage.setItem("websktop_apps", JSON.stringify(next));
      } catch {}
      return next;
    });
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
    setApps((prev) => {
      const next = prev.map((a) => (a.id === updated.id ? updated : a));
      try {
        localStorage.setItem("websktop_apps", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDeleteApp = (id: string) => {
    const target = apps.find((a) => a.id === id);
    setApps((prev) => {
      const next = prev.filter((a) => a.id !== id);
      try {
        localStorage.setItem("websktop_apps", JSON.stringify(next));
      } catch {}
      return next;
    });
    if (target) {
      addNotification({
        type: "completed",
        title: "Project Deleted",
        message: `"${target.name}" was permanently removed from your local projects.`,
        appName: target.name,
        format: "EXE",
      });
    }
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
    <div
      className={`min-h-screen flex font-sans antialiased transition-colors ${
        isDark ? "bg-[#0E0E0F] text-[#E5E3DF]" : "bg-[#FFFFFF] text-[#1F1E1D]"
      }`}
    >
      {/* Sidebar Navigation matching user's original layout + new theme & customize */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        appsCount={apps.length}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenCreate={() => setIsCreateOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <TopNav
          currentView={currentView}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* View 1: My Apps */}
        {currentView === "apps" && (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  My Apps
                </h2>
                <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-[#938F8A]" : "text-[#7B756D]"}`}>
                  {apps.length} {apps.length === 1 ? "app" : "apps"} — unlimited builds, no restrictions.
                </p>
              </div>

              {/* Quick App Creation Button */}
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#E28A74] hover:bg-[#D47963] active:bg-[#C26B56] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Quick App Creation</span>
              </button>
            </div>

            {/* Apps Grid if apps exist */}
            {apps.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                {apps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onBuild={(target) => setBuildTargetApp(target)}
                    onSettings={(target) => setEditTargetApp(target)}
                    onDelete={(id) => handleDeleteApp(id)}
                    onNotify={addNotification}
                    isDark={isDark}
                  />
                ))}
              </div>
            )}

            {/* Instant Sapphire Web-to-App Converter Card */}
            <div
              className={`rounded-2xl border shadow-xs overflow-hidden max-w-2xl mx-auto my-4 transition-colors ${
                isDark
                  ? "bg-[#141416] border-[#252528]"
                  : "bg-white border-[#EAE3D6]"
              }`}
            >
              <div
                className={`p-6 sm:p-8 border-b text-center ${
                  isDark
                    ? "bg-gradient-to-b from-[#1C1C1F] to-[#141416] border-[#242426]"
                    : "bg-gradient-to-b from-[#F7F4EE] to-white border-[#EDE6DA]"
                }`}
              >
                <div
                  className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3 border shadow-2xs ${
                    isDark
                      ? "bg-[#2A1A16] text-[#E58C77] border-[#3E231D]"
                      : "bg-[#F5E5DE] text-[#B9553C] border-[#F0D5D0]"
                  }`}
                >
                  <SapphireLogo size={18} variant="badge" />
                  <span>Sapphire Converter — URL to EXE, APK &amp; Web to App</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  Convert Any Website URL into Windows (.EXE) &amp; Android (.APK)
                </h3>
                <p className={`text-xs sm:text-sm max-w-md mx-auto mt-2 ${isDark ? "text-[#938F8A]" : "text-[#7B756D]"}`}>
                  The ultimate URL to App, URL to EXE, and URL to APK converter. Turn web links into native desktop executables and signed Android apps.
                </p>
              </div>

              <form onSubmit={handleQuickConvert} className="p-6 sm:p-8 space-y-4">
                {/* Website URL */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider">
                      Website URL <span className="text-[#E28A74]">*</span>
                    </label>
                    {quickValidating ? (
                      <span className="text-[11px] text-[#E28A74] font-medium inline-flex items-center gap-1 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Auto-detecting name &amp; logo...
                      </span>
                    ) : quickDetected ? (
                      <span className="text-[11px] text-[#22C55E] font-semibold inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Auto-detected!
                      </span>
                    ) : (
                      <span className={`text-[10px] ${isDark ? "text-[#7E7A75]" : "text-[#9E9890]"}`}>
                        Any URL or deep link (e.g. discord.com/channel)
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={quickUrl}
                      onChange={handleQuickUrlChange}
                      onPaste={handleQuickUrlPaste}
                      onBlur={handleQuickUrlBlur}
                      placeholder="Paste link: e.g. discord.com/channel, youtube.com/watch?v=..., github.com"
                      className={`w-full pl-4 pr-10 py-3 rounded-xl text-sm transition-all border outline-none focus:ring-2 focus:ring-[#E28A74]/20 ${
                        isDark
                          ? "bg-[#1E1E21] border-[#2E2E32] text-[#E5E3DF] focus:border-[#E28A74]"
                          : "bg-[#FBF9F5] border-[#E0D8CB] text-[#22201E] focus:border-[#E28A74]"
                      }`}
                    />
                    <div className="absolute right-3.5 top-3.5 flex items-center">
                      {quickValidating ? (
                        <Loader2 className="w-4 h-4 text-[#E28A74] animate-spin" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => detectQuickMetadata(quickUrl, true)}
                          title="Auto-detect name & logo"
                          className="text-[#9E9890] hover:text-[#E28A74] transition-colors p-0.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-[11px] ${isDark ? "text-[#8E8B87]" : "text-[#7B756D]"}`}>
                    Instant deep link support: enter any URL or subpath (e.g. discord.com/channel) and we convert it directly into your native desktop &amp; mobile app!
                  </p>
                </div>

                {/* App Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider">
                      App Name
                    </label>
                    {quickName && (
                      <span className={`text-[10px] ${isDark ? "text-[#7E7A75]" : "text-[#9E9890]"}`}>
                        {userEditedQuickNameRef.current ? "Custom Name" : "Auto-detected"}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={quickName}
                    onChange={(e) => {
                      userEditedQuickNameRef.current = true;
                      setQuickName(e.target.value);
                    }}
                    placeholder={quickValidating ? "Detecting name..." : "e.g. Discord, YouTube, My Web App"}
                    className={`w-full px-4 py-3 rounded-xl text-sm transition-all border outline-none focus:ring-2 focus:ring-[#E28A74]/20 ${
                      isDark
                        ? "bg-[#1E1E21] border-[#2E2E32] text-[#E5E3DF] focus:border-[#E28A74]"
                        : "bg-[#FBF9F5] border-[#E0D8CB] text-[#22201E] focus:border-[#E28A74]"
                    }`}
                  />
                </div>

                {/* App Icon (Picture) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider">
                      App Icon (Picture)
                    </label>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        userEditedQuickIconRef.current
                          ? "text-[#E28A74] bg-[#E28A74]/10"
                          : quickIconUrl
                          ? "text-[#22C55E] bg-[#22C55E]/10"
                          : "text-[#8E8B87]"
                      }`}
                    >
                      {isHeroProcessingIcon
                        ? "Optimizing Picture..."
                        : userEditedQuickIconRef.current
                        ? "Custom Uploaded Picture"
                        : quickValidating
                        ? "Fetching website picture..."
                        : quickIconUrl
                        ? "Website Picture Auto-Detected"
                        : "Auto-detects from URL or Upload"}
                    </span>
                  </div>

                  {/* Drag & Drop Container */}
                  <div
                    onDragOver={handleHeroDragOver}
                    onDragLeave={handleHeroDragLeave}
                    onDrop={handleHeroDrop}
                    className={`relative border-2 border-dashed rounded-xl p-3 transition-all ${
                      isHeroDragging
                        ? "border-[#E28A74] bg-[#E28A74]/10 scale-[1.01]"
                        : isDark
                        ? "border-[#2A2A2E] bg-[#1A1A1D]/60 hover:bg-[#1A1A1D]"
                        : "border-[#E4DDD1] bg-[#F7F4EE]/60 hover:bg-[#F7F4EE]"
                    }`}
                  >
                    <input
                      ref={heroFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/*"
                      className="hidden"
                      onChange={handleHeroFileChange}
                    />

                    <div className="flex items-center space-x-3">
                      {/* Clickable Icon Box */}
                      <button
                        type="button"
                        onClick={() => heroFileInputRef.current?.click()}
                        title="Click to select or change picture"
                        className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden shadow-xs p-1 transition-all cursor-pointer group relative ${
                          isDark
                            ? "bg-[#252528] border-[#333336]"
                            : "bg-white border-[#E8E1D5]"
                        }`}
                      >
                        {isHeroProcessingIcon ? (
                          <Loader2 className="w-6 h-6 text-[#E28A74] animate-spin" />
                        ) : quickIconUrl ? (
                          <>
                            <img
                              src={quickIconUrl}
                              alt="Website Icon"
                              className="w-full h-full object-contain rounded-lg"
                              onError={(e) => {
                                const fb = getWebsiteFallbackIcon(quickUrl);
                                if (fb && (e.target as HTMLImageElement).src !== fb) {
                                  (e.target as HTMLImageElement).src = fb;
                                }
                              }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                              <Upload className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-[#9E9890]">
                            <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                          </div>
                        )}
                      </button>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <button
                            type="button"
                            onClick={() => heroFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-[#E28A74] hover:bg-[#D47963] active:bg-[#C26B56] text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
                            title="Upload PNG, JPG, or ICO picture"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{quickIconUrl ? "Change Picture" : "Upload Picture"}</span>
                          </button>

                          {quickIconUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                userEditedQuickIconRef.current = false;
                                setQuickIconUrl("");
                                setHeroUploadError(null);
                              }}
                              className="text-xs text-rose-500 hover:text-rose-600 font-medium px-1.5 py-1 hover:underline cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                          <span className={`text-[11px] hidden sm:inline ${isDark ? "text-[#7E7A75]" : "text-[#9E9890]"}`}>
                            or drag &amp; drop image here
                          </span>
                        </div>

                        <input
                          type="text"
                          value={quickIconUrl}
                          onChange={(e) => {
                            userEditedQuickIconRef.current = true;
                            setQuickIconUrl(e.target.value);
                            setHeroUploadError(null);
                          }}
                          placeholder="Or paste any image URL..."
                          className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-none ${
                            isDark
                              ? "bg-[#1E1E21] border-[#2E2E32] text-[#E5E3DF] focus:border-[#E28A74]"
                              : "bg-white border-[#E0D8CB] text-[#22201E] focus:border-[#E28A74]"
                          }`}
                        />
                      </div>
                    </div>

                    {heroUploadError && (
                      <div className="mt-2 text-xs text-rose-500 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{heroUploadError}</span>
                      </div>
                    )}

                    <p className={`mt-1.5 text-[10px] ${isDark ? "text-[#7E7A75]" : "text-[#9E9890]"}`}>
                      Supports PNG, JPG, JPEG, WEBP, ICO, SVG. Rescaled and embedded into Windows .EXE &amp; Android .APK.
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-5 bg-[#E28A74] hover:bg-[#D47963] active:bg-[#C26B56] text-white font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Convert URL &amp; Download Official .EXE / .APK</span>
                </button>

                <div className={`pt-2 flex items-center justify-center space-x-4 text-xs font-medium ${isDark ? "text-[#7E7A75]" : "text-[#9E9890]"}`}>
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Direct .EXE Executable</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>Signed .APK Package</span>
                  </span>
                  <span>•</span>
                  <span>No ZIP Archives</span>
                </div>
              </form>
            </div>
          </main>
        )}

        {/* View 2: View Builds History */}
        {currentView === "builds" && (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Build History</h2>
              <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-[#938F8A]" : "text-[#7B756D]"}`}>
                All generated packages with direct re-download links.
              </p>
            </div>

            <div
              className={`rounded-2xl border overflow-hidden shadow-xs ${
                isDark ? "bg-[#141416] border-[#252528]" : "bg-white border-[#EAE3D6]"
              }`}
            >
              {apps.length > 0 ? (
                <div className={`divide-y ${isDark ? "divide-[#222225]" : "divide-[#EAE3D6]"}`}>
                  {apps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        {app.iconUrl ? (
                          <img
                            src={app.iconUrl}
                            alt={app.name}
                            className={`w-10 h-10 rounded-xl object-contain p-1 border shrink-0 ${
                              isDark ? "bg-[#1F1F22] border-[#2C2C30]" : "bg-[#F7F4EE] border-[#E8E1D5]"
                            }`}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-[#E28A74] text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {app.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm">{app.name}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isDark
                                  ? "bg-[#331E19] text-[#E58C77]"
                                  : "bg-[#F3DDD5] text-[#BD583F]"
                              }`}
                            >
                              Build #{app.buildCount}
                            </span>
                          </div>
                          <span
                            className={`text-xs truncate block max-w-xs sm:max-w-md ${
                              isDark ? "text-[#8E8B87]" : "text-[#7B756D]"
                            }`}
                          >
                            {app.url}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <button
                          onClick={() => setBuildTargetApp(app)}
                          className="px-3.5 py-1.5 bg-[#E28A74] hover:bg-[#D47963] active:bg-[#C26B56] text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Packages</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm opacity-60">No packages generated yet.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentView("apps")}
                    className="px-4 py-2 bg-[#E28A74] hover:bg-[#D47963] text-white font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Convert Your First URL
                  </button>
                </div>
              )}
            </div>
          </main>
        )}

        {/* View 3: Account & Engine Settings */}
        {currentView === "settings" && (
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl w-full mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Account &amp; Engine Settings</h2>
              <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-[#938F8A]" : "text-[#7B756D]"}`}>
                Sapphire native desktop window engine and UI configuration.
              </p>
            </div>

            <div
              className={`rounded-2xl border p-6 space-y-4 shadow-xs ${
                isDark ? "bg-[#141416] border-[#252528]" : "bg-white border-[#EAE3D6]"
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-inherit">
                <div>
                  <span className={`text-xs font-bold uppercase tracking-wider block ${isDark ? "text-[#7E7A75]" : "text-[#8E877F]"}`}>
                    Plan
                  </span>
                  <span className="font-bold text-base">Sapphire Unlimited Free Tier</span>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isDark
                      ? "bg-[#1E2E23] text-[#86EFAC] border border-[#2C4A36]"
                      : "bg-[#EEF7F2] text-[#1B663E] border border-[#C8E8D5]"
                  }`}
                >
                  Active (Free Forever)
                </span>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center justify-between py-2 border-b border-inherit">
                <div>
                  <span className="text-sm font-bold block">Theme Mode</span>
                  <span className={`text-xs ${isDark ? "text-[#8E8B87]" : "text-[#7B756D]"}`}>
                    Switch between Warm Sand Light Mode and Obsidian Dark Mode
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      theme === "light"
                        ? "bg-[#F4EFE6] border-[#E28A74] text-[#BD583F] shadow-xs"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    Light Theme
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      theme === "dark"
                        ? "bg-[#252528] border-[#E28A74] text-[#E58C77] shadow-xs"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    Dark Theme
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div
                  className={`border rounded-xl p-4 space-y-1 ${
                    isDark ? "bg-[#1A1A1D] border-[#2A2A2E]" : "bg-[#FAF7F2] border-[#EAE3D6]"
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    <Monitor className="w-4 h-4 text-[#E28A74]" />
                    <span>Windows Standalone Native Engine</span>
                  </div>
                  <p className={`text-xs ${isDark ? "text-[#8E8B87]" : "text-[#7B756D]"}`}>
                    Standalone Win32 native window using Microsoft WebView2 runtime. Runs completely independent of browser tabs.
                  </p>
                </div>

                <div
                  className={`border rounded-xl p-4 space-y-1 ${
                    isDark ? "bg-[#1A1A1D] border-[#2A2A2E]" : "bg-[#FAF7F2] border-[#EAE3D6]"
                  }`}
                >
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    <Smartphone className="w-4 h-4 text-[#22C55E]" />
                    <span>Android APK Engine</span>
                  </div>
                  <p className={`text-xs ${isDark ? "text-[#8E8B87]" : "text-[#7B756D]"}`}>
                    Trusted Web Activity (TWA) framework. Full-screen mobile app with native push &amp; offline cache.
                  </p>
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Mobile floating "+ Quick App" button */}
        <div className="fixed bottom-5 right-5 lg:hidden z-20">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-13 h-13 rounded-full bg-[#E28A74] text-white flex items-center justify-center shadow-lg shadow-[#E28A74]/30 active:scale-95 transition-transform cursor-pointer"
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
        isDark={isDark}
      />

      {/* Modal 2: Build & Download Package */}
      <BuildDownloadModal
        app={buildTargetApp}
        isOpen={Boolean(buildTargetApp)}
        onClose={() => setBuildTargetApp(null)}
        onBuildSuccess={handleBuildSuccess}
        onNotify={addNotification}
        isDark={isDark}
      />

      {/* Modal 3: Settings & Edit App */}
      <EditAppModal
        app={editTargetApp}
        isOpen={Boolean(editTargetApp)}
        onClose={() => setEditTargetApp(null)}
        onSave={handleUpdateApp}
        onDelete={handleDeleteApp}
        isDark={isDark}
      />

      {/* Global Download Notifications Toast */}
      <DownloadNotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
