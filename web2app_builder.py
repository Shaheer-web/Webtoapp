#!/usr/bin/env python3
"""
================================================================================
  Web2App Executable & APK Builder
  ------------------------------------------------------------------------------
  A production-ready cross-platform GUI application that compiles any web URL
  into a working Windows Executable (.exe) and an Android Package (.apk).

  Author: Senior Cross-Platform Systems Engineer
  Requirements:
    - Python 3.9+
    - PyQt6 (pip install PyQt6 requests)
    - Optional backup webview: pip install pywebview pyinstaller
    - Node.js 18+ (for Nativefier & Bubblewrap CLI)
    - Java JDK 17+ & Android SDK (for .apk generation)
================================================================================
"""

import os
import sys
import re
import json
import shutil
import platform
import subprocess
import threading
import tempfile
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

# ------------------------------------------------------------------------------
# GUI Library Import with Graceful Fallback
# ------------------------------------------------------------------------------
GUI_BACKEND = "PyQt6"
try:
    from PyQt6.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QLabel, QLineEdit, QPushButton, QProgressBar, QTextEdit, QFileDialog,
        QCheckBox, QComboBox, QGroupBox, QTabWidget, QSplitter, QMessageBox,
        QFrame, QStatusBar, QSpinBox
    )
    from PyQt6.QtCore import Qt, QThread, pyqtSignal, QObject, QUrl
    from PyQt6.QtGui import QFont, QIcon, QColor, QTextCursor
except ImportError:
    # If PyQt6 is not installed, we provide a clean Tkinter fallback
    GUI_BACKEND = "Tkinter"
    import tkinter as tk
    from tkinter import ttk, filedialog, messagebox, scrolledtext


# ==============================================================================
# CONSTANTS & DEFAULT CONFIGURATIONS
# ==============================================================================
APP_TITLE = "Web2App Executable & APK Builder"
APP_VERSION = "2.4.0 (Production Release)"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

DEFAULT_WIDTH = 1280
DEFAULT_HEIGHT = 800

# Color Palette for PyQt6 Dark/Modern Theme
COLOR_BG = "#0f172a"          # Slate 900
COLOR_PANEL = "#1e293b"       # Slate 800
COLOR_CARD = "#334155"        # Slate 700
COLOR_ACCENT = "#38bdf8"      # Light Blue 400
COLOR_ACCENT_HOVER = "#0284c7" # Sky 600
COLOR_TEXT = "#f8fafc"        # Slate 50
COLOR_MUTED = "#94a3b8"       # Slate 400
COLOR_SUCCESS = "#22c55e"     # Green 500
COLOR_WARNING = "#f59e0b"     # Amber 500
COLOR_ERROR = "#ef4444"       # Red 500


# ==============================================================================
# UTILITY HELPERS & SYSTEM PROBES
# ==============================================================================
class SystemInspector:
    """Probes system environment and locates compilers, SDKs, and runtimes."""

    @staticmethod
    def which(cmd: str) -> Optional[str]:
        """Cross-platform binary locator with .exe/.cmd/.bat support on Windows."""
        return shutil.which(cmd)

    @staticmethod
    def run_quick_cmd(args: List[str]) -> Tuple[bool, str]:
        """Executes a fast probe command and returns (success, stdout_stripped)."""
        try:
            res = subprocess.run(
                args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=5,
                creationflags=subprocess.CREATE_NO_WINDOW if platform.system() == "Windows" else 0
            )
            if res.returncode == 0:
                return True, res.stdout.strip()
            return False, res.stderr.strip() or res.stdout.strip()
        except Exception as e:
            return False, str(e)

    @classmethod
    def check_all_dependencies(cls) -> Dict[str, Dict[str, Any]]:
        """
        Inspects all required system dependencies:
          - Node.js & npm / npx
          - Java JDK
          - Android SDK
          - Nativefier
          - Bubblewrap CLI
          - PyInstaller & PyWebView (Python fallback)
        """
        results = {}

        # 1. Node.js
        node_path = cls.which("node")
        if node_path:
            ok, ver = cls.run_quick_cmd(["node", "--version"])
            results["Node.js"] = {
                "installed": True,
                "version": ver if ok else "Detected",
                "path": node_path,
                "notes": "Ready for Electron/Nativefier and Bubblewrap TWA."
            }
        else:
            results["Node.js"] = {
                "installed": False,
                "version": None,
                "path": None,
                "notes": "Missing! Download Node.js LTS (v18+) from https://nodejs.org/"
            }

        # 2. NPX
        npx_path = cls.which("npx")
        results["npx"] = {
            "installed": bool(npx_path),
            "version": "Available" if npx_path else None,
            "path": npx_path,
            "notes": "Required to execute on-demand packages without global install."
        }

        # 3. Java JDK
        java_path = cls.which("java")
        java_home = os.environ.get("JAVA_HOME")
        if java_path:
            ok, ver = cls.run_quick_cmd(["java", "-version"])
            # java -version outputs to stderr in many JDK distributions
            results["Java JDK"] = {
                "installed": True,
                "version": ver.split("\n")[0] if ver else "Detected",
                "path": java_path,
                "java_home": java_home or "Not explicitly set in environment",
                "notes": "Required for compiling Android .APK files via Gradle/Bubblewrap."
            }
        else:
            results["Java JDK"] = {
                "installed": False,
                "version": None,
                "path": None,
                "notes": "Missing! Download OpenJDK 17 or 21 from https://adoptium.net/ (Set JAVA_HOME)."
            }

        # 4. Android SDK
        android_home = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
        discovered_sdk = None
        if android_home and os.path.isdir(android_home):
            discovered_sdk = android_home
        else:
            # Common default fallback paths
            if platform.system() == "Windows":
                candidate = os.path.expandvars(r"%LOCALAPPDATA%\Android\Sdk")
                if os.path.isdir(candidate):
                    discovered_sdk = candidate
            elif platform.system() == "Darwin":
                candidate = os.path.expanduser("~/Library/Android/sdk")
                if os.path.isdir(candidate):
                    discovered_sdk = candidate
            else:
                candidate = os.path.expanduser("~/Android/Sdk")
                if os.path.isdir(candidate):
                    discovered_sdk = candidate

        results["Android SDK"] = {
            "installed": bool(discovered_sdk),
            "path": discovered_sdk or "Not detected",
            "notes": "Needed for building Android .APK packages. Install via Android Studio or cmdline-tools."
        }

        # 5. Nativefier CLI
        nativefier_path = cls.which("nativefier")
        results["Nativefier"] = {
            "installed": bool(nativefier_path),
            "path": nativefier_path or "Will execute via 'npx nativefier'",
            "notes": "Can run directly or automated seamlessly via npx."
        }

        # 6. Bubblewrap CLI
        bubblewrap_path = cls.which("bubblewrap")
        results["Bubblewrap"] = {
            "installed": bool(bubblewrap_path),
            "path": bubblewrap_path or "Will execute via 'npx @bubblewrap/cli'",
            "notes": "Generates Google Play-compliant Trusted Web Activity (TWA) APKs."
        }

        # 7. Python PyInstaller & PyWebView
        pyinstaller_path = cls.which("pyinstaller")
        results["PyInstaller"] = {
            "installed": bool(pyinstaller_path),
            "path": pyinstaller_path or "Not found",
            "notes": "Optional fallback for Python-native PyWebView .exe generation."
        }

        return results


# ==============================================================================
# URL VALIDATOR ENGINE
# ==============================================================================
class URLValidator:
    """Validates target URL syntax and tests live network reachability."""

    @staticmethod
    def validate_syntax(url_str: str) -> Tuple[bool, str]:
        """Checks URL format, scheme, and host."""
        if not url_str or not url_str.strip():
            return False, "Target URL cannot be empty."

        url_str = url_str.strip()
        parsed = urllib.parse.urlparse(url_str)

        if parsed.scheme not in ("http", "https"):
            return False, f"Invalid protocol '{parsed.scheme}'. URL must start with http:// or https://"

        if not parsed.netloc:
            return False, "Invalid host domain or IP address in URL."

        # Hostname regex validation
        host_match = re.match(r"^([a-zA-Z0-9-_\.]+)(:\d+)?$", parsed.netloc)
        if not host_match:
            return False, f"Malformed domain or port: '{parsed.netloc}'"

        return True, "Valid URL format."

    @staticmethod
    def test_reachability(url_str: str, timeout_sec: int = 8) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Sends an HTTP HEAD or GET request to verify server is active and responding.
        Returns: (is_reachable, message_summary, metadata_dict)
        """
        syntax_ok, syntax_msg = URLValidator.validate_syntax(url_str)
        if not syntax_ok:
            return False, syntax_msg, {}

        req = urllib.request.Request(
            url_str,
            headers={"User-Agent": USER_AGENT, "Accept": "*/*"}
        )

        try:
            # Try HEAD first for lightweight response, fallback to GET if 405 Method Not Allowed
            try:
                req.get_method = lambda: "HEAD"
                with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                    status = resp.status
                    final_url = resp.geturl()
                    headers = dict(resp.getheaders())
            except urllib.error.HTTPError as e:
                if e.code in (405, 403):
                    # Try standard GET
                    req.get_method = lambda: "GET"
                    with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                        status = resp.status
                        final_url = resp.geturl()
                        headers = dict(resp.getheaders())
                else:
                    return False, f"HTTP Server Error: {e.code} ({e.reason})", {}

            # Read a small chunk to extract title or favicon if HTML
            title = None
            try:
                req_get = urllib.request.Request(url_str, headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(req_get, timeout=timeout_sec) as get_resp:
                    content_type = get_resp.headers.get("Content-Type", "")
                    if "html" in content_type:
                        chunk = get_resp.read(16384).decode("utf-8", errors="ignore")
                        title_match = re.search(r"<title>(.*?)</title>", chunk, re.IGNORECASE | re.DOTALL)
                        if title_match:
                            title = title_match.group(1).strip()
            except Exception:
                pass

            meta = {
                "status_code": status,
                "final_url": final_url,
                "title": title or "Web Application",
                "content_type": headers.get("Content-Type", "Unknown"),
                "server": headers.get("Server", "Unknown"),
                "is_ssl": final_url.startswith("https://")
            }

            return True, f"Active and Reachable (HTTP {status})", meta

        except urllib.error.URLError as e:
            return False, f"Network Connection Failed: {e.reason}", {}
        except TimeoutError:
            return False, f"Connection Timed Out after {timeout_sec}s.", {}
        except Exception as e:
            return False, f"Reachability Probe Failed: {str(e)}", {}


# ==============================================================================
# ASYNCHRONOUS COMPILATION WORKER & PIPELINE
# ==============================================================================
class BuildJobConfig:
    """Data container holding all compilation configurations."""
    def __init__(
        self,
        app_name: str,
        target_url: str,
        output_dir: str,
        package_id: str = "com.web2app.bundle",
        icon_path: Optional[str] = None,
        build_windows: bool = True,
        build_android: bool = True,
        windows_engine: str = "nativefier",  # 'nativefier' or 'pyinstaller'
        android_engine: str = "bubblewrap",  # 'bubblewrap' or 'capacitor'
        window_width: int = DEFAULT_WIDTH,
        window_height: int = DEFAULT_HEIGHT,
        enable_cache: bool = True,
        single_instance: bool = True
    ):
        self.app_name = app_name
        self.target_url = target_url
        self.output_dir = output_dir
        self.package_id = package_id
        self.icon_path = icon_path
        self.build_windows = build_windows
        self.build_android = build_android
        self.windows_engine = windows_engine
        self.android_engine = android_engine
        self.window_width = window_width
        self.window_height = window_height
        self.enable_cache = enable_cache
        self.single_instance = single_instance


class BuildWorkerSignals(QObject if GUI_BACKEND == "PyQt6" else object):
    """Signals emitted during background compilation to update GUI in real-time."""
    if GUI_BACKEND == "PyQt6":
        log_message = pyqtSignal(str, str)  # (message, level: INFO/WARN/ERROR/SUCCESS)
        progress = pyqtSignal(int)          # 0 to 100
        step_changed = pyqtSignal(str)      # description of current stage
        finished = pyqtSignal(bool, str)    # (success, final_summary)
    else:
        def __init__(self):
            self.log_callbacks = []
            self.progress_callbacks = []
            self.finish_callbacks = []


class CompilationPipeline:
    """
    Executes the complete multi-stage compilation flow:
    1. Validation of parameters and directories
    2. Windows .EXE packaging via Nativefier or PyInstaller+PyWebView
    3. Android .APK packaging via Bubblewrap TWA or Capacitor
    """
    def __init__(self, config: BuildJobConfig, emitter_callback=None, progress_callback=None):
        self.config = config
        self.emitter = emitter_callback
        self.progress_cb = progress_callback
        self._is_cancelled = False

    def log(self, msg: str, level: str = "INFO"):
        if self.emitter:
            self.emitter(msg, level)
        else:
            print(f"[{level}] {msg}")

    def update_progress(self, percent: int, step: str = ""):
        if self.progress_cb:
            self.progress_cb(percent, step)

    def cancel(self):
        self._is_cancelled = True
        self.log("Cancellation requested by user. Aborting...", "WARN")

    def run_process_streaming(self, cmd: List[str], cwd: Optional[str] = None, env: Optional[Dict[str, str]] = None) -> bool:
        """Runs a subprocess command and streams its stdout/stderr line-by-line."""
        if self._is_cancelled:
            return False

        cmd_display = " ".join(cmd)
        self.log(f"$ {cmd_display}", "INFO")

        try:
            full_env = os.environ.copy()
            if env:
                full_env.update(env)

            process = subprocess.Popen(
                cmd,
                cwd=cwd,
                env=full_env,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1,
                universal_newlines=True,
                creationflags=subprocess.CREATE_NO_WINDOW if platform.system() == "Windows" else 0
            )

            for line in iter(process.stdout.readline, ""):
                if self._is_cancelled:
                    process.terminate()
                    return False
                clean_line = line.rstrip()
                if clean_line:
                    # Categorize output line based on keywords
                    lvl = "INFO"
                    lower = clean_line.lower()
                    if "error" in lower or "fatal" in lower or "failed" in lower:
                        lvl = "ERROR"
                    elif "warn" in lower or "warning" in lower:
                        lvl = "WARN"
                    elif "success" in lower or "done" in lower or "completed" in lower:
                        lvl = "SUCCESS"
                    self.log(f"  > {clean_line}", lvl)

            process.stdout.close()
            return_code = process.wait()
            return return_code == 0
        except FileNotFoundError:
            self.log(f"Execution failed: Command '{cmd[0]}' not found on system PATH.", "ERROR")
            return False
        except Exception as e:
            self.log(f"Subprocess exception: {str(e)}", "ERROR")
            return False

    # --------------------------------------------------------------------------
    # 1. Windows Executable Compilation (.EXE)
    # --------------------------------------------------------------------------
    def build_windows_nativefier(self, target_dir: str) -> bool:
        """Uses Nativefier (via local binary or npx) to build an Electron .exe."""
        self.log("=== Launching Windows .EXE Builder (Nativefier Engine) ===", "INFO")
        self.update_progress(15, "Configuring Nativefier arguments...")

        # Sanitize app name for filenames
        safe_name = re.sub(r'[^a-zA-Z0-9_\- ]', '', self.config.app_name).strip() or "WebApp"

        # Determine binary command
        nativefier_bin = SystemInspector.which("nativefier")
        if nativefier_bin:
            base_cmd = [nativefier_bin]
        else:
            npx_bin = SystemInspector.which("npx")
            if not npx_bin:
                self.log("Neither 'nativefier' nor 'npx' was found in system PATH. Cannot compile Electron app.", "ERROR")
                self.log("Please install Node.js (https://nodejs.org) and run: npm install -g nativefier", "WARN")
                return False
            base_cmd = [npx_bin, "--yes", "nativefier"]

        # Assemble Nativefier arguments
        cmd = list(base_cmd)
        cmd.append(self.config.target_url)
        cmd.extend(["--name", safe_name])
        cmd.extend(["--platform", "windows"])
        cmd.extend(["--arch", "x64"])
        cmd.extend(["--width", str(self.config.window_width)])
        cmd.extend(["--height", str(self.config.window_height)])
        cmd.append("--maximize")
        
        if self.config.single_instance:
            cmd.append("--single-instance")

        # Custom Icon handling
        if self.config.icon_path and os.path.isfile(self.config.icon_path):
            cmd.extend(["--icon", os.path.abspath(self.config.icon_path)])

        cmd.extend(["--user-agent", USER_AGENT])
        cmd.append(target_dir)

        self.update_progress(25, "Running Nativefier electron compilation...")
        success = self.run_process_streaming(cmd)

        if success:
            self.log(f"Windows Executable successfully packaged into: {target_dir}", "SUCCESS")
            return True
        else:
            self.log("Nativefier compilation reported errors.", "ERROR")
            return False

    def build_windows_pyinstaller(self, target_dir: str) -> bool:
        """Fallback: Generates a custom PyWebView launcher and packages with PyInstaller."""
        self.log("=== Launching Windows .EXE Builder (PyInstaller + PyWebView Engine) ===", "INFO")
        self.update_progress(20, "Generating PyWebView standalone wrapper script...")

        safe_name = re.sub(r'[^a-zA-Z0-9_]', '_', self.config.app_name).strip() or "WebApp"
        temp_workdir = tempfile.mkdtemp(prefix="web2app_pywebview_")

        try:
            # 1. Write the PyWebView wrapper script
            script_path = os.path.join(temp_workdir, "app_launcher.py")
            wrapper_code = f"""# -*- coding: utf-8 -*-
import sys
import webview

def main():
    window = webview.create_window(
        title="{self.config.app_name}",
        url="{self.config.target_url}",
        width={self.config.window_width},
        height={self.config.window_height},
        resizable=True,
        fullscreen=False,
        confirm_close=False
    )
    webview.start(debug=False, user_agent="{USER_AGENT}")

if __name__ == "__main__":
    main()
"""
            with open(script_path, "w", encoding="utf-8") as f:
                f.write(wrapper_code)

            self.log(f"Generated launcher script at: {script_path}", "INFO")

            # 2. Check for PyInstaller
            pyinstaller_bin = SystemInspector.which("pyinstaller")
            if not pyinstaller_bin:
                self.log("PyInstaller is not installed in the current Python environment.", "ERROR")
                self.log("Install it via: pip install pyinstaller pywebview", "WARN")
                return False

            # 3. Assemble PyInstaller build command
            dist_dir = os.path.join(target_dir, f"{safe_name}_pyinstaller_dist")
            os.makedirs(dist_dir, exist_ok=True)

            cmd = [
                pyinstaller_bin,
                "--noconsole",
                "--onefile",
                "--name", safe_name,
                "--distpath", dist_dir,
                "--workpath", os.path.join(temp_workdir, "build"),
                "--specpath", temp_workdir,
            ]

            if self.config.icon_path and os.path.isfile(self.config.icon_path):
                cmd.extend(["--icon", os.path.abspath(self.config.icon_path)])

            cmd.append(script_path)

            self.update_progress(35, "Running PyInstaller bundling...")
            success = self.run_process_streaming(cmd, cwd=temp_workdir)

            if success:
                self.log(f"PyInstaller .EXE successfully created in: {dist_dir}", "SUCCESS")
                return True
            else:
                self.log("PyInstaller compilation failed.", "ERROR")
                return False

        finally:
            # Clean temporary build scripts
            try:
                shutil.rmtree(temp_workdir, ignore_errors=True)
            except Exception:
                pass

    # --------------------------------------------------------------------------
    # 2. Android Package Compilation (.APK)
    # --------------------------------------------------------------------------
    def build_android_bubblewrap(self, target_dir: str) -> bool:
        """
        Uses Bubblewrap CLI (Google Trusted Web Activity / TWA) to produce a production .APK.
        Generates manifest.json, twa-manifest.json, and automates gradle build.
        """
        self.log("=== Launching Android .APK Builder (Bubblewrap TWA Engine) ===", "INFO")
        self.update_progress(55, "Checking Java JDK and Android SDK requirements...")

        # 1. Environment checks
        java_home = os.environ.get("JAVA_HOME")
        android_home = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")

        if not java_home:
            # Check if java is in PATH anyway
            if not SystemInspector.which("java"):
                self.log("Java JDK is required for compiling Android APKs. JAVA_HOME is not set.", "ERROR")
                self.log("Please install OpenJDK 17+ and configure JAVA_HOME environment variable.", "WARN")
                return False
            else:
                self.log("JAVA_HOME is not explicitly set, but 'java' binary was discovered in PATH.", "WARN")

        # 2. Bubblewrap CLI binary
        bw_bin = SystemInspector.which("bubblewrap")
        if bw_bin:
            base_cmd = [bw_bin]
        else:
            npx_bin = SystemInspector.which("npx")
            if not npx_bin:
                self.log("Cannot run Bubblewrap: Neither 'bubblewrap' nor 'npx' is available.", "ERROR")
                self.log("Install Node.js and run: npm install -g @bubblewrap/cli", "WARN")
                return False
            base_cmd = [npx_bin, "--yes", "@bubblewrap/cli"]

        # 3. Create project workspace
        apk_project_dir = os.path.join(target_dir, "android_twa_project")
        os.makedirs(apk_project_dir, exist_ok=True)

        parsed_url = urllib.parse.urlparse(self.config.target_url)
        host_domain = parsed_url.netloc or "example.com"
        package_name = self.config.package_id or f"com.{host_domain.replace('.', '_')}.app"

        self.update_progress(65, "Scaffolding TWA manifest and project...")

        # 4. Generate twa-manifest.json
        twa_manifest = {
            "packageId": package_name,
            "host": host_domain,
            "name": self.config.app_name,
            "launcherName": self.config.app_name[:12],
            "themeColor": "#0F172A",
            "navigationColor": "#0F172A",
            "backgroundColor": "#0F172A",
            "enableNotifications": True,
            "startUrl": parsed_url.path or "/",
            "iconUrl": f"{self.config.target_url.rstrip('/')}/favicon.ico",
            "maskableIconUrl": f"{self.config.target_url.rstrip('/')}/favicon.ico",
            "appVersionName": "1.0.0",
            "appVersionCode": 1,
            "shortcuts": [],
            "generatorApp": "Web2App-Builder-Desktop",
            "webManifestUrl": f"{self.config.target_url.rstrip('/')}/manifest.json",
            "fallbackType": "customtabs",
            "features": {
                "locationDelegation": {"enabled": True},
                "playBilling": {"enabled": False}
            },
            "alphaDependencies": {"enabled": False}
        }

        manifest_file = os.path.join(apk_project_dir, "twa-manifest.json")
        with open(manifest_file, "w", encoding="utf-8") as mf:
            json.dump(twa_manifest, mf, indent=2)

        self.log(f"Generated twa-manifest.json for package: {package_name}", "INFO")

        # 5. Initialize Bubblewrap project
        init_cmd = list(base_cmd)
        init_cmd.extend(["init", "--manifest", manifest_file, "--directory", apk_project_dir])

        self.update_progress(75, "Initializing Bubblewrap project structure...")
        init_ok = self.run_process_streaming(init_cmd, cwd=apk_project_dir)

        # 6. Run Bubblewrap build
        self.update_progress(85, "Compiling Android APK via Gradle...")
        build_cmd = list(base_cmd)
        build_cmd.extend(["build", "--skipPwaValidation"])

        build_ok = self.run_process_streaming(build_cmd, cwd=apk_project_dir)

        if build_ok:
            self.log(f"Android APK generated successfully in: {apk_project_dir}", "SUCCESS")
            return True
        else:
            self.log("Bubblewrap APK build encountered an issue (check Gradle logs above).", "ERROR")
            self.log("Tip: If Android SDK / licenses are missing, run 'bubblewrap doctor' to configure SDK paths.", "WARN")
            return False

    # --------------------------------------------------------------------------
    # Main Execution Entry
    # --------------------------------------------------------------------------
    def execute(self) -> Tuple[bool, str]:
        """Runs the selected pipelines sequentially."""
        self.log(f"Starting Web2App compilation for: {self.config.app_name}", "INFO")
        self.log(f"Target URL: {self.config.target_url}", "INFO")
        self.log(f"Output Destination: {self.config.output_dir}", "INFO")

        os.makedirs(self.config.output_dir, exist_ok=True)
        results = []

        # 1. Validate URL before proceeding
        self.update_progress(5, "Validating Target URL reachability...")
        valid, msg, meta = URLValidator.test_reachability(self.config.target_url)
        if not valid:
            err = f"Pre-build validation aborted: {msg}"
            self.log(err, "ERROR")
            return False, err

        self.log(f"URL Confirmed Active! Server response: {meta.get('status_code', 200)}", "SUCCESS")

        # 2. Windows Executable Build
        if self.config.build_windows:
            win_out = os.path.join(self.config.output_dir, "windows")
            os.makedirs(win_out, exist_ok=True)

            if self.config.windows_engine == "nativefier":
                ok = self.build_windows_nativefier(win_out)
            else:
                ok = self.build_windows_pyinstaller(win_out)

            results.append(("Windows .EXE", ok))

        # 3. Android Package Build
        if self.config.build_android:
            android_out = os.path.join(self.config.output_dir, "android")
            os.makedirs(android_out, exist_ok=True)

            ok = self.build_android_bubblewrap(android_out)
            results.append(("Android .APK", ok))

        self.update_progress(100, "Compilation pipeline completed.")

        # Summary
        all_passed = all(item[1] for item in results) if results else False
        summary_lines = ["Build Results:"]
        for target, status in results:
            summary_lines.append(f" - {target}: {'SUCCESS' if status else 'FAILED'}")

        final_msg = "\n".join(summary_lines)
        self.log(final_msg, "SUCCESS" if all_passed else "WARN")

        return all_passed, final_msg


# ==============================================================================
# PYQT6 THREADED WORKER WRAPPER
# ==============================================================================
if GUI_BACKEND == "PyQt6":
    class PyQtBuildWorker(QThread):
        """Asynchronous QThread worker to prevent GUI freezing during long builds."""
        log_signal = pyqtSignal(str, str)
        progress_signal = pyqtSignal(int, str)
        finished_signal = pyqtSignal(bool, str)

        def __init__(self, config: BuildJobConfig):
            super().__init__()
            self.config = config
            self.pipeline: Optional[CompilationPipeline] = None

        def run(self):
            def emitter(msg, lvl):
                self.log_signal.emit(msg, lvl)

            def progress_cb(pct, step):
                self.progress_signal.emit(pct, step)

            self.pipeline = CompilationPipeline(
                self.config,
                emitter_callback=emitter,
                progress_callback=progress_cb
            )
            success, message = self.pipeline.execute()
            self.finished_signal.emit(success, message)

        def cancel(self):
            if self.pipeline:
                self.pipeline.cancel()


# ==============================================================================
# PYQT6 MODERN GRAPHICAL USER INTERFACE
# ==============================================================================
if GUI_BACKEND == "PyQt6":
    class Web2AppMainWindow(QMainWindow):
        """Main PyQt6 Application Window with modern styling, validation, and live streaming."""

        def __init__(self):
            super().__init__()
            self.worker: Optional[PyQtBuildWorker] = None
            self.init_ui()
            self.run_startup_diagnostics()

        def init_ui(self):
            self.setWindowTitle(f"{APP_TITLE} v{APP_VERSION}")
            self.resize(1150, 780)
            self.setMinimumSize(950, 650)
            self.apply_dark_theme()

            # Main central widget
            central_widget = QWidget(self)
            self.setCentralWidget(central_widget)
            main_layout = QVBoxLayout(central_widget)
            main_layout.setContentsMargins(16, 16, 16, 16)
            main_layout.setSpacing(12)

            # Header Banner
            header_box = QFrame()
            header_box.setObjectName("headerCard")
            h_layout = QHBoxLayout(header_box)
            h_layout.setContentsMargins(16, 12, 16, 12)

            title_layout = QVBoxLayout()
            lbl_title = QLabel(APP_TITLE)
            lbl_title.setStyleSheet("font-size: 19px; font-weight: 700; color: #f8fafc;")
            lbl_sub = QLabel("Convert any website or PWA into production-grade Windows .EXE and Android .APK binaries.")
            lbl_sub.setStyleSheet("font-size: 12px; color: #94a3b8;")
            title_layout.addWidget(lbl_title)
            title_layout.addWidget(lbl_sub)
            h_layout.addLayout(title_layout)
            h_layout.addStretch()

            btn_diag = QPushButton("Check Dependencies")
            btn_diag.clicked.connect(self.run_startup_diagnostics)
            btn_diag.setStyleSheet("padding: 6px 14px; background-color: #334155; border: 1px solid #475569; border-radius: 6px; color: #f8fafc;")
            h_layout.addWidget(btn_diag)

            main_layout.addWidget(header_box)

            # Splitter: Left panel (Form Controls), Right panel (Live Console)
            splitter = QSplitter(Qt.Orientation.Horizontal)
            splitter.setHandleWidth(8)

            # --- Left Control Panel ---
            left_scroll_widget = QWidget()
            left_layout = QVBoxLayout(left_scroll_widget)
            left_layout.setContentsMargins(0, 0, 8, 0)
            left_layout.setSpacing(12)

            # 1. Target URL & Verification Group
            url_group = QGroupBox("Target Website URL")
            url_layout = QVBoxLayout(url_group)

            url_input_row = QHBoxLayout()
            self.txt_url = QLineEdit()
            self.txt_url.setPlaceholderText("https://example.com or your web app URL")
            self.txt_url.setText("https://github.com")
            self.txt_url.textChanged.connect(self.on_url_text_changed)

            self.btn_validate_url = QPushButton("Test URL")
            self.btn_validate_url.clicked.connect(self.validate_url_clicked)
            self.btn_validate_url.setStyleSheet("background-color: #0284c7; color: white; font-weight: 600; padding: 6px 14px; border-radius: 6px;")
            url_input_row.addWidget(self.txt_url)
            url_input_row.addWidget(self.btn_validate_url)
            url_layout.addLayout(url_input_row)

            self.lbl_url_status = QLabel("Ready to validate URL.")
            self.lbl_url_status.setStyleSheet("color: #94a3b8; font-size: 11px;")
            url_layout.addWidget(self.lbl_url_status)
            left_layout.addWidget(url_group)

            # 2. Application Identity Group
            app_group = QGroupBox("Application Metadata")
            app_layout = QVBoxLayout(app_group)

            lbl_name = QLabel("Application Display Name:")
            self.txt_app_name = QLineEdit()
            self.txt_app_name.setText("My Web App")
            app_layout.addWidget(lbl_name)
            app_layout.addWidget(self.txt_app_name)

            lbl_pkg = QLabel("Android Package ID (e.g. com.company.app):")
            self.txt_package_id = QLineEdit()
            self.txt_package_id.setText("com.web2app.bundle")
            app_layout.addWidget(lbl_pkg)
            app_layout.addWidget(self.txt_package_id)

            # Icon row
            lbl_icon = QLabel("Custom Icon (.ico or .png):")
            icon_row = QHBoxLayout()
            self.txt_icon = QLineEdit()
            self.txt_icon.setPlaceholderText("Optional path to custom app icon")
            btn_browse_icon = QPushButton("Browse...")
            btn_browse_icon.clicked.connect(self.browse_icon_clicked)
            icon_row.addWidget(self.txt_icon)
            icon_row.addWidget(btn_browse_icon)
            app_layout.addWidget(lbl_icon)
            app_layout.addLayout(icon_row)

            # Output directory row
            lbl_out = QLabel("Output Directory:")
            out_row = QHBoxLayout()
            self.txt_output_dir = QLineEdit()
            default_out = os.path.join(os.path.expanduser("~"), "Web2App_Builds")
            self.txt_output_dir.setText(default_out)
            btn_browse_out = QPushButton("Browse...")
            btn_browse_out.clicked.connect(self.browse_output_clicked)
            out_row.addWidget(self.txt_output_dir)
            out_row.addWidget(btn_browse_out)
            app_layout.addWidget(lbl_out)
            app_layout.addLayout(out_row)

            left_layout.addWidget(app_group)

            # 3. Compilation Targets & Engines Group
            target_group = QGroupBox("Compilation Platforms & Engines")
            target_layout = QVBoxLayout(target_group)

            # Windows options
            self.chk_build_windows = QCheckBox("Build Windows Executable (.EXE)")
            self.chk_build_windows.setChecked(True)
            self.chk_build_windows.toggled.connect(self.toggle_windows_options)
            target_layout.addWidget(self.chk_build_windows)

            win_engine_row = QHBoxLayout()
            lbl_win_engine = QLabel("  Windows Backend:")
            self.combo_win_engine = QComboBox()
            self.combo_win_engine.addItem("Nativefier (Electron / Node.js - Recommended)", "nativefier")
            self.combo_win_engine.addItem("PyInstaller + PyWebView (Pure Python)", "pyinstaller")
            win_engine_row.addWidget(lbl_win_engine)
            win_engine_row.addWidget(self.combo_win_engine)
            target_layout.addLayout(win_engine_row)

            # Android options
            self.chk_build_android = QCheckBox("Build Android Package (.APK)")
            self.chk_build_android.setChecked(True)
            self.chk_build_android.toggled.connect(self.toggle_android_options)
            target_layout.addWidget(self.chk_build_android)

            android_engine_row = QHBoxLayout()
            lbl_android_engine = QLabel("  Android Backend:")
            self.combo_android_engine = QComboBox()
            self.combo_android_engine.addItem("Bubblewrap CLI (Trusted Web Activity - TWA)", "bubblewrap")
            android_engine_row.addWidget(lbl_android_engine)
            android_engine_row.addWidget(self.combo_android_engine)
            target_layout.addLayout(android_engine_row)

            left_layout.addWidget(target_group)

            # Action Buttons: Start Build & Abort
            btn_layout = QHBoxLayout()
            self.btn_build = QPushButton("Compile & Build Packages")
            self.btn_build.setObjectName("btnPrimary")
            self.btn_build.setFixedHeight(44)
            self.btn_build.clicked.connect(self.start_build_clicked)

            self.btn_cancel = QPushButton("Cancel")
            self.btn_cancel.setObjectName("btnCancel")
            self.btn_cancel.setFixedHeight(44)
            self.btn_cancel.setEnabled(False)
            self.btn_cancel.clicked.connect(self.cancel_build_clicked)

            btn_layout.addWidget(self.btn_build, 3)
            btn_layout.addWidget(self.btn_cancel, 1)
            left_layout.addLayout(btn_layout)
            left_layout.addStretch()

            splitter.addWidget(left_scroll_widget)

            # --- Right Panel: Live Console & Build Status ---
            right_widget = QWidget()
            right_layout = QVBoxLayout(right_widget)
            right_layout.setContentsMargins(8, 0, 0, 0)
            right_layout.setSpacing(8)

            console_header = QHBoxLayout()
            lbl_console = QLabel("Build Log & Compiler Stream")
            lbl_console.setStyleSheet("font-weight: 700; color: #f8fafc;")
            btn_clear_log = QPushButton("Clear Console")
            btn_clear_log.setStyleSheet("padding: 4px 10px; background: #334155; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1;")
            btn_clear_log.clicked.connect(self.clear_console)
            console_header.addWidget(lbl_console)
            console_header.addStretch()
            console_header.addWidget(btn_clear_log)
            right_layout.addLayout(console_header)

            # Live Log Console
            self.txt_console = QTextEdit()
            self.txt_console.setReadOnly(True)
            self.txt_console.setFont(QFont("Consolas", 10))
            self.txt_console.setStyleSheet("""
                QTextEdit {
                    background-color: #020617;
                    color: #e2e8f0;
                    border: 1px solid #1e293b;
                    border-radius: 8px;
                    padding: 8px;
                }
            """)
            right_layout.addWidget(self.txt_console)

            # Progress Bar & Stage Label
            self.lbl_stage = QLabel("System idle. Ready to initiate compilation.")
            self.lbl_stage.setStyleSheet("color: #94a3b8; font-size: 12px;")
            right_layout.addWidget(self.lbl_stage)

            self.progress_bar = QProgressBar()
            self.progress_bar.setRange(0, 100)
            self.progress_bar.setValue(0)
            self.progress_bar.setStyleSheet("""
                QProgressBar {
                    background-color: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 6px;
                    height: 14px;
                    text-align: center;
                    color: white;
                    font-size: 10px;
                }
                QProgressBar::chunk {
                    background-color: #38bdf8;
                    border-radius: 5px;
                }
            """)
            right_layout.addWidget(self.progress_bar)

            splitter.addWidget(right_widget)
            splitter.setStretchFactor(0, 4)
            splitter.setStretchFactor(1, 6)

            main_layout.addWidget(splitter)

            # Status bar
            self.status_bar = QStatusBar()
            self.setStatusBar(self.status_bar)
            self.status_bar.showMessage("Web2App Builder Initialized.")

        def apply_dark_theme(self):
            """Applies professional slate dark theme stylesheet to PyQt6 application."""
            self.setStyleSheet(f"""
                QMainWindow, QWidget {{
                    background-color: {COLOR_BG};
                    color: {COLOR_TEXT};
                    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
                    font-size: 13px;
                }}
                QFrame#headerCard {{
                    background-color: {COLOR_PANEL};
                    border: 1px solid #334155;
                    border-radius: 8px;
                }}
                QGroupBox {{
                    background-color: {COLOR_PANEL};
                    border: 1px solid #334155;
                    border-radius: 8px;
                    margin-top: 14px;
                    padding-top: 14px;
                    font-weight: 600;
                    color: #38bdf8;
                }}
                QGroupBox::title {{
                    subcontrol-origin: margin;
                    subcontrol-position: top left;
                    left: 12px;
                    padding: 0 4px;
                }}
                QLineEdit, QComboBox {{
                    background-color: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 6px;
                    padding: 6px 10px;
                    color: #f8fafc;
                }}
                QLineEdit:focus, QComboBox:focus {{
                    border: 1px solid #38bdf8;
                }}
                QPushButton {{
                    background-color: #334155;
                    border: 1px solid #475569;
                    border-radius: 6px;
                    padding: 6px 12px;
                    color: #f8fafc;
                }}
                QPushButton:hover {{
                    background-color: #475569;
                }}
                QPushButton#btnPrimary {{
                    background-color: #0284c7;
                    border: 1px solid #38bdf8;
                    font-weight: 700;
                    font-size: 14px;
                }}
                QPushButton#btnPrimary:hover {{
                    background-color: #0369a1;
                }}
                QPushButton#btnCancel {{
                    background-color: #b91c1c;
                    border: 1px solid #ef4444;
                    font-weight: 600;
                }}
                QCheckBox {{
                    color: #e2e8f0;
                    spacing: 8px;
                }}
                QSplitter::handle {{
                    background-color: #1e293b;
                }}
            """)

        # ----------------------------------------------------------------------
        # Event Handlers & GUI Logic
        # ----------------------------------------------------------------------
        def on_url_text_changed(self, text: str):
            self.lbl_url_status.setText("URL modified. Click 'Test URL' to verify active reachability.")
            self.lbl_url_status.setStyleSheet("color: #94a3b8; font-size: 11px;")

        def validate_url_clicked(self):
            url = self.txt_url.text().strip()
            self.btn_validate_url.setEnabled(False)
            self.lbl_url_status.setText("Pinging web server...")
            self.lbl_url_status.setStyleSheet("color: #38bdf8; font-size: 11px;")

            # Run check in a lightweight background thread to avoid UI hiccup
            def async_check():
                valid, msg, meta = URLValidator.test_reachability(url)
                # Auto update app name if empty or default
                title = meta.get("title")
                return valid, msg, title

            def on_done(result):
                valid, msg, title = result
                self.btn_validate_url.setEnabled(True)
                if valid:
                    self.lbl_url_status.setText(f"✓ {msg}")
                    self.lbl_url_status.setStyleSheet("color: #22c55e; font-size: 11px; font-weight: 600;")
                    self.append_log(f"URL Validation Success: {url} is online and responding.", "SUCCESS")
                    if title and self.txt_app_name.text() in ("My Web App", "Web Application", ""):
                        self.txt_app_name.setText(title)
                        self.append_log(f"Auto-populated App Name from webpage title: '{title}'", "INFO")
                else:
                    self.lbl_url_status.setText(f"✗ {msg}")
                    self.lbl_url_status.setStyleSheet("color: #ef4444; font-size: 11px; font-weight: 600;")
                    self.append_log(f"URL Validation Error: {msg}", "ERROR")

            t = threading.Thread(target=lambda: on_done(async_check()))
            t.daemon = True
            t.start()

        def browse_icon_clicked(self):
            file_path, _ = QFileDialog.getOpenFileName(
                self, "Select Application Icon", "", "Icon Files (*.ico *.png);;All Files (*)"
            )
            if file_path:
                self.txt_icon.setText(file_path)

        def browse_output_clicked(self):
            folder_path = QFileDialog.getExistingDirectory(self, "Select Output Directory")
            if folder_path:
                self.txt_output_dir.setText(folder_path)

        def toggle_windows_options(self, checked: bool):
            self.combo_win_engine.setEnabled(checked)

        def toggle_android_options(self, checked: bool):
            self.combo_android_engine.setEnabled(checked)

        def clear_console(self):
            self.txt_console.clear()

        def append_log(self, message: str, level: str = "INFO"):
            """Appends color-coded output line to the QTextEdit console."""
            color_map = {
                "INFO": "#94a3b8",
                "WARN": "#f59e0b",
                "ERROR": "#ef4444",
                "SUCCESS": "#22c55e"
            }
            color = color_map.get(level, "#e2e8f0")
            html_msg = f'<span style="color: {color};">[{level}] {message}</span>'
            self.txt_console.append(html_msg)
            self.txt_console.moveCursor(QTextCursor.MoveOperation.End)

        def run_startup_diagnostics(self):
            """Scans environment and logs missing dependencies with direct download guidance."""
            self.append_log("=== Running System Tool Diagnostics ===", "INFO")
            deps = SystemInspector.check_all_dependencies()

            all_ok = True
            for name, info in deps.items():
                if info.get("installed"):
                    ver_str = f" ({info.get('version')})" if info.get("version") else ""
                    self.append_log(f"✓ {name}: Available{ver_str} -> {info.get('path', '')}", "SUCCESS")
                else:
                    self.append_log(f"✗ {name}: NOT FOUND! {info.get('notes')}", "WARN")
                    if name in ("Node.js", "Java JDK"):
                        all_ok = False

            if all_ok:
                self.append_log("All core toolchains detected. System ready for building!", "SUCCESS")
            else:
                self.append_log("Notice: Some compilers are missing. Review warnings above before packaging.", "WARN")

        # ----------------------------------------------------------------------
        # Build Workflow Execution
        # ----------------------------------------------------------------------
        def start_build_clicked(self):
            url = self.txt_url.text().strip()
            app_name = self.txt_app_name.text().strip()
            output_dir = self.txt_output_dir.text().strip()
            package_id = self.txt_package_id.text().strip()
            icon_path = self.txt_icon.text().strip() or None

            # Input validation
            if not url:
                QMessageBox.warning(self, "Validation Error", "Please specify a Target URL.")
                return

            if not app_name:
                QMessageBox.warning(self, "Validation Error", "Please provide an Application Name.")
                return

            if not self.chk_build_windows.isChecked() and not self.chk_build_android.isChecked():
                QMessageBox.warning(self, "Selection Error", "Please select at least one target platform (Windows or Android).")
                return

            # Construct build config
            config = BuildJobConfig(
                app_name=app_name,
                target_url=url,
                output_dir=output_dir,
                package_id=package_id,
                icon_path=icon_path,
                build_windows=self.chk_build_windows.isChecked(),
                build_android=self.chk_build_android.isChecked(),
                windows_engine=self.combo_win_engine.currentData(),
                android_engine=self.combo_android_engine.currentData(),
            )

            # Update UI state to Running
            self.btn_build.setEnabled(False)
            self.btn_cancel.setEnabled(True)
            self.progress_bar.setValue(0)
            self.lbl_stage.setText("Starting build worker thread...")

            # Launch background worker thread
            self.worker = PyQtBuildWorker(config)
            self.worker.log_signal.connect(self.append_log)
            self.worker.progress_signal.connect(self.on_worker_progress)
            self.worker.finished_signal.connect(self.on_worker_finished)
            self.worker.start()

        def on_worker_progress(self, percent: int, step: str):
            self.progress_bar.setValue(percent)
            if step:
                self.lbl_stage.setText(step)

        def on_worker_finished(self, success: bool, message: str):
            self.btn_build.setEnabled(True)
            self.btn_cancel.setEnabled(False)
            self.lbl_stage.setText("Build finished.")

            if success:
                QMessageBox.information(self, "Build Complete", f"Success!\n\nOutput packages saved to:\n{self.txt_output_dir.text()}")
            else:
                QMessageBox.warning(self, "Build Ended with Warnings", f"The build finished with issues:\n\n{message}\nCheck the live log console for details.")

        def cancel_build_clicked(self):
            if self.worker:
                self.worker.cancel()
                self.btn_cancel.setEnabled(False)
                self.lbl_stage.setText("Cancelling build...")


# ==============================================================================
# TKINTER FALLBACK IMPLEMENTATION (Zero External Dependencies)
# ==============================================================================
elif GUI_BACKEND == "Tkinter":
    class TkinterWeb2AppApp:
        """Lightweight GUI fallback using standard Python Tkinter."""
        def __init__(self, root):
            self.root = root
            self.root.title(f"{APP_TITLE} (Tkinter Edition)")
            self.root.geometry("900x650")
            self.root.minsize(750, 500)
            self.build_thread: Optional[threading.Thread] = None
            self.pipeline: Optional[CompilationPipeline] = None
            self.setup_ui()
            self.check_diagnostics()

        def setup_ui(self):
            pad = {"padx": 10, "pady": 5}
            
            # Header
            lbl_title = ttk.Label(self.root, text=APP_TITLE, font=("Helvetica", 14, "bold"))
            lbl_title.pack(anchor="w", **pad)

            # URL
            url_frame = ttk.LabelFrame(self.root, text="Target Website URL")
            url_frame.pack(fill="x", **pad)
            self.ent_url = ttk.Entry(url_frame)
            self.ent_url.insert(0, "https://github.com")
            self.ent_url.pack(side="left", fill="x", expand=True, padx=5, pady=5)
            btn_test = ttk.Button(url_frame, text="Test URL", command=self.test_url)
            btn_test.pack(side="right", padx=5, pady=5)

            # Metadata
            meta_frame = ttk.LabelFrame(self.root, text="Application Identity")
            meta_frame.pack(fill="x", **pad)

            ttk.Label(meta_frame, text="App Name:").grid(row=0, column=0, sticky="w", padx=5, pady=2)
            self.ent_name = ttk.Entry(meta_frame)
            self.ent_name.insert(0, "My Web App")
            self.ent_name.grid(row=0, column=1, sticky="ew", padx=5, pady=2)

            ttk.Label(meta_frame, text="Output Directory:").grid(row=1, column=0, sticky="w", padx=5, pady=2)
            self.ent_out = ttk.Entry(meta_frame)
            self.ent_out.insert(0, os.path.join(os.path.expanduser("~"), "Web2App_Builds"))
            self.ent_out.grid(row=1, column=1, sticky="ew", padx=5, pady=2)
            meta_frame.columnconfigure(1, weight=1)

            # Build Button
            self.btn_build = ttk.Button(self.root, text="Compile .EXE and .APK", command=self.start_build)
            self.btn_build.pack(fill="x", padx=10, pady=8)

            # Log Console
            self.log_area = scrolledtext.ScrolledText(self.root, height=18, bg="#1e1e1e", fg="#d4d4d4", font=("Consolas", 9))
            self.log_area.pack(fill="both", expand=True, padx=10, pady=5)

        def log(self, text, lvl="INFO"):
            self.log_area.insert("end", f"[{lvl}] {text}\n")
            self.log_area.see("end")

        def test_url(self):
            url = self.ent_url.get().strip()
            valid, msg, meta = URLValidator.test_reachability(url)
            self.log(f"URL Check: {msg}", "SUCCESS" if valid else "ERROR")

        def check_diagnostics(self):
            self.log("Running Dependency Checks...", "INFO")
            deps = SystemInspector.check_all_dependencies()
            for k, v in deps.items():
                status = "OK" if v.get("installed") else "MISSING"
                self.log(f"  {k}: {status}", "SUCCESS" if status == "OK" else "WARN")

        def start_build(self):
            config = BuildJobConfig(
                app_name=self.ent_name.get().strip(),
                target_url=self.ent_url.get().strip(),
                output_dir=self.ent_out.get().strip()
            )
            self.pipeline = CompilationPipeline(config, emitter_callback=self.log)
            self.build_thread = threading.Thread(target=self.pipeline.execute)
            self.build_thread.daemon = True
            self.build_thread.start()


# ==============================================================================
# MAIN APPLICATION ENTRY POINT
# ==============================================================================
def main():
    print(f"Starting {APP_TITLE} (Using GUI Backend: {GUI_BACKEND})...")
    if GUI_BACKEND == "PyQt6":
        app = QApplication(sys.argv)
        app.setApplicationName(APP_TITLE)
        window = Web2AppMainWindow()
        window.show()
        sys.exit(app.exec())
    else:
        root = tk.Tk()
        app = TkinterWeb2AppApp(root)
        root.mainloop()


if __name__ == "__main__":
    main()
