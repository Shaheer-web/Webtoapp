import React, { useState, useRef, useCallback } from "react";
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
  Smartphone,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { AppProject } from "../types";
import { detectWebsiteBrand, getWebsiteFaviconUrl, getWebsiteFallbackIcon } from "../utils/iconHelper";
import { processImageFile, validateImageFile } from "../utils/imageUploadHelper";

interface QuickAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateApp: (app: AppProject) => void;
  isDark?: boolean;
}

export const QuickAppModal: React.FC<QuickAppModalProps> = ({
  isOpen,
  onClose,
  onCreateApp,
  isDark = false,
}) => {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [description, setDescription] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [detectedSuccess, setDetectedSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingIcon, setIsProcessingIcon] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const userEditedNameRef = useRef(false);
  const userEditedIconRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto probe URL to fetch title and favicon icon
  const detectMetadata = useCallback(async (inputUrl: string, force = false) => {
    const trimmed = inputUrl.trim();
    if (!trimmed || trimmed.length < 3) return;

    if (!force && !trimmed.includes(".") && !trimmed.startsWith("http")) {
      return;
    }

    let formatted = trimmed;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = "https://" + formatted.replace(/^\/\//, "");
    }

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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = val.trim();
    if (!trimmed) {
      setDetectedSuccess(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      detectMetadata(trimmed, false);
    }, 600);
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (pasted && (pasted.includes(".") || pasted.startsWith("http"))) {
      let formatted = pasted;
      if (!/^https?:\/\//i.test(formatted)) {
        formatted = "https://" + formatted.replace(/^\/\//, "");
      }

      if (!userEditedIconRef.current) {
        const autoIcon = getWebsiteFaviconUrl(formatted) || getWebsiteFallbackIcon(formatted);
        setIconUrl(autoIcon);
      }

      const brand = detectWebsiteBrand(formatted);
      if (brand && (!userEditedNameRef.current || !name.trim())) {
        setName(brand.name);
        setDetectedSuccess(true);
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setTimeout(() => {
        detectMetadata(pasted, true);
      }, 50);
    }
  };

  const handleUrlBlur = () => {
    if (url.trim()) {
      detectMetadata(url, true);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    userEditedNameRef.current = true;
    setName(e.target.value);
  };

  const handleProcessFile = async (file: File) => {
    setUploadError(null);
    const check = validateImageFile(file);
    if (!check.valid) {
      setUploadError(check.error || "Please select a valid image file.");
      return;
    }

    setIsProcessingIcon(true);
    userEditedIconRef.current = true;
    try {
      const processedUrl = await processImageFile(file);
      setIconUrl(processedUrl);
      setUploadError(null);
    } catch (err: any) {
      console.error("Icon upload error:", err);
      setUploadError(err?.message || "Failed to process image. Please try another image.");
    } finally {
      setIsProcessingIcon(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleProcessFile(file);
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleProcessFile(file);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl max-w-md w-full border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? "bg-[#141416] border-[#2A2A2E] text-[#E5E3DF]"
            : "bg-white border-[#E8E1D5] text-[#22201E]"
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
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E28A74] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Quick App Creation</h3>
              <p className={`text-[11px] ${isDark ? "text-[#938F8A]" : "text-[#7B756D]"}`}>
                Auto-detects name, logo &amp; generates .EXE &amp; .APK
              </p>
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

        {/* Modal Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {/* 1. URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Website URL <span className="text-[#E28A74]">*</span>
              </label>
              {isValidating ? (
                <span className="text-[11px] text-[#E28A74] font-medium inline-flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Auto-detecting...
                </span>
              ) : detectedSuccess ? (
                <span className="text-[11px] text-[#22C55E] font-semibold inline-flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Auto-detected!
                </span>
              ) : null}
            </div>
            <div className="relative">
              <div className="absolute left-3 top-3 text-[#A5A19B]">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={url}
                onChange={handleUrlChange}
                onPaste={handleUrlPaste}
                onBlur={handleUrlBlur}
                placeholder="Paste link: e.g. discord.com, youtube.com, github.com"
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl text-sm transition-all border outline-none focus:ring-2 focus:ring-[#E28A74]/30 ${
                  isDark
                    ? "bg-[#1E1E21] border-[#2E2E32] text-[#E5E3DF] focus:border-[#E28A74]"
                    : "bg-[#FBF9F5] border-[#E0D8CB] text-[#22201E] focus:border-[#E28A74]"
                }`}
              />
              <div className="absolute right-3 top-3 flex items-center">
                {isValidating ? (
                  <Loader2 className="w-4 h-4 text-[#E28A74] animate-spin" />
                ) : (
                  <button
                    type="button"
                    onClick={() => detectMetadata(url, true)}
                    title="Auto-detect name & logo"
                    className="text-[#A5A19B] hover:text-[#E28A74] transition-colors p-0.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider">
                App Name <span className="text-[#E28A74]">*</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder={isValidating ? "Detecting name..." : "e.g. Discord, YouTube, My Web App"}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition-all border outline-none focus:ring-2 focus:ring-[#E28A74]/30 ${
                  isDark
                    ? "bg-[#1E1E21] border-[#2E2E32] text-[#E5E3DF] focus:border-[#E28A74]"
                    : "bg-[#FBF9F5] border-[#E0D8CB] text-[#22201E] focus:border-[#E28A74]"
                }`}
              />
            </div>
          </div>

          {/* 3. Icon */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider">
                App Icon (Picture)
              </label>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                userEditedIconRef.current
                  ? "text-[#E28A74] bg-[#E28A74]/10"
                  : iconUrl
                  ? "text-[#22C55E] bg-[#22C55E]/10"
                  : "text-[#8E8B87]"
              }`}>
                {isProcessingIcon
                  ? "Processing..."
                  : userEditedIconRef.current
                  ? "Custom Picture"
                  : iconUrl
                  ? "Auto-Detected"
                  : "Auto or Upload"}
              </span>
            </div>

            {/* Drag & Drop Upload Container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-3 transition-all ${
                isDragging
                  ? "border-[#E28A74] bg-[#E28A74]/10 scale-[1.01]"
                  : isDark
                  ? "border-[#2A2A2E] bg-[#1A1A1D]/60"
                  : "border-[#E4DDD1] bg-[#F7F4EE]/60"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to select picture"
                  className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden p-1 cursor-pointer transition-all ${
                    isDark
                      ? "bg-[#252528] border-[#333336]"
                      : "bg-white border-[#E8E1D5]"
                  }`}
                >
                  {isProcessingIcon ? (
                    <Loader2 className="w-6 h-6 text-[#E28A74] animate-spin" />
                  ) : iconUrl ? (
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
                    <ImageIcon className="w-6 h-6 text-[#A5A19B]" />
                  )}
                </button>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-white bg-[#E28A74] hover:bg-[#D47963] px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{iconUrl ? "Change Picture" : "Upload Picture"}</span>
                    </button>
                    {iconUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          userEditedIconRef.current = false;
                          setIconUrl("");
                          setUploadError(null);
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
                      setUploadError(null);
                    }}
                    placeholder="Or paste image URL..."
                    className={`w-full px-3 py-1.5 rounded-lg text-xs border outline-none ${
                      isDark
                        ? "bg-[#1E1E21] border-[#2E2E32] text-[#E5E3DF]"
                        : "bg-white border-[#E0D8CB] text-[#22201E]"
                    }`}
                  />
                </div>
              </div>

              {uploadError && (
                <div className="mt-2 text-xs text-rose-500 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#E28A74] hover:bg-[#D47963] active:bg-[#C26B56] text-white font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
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
