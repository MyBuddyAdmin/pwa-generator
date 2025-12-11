const ftp = require("basic-ftp");

async function publishToHostGator(storeName, files) {
    const client = new ftp.Client();
    client.ftp.verbose = false;

    try {
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            port: process.env.FTP_PORT || 21,
            secure: false
        });

        const targetPath = `/public_html/${storeName}`;

        await client.ensureDir(targetPath);

        for (const file of files) {
            await client.uploadFrom(Buffer.from(file.content), `${targetPath}/${file.name}`);
        }

        client.close();

        return {
            success: true,
            url: `https://${storeName}.mybuddymobile.com`
        };

    } catch (err) {
        console.error("FTP ERROR:", err);
        return { success: false, error: err.message };
    }
}

module.exports = publishToHostGator;
