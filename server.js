const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Generator is running" });
});

// Main generator route
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
    console.log(e);
    res.status(500).json({ error: "Generation failed" });
  }
});

app.listen(3000, () => console.log("PWA Generator running on port 3000"));
