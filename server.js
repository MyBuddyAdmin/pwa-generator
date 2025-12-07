const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check route
app.get("/", (req, res) => {
  res.json({ status: "Generator is running" });
});

// Main generator endpoint
app.post("/generate", async (req, res) => {
  try {
    const zip = new JSZip();
    zip.file("index.html", "<h1>Your site generated!</h1>");

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=pwa-site.zip"
    });

    res.send(zipBuffer);

  } catch (e) {
    console.error("Generation error:", e);
    res.status(500).json({ error: "Generation failed" });
  }
});

// Render requires listening on process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`PWA Generator running on port ${PORT}`);
});
