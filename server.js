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
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// =====================
// HEALTH CHECK
// =====================
app.get("/", (req, res) => {
  res.json({ status: "MyBuddy PWA Studio running" });
});

// =====================
// BUILD HTML
// =====================
function buildHTML(storeName, primaryColor, accentColor, products) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${storeName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin:0; font-family:sans-serif; background:#f4f4f4 }
    header {
      background:${primaryColor};
      color:#fff;
      padding:16px;
      text-align:center;
      font-size:20px;
      font-weight:700;
    }
    .wrap {
      max-width:420px;
      margin:20px auto;
      padding:16px;
    }
    .card {
      border:2px solid ${accentColor};
      border-radius:14px;
      padding:14px;
      margin-bottom:12px;
      background:#fff;
    }
  </style>
</head>
<body>
  <header>${storeName}</header>
  <div class="wrap">
    ${products.map(p => `
      <div class="card">
        ${p.name} – $${p.price}
      </div>
    `).join("")}
  </div>
</body>
</html>
`;
}

// =====================
// GENERATE ZIP
// =====================
app.post("/generate", async (req, res) => {
  try {
    const { storeName, primaryColor, accentColor, products } = req.body;

    if (!storeName) {
      return res.status(400).json({ error: "Missing storeName" });
    }

    const zip = new JSZip();
    const html = buildHTML(storeName, primaryColor, accentColor, products);

    zip.file("index.html", html);

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=pwa-site.zip"
    });

    res.send(buffer);
  } catch (err) {
    console.error("ZIP ERROR:", err);
    res.status(500).json({ error: "ZIP generation failed" });
  }
});

// =====================
// PUBLISH VIA FTP
// =====================
app.post("/publish", async (req, res) => {
  try {
    const { storeName, primaryColor, accentColor, products } = req.body;

    if (!storeName) {
      return res.status(400).json({ error: "Missing storeName" });
    }

    const subdomain = slugify(storeName, { lower: true, strict: true });
    const html = buildHTML(storeName, primaryColor, accentColor, products);

    const ftp = new FTPClient();

    ftp.on("ready", () => {
      const basePath = `/public_html/${subdomain}.mybuddymobile.com`;

      ftp.mkdir(basePath, true, () => {
        ftp.put(Buffer.from(html), `${basePath}/index.html`, err => {
          ftp.end();

          if (err) {
            console.error("FTP PUT ERROR:", err);
            return res.status(500).json({ error: "FTP upload failed" });
          }

          res.json({
            success: true,
            url: `https://${subdomain}.mybuddymobile.com`
          });
        });
      });
    });

    ftp.on("error", err => {
      console.error("FTP ERROR:", err);
      res.status(500).json({ error: "FTP connection failed" });
    });

    ftp.connect({
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

// =====================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
