export const ECHO_LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYcIQWfKm61CCUiN_fQXj55cBN9_HVXzway2Tkhl5COx4HCm3L8TANtBtR&s=10";

export interface AppProject {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
  description?: string;
  status: "completed" | "ready" | "building";
  buildCount: number;
  lastBuilt: string;
  createdAt: string;
  packageId?: string;
}

export interface UrlValidationResult {
  valid: boolean;
  status: number;
  statusText?: string;
  finalUrl?: string;
  latencyMs: number;
  ssl?: boolean;
  title?: string;
  faviconUrl?: string;
  manifestUrl?: string;
  hostname?: string;
  message: string;
}

export type DashboardView = "apps" | "builds" | "settings";

export interface DownloadNotification {
  id: string;
  type: "preparing" | "downloading" | "completed" | "error";
  title: string;
  message: string;
  appName: string;
  format: "EXE" | "APK";
  timestamp: string;
}

// Types for companion components
export interface BuildFormConfig {
  appName: string;
  targetUrl: string;
  packageId: string;
  outputDir: string;
  iconName: string;
  buildWindows: boolean;
  buildAndroid: boolean;
  windowsEngine: "nativefier" | "pyinstaller";
  androidEngine: "bubblewrap" | "capacitor";
  windowWidth: number;
  windowHeight: number;
  enableCache: boolean;
  singleInstance: boolean;
  maximizeOnOpen: boolean;
}

export interface LogItem {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "success" | "cmd";
  text: string;
}

export interface SystemTool {
  name: string;
  installed: boolean;
  version?: string;
  purpose: string;
  downloadUrl?: string;
}

export interface SystemDiagnostics {
  node: SystemTool;
  npx: SystemTool;
  java: SystemTool;
  python: SystemTool;
  nativefier: SystemTool;
  bubblewrap: SystemTool;
}

export type ActiveTab = "builder" | "python-code" | "diagnostics" | "architecture";
