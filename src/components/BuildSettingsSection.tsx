import React, { useState } from "react";
import { Sliders, Monitor, Smartphone, Folder, Play, Ban, Layers, Check } from "lucide-react";
import { BuildFormConfig } from "../types";

interface BuildSettingsSectionProps {
  config: BuildFormConfig;
  setConfig: React.Dispatch<React.SetStateAction<BuildFormConfig>>;
  isBuilding: boolean;
  onStartBuild: () => void;
  onCancelBuild: () => void;
}

export const BuildSettingsSection: React.FC<BuildSettingsSectionProps> = ({
  config,
  setConfig,
  isBuilding,
  onStartBuild,
  onCancelBuild,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTextChange = (field: keyof BuildFormConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center space-x-2">
        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            2. Build Customization &amp; Target Targets
          </h2>
          <p className="text-xs text-slate-400">
            Define application identity, output formats, and compiler backends
          </p>
        </div>
      </div>

      {/* Row 1: App Name & Android Package ID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Application Display Name *
          </label>
          <input
            id="app-name-input"
            type="text"
            value={config.appName}
            onChange={(e) => handleTextChange("appName", e.target.value)}
            placeholder="e.g. My Web Portal"
            className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Displayed on desktop window titlebar and mobile app launcher
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Android Package ID (Reverse Domain) *
          </label>
          <input
            id="package-id-input"
            type="text"
            value={config.packageId}
            onChange={(e) => handleTextChange("packageId", e.target.value)}
            placeholder="com.example.webapp"
            className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 font-mono outline-none transition-colors"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Unique identifier for Android APK (e.g. com.company.app)
          </p>
        </div>
      </div>

      {/* Row 2: Output Directory & App Icon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Output Destination Directory
          </label>
          <div className="relative flex items-center">
            <input
              id="output-dir-input"
              type="text"
              value={config.outputDir}
              onChange={(e) => handleTextChange("outputDir", e.target.value)}
              placeholder="~/Web2App_Builds"
              className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg pl-9 pr-3.5 py-2 text-sm text-slate-100 font-mono outline-none transition-colors"
            />
            <Folder className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Where compiled <code className="text-slate-400">.exe</code> and <code className="text-slate-400">.apk</code> binaries will be saved
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            App Icon (.ico for Windows, .png for Android)
          </label>
          <input
            id="app-icon-input"
            type="text"
            value={config.iconName}
            onChange={(e) => handleTextChange("iconName", e.target.value)}
            placeholder="icon.ico or icon.png (Optional)"
            className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            If left blank, standard high-res web app icon is auto-extracted
          </p>
        </div>
      </div>

      {/* Target Platforms & Engine Selection */}
      <div className="pt-2 border-t border-slate-800 space-y-3">
        <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
          Target Platforms &amp; Compilation Backends
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Windows .EXE card */}
          <div
            className={`border rounded-xl p-4 transition-all ${
              config.buildWindows
                ? "bg-slate-950 border-sky-500/40 ring-1 ring-sky-500/20"
                : "bg-slate-950/40 border-slate-800 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-md bg-sky-500/20 text-sky-400">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Windows Executable (.EXE)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Native desktop packaging
                  </span>
                </div>
              </div>
              <input
                id="checkbox-windows"
                type="checkbox"
                checked={config.buildWindows}
                onChange={(e) => handleTextChange("buildWindows", e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 bg-slate-800 border-slate-600 focus:ring-sky-500"
              />
            </div>

            {config.buildWindows && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                <label className="block text-[11px] font-medium text-slate-300">
                  Compilation Engine:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="windowsEngine"
                      checked={config.windowsEngine === "nativefier"}
                      onChange={() => handleTextChange("windowsEngine", "nativefier")}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                    <span>
                      <strong className="text-slate-100 font-medium">Nativefier</strong> (Electron / Node.js — Recommended)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="windowsEngine"
                      checked={config.windowsEngine === "pyinstaller"}
                      onChange={() => handleTextChange("windowsEngine", "pyinstaller")}
                      className="text-sky-500 focus:ring-sky-500"
                    />
                    <span>
                      <strong className="text-slate-100 font-medium">PyInstaller</strong> (PyWebView standalone wrapper)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Android .APK card */}
          <div
            className={`border rounded-xl p-4 transition-all ${
              config.buildAndroid
                ? "bg-slate-950 border-emerald-500/40 ring-1 ring-emerald-500/20"
                : "bg-slate-950/40 border-slate-800 opacity-60"
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    Android Package (.APK)
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Trusted Web Activity &amp; Hybrid
                  </span>
                </div>
              </div>
              <input
                id="checkbox-android"
                type="checkbox"
                checked={config.buildAndroid}
                onChange={(e) => handleTextChange("buildAndroid", e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500"
              />
            </div>

            {config.buildAndroid && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                <label className="block text-[11px] font-medium text-slate-300">
                  Compilation Engine:
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="androidEngine"
                      checked={config.androidEngine === "bubblewrap"}
                      onChange={() => handleTextChange("androidEngine", "bubblewrap")}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>
                      <strong className="text-slate-100 font-medium">Bubblewrap CLI</strong> (TWA / Play Store ready)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="androidEngine"
                      checked={config.androidEngine === "capacitor"}
                      onChange={() => handleTextChange("androidEngine", "capacitor")}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>
                      <strong className="text-slate-100 font-medium">Capacitor CLI</strong> (Lightweight hybrid container)
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Options Accordion */}
      <div className="pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{showAdvanced ? "Hide Advanced Window & Runtime Options" : "Show Advanced Window & Runtime Options"}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Window Width</label>
              <input
                type="number"
                value={config.windowWidth}
                onChange={(e) => handleTextChange("windowWidth", Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Window Height</label>
              <input
                type="number"
                value={config.windowHeight}
                onChange={(e) => handleTextChange("windowHeight", Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-200"
              />
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <input
                id="single-instance-chk"
                type="checkbox"
                checked={config.singleInstance}
                onChange={(e) => handleTextChange("singleInstance", e.target.checked)}
                className="rounded bg-slate-800 text-sky-500"
              />
              <label htmlFor="single-instance-chk" className="text-slate-300">
                Single Instance Lock
              </label>
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <input
                id="cache-chk"
                type="checkbox"
                checked={config.enableCache}
                onChange={(e) => handleTextChange("enableCache", e.target.checked)}
                className="rounded bg-slate-800 text-sky-500"
              />
              <label htmlFor="cache-chk" className="text-slate-300">
                Enable Disk Caching
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Build Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          id="start-compilation-btn"
          type="button"
          disabled={isBuilding || (!config.buildWindows && !config.buildAndroid)}
          onClick={onStartBuild}
          className="w-full sm:flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
        >
          {isBuilding ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Compilation Running in Background Thread...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Start Automated Compilation Pipeline</span>
            </>
          )}
        </button>

        {isBuilding && (
          <button
            id="cancel-compilation-btn"
            type="button"
            onClick={onCancelBuild}
            className="flex items-center justify-center space-x-1.5 py-3 px-5 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/60 text-rose-200 font-semibold text-sm transition-all"
          >
            <Ban className="w-4 h-4 text-rose-400" />
            <span>Cancel Build</span>
          </button>
        )}
      </div>
    </div>
  );
};
