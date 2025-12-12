/**
 * MyBuddy PWA Studio Backend
 * - ZIP generation
 * - Wildcard subdomain publishing via FTP
 */

const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");
const FTPClient = require("ftp");
const slugify = require("slugify");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

/* =========================================================
   HEALTH CHECK
========================================================= */
app.get("/", (req, res) => {
  res.json({ status: "MyBuddy PWA Studio backend running" });
});

/* =========================================================
   GENERATE ZIP (DOWNLOAD)
========================================================= */
app.post("/generate", async (req, res) => {
  try {
    const { storeName, primaryColor, accentColor, products } = req.body;

    if (!storeName) {
      return res.status(400).json({ error: "Missing storeName" });
    }

    const zip = new JSZip();

    const html = buildStoreHTML(storeName, primaryColor, accentColor, products);

    zip.file("index.html", html);
    zip.file("manifest.json", JSON.stringify(buildManifest(storeName), null, 2));
    zip.file("service-worker.js", buildServiceWorker());

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=pwa-site.zip"
    });

    res.send(buffer);

  } catch (err) {
    console.error("ZIP GENERATE ERROR:", err);
    res.status(500).json({ error: "ZIP generation failed" });
  }
});

/* =========================================================
   PUBLISH STORE (WILDCARD SUBDOMAIN)
========================================================= */
app.post("/publish", async (req, res) => {
  try {
    const { storeName, primaryColor, accentColor, products } = req.body;

    if (!storeName) {
      return res.status(400).json({ error: "Missing storeName" });
    }

    const slug = slugify(storeName, { lower: true, strict: true });
    const folder = `/public_html/${slug}`;

    const html = buildStoreHTML(storeName, primaryColor, accentColor, products);

    const client = new FTPClient();

    client.on("ready", () => {
      client.mkdir(folder, true, err => {
        if (err) console.log("mkdir warning:", err.message);

        client.put(Buffer.from(html), `${folder}/index.html`, err => {
          client.end();

          if (err) {
            console.error("FTP PUT ERROR:", err);
            return res.status(500).json({ error: "FTP upload failed" });
          }

          res.json({
            success: true,
            url: `https://${slug}.mybuddymobile.com`
          });
        });
      });
    });

    client.on("error", err => {
      console.error("FTP ERROR:", err);
      res.status(500).json({ error: "FTP connection failed" });
    });

    client.connect({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: process.env.FTP_PORT || 21
    });

  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    res.status(500).json({ error: "Publish failed" });
  }
});

/* =========================================================
   HELPERS
========================================================= */

function buildStoreHTML(storeName, primaryColor, accentColor, products = []) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHTML(storeName)}</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f4f4f4;
    }

    header {
      background: ${primaryColor || "#22c55e"};
      color: #fff;
      padding: 16px;
      text-align: center;
      font-size: 20px;
      font-weight: 600;
    }

    .products {
      padding: 16px;
      display: grid;
      gap: 12px;
    }

    .card {
      background: #fff;
      border-radius: 14px;
      padding: 14px;
      border: 2px solid ${accentColor || "#9333ea"};
      font-size: 16px;
    }
  </style>
</head>

<body>
  <header>${escapeHTML(storeName)}</header>

  <div class="products">
    ${
      products.length
        ? products.map(p => `
          <div class="card">
            ${escapeHTML(p.name || "Item")}
            ${p.price ? ` - $${escapeHTML(p.price)}` : ""}
          </div>
        `).join("")
        : `<div class="card" style="opacity:.6">No products yet</div>`
    }
  </div>
</body>
</html>`;
}

function buildManifest(storeName) {
  return {
    name: storeName,
    short_name: storeName.slice(0, 12),
    start_url: ".",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#22c55e"
  };
}

function buildServiceWorker() {
  return `
self.addEventListener("install", e => self.skipWaiting());
self.addEventListener("fetch", e => {});
`;
}

function escapeHTML(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* =========================================================
   START SERVER
========================================================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("MyBuddy PWA Studio backend running on port", PORT);
});
