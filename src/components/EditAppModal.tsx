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
  isDark?: boolean;
}

export const EditAppModal: React.FC<EditAppModalProps> = ({
  app,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isDark = false,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className={`rounded-2xl max-w-md w-full border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
          isDark
            ? "bg-[#141416] border-[#2A2A2E] text-[#E5E3DF]"
            : "bg-white border-[#E8E1D5] text-[#22201E]"
        }`}
      >
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDark
              ? "bg-[#1A1A1D] border-[#262629]"
              : "bg-[#F7F4EE] border-[#EAE3D6]"
          }`}
        >
          <h3 className="font-bold text-base">App Settings</h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              isDark ? "text-[#938F8A] hover:text-white hover:bg-[#252528]" : "text-[#7B756D] hover:text-black hover:bg-[#EAE3D6]"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider">
              App Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition-all border outline-none focus:ring-2 focus:ring-[#E28A74]/30 ${
                isDark
                  ? "bg-[#1E1E21] border-[#2E2E32] text-[#E5E3DF] focus:border-[#E28A74]"
                  : "bg-[#FBF9F5] border-[#E0D8CB] text-[#22201E] focus:border-[#E28A74]"
              }`}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider">
              Website URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-sm transition-all border outline-none focus:ring-2 focus:ring-[#E28A74]/30 ${
                isDark
                  ? "bg-[#1E1E21] border-[#2E2E32] text-[#E5E3DF] focus:border-[#E28A74]"
                  : "bg-[#FBF9F5] border-[#E0D8CB] text-[#22201E] focus:border-[#E28A74]"
              }`}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider">
                App Icon (Picture)
              </label>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-3 transition-all ${
                isDragging
                  ? "border-[#E28A74] bg-[#E28A74]/10"
                  : isDark
                  ? "border-[#2A2A2E] bg-[#1A1A1D]/60"
                  : "border-[#E4DDD1] bg-[#F7F4EE]/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-14 h-14 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden p-1 cursor-pointer transition-all ${
                    isDark ? "bg-[#252528] border-[#333336]" : "bg-white border-[#E8E1D5]"
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
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-white bg-[#E28A74] hover:bg-[#D47963] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      <span>{iconUrl ? "Change Picture" : "Upload Picture"}</span>
                    </button>
                    {iconUrl && (
                      <button
                        type="button"
                        onClick={() => setIconUrl("")}
                        className="text-xs text-rose-500 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
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

          <div className="pt-2 flex items-center justify-between">
            {confirmDelete ? (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    onDelete(app.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                    isDark ? "bg-[#1E1E21] border-[#2E2E32] text-[#A5A19B]" : "bg-white border-[#E0D8CB] text-[#6B655D]"
                  }`}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Project</span>
              </button>
            )}

            <button
              type="submit"
              className="py-2 px-4 bg-[#E28A74] hover:bg-[#D47963] active:bg-[#C26B56] text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
