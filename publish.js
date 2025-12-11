// publish.js
const express = require("express");
const router = express.Router();
const AdmZip = require("adm-zip");
const ftp = require("basic-ftp");

// FTP Credentials (HostGator)
const FTP_HOST = process.env.FTP_HOST;
const FTP_USER = process.env.FTP_USER;
const FTP_PASS = process.env.FTP_PASS;

// Handle /publish
router.post("/", async (req, res) => {
  try {
    const { branding, firebase, products } = req.body;

    if (!branding || !branding.name) {
      return res.status(400).send("Missing store name");
    }

    const folderName = branding.name.toLowerCase().replace(/\s+/g, "-");
    const zip = new AdmZip();

    // Build a minimal index.html for the store
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${branding.name}</title>
        <style>
          body { font-family: Arial; padding: 20px; background: #f2f2f2; }
          h1 { color: ${branding.primaryColor}; }
          .product {
            background: white;
            padding: 12px;
            margin-bottom: 12px;
            border-left: 8px solid ${branding.accentColor};
            border-radius: 6px;
          }
          .price {
            color: ${branding.accentColor};
            font-size: 18px;
          }
        </style>
      </head>
      <body>
        <h1>${branding.name}</h1>

        ${products.map(p => `
          <div class="product">
            <strong>${p.name}</strong>
            <div class="price">$${p.price}</div>
          </div>
        `).join("")}
      </body>
      </html>
    `;

    zip.addFile("index.html", Buffer.from(html));

    // Prepare FTP upload
    const client = new ftp.Client();
    client.ftp.verbose = true;

    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: false,
    });

    // Create folder: /public_html/{folderName}
    await client.ensureDir(`/public_html/${folderName}`);
    await client.clearWorkingDir();

    // Upload index.html
    await client.uploadFrom(Buffer.from(html), "index.html");

    client.close();

    return res.send(`Store published! Visit: https://${folderName}.mybuddymobile.com`);

  } catch (err) {
    console.error("Publish Error:", err);
    return res.status(500).send("Failed to publish store");
  }
});

module.exports = router;
