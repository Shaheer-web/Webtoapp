import React from "react";
import { Menu, Zap, Sun, Moon, Layers, Code2, Settings } from "lucide-react";
import { DashboardView, ThemeMode } from "../types";
import { SapphireLogo } from "./SapphireLogo";

interface TopNavProps {
  currentView: DashboardView;
  onOpenMobileMenu: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  onOpenMobileMenu,
  theme,
  onToggleTheme,
}) => {
  const isDark = theme === "dark";

  return (
    <header
      className={`h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors ${
        isDark
          ? "bg-[#0E0E0F]/90 border-b border-[#242426] backdrop-blur-md text-[#E5E3DF]"
          : "bg-white/90 border-b border-[#EAE3D6] backdrop-blur-md text-[#242220]"
      }`}
    >
      {/* Left: Mobile menu button + Brand + Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className={`lg:hidden p-2 rounded-lg transition-colors cursor-pointer ${
            isDark
              ? "text-[#9B9792] hover:text-white hover:bg-[#1E1E20]"
              : "text-[#6B655D] hover:text-black hover:bg-[#F4EFE6]"
          }`}
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile brand indicator */}
        <div className="lg:hidden flex items-center space-x-2">
          <SapphireLogo size={28} variant="badge" />
          <span className="font-bold text-sm tracking-tight">Sapphire</span>
          <span
            className={`text-[9px] font-bold px-1 py-0.5 rounded tracking-wide ${
              isDark
                ? "bg-[#331E19] text-[#E58C77]"
                : "bg-[#F3DDD5] text-[#BD583F]"
            }`}
          >
            AI
          </span>
        </div>

        {/* View Indicator */}
        <div
          className={`hidden sm:flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border ${
            isDark
              ? "bg-[#18181A] border-[#272729] text-[#A5A19B]"
              : "bg-[#F7F4EE] border-[#E8E1D5] text-[#6B655D]"
          }`}
        >
          {currentView === "apps" && <Layers className="w-3.5 h-3.5 text-[#E28A74]" />}
          {currentView === "builds" && <Code2 className="w-3.5 h-3.5 text-[#E28A74]" />}
          {currentView === "settings" && <Settings className="w-3.5 h-3.5 text-[#E28A74]" />}
          <span className="font-semibold capitalize text-current">
            {currentView === "apps" ? "Sapphire Converter" : currentView === "builds" ? "Build Packages" : "Engine Settings"}
          </span>
        </div>
      </div>

      {/* Right: Badges, Theme Toggle & Avatar */}
      <div className="flex items-center space-x-3">
        {/* URL TO APP Tag */}
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-md shadow-2xs ${
              isDark
                ? "bg-[#331E19] text-[#E58C77] border border-[#482821]"
                : "bg-[#F5E5DE] text-[#B9553C] border border-[#ECCFCA]"
            }`}
          >
            <Zap className="w-3 h-3 text-[#E28A74]" />
            <span className="hidden xs:inline">URL TO APP</span>
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
          className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            isDark
              ? "bg-[#18181A] hover:bg-[#222225] border-[#2A2A2D] text-[#E28A74]"
              : "bg-white hover:bg-stone-50 border-[#E5DFD4] text-[#6B655D]"
          }`}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-[#E28A74]" />
          ) : (
            <Moon className="w-4 h-4 text-[#7A746B]" />
          )}
        </button>

        {/* User Avatar matching screenshot */}
        <div
          title="shaheer (shaheerhassan)"
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase cursor-pointer ${
            isDark
              ? "bg-[#252528] text-white border border-[#3A3A3D]"
              : "bg-stone-100 text-[#1F1E1D] border border-[#E4DDD1]"
          }`}
        >
          S
        </div>
      </div>
    </header>
  );
};
