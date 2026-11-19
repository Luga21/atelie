"use client";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { themeDataAttrs, themeToCssVars } from "./cssVars";
import { googleFontsHref } from "./fonts";
import type { Theme } from "./types";

/** Carrega as fontes do tema (Google Fonts) uma única vez por URL. */
export function useThemeFonts(theme: Theme) {
  const href = googleFontsHref(theme);
  useEffect(() => {
    if (!href || typeof document === "undefined") return;
    if (document.querySelector(`link[data-theme-font="${CSS.escape(href)}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.themeFont = href;
    document.head.appendChild(link);
  }, [href]);
}

/**
 * Raiz de conteúdo do treinamento (`.cr`): aplica variáveis CSS e atributos do tema.
 * Canvas, preview e player exportado usam este mesmo componente.
 */
export function ThemeScope({ theme, children, className, style }: {
  theme: Theme;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  useThemeFonts(theme);
  const vars = themeToCssVars(theme) as CSSProperties;
  return (
    <div className={`cr ${className ?? ""}`} style={{ ...vars, ...style }} {...themeDataAttrs(theme)}>
      {children}
    </div>
  );
}
