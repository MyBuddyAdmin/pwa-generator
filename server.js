// server.js (FINAL — FTP Publishing Working)

const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");
const FTP = require("ftp");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ----------------------
// Root test
// ----------------------
app.get("/", (req, res) => {
  res.json({ status: "Generator API Running" });
});

// ----------------------
// /generate → create ZIP
// ----------------------
app.post("/generate", async (req, res) => {
  try {
    const { branding, firebase, products } = req.body;

    const zip = new JSZip();

    // Create config.json inside the ZIP
    zip.file(
      "config.json",
      JSON.stringify({ branding, firebase, products }, null, 2)
    );

    const content = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=pwa-site.zip",
    });

    return res.send(content);

  } catch (err) {
    console.error("ZIP ERROR:", err);
    res.status(500).json({ error: "ZIP generation failed" });
  }
});

// ----------------------
// /publish → FTP upload
// ----------------------
app.post("/publish", async (req, res) => {
  try {
    const { folderName, files } = req.body;

    if (!folderName || !files) {
      return res.status(400).json({ error: "Missing folderName or files" });
    }

    const ftp = new FTP();

    // Connect to HostGator FTP
    ftp.connect({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      port: process.env.FTP_PORT || 21
    });

    ftp.on("ready", () => {
      const targetPath = `/public_html/${folderName}`;

      ftp.mkdir(targetPath, true, (err) => {
        if (err && !err.message.includes("File exists")) {
          console.error("FTP mkdir error:", err);
          return res.status(500).json({ error: "Could not create folder" });
        }

        let remaining = Object.keys(files).length;

        for (const [filePath, base64] of Object.entries(files)) {
          const buffer = Buffer.from(base64, "base64");

          ftp.put(buffer, `${targetPath}/${filePath}`, (err) => {
            if (err) console.error("FTP upload error:", err);

            remaining--;

            if (remaining === 0) {
              ftp.end();
              return res.json({
                success: true,
                url: `https://${folderName}.mybuddymobile.com`
              });
            }
          });
        }
      });
    });

  } catch (err) {
    console.error("PUBLISH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
