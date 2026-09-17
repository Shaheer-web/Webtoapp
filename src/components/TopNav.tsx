import React from "react";
import { Menu, Home, ChevronRight, Zap } from "lucide-react";
import { DashboardView, ECHO_LOGO_URL } from "../types";

interface TopNavProps {
  currentView: DashboardView;
  onOpenMobileMenu: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentView, onOpenMobileMenu }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile menu button + Brand + Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile brand indicator */}
        <div className="lg:hidden flex items-center space-x-2">
          <img
            src={ECHO_LOGO_URL}
            alt="Echo"
            className="w-7 h-7 rounded-lg object-contain bg-slate-50 border border-slate-200 p-0.5"
          />
          <span className="font-extrabold text-sm text-slate-900">Echo</span>
        </div>

        {/* Breadcrumb pill */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Home className="w-3.5 h-3.5 text-slate-500" />
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="font-semibold text-slate-700 capitalize">
            {currentView === "apps" ? "Echo Apps" : currentView === "builds" ? "Builds" : "Settings"}
          </span>
        </div>
      </div>

      {/* Right: Badges & Profile */}
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center space-x-1.5">
          <span className="inline-flex items-center space-x-1 text-xs font-bold text-white bg-sky-600 px-2.5 py-1 rounded-md shadow-xs">
            <Zap className="w-3 h-3" />
            <span>URL TO APP</span>
          </span>
          <span className="hidden sm:inline-flex items-center space-x-1 text-xs font-bold text-white bg-emerald-600 px-2.5 py-1 rounded-md shadow-xs">
            <span>FREE &amp; UNLIMITED</span>
          </span>
        </div>

        {/* Echo App Avatar */}
        <img
          src={ECHO_LOGO_URL}
          alt="Echo"
          className="w-8 h-8 rounded-full object-contain border border-slate-200 shadow-xs"
        />
      </div>
    </header>
  );
};
