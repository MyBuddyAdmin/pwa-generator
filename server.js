const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "MyBuddy PWA Generator running" });
});

// Generate ZIP
app.post("/generate", async (req, res) => {
  try {
    const { storeName, primaryColor, accentColor, products = [] } = req.body;

    if (!storeName) {
      return res.status(400).json({ error: "Missing storeName" });
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${storeName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family:sans-serif; margin:0; background:#f4f4f4 }
    header { background:${primaryColor}; color:#fff; padding:16px; text-align:center }
    .item {
      background:#fff;
      margin:12px;
      padding:14px;
      border-radius:12px;
      border:2px solid ${accentColor};
    }
  </style>
</head>
<body>
  <header>${storeName}</header>
  ${products.map(p => `
    <div class="item">
      <strong>${p.name}</strong><br>
      $${p.price}
    </div>
  `).join("")}
</body>
</html>
`;

    const zip = new JSZip();
    zip.file("index.html", html);

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=generated-pwa.zip"
    });

    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "ZIP generation failed" });
  }
});

app.listen(PORT, () => {
  console.log("Generator running on port", PORT);
});
