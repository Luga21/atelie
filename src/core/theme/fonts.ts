import type { FontId, Theme } from "./types";

interface FontDef {
  label: string;
  stack: string;
  /** Família no Google Fonts (null = fonte do sistema). */
  google: string | null;
  kind: "sans" | "serif";
}

export const FONTS: Record<FontId, FontDef> = {
  inter: { label: "Inter", stack: "'Inter', system-ui, sans-serif", google: "Inter", kind: "sans" },
  manrope: { label: "Manrope", stack: "'Manrope', system-ui, sans-serif", google: "Manrope", kind: "sans" },
  "plus-jakarta": { label: "Plus Jakarta Sans", stack: "'Plus Jakarta Sans', system-ui, sans-serif", google: "Plus Jakarta Sans", kind: "sans" },
  "dm-sans": { label: "DM Sans", stack: "'DM Sans', system-ui, sans-serif", google: "DM Sans", kind: "sans" },
  poppins: { label: "Poppins", stack: "'Poppins', system-ui, sans-serif", google: "Poppins", kind: "sans" },
  montserrat: { label: "Montserrat", stack: "'Montserrat', system-ui, sans-serif", google: "Montserrat", kind: "sans" },
  "space-grotesk": { label: "Space Grotesk", stack: "'Space Grotesk', system-ui, sans-serif", google: "Space Grotesk", kind: "sans" },
  "ibm-plex": { label: "IBM Plex Sans", stack: "'IBM Plex Sans', system-ui, sans-serif", google: "IBM Plex Sans", kind: "sans" },
  lora: { label: "Lora", stack: "'Lora', Georgia, serif", google: "Lora", kind: "serif" },
  merriweather: { label: "Merriweather", stack: "'Merriweather', Georgia, serif", google: "Merriweather", kind: "serif" },
  playfair: { label: "Playfair Display", stack: "'Playfair Display', Georgia, serif", google: "Playfair Display", kind: "serif" },
  "source-serif": { label: "Source Serif 4", stack: "'Source Serif 4', Georgia, serif", google: "Source Serif 4", kind: "serif" },
  system: { label: "Fonte do sistema", stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", google: null, kind: "sans" },
};

export const FONT_OPTIONS = (Object.keys(FONTS) as FontId[]).map((id) => ({ value: id, label: FONTS[id].label }));

/** URL do Google Fonts para as fontes do tema (ou null se só usar fontes do sistema). */
export function googleFontsHref(theme: Theme): string | null {
  const families = new Set<string>();
  for (const id of [theme.typography.headingFont, theme.typography.bodyFont]) {
    const g = FONTS[id]?.google;
    if (g) families.add(g);
  }
  if (families.size === 0) return null;
  const params = [...families]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@300;400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
