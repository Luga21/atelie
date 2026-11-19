// Compila o player standalone (usado na exportação HTML) para public/runtime/.
// O mesmo código do player e dos renderizadores de blocos da aplicação é empacotado aqui,
// garantindo que o treinamento exportado se comporte exatamente como o preview.
//
//   node scripts/build-runtime.mjs          → build único (usado no prebuild)
//   node scripts/build-runtime.mjs --watch  → recompila a cada alteração (usado no dev)
import { build, context } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** @type {import("esbuild").BuildOptions} */
export const options = {
  entryPoints: { player: path.join(root, "src/runtime/standalone.tsx") },
  outdir: path.join(root, "public/runtime"),
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  jsx: "automatic",
  alias: { "@": path.join(root, "src") },
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("[runtime] observando alterações do player…");
} else {
  await build(options);
}
