// server.js
const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");
require("dotenv").config();

const app = express();

// Allow Studio frontend
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// -----------------------------
// HEALTH CHECK
// -----------------------------
app.get("/", (req, res) => {
  res.json({ status: "Generator API Running" });
});


// **************************************************************
// ----------------------  /generate (ZIP Builder)  --------------
// **************************************************************
app.post("/generate", async (req, res) => {
  try {
    const payload = req.body || {};
    const branding = payload.branding || {};
    const firebase = payload.firebase || {};
    const products = Array.isArray(payload.products) ? payload.products : [];

    const appName = branding.name || "My Store";
    const primaryColor = branding.primaryColor || "#22c55e";
    const accentColor = branding.accentColor || "#9333ea";

    const zip = new JSZip();

    // --------------------------
    // index.html generation
    // --------------------------
    const indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${appName}</title>
  <link rel="stylesheet" href="app.css" />
</head>
<body>
  <header class="header">${appName}</header>

  <main>
    ${products
      .map(
        (p) => `
      <div class="product">
        <div class="name">${p.name}</div>
        <div class="price">$${p.price}</div>
      </div>
    `
      )
      .join("")}
  </main>

  <script src="firebase-init.js"></script>
  <script src="app.js"></script>
</body>
</html>
`;

    // --------------------------
    // CSS
    // --------------------------
    const css = `
body { margin:0; font-family:Arial; background:#fafafa; padding:20px; }
.header { font-size:24px; font-weight:bold; margin-bottom:20px; color:${primaryColor}; }
.product {
  background:#fff;
  padding:14px;
  margin-bottom:12px;
  border-left:8px solid ${accentColor};
  border-radius:6px;
  box-shadow:0 1px 4px rgba(0,0,0,0.1);
}
.name { font-size:16px; font-weight:600; }
.price { color:${accentColor}; margin-top:4px; font-size:18px; }
`;

    // --------------------------
    // JS FILES
    // --------------------------
    const appJs = `console.log("PWA Loaded: ${appName}");`;
    const firebaseJs = `const firebaseConfig = ${JSON.stringify(firebase, null, 2)};`;

    // Add files to ZIP
    zip.file("index.html", indexHtml);
    zip.file("app.css", css);
    zip.file("app.js", appJs);
    zip.file("firebase-init.js", firebaseJs);

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=pwa-site.zip",
    });
    res.send(buffer);
  } catch (err) {
    console.error("ZIP Generate Error:", err);
    return res.status(500).json({ error: "Failed to generate PWA." });
  }
});


// **************************************************************
// ----------------------  /publish  -----------------------------
// **************************************************************
const publishRoute = require("./publish");
app.use("/publish", publishRoute);


// -----------------------------
// START SERVER
// -----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 PWA Generator running on port " + PORT);
});
