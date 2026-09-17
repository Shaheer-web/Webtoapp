import React, { useState, useRef } from "react";
import {
  X,
  Globe,
  Upload,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Image as ImageIcon,
  Monitor,
  Smartphone
} from "lucide-react";
import { AppProject, ECHO_LOGO_URL } from "../types";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto probe URL to fetch title and favicon icon
  const handleUrlBlur = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    let formatted = trimmed;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = "https://" + formatted;
      setUrl(formatted);
    }

    setIsValidating(true);
    try {
      const res = await fetch("/api/validate-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formatted }),
      });
      const data = await res.json();
      if (data.valid) {
        if (data.title && !name) {
          setName(data.title.slice(0, 24));
        }
        if (data.faviconUrl && !iconUrl) {
          setIconUrl(data.faviconUrl);
        }
      }
    } catch {
      // Best effort
    } finally {
      setIsValidating(false);
    }
  };

  // Upload custom icon
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setIconUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const rawUrl = url.trim();
    if (!rawUrl) return;

    let validUrl = rawUrl;
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = "https://" + validUrl;
    }

    let finalName = name.trim();
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
      iconUrl: iconUrl.trim() || ECHO_LOGO_URL,
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
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Quick App Creation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          {/* 1. URL */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Website URL <span className="text-sky-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-slate-400">
                <Globe className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://discord.com or https://yourwebsite.com"
                className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
              {isValidating && (
                <div className="absolute right-3 top-3">
                  <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Paste any URL. We automatically detect the title and website icon.
            </p>
          </div>

          {/* 2. Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. App Name <span className="text-sky-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Discord, ModCube, My App"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </div>

          {/* 3. Icon */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. App Icon
              </label>
              {!iconUrl && (
                <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                  Echo Pre-Logo (Default)
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={iconUrl || ECHO_LOGO_URL}
                  alt="App Icon"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = ECHO_LOGO_URL;
                  }}
                />
              </div>

              <div className="flex-1 space-y-1">
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
                    <span>Upload Custom</span>
                  </button>
                  {iconUrl && (
                    <button
                      type="button"
                      onClick={() => setIconUrl("")}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      Reset to Echo Pre-Logo
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {iconUrl ? "Custom icon loaded" : "Pre-logo of Echo used automatically if none selected"}
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
              disabled={!url.trim()}
              className="w-full py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors shadow-sm shadow-sky-600/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Create App Now</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
