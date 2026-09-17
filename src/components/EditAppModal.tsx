import React, { useState } from "react";
import { X, Trash2, Save, Globe } from "lucide-react";
import { AppProject, ECHO_LOGO_URL } from "../types";

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

  // Update state when modal opens with a new app
  React.useEffect(() => {
    if (app) {
      setName(app.name);
      setUrl(app.url);
      setIconUrl(app.iconUrl || "");
      setDescription(app.description || "");
    }
  }, [app]);

  if (!isOpen || !app) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;

    onSave({
      ...app,
      name: name.trim(),
      url: url.trim(),
      iconUrl: iconUrl.trim() || ECHO_LOGO_URL,
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
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
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

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                App Icon
              </label>
              <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                {iconUrl ? "Custom Logo" : "Echo Pre-Logo (Default)"}
              </span>
            </div>
            <div className="flex items-center space-x-2.5">
              <img
                src={iconUrl || ECHO_LOGO_URL}
                alt="Logo preview"
                className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = ECHO_LOGO_URL;
                }}
              />
              <input
                type="text"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="Icon URL (leave empty for Echo pre-logo)"
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
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

          <div className="pt-2 flex items-center justify-between space-x-3">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete app "${app.name}"?`)) {
                  onDelete(app.id);
                  onClose();
                }
              }}
              className="py-2.5 px-3.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
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
