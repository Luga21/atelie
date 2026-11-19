import { FONTS } from "./fonts";
import type { Theme } from "./types";

/** Converte "#RRGGBB" em luminância relativa (WCAG). */
function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0.5;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** Cor de texto legível sobre a cor informada. */
export function contrastText(hex: string): string {
  return luminance(hex) > 0.45 ? "#111318" : "#FFFFFF";
}

export function isDark(hex: string): boolean {
  return luminance(hex) < 0.2;
}

const HEADING_SCALE = { sm: 1.18, md: 1.25, lg: 1.33, xl: 1.42 } as const;
const RADIUS = { none: 0, sm: 4, md: 8, lg: 14, xl: 22 } as const;
const SHADOW = {
  none: "none",
  sm: "0 1px 2px rgb(16 24 40 / 0.06), 0 1px 3px rgb(16 24 40 / 0.08)",
  md: "0 4px 12px rgb(16 24 40 / 0.08), 0 2px 4px rgb(16 24 40 / 0.05)",
  lg: "0 18px 40px rgb(16 24 40 / 0.14), 0 4px 10px rgb(16 24 40 / 0.06)",
} as const;
const CONTENT_WIDTH = { narrow: 640, medium: 760, wide: 920 } as const;
const BLOCK_SPACING = { compact: 0.6, normal: 1, relaxed: 1.45 } as const;

/**
 * Gera as variáveis CSS do tema. São aplicadas na raiz `.cr` do conteúdo
 * (canvas do editor, preview e player exportado), garantindo aparência idêntica.
 */
export function themeToCssVars(theme: Theme): Record<string, string> {
  const { colors: c, typography: t, components: k, layout: l } = theme;
  const s = HEADING_SCALE[t.headingScale] ?? 1.25;
  const base = t.bodySize;
  const r = RADIUS[k.radius] ?? 8;
  return {
    "--c-primary": c.primary,
    "--c-on-primary": contrastText(c.primary),
    "--c-secondary": c.secondary,
    "--c-on-secondary": contrastText(c.secondary),
    "--c-accent": c.accent,
    "--c-on-accent": contrastText(c.accent),
    "--c-bg": c.background,
    "--c-surface": c.surface,
    "--c-text": c.text,
    "--c-muted": c.textMuted,
    "--c-border": c.border,
    "--c-success": c.success,
    "--c-danger": c.danger,
    "--c-dark": isDark(c.background) ? "#000000" : c.secondary,
    "--c-on-dark": isDark(c.background) ? c.text : contrastText(c.secondary),
    "--f-heading": FONTS[t.headingFont]?.stack ?? FONTS.system.stack,
    "--f-body": FONTS[t.bodyFont]?.stack ?? FONTS.system.stack,
    "--fw-heading": String(t.headingWeight),
    "--fw-body": String(t.bodyWeight),
    "--fs-body": `${base}px`,
    "--fs-small": `${Math.round(base * 0.85)}px`,
    "--fs-h4": `${(base * s).toFixed(1)}px`,
    "--fs-h3": `${(base * s * s).toFixed(1)}px`,
    "--fs-h2": `${(base * s * s * s).toFixed(1)}px`,
    "--fs-h1": `${(base * s * s * s * s).toFixed(1)}px`,
    "--radius": `${r}px`,
    "--radius-sm": `${Math.round(r * 0.6)}px`,
    "--radius-lg": `${Math.round(r * 1.5)}px`,
    "--shadow": SHADOW[k.shadow] ?? SHADOW.sm,
    "--content-w": `${CONTENT_WIDTH[l.contentWidth] ?? 760}px`,
    "--block-space": String(BLOCK_SPACING[l.blockSpacing] ?? 1),
  };
}

/** Atributos de dados que ativam variações de componentes no CSS (botões, cards, interativos). */
export function themeDataAttrs(theme: Theme): Record<string, string> {
  return {
    "data-btn": theme.components.buttonStyle,
    "data-card": theme.components.cardStyle,
    "data-interactive": theme.components.interactiveStyle,
    "data-scheme": isDark(theme.colors.background) ? "dark" : "light",
  };
}
