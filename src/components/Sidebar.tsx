import React from "react";
import {
  Plus,
  Layers,
  History,
  Settings,
  X,
  Sparkles
} from "lucide-react";
import { DashboardView, ECHO_LOGO_URL } from "../types";

interface SidebarProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  appsCount: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  appsCount,
  isOpen,
  onClose,
  onOpenCreate,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/70">
            <div className="flex items-center space-x-2.5">
              <img
                src={ECHO_LOGO_URL}
                alt="Echo Logo"
                className="w-9 h-9 rounded-xl object-contain bg-white shadow-xs border border-slate-200/90 p-0.5"
              />
              <div>
                <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center leading-none">
                  Echo Converter
                </span>
                <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider block mt-0.5">
                  URL to EXE • APK • App
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="px-3 py-4 space-y-6">
            {/* Group 1: MY APPS */}
            <div className="space-y-1">
              <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                My Apps
              </div>

              {/* Quick Create CTA */}
              <button
                onClick={() => {
                  onOpenCreate();
                  onClose();
                }}
                className="w-full mt-1.5 flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/80 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 text-sky-600" />
                <span>New App</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView("apps");
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  currentView === "apps"
                    ? "bg-slate-200/70 text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>All Apps</span>
                </div>
                <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                  {appsCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentView("builds");
                  onClose();
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  currentView === "builds"
                    ? "bg-slate-200/70 text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <History className="w-4 h-4 text-slate-500" />
                <span>View Builds</span>
              </button>
            </div>

            {/* Group 2: SETTINGS */}
            <div className="space-y-1">
              <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Settings
              </div>

              <button
                onClick={() => {
                  setCurrentView("settings");
                  onClose();
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  currentView === "settings"
                    ? "bg-slate-200/70 text-slate-900 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Account &amp; Engine</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info pill */}
        <div className="p-4 border-t border-slate-200/70">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">100% Free Tier</span>
              <span className="text-[11px] text-emerald-700">Unlimited .EXE &amp; .APK builds</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
