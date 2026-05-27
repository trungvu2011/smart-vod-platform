/**
 * Upload anchor videos (TED talks) lên Production VM qua API.
 * Dùng native Node.js fetch + Blob — không cần thêm dependency.
 *
 * Cách chạy:
 *   node scripts/upload-anchors-to-prod.js
 *   node scripts/upload-anchors-to-prod.js --api=http://api.20.193.248.35.sslip.io
 *   node scripts/upload-anchors-to-prod.js --api=http://localhost:5000
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const DEFAULT_API_BASE = "http://api.20.193.248.35.sslip.io";
const LOGIN_EMAIL = "demo.admin@waypoint.com";
const LOGIN_PASSWORD = "Demo@123456";

const ANCHOR_DIR = path.join(__dirname, "..", "..", "temp", "anchor-videos");

const VIDEO_INFO = [
  {
    pattern: "short1",
    title: "How to Start a Movement - Derek Sivers",
    description: "With help from some surprising footage, Derek Sivers explains how movements really get started. (Hint: it takes two).",
    category: "Leadership",
  }
];

// ─── UTILS ────────────────────────────────────────────────────────────────────

const log = (msg) => console.log(`[upload-prod] ${msg}`);
const success = (msg) => console.log(`[upload-prod] ✅ ${msg}`);
const error = (msg) => console.error(`[upload-prod] ❌ ${msg}`);

const parseArgs = () => {
  let apiBase = DEFAULT_API_BASE;
  for (const arg of process.argv.slice(2)) {
    const [key, value] = arg.replace(/^--/, "").split("=");
    if (key === "api" && value) apiBase = value.replace(/\/$/, "");
  }
  return { apiBase };
};

/**
 * Multipart upload sử dụng raw HTTP — tương thích mọi Node version.
 */
const uploadMultipart = (url, token, fields, fileField) => {
  return new Promise((resolve, reject) => {
    const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);
    const parts = [];

    // Text fields
    for (const [key, value] of Object.entries(fields)) {
      parts.push(
        `--${boundary}\r\n` +
          `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
          `${value}\r\n`,
      );
    }

    // File field
    const fileHeader =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fileField.fieldName}"; filename="${fileField.fileName}"\r\n` +
      `Content-Type: video/mp4\r\n\r\n`;
    const fileFooter = `\r\n--${boundary}--\r\n`;

    const fileData = fs.readFileSync(fileField.filePath);
    const headerBuf = Buffer.from(
      parts.join("") + fileHeader,
      "utf-8",
    );
    const footerBuf = Buffer.from(fileFooter, "utf-8");
    const body = Buffer.concat([headerBuf, fileData, footerBuf]);

    const parsed = new URL(url);
    const isHttps = parsed.protocol === "https:";
    const transport = isHttps ? https : http;

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
        Authorization: `Bearer ${token}`,
      },
      timeout: 120000, // 2 phút timeout cho file lớn
    };

    const req = transport.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.write(body);
    req.end();
  });
};

// ─── API CALLS ────────────────────────────────────────────────────────────────

const login = async (apiBase) => {
  log(`Logging in as ${LOGIN_EMAIL}...`);
  const response = await fetch(`${apiBase}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Login failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  const token = data.accessToken || data.token;
  if (!token) throw new Error("No access token in login response");

  success(`Logged in successfully.`);
  return token;
};

const uploadVideo = async (apiBase, token, filePath, info) => {
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  const sizeMB = (fileSize / 1024 / 1024).toFixed(1);

  log(`Uploading "${info.title}" (${sizeMB} MB)...`);

  const result = await uploadMultipart(
    `${apiBase}/api/videos/upload`,
    token,
    {
      title: info.title,
      description: info.description,
      category: info.category,
    },
    {
      fieldName: "videoFile",
      fileName: fileName,
      filePath: filePath,
    },
  );

  const videoId = result.video?.id || result.id || "unknown";
  success(`"${info.title}" → ID: ${videoId}`);
  return videoId;
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const run = async () => {
  const { apiBase } = parseArgs();

  log("═══════════════════════════════════════════════════════════════");
  log("  Upload TED Anchor Videos to Production VM");
  log("═══════════════════════════════════════════════════════════════");
  log(`  API: ${apiBase}`);
  log(`  Video Dir: ${ANCHOR_DIR}\n`);

  // 1. Find video files
  if (!fs.existsSync(ANCHOR_DIR)) {
    error(`Directory not found: ${ANCHOR_DIR}`);
    process.exitCode = 1;
    return;
  }

  const mp4Files = fs
    .readdirSync(ANCHOR_DIR)
    .filter((f) => f.endsWith(".mp4") && !f.includes(".temp.") && !f.includes(".f398."))
    .sort();

  if (!mp4Files.length) {
    error("No MP4 files found!");
    process.exitCode = 1;
    return;
  }

  log(`Found ${mp4Files.length} video(s):\n`);
  for (const f of mp4Files) {
    const size = (fs.statSync(path.join(ANCHOR_DIR, f)).size / 1024 / 1024).toFixed(1);
    log(`  → ${f} (${size} MB)`);
  }
  log("");

  // 2. Login
  const token = await login(apiBase);

  // 3. Upload each video
  const uploaded = [];

  for (const file of mp4Files) {
    const info = VIDEO_INFO.find((v) => file.includes(v.pattern));
    if (!info) continue;

    try {
      const videoId = await uploadVideo(
        apiBase,
        token,
        path.join(ANCHOR_DIR, file),
        info,
      );
      uploaded.push({ videoId, title: info.title });
    } catch (err) {
      error(`Failed: ${file}: ${err.message}`);
    }
  }

  log(`\n╔═══════════════════════════════════════════════════════╗`);
  log(`║  UPLOAD COMPLETE: ${String(uploaded.length + "/" + mp4Files.length).padEnd(36)}║`);
  log(`╚═══════════════════════════════════════════════════════╝`);

  if (uploaded.length > 0) {
    log("\n⏳ Worker đang xử lý HLS + Whisper AI trên VM...");
    log("   Kiểm tra status: ssh vào VM rồi chạy:");
    log("   docker logs -f smartvod-worker");
    log("\n   Khi tất cả READY, chạy seed:");
    log("   docker exec smartvod-api node scripts/seed-youtube-metadata.js --limit=50");
  }
  log("");
};

run().catch((err) => {
  console.error("[upload-prod] Fatal:", err);
  process.exitCode = 1;
});
