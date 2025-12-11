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
