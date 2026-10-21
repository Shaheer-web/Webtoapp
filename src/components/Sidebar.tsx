import React from "react";
import {
  Plus,
  Layers,
  History,
  Settings,
  Sliders,
  X,
  Sparkles,
  Sun,
  Moon
} from "lucide-react";
import { DashboardView, ThemeMode, SAPPHIRE_LOGO_URL } from "../types";
import { SapphireLogo } from "./SapphireLogo";

interface SidebarProps {
  currentView: DashboardView;
  setCurrentView: (view: DashboardView) => void;
  appsCount: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  appsCount,
  isOpen,
  onClose,
  onOpenCreate,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === "dark";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isDark
            ? "bg-[#141415] border-r border-[#242426] text-[#E5E3DF]"
            : "bg-[#F4EFE6] border-r border-[#E6DFD3] text-[#242220]"
        }`}
      >
        {/* Header / Brand & Nav Items */}
        <div>
          {/* Header / Brand */}
          <div
            className={`h-16 px-4 flex items-center justify-between border-b ${
              isDark ? "border-[#242426]" : "border-[#E6DFD3]"
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <SapphireLogo size={34} variant="badge" />
              <div>
                <div className="flex items-center">
                  <span className="font-extrabold text-lg tracking-tight leading-none">
                    Sapphire
                  </span>
                  <span
                    className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                      isDark
                        ? "bg-[#331E19] text-[#E58C77]"
                        : "bg-[#F3DDD5] text-[#BD583F]"
                    }`}
                  >
                    AI
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#E28A74] uppercase tracking-wider block mt-0.5">
                  URL to EXE • APK • App
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className={`lg:hidden p-1 rounded-md cursor-pointer ${
                isDark
                  ? "text-[#938F8A] hover:text-white"
                  : "text-[#7B756D] hover:text-black"
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="px-3 py-4 space-y-6">
            {/* Group 1: MY APPS */}
            <div className="space-y-1">
              <div
                className={`px-3 text-[11px] font-bold tracking-wider uppercase ${
                  isDark ? "text-[#7E7A75]" : "text-[#8E877F]"
                }`}
              >
                My Apps
              </div>

              {/* Quick Create CTA */}
              <button
                onClick={() => {
                  onOpenCreate();
                  onClose();
                }}
                className={`w-full mt-1.5 flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-2xs ${
                  isDark
                    ? "text-[#E58C77] bg-[#2A1A16] hover:bg-[#341F1A] border border-[#3E231D]"
                    : "text-[#B9553C] bg-[#F5E5DE] hover:bg-[#ECCFCA] border border-[#F0D5D0]"
                }`}
              >
                <Plus className="w-4 h-4 text-[#E28A74]" />
                <span>New App</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView("apps");
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                  currentView === "apps"
                    ? isDark
                      ? "bg-[#232326] text-white font-semibold"
                      : "bg-[#EAE2D5] text-[#1F1E1D] font-semibold"
                    : isDark
                    ? "text-[#9B9792] hover:text-white hover:bg-[#1C1C1E]"
                    : "text-[#6B655D] hover:text-[#1F1E1D] hover:bg-[#ECE4D8]"
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Layers className="w-4 h-4 text-[#E28A74]" />
                  <span>All Apps</span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isDark
                      ? "bg-[#252528] text-[#E5E3DF]"
                      : "bg-white text-[#5C564E] border border-[#E0D8CB]"
                  }`}
                >
                  {appsCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setCurrentView("builds");
                  onClose();
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                  currentView === "builds"
                    ? isDark
                      ? "bg-[#232326] text-white font-semibold"
                      : "bg-[#EAE2D5] text-[#1F1E1D] font-semibold"
                    : isDark
                    ? "text-[#9B9792] hover:text-white hover:bg-[#1C1C1E]"
                    : "text-[#6B655D] hover:text-[#1F1E1D] hover:bg-[#ECE4D8]"
                }`}
              >
                <History className="w-4 h-4 text-[#E28A74]" />
                <span>View Builds</span>
              </button>
            </div>

            {/* Group 2: SETTINGS & CUSTOMIZE */}
            <div className="space-y-1">
              <div
                className={`px-3 text-[11px] font-bold tracking-wider uppercase ${
                  isDark ? "text-[#7E7A75]" : "text-[#8E877F]"
                }`}
              >
                Settings &amp; Theme
              </div>

              {/* Customize / Theme Switcher requested by user */}
              <button
                onClick={onToggleTheme}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                  isDark
                    ? "text-[#9B9792] hover:text-white hover:bg-[#1C1C1E]"
                    : "text-[#6B655D] hover:text-[#1F1E1D] hover:bg-[#ECE4D8]"
                }`}
                title="Toggle Light / Dark theme"
              >
                <div className="flex items-center space-x-2.5">
                  <Sliders className="w-4 h-4 text-[#E28A74]" />
                  <span>Customize</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {isDark ? (
                    <Sun className="w-3.5 h-3.5 text-[#E28A74]" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-[#7B756D]" />
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isDark
                        ? "bg-[#252528] text-[#E5E3DF]"
                        : "bg-white text-[#5C564E] border border-[#E0D8CB]"
                    }`}
                  >
                    {isDark ? "Dark" : "Light"}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setCurrentView("settings");
                  onClose();
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors cursor-pointer ${
                  currentView === "settings"
                    ? isDark
                      ? "bg-[#232326] text-white font-semibold"
                      : "bg-[#EAE2D5] text-[#1F1E1D] font-semibold"
                    : isDark
                    ? "text-[#9B9792] hover:text-white hover:bg-[#1C1C1E]"
                    : "text-[#6B655D] hover:text-[#1F1E1D] hover:bg-[#ECE4D8]"
                }`}
              >
                <Settings className="w-4 h-4 text-[#E28A74]" />
                <span>Account &amp; Engine</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info pill */}
        <div
          className={`p-4 border-t ${
            isDark ? "border-[#242426]" : "border-[#E6DFD3]"
          }`}
        >
          <div
            className={`border rounded-xl p-3 flex items-center space-x-2.5 text-xs ${
              isDark
                ? "bg-[#1E2E23] border-[#2C4A36] text-[#86EFAC]"
                : "bg-[#EEF7F2] border-[#C8E8D5] text-[#1B663E]"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#22C55E] shrink-0" />
            <div>
              <span className="font-bold block">100% Free Tier</span>
              <span className="text-[11px] opacity-90">Unlimited .EXE &amp; .APK builds</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
