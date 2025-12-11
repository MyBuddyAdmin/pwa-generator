import JSZip from "jszip";
import FTPClient from "basic-ftp";
import fs from "fs/promises";

export async function publishToHost(zipBuffer, storeId) {
  const zip = await JSZip.loadAsync(zipBuffer);

  // ----- 1. FTP Connection -----
  const client = new FTPClient.Client();
  client.ftp.verbose = false;

  await client.access({
    host: process.env.FTP_HOST,        // ftp.mybuddymobile.com
    user: process.env.FTP_USER,        // ftp1@mybuddymobile.com
    password: process.env.FTP_PASS,    // your password
    port: 21,
    secure: false
  });

  console.log("FTP connected!");

  // ----- 2. Create store folder -----
  const storePath = `/public_html/stores/${storeId}`;
  await client.ensureDir(storePath);
  await client.clearWorkingDir(); // prevent leftovers

  console.log("Created folder:", storePath);

  // ----- 3. Upload ZIP contents -----
  for (const filename of Object.keys(zip.files)) {
    const file = zip.files[filename];
    if (!file.dir) {
      const content = await file.async("nodebuffer");

      await client.uploadFrom(
        Buffer.from(content),
        `${storePath}/${filename}`
      );
    }
  }

  console.log("Upload complete.");

  await client.close();

  // ----- 4. Determine URL -----

  // If wildcard DNS is active (propagated)
  const wildcardWorks = false; // (We will switch this later)

  if (wildcardWorks) {
    return `https://${storeId}.mybuddymobile.com/`;
  }

  // Temporary fallback URL
  return `https://mybuddymobile.com/stores/${storeId}/`;
}
