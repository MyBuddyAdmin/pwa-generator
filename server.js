const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");
const FTPClient = require("ftp");
const slugify = require("slugify");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

/* =========================
   HEALTH
========================= */
app.get("/", (req, res) => {
  res.json({ status: "MyBuddy PWA Studio running" });
});

/* =========================
   GENERATE ZIP
========================= */
app.post("/generate", async (req, res) => {
  const { storeName, primaryColor, accentColor, products } = req.body;

  const zip = new JSZip();
  zip.file("index.html", buildHTML(storeName, primaryColor, accentColor, products));

  const buffer = await zip.generateAsync({ type: "nodebuffer" });

  res.set({
    "Content-Type": "application/zip",
    "Content-Disposition": "attachment; filename=pwa-site.zip"
  });

  res.send(buffer);
});

/* =========================
   PUBLISH (WILDCARD)
========================= */
app.post("/publish", async (req, res) => {
  const { storeName, primaryColor, accentColor, products } = req.body;
  const slug = slugify(storeName, { lower: true, strict: true });
  const folder = `/public_html/${slug}`;

  const html = buildHTML(storeName, primaryColor, accentColor, products);
  const client = new FTPClient();

  client.on("ready", () => {
    client.mkdir(folder, true, () => {
      client.put(Buffer.from(html), `${folder}/index.html`, () => {
        client.end();
        res.json({
          success: true,
          url: `https://${slug}.mybuddymobile.com`
        });
      });
    });
  });

  client.connect({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    port: process.env.FTP_PORT || 21
  });
});

/* =========================
   HTML BUILDER
========================= */
function buildHTML(name, primary, accent, products = []) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(name)}</title>
<style>
body{margin:0;font-family:sans-serif;background:#f4f4f4}
header{background:${primary};color:#fff;padding:16px;text-align:center}
.card{background:#fff;border-radius:14px;padding:14px;border:2px solid ${accent};margin:12px}
</style>
</head>
<body>
<header>${escape(name)}</header>
${products.map(p =>
  `<div class="card">${escape(p.name)}${p.price ? " – $" + escape(p.price) : ""}</div>`
).join("")}
</body>
</html>`;
}

function escape(s="") {
  return String(s).replace(/[&<>"]/g, c =>
    ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c])
  );
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
