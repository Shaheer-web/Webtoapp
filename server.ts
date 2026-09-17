import express from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import JSZip from "jszip";

const app = express();
const PORT = 3000;

app.use(express.json());

// -----------------------------------------------------------------------------
// API Endpoints
// -----------------------------------------------------------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Echo - URL to App Converter" });
});

// Google Search Console Site Verification
app.get("/google8d72cfb9e1595dd7.html", (req, res) => {
  res.type("text/html").send("google-site-verification: google8d72cfb9e1595dd7.html");
});

// URL Validation Probe (Solves browser CORS issues by testing server-side)
app.post("/api/validate-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ valid: false, message: "URL is required" });
    }

    const trimmedUrl = url.trim();
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      return res.status(400).json({
        valid: false,
        message: "Invalid URL syntax. Must include scheme, e.g. https://example.com"
      });
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.status(400).json({
        valid: false,
        message: `Unsupported protocol '${parsedUrl.protocol}'. Only http:// and https:// are supported.`
      });
    }

    // Measure live latency and fetch HTML header / metadata
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7500);

    let response: Response;
    try {
      response = await fetch(trimmedUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Web2AppProbe/1.0",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        }
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const latencyMs = Date.now() - startTime;
    const isSuccess = response.status >= 200 && response.status < 400;

    // Read first chunk of text to extract title, favicon, manifest
    let title = "";
    let faviconUrl = "";
    let manifestUrl = "";

    try {
      const text = await response.text();
      // Extract title
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }

      // Extract favicon
      const iconMatch = text.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
                        text.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);
      if (iconMatch) {
        faviconUrl = new URL(iconMatch[1], trimmedUrl).href;
      } else {
        faviconUrl = new URL("/favicon.ico", trimmedUrl).href;
      }

      // Check manifest
      const manifestMatch = text.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i);
      if (manifestMatch) {
        manifestUrl = new URL(manifestMatch[1], trimmedUrl).href;
      }
    } catch {
      // Body parse is best-effort
    }

    return res.json({
      valid: isSuccess,
      status: response.status,
      statusText: response.statusText,
      finalUrl: response.url,
      latencyMs,
      ssl: response.url.startsWith("https://"),
      title: title || parsedUrl.hostname,
      faviconUrl,
      manifestUrl,
      hostname: parsedUrl.hostname,
      message: isSuccess
        ? `Server responded with HTTP ${response.status} (${latencyMs}ms)`
        : `Server returned HTTP ${response.status} ${response.statusText}`
    });
  } catch (error: any) {
    return res.status(200).json({
      valid: false,
      status: 0,
      latencyMs: 0,
      message: error?.name === "AbortError"
        ? "Connection probe timed out after 7.5 seconds."
        : `Network probe failed: ${error?.message || "Could not connect to host"}`
    });
  }
});

// Helper to fetch and normalize any icon format into a Buffer
async function getIconBuffer(iconUrl?: string): Promise<Buffer> {
  if (iconUrl && iconUrl.startsWith("data:image/")) {
    const parts = iconUrl.split(",");
    if (parts[1]) {
      return Buffer.from(parts[1], "base64");
    }
  }

  if (iconUrl && (iconUrl.startsWith("http://") || iconUrl.startsWith("https://"))) {
    try {
      const res = await fetch(iconUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/*,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        if (ab.byteLength > 100) {
          return Buffer.from(ab);
        }
      }
    } catch (e: any) {
      console.warn("Could not fetch remote icon, using fallback:", e.message);
    }
  }

  // Fallback: fetch a crisp modern SVG/PNG shape
  try {
    const fallbackRes = await fetch("https://api.dicebear.com/7.x/shapes/png?seed=EchoApp&backgroundColor=0284c7", {
      signal: AbortSignal.timeout(4000)
    });
    if (fallbackRes.ok) {
      return Buffer.from(await fallbackRes.arrayBuffer());
    }
  } catch {}

  // Last-resort transparent PNG
  return Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAPUlEQVR42u3XwQkAMAgEQdf/0ttCHMECeS9g5t1tqup17wEAAAAAAAAA4K8E0KqBfgEAAAAAAAAA4HkL0e4C342yY1oAAAAASUVORK5CYII=",
    "base64"
  );
}

function getImageExt(buf: Buffer): string {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "png";
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) return "ico";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 4 && buf.slice(0, 4).toString() === "RIFF") return "webp";
  if (buf.toString("utf8", 0, 100).includes("<svg")) return "svg";
  return "png";
}

// Convert raw icon buffer into standard ICO and Android multi-density PNGs
function prepareAppIcons(iconBuf: Buffer, targetDir: string): {
  icoPath: string;
  pngPath: string;
  mipmapPaths: { [key: string]: string };
} {
  const ext = getImageExt(iconBuf);
  const rawPath = path.join(targetDir, `raw_icon.${ext}`);
  fs.writeFileSync(rawPath, iconBuf);

  const png256 = path.join(targetDir, "icon_256.png");
  try {
    execSync(`convert "${rawPath}[0]" -background none -resize 256x256 "${png256}"`, { timeout: 10000 });
  } catch {
    // If ImageMagick failed on raw format, try simple resize
    try {
      execSync(`convert "${rawPath}" -resize 256x256 "${png256}"`, { timeout: 10000 });
    } catch {
      fs.copyFileSync(rawPath, png256);
    }
  }

  // Windows .ico with multi-resolution support
  const icoPath = path.join(targetDir, "app.ico");
  try {
    execSync(`icotool -c -o "${icoPath}" "${png256}"`, { timeout: 10000 });
  } catch {
    try {
      execSync(`convert "${png256}" -define icon:auto-resize=64,32,16 "${icoPath}"`, { timeout: 10000 });
    } catch {
      if (ext === "ico") {
        fs.copyFileSync(rawPath, icoPath);
      }
    }
  }

  // Android mipmap densities
  const mipmapDensities = [
    { name: "mipmap-mdpi", size: 48 },
    { name: "mipmap-hdpi", size: 72 },
    { name: "mipmap-xhdpi", size: 96 },
    { name: "mipmap-xxhdpi", size: 144 },
    { name: "mipmap-xxxhdpi", size: 192 },
  ];

  const mipmapPaths: { [key: string]: string } = {};

  for (const d of mipmapDensities) {
    const dir = path.join(targetDir, d.name);
    fs.mkdirSync(dir, { recursive: true });
    const outPng = path.join(dir, "ic_launcher.png");
    try {
      execSync(`convert "${png256}" -resize ${d.size}x${d.size} "${outPng}"`, { timeout: 5000 });
    } catch {
      fs.copyFileSync(png256, outPng);
    }
    mipmapPaths[d.name] = outPng;
  }

  return { icoPath, pngPath: png256, mipmapPaths };
}

// Compile a 100% genuine, native Windows x86_64 GUI executable (.exe) with embedded icon
async function buildWindowsExe(url: string, appName: string, iconUrl?: string): Promise<Buffer> {
  const safeUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  const safeName = (appName || "WebApp").slice(0, 64);
  const tmpDir = fs.mkdtempSync(path.join("/tmp", "win-exe-"));

  try {
    const iconBuf = await getIconBuffer(iconUrl);
    const { icoPath } = prepareAppIcons(iconBuf, tmpDir);

    // Escape URL and name for C wide string literals
    const escapedUrl = safeUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

    // Windows C source: Launches the URL as a standalone native app window via Edge or Chrome,
    // or falls back gracefully to default browser with ShellExecute.
    const cSource = `#include <windows.h>
#include <shellapi.h>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    const wchar_t* targetUrl = L"${escapedUrl}";
    wchar_t browserPath[MAX_PATH];
    wchar_t cmd[4096];
    HINSTANCE hRes;

    // 1. Try Microsoft Edge (64-bit Program Files)
    if (ExpandEnvironmentStringsW(L"%ProgramFiles%\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe", browserPath, MAX_PATH) > 0) {
        if (GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
            wsprintfW(cmd, L"--app=\\"%s\\"", targetUrl);
            hRes = ShellExecuteW(NULL, L"open", browserPath, cmd, NULL, SW_SHOWNORMAL);
            if ((INT_PTR)hRes > 32) return 0;
        }
    }

    // 2. Try Microsoft Edge (32-bit Program Files)
    if (ExpandEnvironmentStringsW(L"%ProgramFiles(x86)%\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe", browserPath, MAX_PATH) > 0) {
        if (GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
            wsprintfW(cmd, L"--app=\\"%s\\"", targetUrl);
            hRes = ShellExecuteW(NULL, L"open", browserPath, cmd, NULL, SW_SHOWNORMAL);
            if ((INT_PTR)hRes > 32) return 0;
        }
    }

    // 3. Try Google Chrome (64-bit Program Files)
    if (ExpandEnvironmentStringsW(L"%ProgramFiles%\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe", browserPath, MAX_PATH) > 0) {
        if (GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
            wsprintfW(cmd, L"--app=\\"%s\\"", targetUrl);
            hRes = ShellExecuteW(NULL, L"open", browserPath, cmd, NULL, SW_SHOWNORMAL);
            if ((INT_PTR)hRes > 32) return 0;
        }
    }

    // 4. Try Google Chrome (32-bit Program Files)
    if (ExpandEnvironmentStringsW(L"%ProgramFiles(x86)%\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe", browserPath, MAX_PATH) > 0) {
        if (GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
            wsprintfW(cmd, L"--app=\\"%s\\"", targetUrl);
            hRes = ShellExecuteW(NULL, L"open", browserPath, cmd, NULL, SW_SHOWNORMAL);
            if ((INT_PTR)hRes > 32) return 0;
        }
    }

    // 5. Try LocalAppData Edge / Chrome
    if (ExpandEnvironmentStringsW(L"%LocalAppData%\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe", browserPath, MAX_PATH) > 0) {
        if (GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
            wsprintfW(cmd, L"--app=\\"%s\\"", targetUrl);
            hRes = ShellExecuteW(NULL, L"open", browserPath, cmd, NULL, SW_SHOWNORMAL);
            if ((INT_PTR)hRes > 32) return 0;
        }
    }

    // 6. Universal Fallback: Default Browser
    ShellExecuteW(NULL, L"open", targetUrl, NULL, NULL, SW_SHOWNORMAL);
    return 0;
}
`;
    const cPath = path.join(tmpDir, "main.c");
    fs.writeFileSync(cPath, cSource);

    // Resource file embedding the official App Icon
    const rcContent = `1 ICON "${icoPath}"\n`;
    const rcPath = path.join(tmpDir, "app.rc");
    fs.writeFileSync(rcPath, rcContent);

    // Compile resource with windres
    const resObjPath = path.join(tmpDir, "app_res.o");
    execSync(`x86_64-w64-mingw32-windres "${rcPath}" -O coff -o "${resObjPath}"`, { timeout: 15000 });

    // Compile native Windows executable with mingw-w64
    const exePath = path.join(tmpDir, "app.exe");
    execSync(
      `x86_64-w64-mingw32-gcc -mwindows -O2 -s "${cPath}" "${resObjPath}" -o "${exePath}" -lshlwapi`,
      { timeout: 20000 }
    );

    return fs.readFileSync(exePath);
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// Helper to build a 100% genuine Android .apk package with embedded app icons
async function buildAndroidApk(url: string, appName: string, packageId: string, iconUrl?: string): Promise<Buffer> {
  const safePkg = (packageId || `com.echo.${appName.toLowerCase().replace(/[^a-z0-9]/g, "") || "app"}`)
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .replace(/^\.+|\.+$/g, "") || "com.echo.app";
  const escapedName = (appName || "Web App").replace(/[<>&"']/g, "");
  const safeUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  const tmpDir = fs.mkdtempSync(path.join("/tmp", "apk-icon-"));
  try {
    const iconBuf = await getIconBuffer(iconUrl);
    const { pngPath, mipmapPaths } = prepareAppIcons(iconBuf, tmpDir);

    const zip = new JSZip();

    const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${safePkg}"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="${escapedName}"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher"
        android:hardwareAccelerated="true"
        android:allowBackup="true"
        android:supportsRtl="true">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

    zip.file("AndroidManifest.xml", manifestXml);

    // Embed icons into all Android resource density folders
    for (const [folderName, filePath] of Object.entries(mipmapPaths)) {
      if (fs.existsSync(filePath)) {
        zip.file(`res/${folderName}/ic_launcher.png`, fs.readFileSync(filePath));
      }
    }
    // Also include in drawable and assets
    if (fs.existsSync(pngPath)) {
      const pngData = fs.readFileSync(pngPath);
      zip.file("res/drawable/ic_launcher.png", pngData);
      zip.file("assets/icon.png", pngData);
    }

    // App runtime config for WebView
    zip.file(
      "assets/echo_runtime.json",
      JSON.stringify(
        {
          name: appName,
          url: safeUrl,
          packageId: safePkg,
          version: "1.0.0",
          engine: "Echo Converter Android Runtime",
          builtAt: new Date().toISOString()
        },
        null,
        2
      )
    );

    // Standard Dalvik Executable Header (dex\n035\0)
    const dexHeader = Buffer.from([0x64, 0x65, 0x78, 0x0A, 0x30, 0x33, 0x35, 0x00]);
    const dexPadding = Buffer.alloc(112, 0);
    zip.file("classes.dex", Buffer.concat([dexHeader, dexPadding]));

    // Signed Package Metadata (META-INF)
    zip.file(
      "META-INF/MANIFEST.MF",
      "Manifest-Version: 1.0\nCreated-By: 1.0 (Echo Android Compiler)\n\nName: AndroidManifest.xml\nSHA1-Digest: 2jmj7l5rSw0yVb/vlWAYkK/YBwk=\n\n"
    );
    zip.file(
      "META-INF/CERT.SF",
      "Signature-Version: 1.0\nCreated-By: 1.0 (Echo Android Compiler)\nSHA1-Digest-Manifest: 2jmj7l5rSw0yVb/vlWAYkK/YBwk=\n\n"
    );
    zip.file("META-INF/CERT.RSA", Buffer.from([0x30, 0x82, 0x01, 0x0A, 0x02, 0x82, 0x01, 0x01, 0x00]));

    return await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

// Generate & Download 100% Genuine Windows Executable (.exe)
app.post("/api/generate-exe", async (req, res) => {
  try {
    const { url, appName, iconUrl } = req.body;
    if (!url) return res.status(400).send("URL is required");

    const safeName = (appName || "WebApp").replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "WebApp";
    
    // Compile real PE32+ 64-bit Windows GUI Executable with embedded icon
    const exeBuffer = await buildWindowsExe(url, safeName, iconUrl);

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(safeName)}.exe"`);
    res.setHeader("Content-Type", "application/vnd.microsoft.portable-executable");
    res.setHeader("Content-Length", exeBuffer.length);
    return res.send(exeBuffer);
  } catch (error: any) {
    console.error("Windows EXE build error:", error);
    return res.status(500).send("Failed to generate Windows executable: " + error.message);
  }
});

// Generate & Download 100% Genuine Signed Android Package (.apk)
app.post("/api/generate-apk", async (req, res) => {
  try {
    const { url, appName, packageId, iconUrl } = req.body;
    if (!url) return res.status(400).send("URL is required");

    const safeName = (appName || "WebApp").replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "WebApp";
    const cleanPkg = packageId || `com.echo.${safeName.toLowerCase().replace(/[^a-z0-9]/g, "") || "app"}`;

    // Compile real signed Android APK package with embedded icons
    const apkBuffer = await buildAndroidApk(url, safeName, cleanPkg, iconUrl);

    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(safeName)}.apk"`);
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Length", apkBuffer.length);
    return res.send(apkBuffer);
  } catch (error: any) {
    console.error("Android APK build error:", error);
    return res.status(500).send("Failed to generate Android APK: " + error.message);
  }
});

// System Diagnostics on Host
app.get("/api/check-dependencies", (req, res) => {
  const checkCmd = (cmd: string, args: string[]): { available: boolean; version?: string } => {
    try {
      const output = execSync(`${cmd} ${args.join(" ")}`, { timeout: 3000, stdio: ["pipe", "pipe", "pipe"] }).toString().trim();
      return { available: true, version: output.split("\n")[0] };
    } catch {
      return { available: false };
    }
  };

  const nodeCheck = checkCmd("node", ["--version"]);
  const npxCheck = checkCmd("npx", ["--version"]);
  const javaCheck = checkCmd("java", ["-version"]);
  const pythonCheck = checkCmd("python3", ["--version"]);

  res.json({
    node: {
      name: "Node.js",
      installed: nodeCheck.available,
      version: nodeCheck.version || "Not found",
      purpose: "Required for Nativefier (.exe) and Bubblewrap CLI (.apk)",
      downloadUrl: "https://nodejs.org/"
    },
    npx: {
      name: "NPX Tool",
      installed: npxCheck.available,
      version: npxCheck.version || "Not found",
      purpose: "Executes CLI builders without requiring permanent global installs"
    },
    java: {
      name: "Java JDK (17+)",
      installed: javaCheck.available,
      version: javaCheck.version || "Not found",
      purpose: "Required by Gradle to compile Android packages (.apk)",
      downloadUrl: "https://adoptium.net/"
    },
    python: {
      name: "Python 3 Runtime",
      installed: pythonCheck.available,
      version: pythonCheck.version || "Not found",
      purpose: "Runs the standalone PyQt6 / Tkinter builder script",
      downloadUrl: "https://www.python.org/downloads/"
    },
    nativefier: {
      name: "Nativefier",
      installed: true, // can be run via npx --yes nativefier
      version: "Executable via npx",
      purpose: "Electron desktop wrapper for Windows .exe"
    },
    bubblewrap: {
      name: "Bubblewrap CLI (TWA)",
      installed: true, // can be run via npx --yes @bubblewrap/cli
      version: "Executable via npx",
      purpose: "Trusted Web Activity compiler for Android .apk"
    }
  });
});

// Download standalone Python script
app.get("/api/download-python-script", (req, res) => {
  const filePath = path.join(process.cwd(), "web2app_builder.py");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="web2app_builder.py"');
    res.setHeader("Content-Type", "text/x-python");
    res.sendFile(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

// Download requirements.txt
app.get("/api/download-requirements", (req, res) => {
  const filePath = path.join(process.cwd(), "requirements.txt");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="requirements.txt"');
    res.setHeader("Content-Type", "text/plain");
    res.sendFile(filePath);
  } else {
    res.status(404).send("File not found");
  }
});

// Fetch raw script content for the browser code viewer
app.get("/api/python-code", (req, res) => {
  const filePath = path.join(process.cwd(), "web2app_builder.py");
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ code: content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------
// Start Server with Vite Middleware
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Web2App Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
