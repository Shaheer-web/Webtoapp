import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Globe,
  Upload,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Check,
  Monitor,
  Smartphone
} from "lucide-react";
import { AppProject } from "../types";
import { detectWebsiteBrand, getWebsiteFaviconUrl, getWebsiteFallbackIcon } from "../utils/iconHelper";
import { processImageFile } from "../utils/imageUploadHelper";

interface QuickAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateApp: (app: AppProject) => void;
}

export const QuickAppModal: React.FC<QuickAppModalProps> = ({
  isOpen,
  onClose,
  onCreateApp,
}) => {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [detectedSuccess, setDetectedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userEditedNameRef = useRef(false);
  const userEditedIconRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto probe URL to fetch title and favicon icon
  const detectMetadata = useCallback(async (inputUrl: string, force = false) => {
    const trimmed = inputUrl.trim();
    if (!trimmed || trimmed.length < 3) return;

    // Must look like a domain or URL
    if (!force && !trimmed.includes(".") && !trimmed.startsWith("http")) {
      return;
    }

    let formatted = trimmed;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = "https://" + formatted.replace(/^\/\//, "");
    }

    // Cancel any previous pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsValidating(true);
    setDetectedSuccess(false);

    try {
      const res = await fetch("/api/validate-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formatted }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) return;
      const data = await res.json();

      if (data.valid) {
        const detectedTitle = data.appName || data.title;
        if (detectedTitle && (!userEditedNameRef.current || !name.trim())) {
          setName(detectedTitle);
        }

        const detectedFavicon = data.faviconUrl || data.googleFaviconUrl;
        if (detectedFavicon && !userEditedIconRef.current) {
          setIconUrl(detectedFavicon);
        }

        setDetectedSuccess(true);
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("Auto-detect note:", err);
      }
    } finally {
      setIsValidating(false);
    }
  }, [name]);

  // Trigger on typing with instant brand detection + debounced deep probe
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setUrl(newVal);

    // Instant local domain/brand check
    const brand = detectWebsiteBrand(newVal);
    if (brand) {
      if (!userEditedNameRef.current || !name.trim()) {
        setName(brand.name);
      }
      if (!userEditedIconRef.current) {
        setIconUrl(brand.faviconUrl);
      }
      setDetectedSuccess(true);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (newVal.trim().includes(".")) {
      debounceTimerRef.current = setTimeout(() => {
        detectMetadata(newVal, false);
      }, 300);
    }
  };

  // Instant trigger on paste
  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (pastedText) {
      const brand = detectWebsiteBrand(pastedText);
      if (brand) {
        if (!userEditedNameRef.current || !name.trim()) {
          setName(brand.name);
        }
        if (!userEditedIconRef.current) {
          setIconUrl(brand.faviconUrl);
        }
        setDetectedSuccess(true);
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setTimeout(() => {
        detectMetadata(pastedText, true);
      }, 50);
    }
  };

  const handleUrlBlur = () => {
    if (url.trim()) {
      detectMetadata(url, true);
    }
  };

  // Track if user manually changes name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userEditedNameRef.current = true;
    setName(e.target.value);
  };

  // Upload custom icon
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      userEditedIconRef.current = true;
      try {
        const processedUrl = await processImageFile(file);
        setIconUrl(processedUrl);
      } catch (err) {
        console.error("Icon upload error:", err);
      } finally {
        e.target.value = "";
      }
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = url.trim();
    if (!rawUrl) return;

    let validUrl = rawUrl;
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl.replace(/^\/\//, "");
    }

    let finalName = name.trim();
    if (!finalName) {
      try {
        const brand = detectWebsiteBrand(validUrl);
        if (brand) {
          finalName = brand.name;
        } else {
          const h = new URL(validUrl).hostname.replace(/^www\./i, "");
          finalName = h.charAt(0).toUpperCase() + h.slice(1).split(".")[0];
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
      iconUrl: iconUrl.trim() || autoDetectedIcon,
      description: description.trim() || undefined,
      status: "completed",
      buildCount: 1,
      lastBuilt: "Just now",
      createdAt: new Date().toLocaleDateString(),
    };

    onCreateApp(newApp);
    onClose();

    // Reset form
    setUrl("");
    setName("");
    setIconUrl("");
    setDescription("");
    userEditedNameRef.current = false;
    userEditedIconRef.current = false;
    setDetectedSuccess(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 leading-tight">Quick App Creation</h3>
              <p className="text-[11px] text-slate-500">Auto-detects name, logo, and converts in seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {/* 1. URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Website URL <span className="text-sky-600">*</span>
              </label>
              {isValidating ? (
                <span className="text-[11px] text-sky-600 font-medium inline-flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Auto-detecting logo &amp; name...
                </span>
              ) : detectedSuccess ? (
                <span className="text-[11px] text-emerald-600 font-semibold inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Auto-detected!
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">Any URL or deep link (e.g. discord.com/channel)</span>
              )}
            </div>
            <div className="relative">
              <div className="absolute left-3 top-3 text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={url}
                onChange={handleUrlChange}
                onPaste={handleUrlPaste}
                onBlur={handleUrlBlur}
                placeholder="Paste link: e.g. discord.com/channel, youtube.com/watch?v=..., github.com"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
              <div className="absolute right-3 top-3 flex items-center">
                {isValidating ? (
                  <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
                ) : (
                  <button
                    type="button"
                    onClick={() => detectMetadata(url, true)}
                    title="Auto-detect name & logo"
                    className="text-slate-400 hover:text-sky-600 transition-colors p-0.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Instant auto-detection: paste any link and we immediately fetch the official title and logo!
            </p>
          </div>

          {/* 2. Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. App Name <span className="text-sky-600">*</span>
              </label>
              {name && (
                <span className="text-[10px] text-slate-400">
                  {userEditedNameRef.current ? "Custom Name" : "Auto-detected"}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder={isValidating ? "Detecting name..." : "e.g. Discord, YouTube, My App"}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all ${
                  isValidating ? "border-sky-300 bg-sky-50/30" : "border-slate-300"
                }`}
              />
            </div>
          </div>

          {/* 3. Icon */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. App Icon
              </label>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                iconUrl
                  ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                  : "text-slate-600 bg-slate-50 border-slate-200"
              }`}>
                {isValidating
                  ? "Fetching website picture..."
                  : iconUrl
                  ? (userEditedIconRef.current ? "Custom Icon" : "Website Picture Auto-Detected")
                  : "Auto-detects from URL"}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-14 h-14 rounded-xl border bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-xs p-1 transition-all ${
                isValidating
                  ? "border-sky-400 ring-2 ring-sky-300 animate-pulse bg-sky-50/50"
                  : "border-slate-200"
              }`}>
                {iconUrl ? (
                  <img
                    src={iconUrl}
                    alt="App Icon"
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => {
                      if (userEditedIconRef.current) return;
                      const fb = getWebsiteFallbackIcon(url);
                      if (fb && (e.target as HTMLImageElement).src !== fb) {
                        (e.target as HTMLImageElement).src = fb;
                      }
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Globe className="w-6 h-6 stroke-[1.5]" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.ico"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upload Custom Image</span>
                  </button>
                  {iconUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        userEditedIconRef.current = false;
                        setIconUrl("");
                      }}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={iconUrl}
                  onChange={(e) => {
                    userEditedIconRef.current = true;
                    setIconUrl(e.target.value);
                  }}
                  placeholder="Or paste image URL"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
                <p className="text-[11px] text-slate-400">
                  {iconUrl
                    ? "Official high-res icon will be embedded in Windows .EXE & Android .APK"
                    : "Paste a URL above to auto-detect official icon, or upload an image."}
                </p>
              </div>
            </div>
          </div>

          {/* Target preview badge */}
          <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3 flex items-center justify-between text-xs text-sky-950 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              <span>Creates both <strong>.EXE</strong> and <strong>.APK</strong></span>
            </span>
            <div className="flex items-center space-x-1 text-sky-600">
              <Monitor className="w-4 h-4" />
              <Smartphone className="w-4 h-4" />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create &amp; Download App</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
