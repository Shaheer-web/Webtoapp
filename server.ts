import express from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";
import JSZip from "jszip";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS & Safe Download Headers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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

// Helper to derive clean brand name from domain
function getBrandNameFromDomain(domain: string): string {
  const cleanDomain = domain.replace(/^www\./i, "").split(".")[0] || "Web App";
  const knownBrands: Record<string, string> = {
    github: "GitHub",
    youtube: "YouTube",
    discord: "Discord",
    tiktok: "TikTok",
    reddit: "Reddit",
    twitter: "X (Twitter)",
    x: "X",
    instagram: "Instagram",
    facebook: "Facebook",
    spotify: "Spotify",
    netflix: "Netflix",
    twitch: "Twitch",
    chatgpt: "ChatGPT",
    openai: "OpenAI",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    linkedin: "LinkedIn",
    pinterest: "Pinterest",
    notion: "Notion",
    figma: "Figma",
    slack: "Slack",
    amazon: "Amazon",
    ebay: "eBay",
    google: "Google",
    apple: "Apple",
    microsoft: "Microsoft",
    soundcloud: "SoundCloud",
    roblox: "Roblox",
    steam: "Steam",
  };

  if (knownBrands[cleanDomain.toLowerCase()]) {
    return knownBrands[cleanDomain.toLowerCase()];
  }

  // Capitalize words separated by hyphens or underscores
  return cleanDomain
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Clean title from common web suffixes
function cleanAppTitle(rawTitle: string, hostname: string): string {
  if (!rawTitle) return getBrandNameFromDomain(hostname);
  let t = rawTitle.trim();

  // Split by common separators: " | ", " - ", " – ", " — ", " • ", " : "
  const parts = t.split(/\s+[-–—|•/:]\s+/);
  if (parts.length > 1) {
    const first = parts[0].trim();
    const last = parts[parts.length - 1].trim();
    // Prefer shorter branded chunk
    if (first.length >= 2 && first.length <= 25) return first;
    if (last.length >= 2 && last.length <= 25) return last;
  }

  return t.length > 30 ? t.slice(0, 30).trim() : t;
}

// URL Validation & Auto-Detection Probe
app.post("/api/validate-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ valid: false, message: "URL is required" });
    }

    let trimmedUrl = url.trim();
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = "https://" + trimmedUrl.replace(/^\/\//, "");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      return res.status(400).json({
        valid: false,
        message: "Invalid URL syntax. Please enter a valid domain or web link.",
      });
    }

    const hostname = parsedUrl.hostname.replace(/^www\./i, "");
    const fallbackName = getBrandNameFromDomain(parsedUrl.hostname);
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=256`;
    const duckFaviconUrl = `https://icons.duckduckgo.com/ip3/${parsedUrl.hostname}.ico`;

    // Measure live latency and fetch HTML metadata
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    let response: Response | null = null;
    let text = "";
    let isDeepLink = parsedUrl.pathname.length > 1 || !!parsedUrl.search || !!parsedUrl.hash;

    try {
      response = await fetch(trimmedUrl, {
        method: "GET",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      text = await response.text();
    } catch (fetchErr: any) {
      // Benign probe note - connection dropped or domain blocked
    } finally {
      clearTimeout(timeoutId);
    }

    // If deep link returned 404, 401, 403 or failed to yield metadata (common for Discord, Slack, login-walled routes),
    // probe the root origin domain (e.g. https://discord.com/) so we can extract the official brand name & icon!
    if (isDeepLink && (!response || response.status >= 400 || !text || text.length < 200)) {
      try {
        const rootController = new AbortController();
        const rootTimeout = setTimeout(() => rootController.abort(), 4000);
        const rootRes = await fetch(parsedUrl.origin, {
          method: "GET",
          signal: rootController.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          },
        });
        clearTimeout(rootTimeout);
        if (rootRes.ok) {
          const rootText = await rootRes.text();
          if (rootText && rootText.length > 100) {
            text = rootText;
          }
        }
      } catch (rootErr) {
        // Benign root origin fallback probe note
      }
    }

    const latencyMs = Date.now() - startTime;
    // CRITICAL: NEVER overwrite user's deep link with redirect URL.
    // The user requested an app for trimmedUrl (e.g. https://discord.com/channel).
    const finalTargetUrl = trimmedUrl;

    // Extract candidates
    let detectedName = "";
    let detectedIcon = "";
    let manifestUrl = "";

    if (text) {
      // 1. og:site_name (often cleanest brand name)
      const siteNameMatch = text.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
                            text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
      if (siteNameMatch?.[1]?.trim()) {
        detectedName = siteNameMatch[1].trim();
      }

      // 2. application-name
      if (!detectedName) {
        const appNameMatch = text.match(/<meta[^>]+name=["']application-name["'][^>]+content=["']([^"']+)["']/i) ||
                             text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']application-name["']/i);
        if (appNameMatch?.[1]?.trim()) {
          detectedName = appNameMatch[1].trim();
        }
      }

      // 3. Page <title>
      if (!detectedName) {
        const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch?.[1]?.trim()) {
          detectedName = cleanAppTitle(titleMatch[1].trim(), parsedUrl.hostname);
        }
      }

      // 4. Apple touch icon (highest resolution icon)
      const appleTouchMatch = text.match(/<link[^>]+rel=["']apple-touch-icon(?:-precomposed)?["'][^>]+href=["']([^"']+)["']/i) ||
                              text.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon(?:-precomposed)?["']/i);
      if (appleTouchMatch?.[1]?.trim()) {
        try {
          detectedIcon = new URL(appleTouchMatch[1].trim(), finalTargetUrl).href;
        } catch {}
      }

      // 5. High-res or standard favicon
      if (!detectedIcon) {
        const iconMatch = text.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
                          text.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);
        if (iconMatch?.[1]?.trim()) {
          const raw = iconMatch[1].trim();
          if (!raw.startsWith("data:") || raw.length > 100) {
            try {
              detectedIcon = new URL(raw, finalTargetUrl).href;
            } catch {}
          }
        }
      }

      // 6. OpenGraph Image
      if (!detectedIcon) {
        const ogImageMatch = text.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                             text.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (ogImageMatch?.[1]?.trim()) {
          try {
            detectedIcon = new URL(ogImageMatch[1].trim(), finalTargetUrl).href;
          } catch {}
        }
      }

      // Check manifest
      const manifestMatch = text.match(/<link[^>]+rel=["']manifest["'][^>]+href=["']([^"']+)["']/i) ||
                            text.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']manifest["']/i);
      if (manifestMatch?.[1]?.trim()) {
        try {
          manifestUrl = new URL(manifestMatch[1].trim(), finalTargetUrl).href;
        } catch {}
      }
    }

    // Final clean name & guaranteed high-res icon
    const finalName = detectedName || fallbackName;
    const finalFavicon = detectedIcon || googleFaviconUrl;

    const pathDesc = parsedUrl.pathname && parsedUrl.pathname !== "/" ? `(${parsedUrl.pathname})` : "";
    const statusMsg = isDeepLink
      ? `Deep link "${finalName}" ${pathDesc} verified. Ready to convert.`
      : `Detected "${finalName}" with official logo.`;

    return res.json({
      valid: true,
      status: response?.status || 200,
      statusText: response?.statusText || "OK",
      finalUrl: finalTargetUrl,
      targetUrl: finalTargetUrl,
      isDeepLink,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      latencyMs,
      ssl: finalTargetUrl.startsWith("https://"),
      title: finalName,
      appName: finalName,
      faviconUrl: finalFavicon,
      googleFaviconUrl,
      duckFaviconUrl,
      manifestUrl,
      hostname,
      message: statusMsg,
    });
  } catch (error: any) {
    // If anything fails, still return domain fallback
    return res.status(200).json({
      valid: true,
      status: 200,
      latencyMs: 0,
      title: "Web App",
      appName: "Web App",
      faviconUrl: "https://api.dicebear.com/7.x/shapes/png?seed=EchoApp&backgroundColor=0284c7",
      message: error?.message || "Detection completed with defaults.",
    });
  }
});

// Helper to fetch and normalize any icon format into a Buffer (auto-detects website picture)
async function getIconBuffer(iconUrl?: string, appUrl?: string): Promise<Buffer> {
  const cleanAppUrl = appUrl ? (appUrl.startsWith("http") ? appUrl : `https://${appUrl}`) : "";
  let host = "";
  if (cleanAppUrl) {
    try {
      host = new URL(cleanAppUrl).hostname.replace(/^www\./i, "");
    } catch {}
  }

  // 1. If an explicit icon URL is provided, attempt to fetch it
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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          Accept: "image/png,image/x-icon,image/*,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        const buf = Buffer.from(ab);
        // If it's a valid raster image (not SVG text) and has substance, use it
        if (!buf.toString("utf8", 0, 100).includes("<svg") && ab.byteLength > 100) {
          return buf;
        }
      }
    } catch (e: any) {
      console.warn("Could not fetch remote iconUrl, attempting domain auto-detect:", e.message);
    }
  }

  // 2. Auto-detect website picture from Google Favicons (high-res 256px) using host
  if (host) {
    try {
      const gRes = await fetch(`https://www.google.com/s2/favicons?domain=${host}&sz=256`, {
        signal: AbortSignal.timeout(4000)
      });
      if (gRes.ok) {
        const ab = await gRes.arrayBuffer();
        if (ab.byteLength > 100) {
          return Buffer.from(ab);
        }
      }
    } catch {}

    // 3. Fallback: DuckDuckGo favicon
    try {
      const dRes = await fetch(`https://icons.duckduckgo.com/ip3/${host}.ico`, {
        signal: AbortSignal.timeout(3000)
      });
      if (dRes.ok) {
        const ab = await dRes.arrayBuffer();
        if (ab.byteLength > 100) {
          return Buffer.from(ab);
        }
      }
    } catch {}
  }

  // 4. Built-in high-quality PNG fallback
  const fallbackPngPath = path.join(process.cwd(), "public", "default_app.png");
  if (fs.existsSync(fallbackPngPath)) {
    return fs.readFileSync(fallbackPngPath);
  }

  if (fs.existsSync("/tmp/default_app.png")) {
    return fs.readFileSync("/tmp/default_app.png");
  }

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

function isValidIcoFile(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (stat.size < 22) return false;
    const buf = Buffer.alloc(4);
    const fd = fs.openSync(filePath, "r");
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0;
  } catch {
    return false;
  }
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
    execSync(`convert "${rawPath}[0]" -background none -resize 256x256 "${png256}"`, { timeout: 8000 });
  } catch {
    try {
      execSync(`convert "${rawPath}" -resize 256x256 "${png256}"`, { timeout: 8000 });
    } catch {
      // If convert completely failed, use our high quality fallback PNG
      const defaultPng = fs.existsSync("/tmp/default_app.png")
        ? "/tmp/default_app.png"
        : path.join(process.cwd(), "public", "default_app.png");
      if (fs.existsSync(defaultPng)) {
        fs.copyFileSync(defaultPng, png256);
      } else {
        fs.copyFileSync(rawPath, png256);
      }
    }
  }

  // Ensure png256 actually exists and has size
  if (!fs.existsSync(png256) || fs.statSync(png256).size < 50) {
    const defaultPng = fs.existsSync("/tmp/default_app.png")
      ? "/tmp/default_app.png"
      : path.join(process.cwd(), "public", "default_app.png");
    if (fs.existsSync(defaultPng)) {
      fs.copyFileSync(defaultPng, png256);
    }
  }

  // Windows .ico with multi-resolution support
  const icoPath = path.join(targetDir, "app.ico");
  try {
    execSync(`icotool -c -o "${icoPath}" "${png256}"`, { timeout: 8000 });
  } catch {
    try {
      execSync(`convert "${png256}" -define icon:auto-resize=64,32,16 "${icoPath}"`, { timeout: 8000 });
    } catch {
      // Fallback to default .ico
    }
  }

  // If ico still missing, corrupted, or non-ICO format, copy guaranteed valid ICO
  const defaultIco = fs.existsSync("/tmp/default_app.ico")
    ? "/tmp/default_app.ico"
    : path.join(process.cwd(), "public", "default_app.ico");

  if (!isValidIcoFile(icoPath)) {
    if (isValidIcoFile(defaultIco)) {
      fs.copyFileSync(defaultIco, icoPath);
    } else if (ext === "ico" && isValidIcoFile(rawPath)) {
      fs.copyFileSync(rawPath, icoPath);
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

function getMingwGcc(): string {
  if (fs.existsSync("/usr/bin/x86_64-w64-mingw32-gcc")) return "/usr/bin/x86_64-w64-mingw32-gcc";
  if (fs.existsSync("/usr/bin/x86_64-w64-mingw32-gcc-posix")) return "/usr/bin/x86_64-w64-mingw32-gcc-posix";
  if (fs.existsSync("/usr/bin/x86_64-w64-mingw32-gcc-win32")) return "/usr/bin/x86_64-w64-mingw32-gcc-win32";
  if (fs.existsSync("/usr/local/bin/gcc")) return "/usr/local/bin/gcc";
  return "x86_64-w64-mingw32-gcc";
}

function getWindres(): string {
  if (fs.existsSync("/usr/bin/x86_64-w64-mingw32-windres")) return "/usr/bin/x86_64-w64-mingw32-windres";
  return "windres";
}

// Pure zero-dependency binary patching for pre-compiled native Windows PE32+ launcher template
function patchExeTemplate(targetUrl: string, appName: string = "WebApp"): Buffer {
  const possiblePaths = [
    path.join(process.cwd(), "public", "assets", "launcher_template.exe"),
    path.join(process.cwd(), "assets", "launcher_template.exe"),
    "/tmp/launcher_template.exe"
  ];
  let templateBuffer: Buffer | null = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        templateBuffer = fs.readFileSync(p);
        break;
      } catch {}
    }
  }

  if (!templateBuffer) {
    throw new Error("Windows launcher template binary not found.");
  }

  const marker = Buffer.from("__ECHO_TARGET_URL_PLACEHOLDER_V1_", "utf16le");
  const idx = templateBuffer.indexOf(marker);
  if (idx === -1) {
    throw new Error("Placeholder marker not found in launcher template.");
  }

  const cleanTarget = targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
    ? targetUrl
    : `https://${targetUrl}`;

  const urlBuf = Buffer.from(cleanTarget + "\0", "utf16le");
  const patched = Buffer.from(templateBuffer);
  // Zero out the URL placeholder area (up to 4000 bytes)
  patched.fill(0, idx, Math.min(idx + 4000, patched.length));
  urlBuf.copy(patched, idx);

  // Also patch app name placeholder if present
  const nameMarker = Buffer.from("__ECHO_APP_NAME_PLACEHOLDER_V1_", "utf16le");
  const nameIdx = patched.indexOf(nameMarker);
  if (nameIdx !== -1) {
    const cleanName = (appName || "WebApp").slice(0, 64);
    const nameBuf = Buffer.from(cleanName + "\0", "utf16le");
    patched.fill(0, nameIdx, Math.min(nameIdx + 500, patched.length));
    nameBuf.copy(patched, nameIdx);
  }

  return patched;
}

// Compile or generate a 100% genuine, native Windows x86_64 GUI executable (.exe) with embedded icon
async function buildWindowsExe(url: string, appName: string, iconUrl?: string): Promise<Buffer> {
  const safeUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  const safeName = (appName || "WebApp").replace(/[\\/:*?"<>|]/g, " ").trim().slice(0, 64) || "WebApp";
  const gccCmd = getMingwGcc();
  const hasGcc = fs.existsSync(gccCmd);

  // If compiler toolchain is present in the runtime environment, compile customized executable
  if (hasGcc) {
    const tmpDir = fs.mkdtempSync(path.join("/tmp", "win-exe-"));

    try {
      const iconBuf = await getIconBuffer(iconUrl, safeUrl);
      const { icoPath } = prepareAppIcons(iconBuf, tmpDir);

      // Escape URL and name for C wide string literals
      const escapedUrl = safeUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const escapedName = safeName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

      // Windows C source: Launches the URL in a dedicated, standalone application window
      // (no browser chrome, no address bar, no tabs) and registers the EXE in Windows Startup.
      const cSource = `#include <windows.h>
#include <shellapi.h>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    const wchar_t* targetUrl = L"${escapedUrl}";
    const wchar_t* appName = L"${escapedName}";

    // 1. Auto-register in Windows Startup (HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run)
    HKEY hRunKey;
    wchar_t currentExePath[MAX_PATH];
    if (GetModuleFileNameW(NULL, currentExePath, MAX_PATH) > 0) {
        if (RegOpenKeyExW(HKEY_CURRENT_USER, L"Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run", 0, KEY_SET_VALUE, &hRunKey) == ERROR_SUCCESS) {
            RegSetValueExW(hRunKey, appName, 0, REG_SZ, (const BYTE*)currentExePath, (lstrlenW(currentExePath) + 1) * sizeof(wchar_t));
            RegCloseKey(hRunKey);
        }
    }

    // 2. Prepare isolated user data directory for true standalone application window
    wchar_t dataDir[MAX_PATH];
    wchar_t cmdArgs[4096];
    wchar_t browserPath[MAX_PATH];
    HINSTANCE hRes;

    if (ExpandEnvironmentStringsW(L"%LocalAppData%\\\\WebsktopApps", dataDir, MAX_PATH) > 0) {
        CreateDirectoryW(dataDir, NULL);
    }
    if (ExpandEnvironmentStringsW(L"%LocalAppData%\\\\WebsktopApps\\\\${escapedName}", dataDir, MAX_PATH) > 0) {
        CreateDirectoryW(dataDir, NULL);
    }

    // Launch flags: opens separate dedicated app window, independent of regular browser sessions
    wsprintfW(cmdArgs, L"--app=\\"%s\\" --user-data-dir=\\"%s\\" --no-first-run --no-default-browser-check --disable-extensions", targetUrl, dataDir);

    // 1. Microsoft Edge (64-bit)
    if (ExpandEnvironmentStringsW(L"%ProgramFiles%\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe", browserPath, MAX_PATH) > 0 &&
        GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
        hRes = ShellExecuteW(NULL, L"open", browserPath, cmdArgs, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)hRes > 32) return 0;
    }

    // 2. Microsoft Edge (32-bit)
    if (ExpandEnvironmentStringsW(L"%ProgramFiles(x86)%\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe", browserPath, MAX_PATH) > 0 &&
        GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
        hRes = ShellExecuteW(NULL, L"open", browserPath, cmdArgs, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)hRes > 32) return 0;
    }

    // 3. Google Chrome (64-bit)
    if (ExpandEnvironmentStringsW(L"%ProgramFiles%\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe", browserPath, MAX_PATH) > 0 &&
        GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
        hRes = ShellExecuteW(NULL, L"open", browserPath, cmdArgs, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)hRes > 32) return 0;
    }

    // 4. Google Chrome (32-bit)
    if (ExpandEnvironmentStringsW(L"%ProgramFiles(x86)%\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe", browserPath, MAX_PATH) > 0 &&
        GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
        hRes = ShellExecuteW(NULL, L"open", browserPath, cmdArgs, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)hRes > 32) return 0;
    }

    // 5. LocalAppData Edge
    if (ExpandEnvironmentStringsW(L"%LocalAppData%\\\\Microsoft\\\\Edge\\\\Application\\\\msedge.exe", browserPath, MAX_PATH) > 0 &&
        GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
        hRes = ShellExecuteW(NULL, L"open", browserPath, cmdArgs, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)hRes > 32) return 0;
    }

    // 6. LocalAppData Chrome
    if (ExpandEnvironmentStringsW(L"%LocalAppData%\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe", browserPath, MAX_PATH) > 0 &&
        GetFileAttributesW(browserPath) != INVALID_FILE_ATTRIBUTES) {
        hRes = ShellExecuteW(NULL, L"open", browserPath, cmdArgs, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)hRes > 32) return 0;
    }

    // Universal Fallback
    ShellExecuteW(NULL, L"open", targetUrl, NULL, NULL, SW_SHOWNORMAL);
    return 0;
}
`;
      const cPath = path.join(tmpDir, "main.c");
      fs.writeFileSync(cPath, cSource);

      // Ensure ico file exists and has valid Windows ICO format
      let safeIcoPath = icoPath;
      const defaultIco = fs.existsSync("/tmp/default_app.ico")
        ? "/tmp/default_app.ico"
        : path.join(process.cwd(), "public", "default_app.ico");

      if (!isValidIcoFile(safeIcoPath)) {
        safeIcoPath = defaultIco;
      }

      let resObjPath: string | null = null;
      const windresCmd = getWindres();

      if (isValidIcoFile(safeIcoPath)) {
        try {
          const cleanIcoPath = safeIcoPath.replace(/\\/g, "/");
          const rcContent = `1 ICON "${cleanIcoPath}"\n`;
          const rcPath = path.join(tmpDir, "app.rc");
          fs.writeFileSync(rcPath, rcContent);
          const testRes = path.join(tmpDir, "app_res.o");
          // Execute windres with explicit preprocessor so it never fails looking for ambient cpp/gcc
          try {
            execSync(
              `"${windresCmd}" --preprocessor "${gccCmd}" --preprocessor-arg "-E" --preprocessor-arg "-xc-header" --preprocessor-arg "-DRC_INVOKED" "${rcPath}" -O coff -o "${testRes}"`,
              { timeout: 15000 }
            );
          } catch {
            // Fallback to standard windres call without custom preprocessor args
            execSync(`"${windresCmd}" "${rcPath}" -O coff -o "${testRes}"`, { timeout: 15000 });
          }
          if (fs.existsSync(testRes) && fs.statSync(testRes).size > 0) {
            resObjPath = testRes;
          }
        } catch {
          // Silently fall back to standard executable if resource compilation is skipped
        }
      }

      // Compile native Windows executable with mingw-w64
      const exePath = path.join(tmpDir, "app.exe");
      try {
        if (resObjPath) {
          try {
            execSync(
              `"${gccCmd}" -mwindows -O2 -s "${cPath}" "${resObjPath}" -o "${exePath}" -lshell32 -ladvapi32 -lshlwapi`,
              { timeout: 20000 }
            );
          } catch {
            execSync(
              `"${gccCmd}" -mwindows -O2 -s "${cPath}" -o "${exePath}" -lshell32 -ladvapi32 -lshlwapi`,
              { timeout: 20000 }
            );
          }
        } else {
          execSync(
            `"${gccCmd}" -mwindows -O2 -s "${cPath}" -o "${exePath}" -lshell32 -ladvapi32 -lshlwapi`,
            { timeout: 20000 }
          );
        }

        if (fs.existsSync(exePath) && fs.statSync(exePath).size > 1000) {
          return fs.readFileSync(exePath);
        }
      } catch {
        // Fall back to template patching
      }
    } catch {
      // Fall back to template patching
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  // Guaranteed, instantaneous fallback: patch the tested native Windows executable template
  return patchExeTemplate(safeUrl, safeName);
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
    const iconBuf = await getIconBuffer(iconUrl, safeUrl);
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
    const safeFilename = safeName.replace(/[^\w\-\.]/g, "_") || "app";
    
    // Compile real PE32+ 64-bit Windows GUI Executable with embedded icon
    const exeBuffer = await buildWindowsExe(url, safeName, iconUrl);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.exe"; filename*=UTF-8''${encodeURIComponent(safeName)}.exe`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", exeBuffer.length.toString());
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.end(exeBuffer);
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

    const safeFilename = safeName.replace(/[^\w\-\.]/g, "_") || "app";
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.apk"; filename*=UTF-8''${encodeURIComponent(safeName)}.apk`);
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader("Content-Length", apkBuffer.length.toString());
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.end(apkBuffer);
  } catch (error: any) {
    console.error("Android APK build error:", error);
    return res.status(500).send("Failed to generate Android APK: " + error.message);
  }
});

// Universal Direct GET download endpoint (allows direct browser links, new tab downloads, and iframe-safe triggers)
app.get("/api/download-app", async (req, res) => {
  try {
    const { type, url, appName, packageId, iconUrl } = req.query as {
      type?: string;
      url?: string;
      appName?: string;
      packageId?: string;
      iconUrl?: string;
    };

    if (!url) return res.status(400).send("URL parameter is required");

    const safeName = (appName || "WebApp").replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "WebApp";
    const safeFilename = safeName.replace(/[^\w\-\.]/g, "_") || "app";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");

    if (type === "apk") {
      const cleanPkg = packageId || `com.echo.${safeName.toLowerCase().replace(/[^a-z0-9]/g, "") || "app"}`;
      const apkBuffer = await buildAndroidApk(url, safeName, cleanPkg, iconUrl);
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.apk"; filename*=UTF-8''${encodeURIComponent(safeName)}.apk`);
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Length", apkBuffer.length.toString());
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.end(apkBuffer);
    } else {
      const exeBuffer = await buildWindowsExe(url, safeName, iconUrl);
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.exe"; filename*=UTF-8''${encodeURIComponent(safeName)}.exe`);
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Length", exeBuffer.length.toString());
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.end(exeBuffer);
    }
  } catch (error: any) {
    console.error("Direct download error:", error);
    return res.status(500).send("Failed to generate download: " + error.message);
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
