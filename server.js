const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");
const publishToHostGator = require("./publish");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));

function sanitizeSlug(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 25);
}

function generateIndexHTML(branding, products) {
  const name = branding.name || "My Store";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${name}</title>
<link rel="stylesheet" href="style.css">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="manifest" href="manifest.json">
</head>
<body>
<header class="header">${name}</header>
<div class="status">🟢 Store Open</div>
<main class="products">
${products.map(p => `
  <div class="product-card">
    <h3>${p.name}</h3>
    <p>$${p.price}</p>
  </div>
`).join("")}
</main>
<script src="app.js"></script>
</body>
</html>`;
}

function generateCSS(branding) {
  const primary = branding.primaryColor || "#22c55e";
  const accent = branding.accentColor || "#9333ea";
  return `body { margin:0;font-family:Arial;background:#f6f6f6;}
.header {background:${primary};padding:16px;text-align:center;font-size:22px;color:white;}
.status {padding:10px;background:${accent};color:white;text-align:center;}
.products {padding:16px;}
.product-card {background:white;padding:14px;margin-bottom:12px;border-radius:10px;}`;
}

function generateAppJS(products) {
  return `console.log("PWA active with ${products.length} products.");`;
}

function generateManifest(branding) {
  return {
    name: branding.name || "Store",
    short_name: (branding.name || "Store").substring(0,10),
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: branding.primaryColor || "#22c55e",
    icons: []
  };
}

app.post("/generate", async (req, res) => {
  try {
    const branding = req.body.branding || {};
    const products = req.body.products || [];
    const zip = new JSZip();

    zip.file("index.html", generateIndexHTML(branding, products));
    zip.file("style.css", generateCSS(branding));
    zip.file("app.js", generateAppJS(products));
    zip.file("manifest.json", JSON.stringify(generateManifest(branding), null, 2));
    zip.file("service-worker.js", "self.addEventListener('fetch', ()=>{});");

    const buf = await zip.generateAsync({ type: "nodebuffer" });
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=pwa-site.zip"
    });
    res.send(buf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ZIP generation failed" });
  }
});

app.post("/publish", async (req, res) => {
  try {
    const { branding, products } = req.body;
    if (!branding || !branding.name)
      return res.status(400).json({ error: "Missing branding.name" });

    const storeSlug = sanitizeSlug(branding.name);

    const files = [
      { name: "index.html", content: generateIndexHTML(branding, products) },
      { name: "style.css", content: generateCSS(branding) },
      { name: "app.js", content: generateAppJS(products) },
      { name: "manifest.json", content: JSON.stringify(generateManifest(branding), null, 2) },
      { name: "service-worker.js", content: "self.addEventListener('fetch', ()=>{});" }
    ];

    const result = await publishToHostGator(storeSlug, files);
    res.json(result);

  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    res.status(500).json({ error: "Publish failed" });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "PWA Generator running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port", PORT));
