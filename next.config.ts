import type { NextConfig } from "next";

/**
 * A aplicação é 100% client-side (persistência em IndexedDB), então usamos export estático:
 * `npm run build` gera `out/`, hospedável em qualquer servidor estático (ex.: GitHub Pages).
 *
 * NEXT_PUBLIC_BASE_PATH permite publicar numa subpasta, como https://conta.github.io/nome-do-repo.
 * Localmente fica vazio. O workflow de deploy define o valor automaticamente.
 */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  // Gera editor/index.html (em vez de editor.html): funciona em qualquer servidor estático.
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
