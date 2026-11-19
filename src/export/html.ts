/**
 * Exportação do treinamento como pacote HTML independente (.zip):
 *
 *   index.html          → página que carrega o player
 *   assets/player.js    → player compilado (mesmo código do preview)
 *   assets/player.css   → estilos do conteúdo
 *   data/course.js      → documento do treinamento (window.__COURSE__)
 *   media/*             → imagens e vídeos enviados
 *
 * Os dados ficam em um .js (e não .json) para funcionar ao abrir o index.html direto
 * do disco (file://), onde fetch() de arquivos locais é bloqueado.
 * Um exportador SCORM reutilizará este pacote acrescentando imsmanifest.xml e o adaptador de API.
 */
import { strToU8, zipSync, type Zippable } from "fflate";
import { collectAssetIds } from "@/core/model/schema";
import type { Course } from "@/core/model/types";
import { withBase } from "@/core/env";
import { googleFontsHref } from "@/core/theme/fonts";
import { assetRepository } from "@/storage/repository";
import { downloadBlob, extensionFor, slugify } from "./download";

function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Serializa para inclusão segura dentro de <script>. */
function jsonForScript(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(new RegExp("\\u2028", "g"), "\\u2028")
    .replace(new RegExp("\\u2029", "g"), "\\u2029");
}

async function fetchRuntime(path: string): Promise<Uint8Array> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Runtime do player indisponível (${path}). Rode "npm run build:runtime".`);
  return new Uint8Array(await res.arrayBuffer());
}

export interface HtmlPackage {
  files: Zippable;
  entry: string;
}

export type ExportTarget = "html" | "scorm12" | "scorm2004";

export async function buildHtmlPackage(course: Course, target: ExportTarget = "html"): Promise<HtmlPackage> {
  const [js, css] = await Promise.all([fetchRuntime(withBase("/runtime/player.js")), fetchRuntime(withBase("/runtime/player.css"))]);

  const media: Zippable = {};
  const assetPaths: Record<string, string> = {};
  for (const id of collectAssetIds(course)) {
    const a = await assetRepository.get(id);
    if (!a) continue;
    const path = `media/${id}.${extensionFor(a.mime, a.name)}`;
    media[`${id}.${extensionFor(a.mime, a.name)}`] = new Uint8Array(await a.blob.arrayBuffer());
    assetPaths[id] = path;
  }

  const fonts = googleFontsHref(course.theme);
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(course.title)}</title>
<meta name="description" content="${escapeHtml(course.description)}">
${fonts ? `<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="${fonts}">` : ""}
<link rel="stylesheet" href="assets/player.css">
<style>html,body{margin:0;min-height:100%;background:${escapeHtml(course.theme.colors.background)}}#app{min-height:100vh}</style>
</head>
<body>
<div id="app"></div>
<noscript>Este treinamento requer JavaScript habilitado.</noscript>
<script src="data/course.js"></script>
<script src="assets/player.js"></script>
</body>
</html>
`;

  const data =
    `window.__COURSE__ = ${jsonForScript(course)};\n` +
    `window.__ASSETS__ = ${jsonForScript(assetPaths)};\n` +
    `window.__EXPORT_TARGET__ = ${jsonForScript(target)};\n`;

  return {
    entry: "index.html",
    files: {
      "index.html": strToU8(html),
      assets: { "player.js": js, "player.css": css },
      data: { "course.js": strToU8(data) },
      ...(Object.keys(media).length ? { media } : {}),
    },
  };
}

export async function exportCourseHtml(course: Course) {
  const pkg = await buildHtmlPackage(course);
  const zipped = zipSync(pkg.files, { level: 6 });
  downloadBlob(new Blob([zipped as BlobPart], { type: "application/zip" }), `${slugify(course.title)}-html.zip`);
}
