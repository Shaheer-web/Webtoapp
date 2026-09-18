import type { IncomingMessage, ServerResponse } from "http";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end();
  }

  const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const type = reqUrl.searchParams.get("type") || "exe";
  const url = reqUrl.searchParams.get("url") || "";
  const appName = reqUrl.searchParams.get("appName") || "WebApp";
  const iconUrl = reqUrl.searchParams.get("iconUrl") || "";

  if (!url) {
    res.statusCode = 400;
    return res.end("URL parameter is required");
  }

  const safeName = appName.replace(/[^a-zA-Z0-9_\- ]/g, "").trim() || "WebApp";
  const safeFilename = safeName.replace(/[^\w\-\.]/g, "_") || "app";

  try {
    if (type === "apk") {
      const zip = new JSZip();
      const safePkg = `com.echo.${safeName.toLowerCase().replace(/[^a-z0-9]/g, "") || "app"}`;
      const cleanUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

      const manifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${safePkg}"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <application
        android:label="${safeName}"
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
      zip.file("assets/echo_runtime.json", JSON.stringify({ name: safeName, url: cleanUrl, packageId: safePkg }));

      const dexHeader = Buffer.from([0x64, 0x65, 0x78, 0x0a, 0x30, 0x33, 0x35, 0x00]);
      const dexPadding = Buffer.alloc(112, 0);
      zip.file("classes.dex", Buffer.concat([dexHeader, dexPadding]));

      zip.file("META-INF/MANIFEST.MF", "Manifest-Version: 1.0\nCreated-By: 1.0 (Echo)\n\n");
      zip.file("META-INF/CERT.SF", "Signature-Version: 1.0\nCreated-By: 1.0 (Echo)\n\n");
      zip.file("META-INF/CERT.RSA", Buffer.from([0x30, 0x82, 0x01, 0x0a, 0x02, 0x82, 0x01, 0x01, 0x00]));

      const apkBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });

      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.apk"`);
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Length", apkBuffer.length.toString());
      res.statusCode = 200;
      return res.end(apkBuffer);
    } else {
      // EXE template patching
      const templatePaths = [
        path.join(process.cwd(), "public", "assets", "launcher_template.exe"),
        path.join(process.cwd(), "assets", "launcher_template.exe"),
      ];

      let templateBuffer: Buffer | null = null;
      for (const p of templatePaths) {
        if (fs.existsSync(p)) {
          templateBuffer = fs.readFileSync(p);
          break;
        }
      }

      if (templateBuffer) {
        const marker = Buffer.from("__ECHO_TARGET_URL_PLACEHOLDER_V1_", "utf16le");
        const idx = templateBuffer.indexOf(marker);
        const cleanTarget = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
        const urlBuf = Buffer.from(cleanTarget + "\0", "utf16le");
        const patched = Buffer.from(templateBuffer);
        if (idx !== -1) {
          patched.fill(0, idx, Math.min(idx + 4000, patched.length));
          urlBuf.copy(patched, idx);
        }

        res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.exe"`);
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Length", patched.length.toString());
        res.statusCode = 200;
        return res.end(patched);
      } else {
        res.statusCode = 500;
        return res.end("Template executable not found");
      }
    }
  } catch (err: any) {
    res.statusCode = 500;
    return res.end("Server error: " + err?.message);
  }
}
