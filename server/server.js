const express = require("express");
const cors = require("cors");
const JSZip = require("jszip");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ status: "Generator is running" });
});

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.post("/generate", async (req, res) => {
  try {
    const payload = req.body || {};
    const branding = payload.branding || {};
    const firebase = payload.firebase || {};
    const products = Array.isArray(payload.products) ? payload.products : [];

    const appName = branding.name || "My Store";
    const primaryColor = branding.primaryColor || "#22c55e";
    const accentColor = branding.accentColor || "#16a34a";

    const zip = new JSZip();

    const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(appName)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="manifest" href="manifest.json" />
  <link rel="stylesheet" href="css/app.css" />
</head>
<body>
  <div id="app">
    <header class="app-header">
      <div class="app-title">${escapeHtml(appName)}</div>
      <div id="store-status" class="badge badge-open">Open</div>
    </header>

    <main id="view-storefront" class="view active">
      <section class="hero">
        <h1>Welcome to ${escapeHtml(appName)}</h1>
        <p class="hero-subtitle">Tap a product to see more details.</p>
      </section>
      <section id="product-list" class="product-list"></section>
    </main>

    <main id="view-admin" class="view">
      <section class="admin-login" id="admin-login">
        <h2>Admin Login</h2>
        <label>PIN</label>
        <input type="password" id="admin-pin-input" maxlength="8" />
        <button id="admin-pin-login-btn">Enter</button>
      </section>
      <section class="admin-panel hidden" id="admin-panel">
        <h2>Admin Panel</h2>
        <button id="toggle-open-btn">Toggle Open / Closed</button>
        <div class="admin-section">
          <h3>Products (read-only in this starter)</h3>
          <ul id="admin-product-list"></ul>
        </div>
      </section>
    </main>

    <nav class="bottom-nav">
      <button data-view="storefront" class="nav-btn active">Store</button>
      <button data-view="admin" class="nav-btn">Admin</button>
    </nav>
  </div>

  <script src="js/firebase-init.js"></script>
  <script src="js/app.js"></script>
</body>
</html>`;

    const appCss = `:root {
  --primary: ${primaryColor};
  --accent: ${accentColor};
  --bg: #050816;
  --surface: #020617;
  --surface-soft: #0b1120;
  --border-subtle: #1e293b;
  --text: #e5e7eb;
  --text-muted: #9ca3af;
  --danger: #ef4444;
  --success: #22c55e;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text",
    "Helvetica Neue", Arial, sans-serif;
  background: radial-gradient(circle at top, #1d283a 0, #020617 55%, #000 100%);
  color: var(--text);
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15,23,42,0.92);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
}

.app-title {
  font-weight: 600;
  letter-spacing: 0.04em;
}

.badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  border: 1px solid transparent;
}

.badge-open {
  background: rgba(34,197,94,0.12);
  border-color: rgba(34,197,94,0.5);
  color: #bbf7d0;
}

.badge-closed {
  background: rgba(248,113,113,0.12);
  border-color: rgba(248,113,113,0.6);
  color: #fecaca;
}

.view {
  display: none;
  flex: 1;
}

.view.active {
  display: block;
}

.hero {
  padding: 16px;
}

.hero h1 {
  font-size: 22px;
  margin: 0 0 4px;
}

.hero-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill,minmax(150px,1fr));
  gap: 12px;
  padding: 0 12px 80px;
}

.product-card {
  background: radial-gradient(circle at top, #1e293b 0, #020617 55%);
  border-radius: 18px;
  border: 1px solid rgba(148,163,184,0.18);
  padding: 10px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 18px 45px rgba(15,23,42,0.9);
  transform-origin: center;
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out,
    border-color 160ms ease-out;
}

.product-card:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 22px 55px rgba(15,23,42,1);
  border-color: rgba(94,234,212,0.5);
}

.product-media {
  height: 120px;
  border-radius: 14px;
  background: radial-gradient(circle at 0 0,#22c55e 0,#0f172a 40%,#020617 70%);
  margin-bottom: 8px;
}

.product-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.product-price {
  font-size: 13px;
  color: var(--text-muted);
}

.bottom-nav {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px;
  display: inline-flex;
  gap: 4px;
  background: rgba(15,23,42,0.96);
  border-radius: 999px;
  border: 1px solid rgba(148,163,184,0.4);
  backdrop-filter: blur(18px);
}

.nav-btn {
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 999px;
}

.nav-btn.active {
  background: linear-gradient(135deg,#22c55e,#4ade80);
  color: #032013;
}

.admin-login,
.admin-panel {
  padding: 16px;
}

.admin-section {
  margin-top: 18px;
}

.admin-panel.hidden {
  display: none;
}
`;

    const productsJson = JSON.stringify(products, null, 2);

    const appJs = `const state = {
  view: "storefront",
  adminPinHash: null,
  isOpen: true,
  products: ${productsJson}
};

function $(sel) {
  return document.querySelector(sel);
}

function $all(sel) {
  return Array.from(document.querySelectorAll(sel));
}

function hashPin(pin) {
  let h = 0;
  for (let i = 0; i < pin.length; i++) {
    h = (h << 5) - h + pin.charCodeAt(i);
    h |= 0;
  }
  return h.toString();
}

function init() {
  $all(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      switchView(view);
      $all(".nav-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  renderProducts();
  renderAdminProducts();

  const storedPin = localStorage.getItem("adminPinHash");
  if (!storedPin) {
    localStorage.setItem("adminPinHash", hashPin("1234"));
  }

  const pinBtn = $("#admin-pin-login-btn");
  if (pinBtn) {
    pinBtn.addEventListener("click", () => {
      const pinInput = $("#admin-pin-input");
      const pin = pinInput ? pinInput.value.trim() : "";
      const hash = hashPin(pin);
      const good = localStorage.getItem("adminPinHash") === hash;
      if (!good) {
        alert("Incorrect PIN (default is 1234 in this starter).");
        return;
      }
      const login = $("#admin-login");
      const panel = $("#admin-panel");
      if (login && panel) {
        login.classList.add("hidden");
        panel.classList.remove("hidden");
      }
    });
  }

  const toggleBtn = $("#toggle-open-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      state.isOpen = !state.isOpen;
      syncOpenClosedUI();
    });
  }

  syncOpenClosedUI();
}

function switchView(view) {
  state.view = view;
  $all(".view").forEach(v => v.classList.remove("active"));
  if (view === "storefront") {
    const s = $("#view-storefront");
    if (s) s.classList.add("active");
  } else if (view === "admin") {
    const a = $("#view-admin");
    if (a) a.classList.add("active");
  }
}

function syncOpenClosedUI() {
  const badge = $("#store-status");
  if (!badge) return;
  if (state.isOpen) {
    badge.textContent = "Open";
    badge.classList.remove("badge-closed");
    badge.classList.add("badge-open");
  } else {
    badge.textContent = "Closed";
    badge.classList.remove("badge-open");
    badge.classList.add("badge-closed");
  }
}

function renderProducts() {
  const container = $("#product-list");
  if (!container) return;
  container.innerHTML = "";
  if (!state.products || !state.products.length) {
    container.innerHTML = "<p style=\\"color:#9ca3af;font-size:14px;\\">No products configured yet.</p>";
    return;
  }
  state.products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = \`
      <div class="product-media"></div>
      <div class="product-name">\${p.name || "Product"}</div>
      <div class="product-price">\${p.price != null ? "$" + p.price : ""}</div>
    \`;
    container.appendChild(card);
  });
}

function renderAdminProducts() {
  const list = $("#admin-product-list");
  if (!list) return;
  list.innerHTML = "";
  (state.products || []).forEach(p => {
    const li = document.createElement("li");
    li.textContent = (p.name || "Product") + (p.price != null ? " — $" + p.price : "");
    list.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", init);
`;

    const firebaseInit = `const firebaseConfig = ${JSON.stringify(firebase, null, 2)};

// In a real app you would load Firebase SDK and do:
// firebase.initializeApp(firebaseConfig);
`;

    const manifestJson = {
      name: appName,
      short_name: appName.slice(0, 12),
      start_url: ".",
      display: "standalone",
      background_color: "#020617",
      theme_color: primaryColor,
      icons: []
    };

    const swJs = `self.addEventListener("install", (e) => {
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {});
self.addEventListener("fetch", (e) => {});
`;

    zip.file("index.html", indexHtml);
    zip.folder("css").file("app.css", appCss);
    const jsFolder = zip.folder("js");
    jsFolder.file("app.js", appJs);
    jsFolder.file("firebase-init.js", firebaseInit);
    zip.file("manifest.json", JSON.stringify(manifestJson, null, 2));
    zip.file("service-worker.js", swJs);

    const buf = await zip.generateAsync({ type: "nodebuffer" });

    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": "attachment; filename=pwa-site.zip"
    });
    res.send(buf);
  } catch (err) {
    console.error("Generation error:", err);
    res.status(500).json({ error: "Generation failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("PWA Generator running on port " + PORT);
});
