// ----------------------
// server.js (new)
// ----------------------

const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");
const FTP = require("ftp");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ----------------------
// ROOT TEST ENDPOINT
// ----------------------
app.get("/", (req, res) => {
  res.json({ status: "Generator API Running" });
});

// ----------------------
// /generate  → returns ZIP file
// ----------------------
app.post("/generate", async (req, res) => {
  try {
    const { branding, firebase, products } = req.body;

    const zip = new JSZip();

    // Write config.json inside ZIP
    zip.file(
      "config.json",
      JSON.stringify({ branding, firebase, products }, null, 2)
    );

    const content = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=pwa-site.zip"
    });

    return res.send(content);
  } catch (err) {
    console.error("ZIP error", err);
    return res.status(500).json({ error: "ZIP generation failed" });
  }
});

// ----------------------
// /publish  → FTP upload
// ----------------------
app.post("/publish", (req, res) => {
  const { subdomain, files } = req.body;

  if (!subdomain || !files) {
    return res.status(400).json({ error: "Missing subdomain or files" });
  }

  const ftp = new FTP();

  ftp.on("ready", () => {
    const basePath = `${subdomain}.mybuddymobile.com`;

    ftp.mkdir(basePath, true, (err) => {
      if (err) console.log("Folder already exists.");

      let uploadsRemaining = Object.keys(files).length;

      for (const [filename, content] of Object.entries(files)) {
        const buffer = Buffer.from(content, "base64");

        ftp.put(buffer, `${basePath}/${filename}`, (err) => {
          if (err) console.error("FTP error:", err);

          uploadsRemaining--;
          if (uploadsRemaining === 0) {
            ftp.end();
            return res.json({
              success: true,
              url: `https://${subdomain}.mybuddymobile.com`
            });
          }
        });
      }
    });
  });

  ftp.connect({
    host: process.env.FTP_HOST,
    port: process.env.FTP_PORT,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS
  });
});

// ----------------------
// START SERVER
// ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("API Running on port", PORT);
});
