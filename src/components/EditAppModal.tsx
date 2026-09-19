import React, { useState, useRef } from "react";
import { X, Trash2, Save, Globe, Upload, ImageIcon, AlertCircle, Loader2 } from "lucide-react";
import { AppProject } from "../types";
import { getWebsiteFaviconUrl, getWebsiteFallbackIcon } from "../utils/iconHelper";
import { processImageFile, validateImageFile } from "../utils/imageUploadHelper";

interface EditAppModalProps {
  app: AppProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: AppProject) => void;
  onDelete: (id: string) => void;
}

export const EditAppModal: React.FC<EditAppModalProps> = ({
  app,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(app?.name || "");
  const [url, setUrl] = useState(app?.url || "");
  const [iconUrl, setIconUrl] = useState(app?.iconUrl || "");
  const [description, setDescription] = useState(app?.description || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingIcon, setIsProcessingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update state when modal opens with a new app
  React.useEffect(() => {
    if (app) {
      setName(app.name);
      setUrl(app.url);
      setIconUrl(app.iconUrl || "");
      setDescription(app.description || "");
      setConfirmDelete(false);
      setUploadError(null);
    }
  }, [app]);

  if (!isOpen || !app) return null;

  const activeWebsiteIcon = iconUrl || getWebsiteFaviconUrl(url) || getWebsiteFallbackIcon(url);

  const handleProcessFile = async (file: File) => {
    setUploadError(null);
    const check = validateImageFile(file);
    if (!check.valid) {
      setUploadError(check.error || "Please select a valid image file.");
      return;
    }

    setIsProcessingIcon(true);
    try {
      const processedUrl = await processImageFile(file);
      setIconUrl(processedUrl);
      setUploadError(null);
    } catch (err: any) {
      console.error("Failed to process icon file:", err);
      setUploadError(err?.message || "Failed to process image. Please try another file.");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    const finalIcon = iconUrl.trim() || getWebsiteFaviconUrl(url.trim()) || getWebsiteFallbackIcon(url.trim());

    onSave({
      ...app,
      name: name.trim(),
      url: url.trim(),
      iconUrl: finalIcon,
      description: description.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-base text-slate-900">App Settings</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              App Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Website URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                App Icon (Picture)
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                iconUrl
                  ? "text-sky-700 bg-sky-50 border-sky-200"
                  : "text-slate-600 bg-slate-50 border-slate-200"
              }`}>
                {isProcessingIcon
                  ? "Optimizing Picture..."
                  : iconUrl
                  ? "Custom Picture Loaded"
                  : "Auto-Detected Picture"}
              </span>
            </div>

            {/* Drag & Drop Upload Container */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-3 transition-all ${
                isDragging
                  ? "border-sky-500 bg-sky-50/60 ring-2 ring-sky-300 scale-[1.01]"
                  : "border-slate-300 bg-slate-50/50 hover:bg-slate-50"
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
                  title="Click to select or change picture"
                  className={`w-14 h-14 rounded-xl border bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-xs p-1 transition-all cursor-pointer group relative ${
                    isProcessingIcon
                      ? "border-sky-400 ring-2 ring-sky-300"
                      : "border-slate-200 hover:border-sky-400 hover:ring-2 hover:ring-sky-200"
                  }`}
                >
                  {isProcessingIcon ? (
                    <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
                  ) : activeWebsiteIcon ? (
                    <>
                      <img
                        src={activeWebsiteIcon}
                        alt="Logo preview"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getWebsiteFallbackIcon(url);
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Upload className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-sky-600">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </button>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{iconUrl ? "Change Picture" : "Upload Picture"}</span>
                    </button>

                    {iconUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setIconUrl("");
                          setUploadError(null);
                        }}
                        className="text-xs text-rose-500 hover:text-rose-700 font-medium px-1.5 py-1 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-[11px] text-slate-400 hidden sm:inline">
                      or drag &amp; drop image here
                    </span>
                  </div>

                  <input
                    type="text"
                    value={iconUrl}
                    onChange={(e) => {
                      setIconUrl(e.target.value);
                      setUploadError(null);
                    }}
                    placeholder="Or paste any image URL..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {uploadError && (
                <div className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <p className="mt-1.5 text-[10px] text-slate-400">
                Supports PNG, JPG, JPEG, WEBP, ICO, SVG. Rescaled and embedded into Windows .EXE &amp; Android .APK.
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. My favorite communication app"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            {confirmDelete ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                <p className="text-xs font-bold text-rose-900">
                  Delete "{app.name}" permanently?
                </p>
                <p className="text-[11px] text-rose-700">
                  All local data for this app will be deleted.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(app.id);
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Yes, Delete Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between space-x-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="py-2.5 px-3.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
