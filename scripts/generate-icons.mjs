// Gera os ícones do app (PWA, favicon, iOS) a partir do logo vetorial, sem dependências.
// Uso: node scripts/generate-icons.mjs   (os PNGs gerados são versionados no repositório)
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/* --------------------------------------------------------- PNG mínimo */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bits
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------- Geometria do logo */
// Letra "A" do logo, no sistema 32×32 do SVG original (preenchimento par-ímpar).
const LETTER = [
  [[9, 22.5], [15.2, 9], [16.8, 9], [23, 22.5], [19.9, 22.5], [18.6, 19.5], [13.4, 19.5], [12.1, 22.5]],
  [[14.4, 16.9], [17.6, 16.9], [16, 13.1]],
];
const FROM = [0x9a, 0x85, 0xff];
const TO = [0x55, 0x36, 0xd6];

function insideEvenOdd(x, y, polys) {
  let inside = false;
  for (const poly of polys)
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  return inside;
}

function insideRoundedRect(x, y, size, r) {
  const cx = Math.min(Math.max(x, r), size - r);
  const cy = Math.min(Math.max(y, r), size - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/**
 * @param size      lado em px
 * @param rounded   cantos arredondados (false = fundo sangrado, para ícones "maskable"/iOS)
 * @param letterBox fração do lado ocupada pela área 32×32 do logo
 */
function renderIcon(size, { rounded, letterBox }) {
  const S = 4; // supersampling 4×4
  const out = Buffer.alloc(size * size * 4);
  const scale = (size * letterBox) / 32;
  const offset = (size - size * letterBox) / 2;
  const radius = rounded ? (size * 9) / 32 : 0;
  for (let py = 0; py < size; py++)
    for (let px = 0; px < size; px++) {
      let bg = 0;
      let fg = 0;
      for (let sy = 0; sy < S; sy++)
        for (let sx = 0; sx < S; sx++) {
          const x = px + (sx + 0.5) / S;
          const y = py + (sy + 0.5) / S;
          if (rounded && !insideRoundedRect(x, y, size, radius)) continue;
          bg++;
          if (insideEvenOdd((x - offset) / scale, (y - offset) / scale, LETTER)) fg++;
        }
      const t = (px + py) / (2 * size);
      const base = FROM.map((c, i) => c + (TO[i] - c) * t);
      const cover = fg / bg || 0;
      const i = (py * size + px) * 4;
      for (let k = 0; k < 3; k++) out[i + k] = Math.round(base[k] * (1 - cover) + 255 * cover);
      out[i + 3] = Math.round((bg / (S * S)) * 255);
    }
  return encodePng(size, size, out);
}

const targets = [
  // Manifesto PWA
  { file: "public/icons/icon-192.png", size: 192, rounded: true, letterBox: 1 },
  { file: "public/icons/icon-512.png", size: 512, rounded: true, letterBox: 1 },
  // "maskable": o sistema recorta o formato; o conteúdo fica na zona segura (80% central)
  { file: "public/icons/icon-maskable-512.png", size: 512, rounded: false, letterBox: 0.78 },
  // Convenções de arquivo do Next.js (geram as tags <link> com o basePath correto)
  { file: "src/app/icon.png", size: 64, rounded: true, letterBox: 1 },
  { file: "src/app/apple-icon.png", size: 180, rounded: false, letterBox: 0.9 },
];

for (const t of targets) {
  const abs = path.join(root, t.file);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, renderIcon(t.size, t));
  console.log(`✓ ${t.file} (${t.size}px)`);
}
