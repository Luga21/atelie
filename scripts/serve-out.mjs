// Serve a pasta out/ como o GitHub Pages faria, inclusive sob um caminho base.
// Uso: npm run preview:pages            → http://localhost:4173/atelie/
//      BASE=/outro npm run preview:pages
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../out");
const base = (process.env.BASE ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "/atelie").replace(/\/+$/, "");
const port = Number(process.env.PORT ?? 4173);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".txt": "text/plain", ".woff2": "font/woff2",
};

async function resolveFile(urlPath) {
  const rel = decodeURIComponent(urlPath).replace(/^\/+/, "");
  const candidate = path.join(root, rel);
  if (!candidate.startsWith(root)) return null;
  for (const p of [candidate, path.join(candidate, "index.html"), `${candidate}.html`]) {
    try {
      if ((await stat(p)).isFile()) return p;
    } catch {
      /* tenta o próximo */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  if (base && pathname === "/") {
    res.writeHead(302, { Location: `${base}/` }).end();
    return;
  }
  if (base && !pathname.startsWith(`${base}/`) && pathname !== base) {
    res.writeHead(404).end("Fora do caminho base");
    return;
  }
  const file = await resolveFile(pathname.slice(base.length) || "/");
  if (!file) {
    res.writeHead(404).end("Não encontrado");
    return;
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  res.end(await readFile(file));
}).listen(port, () => console.log(`Servindo out/ em http://localhost:${port}${base}/`));
