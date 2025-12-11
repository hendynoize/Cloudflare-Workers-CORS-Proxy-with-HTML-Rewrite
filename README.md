

# 🌀 Cloudflare Workers CORS Proxy with HTML Rewrite

### **Full Content Rewriter • CORS Bypass • Asset Fix (Images, CSS, JS, Favicon)**

Proyek ini adalah **reverse proxy berbasis Cloudflare Workers** yang mampu:

✔ Mem-bypass CORS
✔ Menjadi proxy penuh untuk website lain
✔ Rewrite teks dalam halaman
✔ Rewrite `<title>` dan meta tags
✔ Rewrite semua asset (gambar, CSS, JS, favicon) agar tetap muncul
✔ Rewrite absolute & relative link agar tidak rusak
✔ Dapat digunakan untuk scraping, embedding, atau front-end API proxy

Script ini tidak memerlukan Wrangler — cukup copy & paste ke Cloudflare Workers.

---

## 📌 Fitur Utama

| Fitur                                 | Deskripsi                                                 |
| ------------------------------------- | --------------------------------------------------------- |
| 🔁 **Reverse Proxy**                  | Meneruskan request dari browser ke website target         |
| ♻ **CORS Enabled**                    | Semua response dilengkapi header CORS (`*`)               |
| ✏ **Content Rewrite**                 | Mengubah teks tertentu dalam HTML                         |
| 🏷 **Title Rewrite**                  | Mengganti `<title>` secara otomatis                       |
| 🖼 **Asset Auto-Rewrite**             | Memastikan gambar, CSS, JS, favicon tetap muncul          |
| 🔗 **Fix Relative & Absolute URL**    | Semua link yang menuju target diarahkan kembali ke Worker |
| 🧩 **Compatible With All HTML Sites** | Termasuk static site seperti nginx.org                    |

---

## 📂 Struktur Proyek

```
/
└─ README.md
└─ worker.js
```

---

# 🚀 Cara Menggunakan

## 1. Buat Worker Baru

1. Buka **Cloudflare Dashboard**
2. Menu: **Workers & Pages** → **Create Worker**
3. Hapus semua kode default

---

## 2. Paste Script Berikut

> **File:** `worker.js`

```javascript
export default {
  async fetch(request, env) {
    const target = "https://www.nasa.gov"; // target utama

    const reqUrl = new URL(request.url);
    const proxyOrigin = reqUrl.origin;
    const targetUrl = new URL(target + reqUrl.pathname + reqUrl.search);

    // Fetch ke target
    const originalResponse = await fetch(targetUrl, {
      method: request.method,
      headers: {
        "Origin": "https://www.nasa.gov",
        "Referer": "https://www.nasa.gov/",
        "User-Agent": "Mozilla/5.0"
      }
    });

    const contentType = originalResponse.headers.get("content-type") || "";

    // Clone header dan tambahkan CORS
    const newHeaders = new Headers(originalResponse.headers);
    newHeaders.set("Access-Control-Allow-Origin", "*");
    newHeaders.set("Access-Control-Allow-Headers", "*");
    newHeaders.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

    // Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: newHeaders });
    }

    // Jika konten bukan HTML → jangan rewrite, langsung pass-through
    if (!contentType.includes("text/html")) {
      return new Response(originalResponse.body, {
        status: originalResponse.status,
        headers: newHeaders
      });
    }

    // Ambil HTML
    let html = await originalResponse.text();

    // -----------------------------
    // 🔧 Rewrite Content
    // -----------------------------

    // Replace text biasa
    html = html.replace(/For the Benefit of All/g, "Github Hendynoize");
    html = html.replace(/Featured News/g, "Latest News");
    // Replace tag title
    html = html.replace(
      /<title>(.*?)<\/title>/i,
      "<title>ASAN</title>"
    );

    // -----------------------------
    // 🔧 Rewrite Asset URL (gambar, css, js, favicon)
    // -----------------------------
    // Rewrite src, href, data-src → agar tetap lewat proxy
    html = html.replace(
      /(src|href|data-src)=["'](\/[^"']*)["']/gi,
      (match, attr, path) => {
        return `${attr}="${proxyOrigin}${path}"`;
      }
    );

    // Rewrite absolute URL menuju hostname target
    html = html.replace(
      new RegExp(`(https?:\/\/${escapeRegExp(new URL(target).hostname)})([^"'>]+)`, "gi"),
      (match, domain, path) => {
        return `${proxyOrigin}${path}`;
      }
    );

    return new Response(html, {
      status: originalResponse.status,
      headers: newHeaders
    });
  }
};


// Utility untuk escape regex
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

```

---

# ⚙ Konfigurasi

### Ganti target website:

```js
const target = "https://nasa.gov";
```

Kamu dapat menggantinya dengan website apa saja:

```
https://example.com
https://docs.python.org
https://news.ycombinator.com
```

---

# 🧪 Contoh Penggunaan (Front-End)

```js
fetch("https://your-worker.workers.dev/en/", {
  mode: "cors"
})
  .then(res => res.text())
  .then(html => {
    document.getElementById("output").innerHTML = html;
  });
```

---

# 🖼 Asset Rewrite: Cara Kerja

Worker otomatis memperbaiki:

| Tipe         | Contoh Awal                  | Hasil Rewrite                            |
| ------------ | ---------------------------- | ---------------------------------------- |
| Gambar       | `/img/logo.png`              | `https://worker-domain.com/img/logo.png` |
| CSS          | `/style.css`                 | `https://worker-domain.com/style.css`    |
| JS           | `/js/main.js`                | `https://worker-domain.com/js/main.js`   |
| Favicon      | `/favicon.ico`               | `https://worker-domain.com/favicon.ico`  |
| Link absolut | `https://nginx.org/en/docs/` | `https://worker-domain.com/en/docs/`     |

Ini memastikan halaman proxy **tampil utuh tanpa gambar hilang**.

---

# 🔒 Batasan

Cloudflare Workers memiliki batasan:

* Streaming video besar dapat ditolak
* Beberapa situs memiliki CSP ketat
* Site dinamis dengan session/cookie kompleks bisa tidak stabil
* Tidak mendukung WebSockets 100% untuk semua website

---

# 🧰 Roadmap (Opsional)

Planned features:

* 🔧 Rewrite meta `<meta name="description">`
* 🖼 Rewrite OpenGraph tags
* 🧹 Remove/modify CSP header
* 🚀 Cache otomatis dengan Cloudflare Cache API
* 🔒 Whitelist domain yang boleh akses Worker

Jika Anda ingin fitur ini, silakan buka issue.

---

# 🤝 Kontribusi

Pull Request sangat diterima!
Sertakan:

* penjelasan fitur
* screenshot sebelum/after (jika UI)
* code clean & modular
* tidak memecahkan kompatibilitas existing

---

# 📄 Lisensi

Proyek ini dirilis dengan lisensi **MIT**.
Bebas digunakan untuk komersial maupun personal.

---

# ⭐ Jika proyek ini membantu

Berikan ⭐ di GitHub dan kembangkan dengan fork & PR!

---


