/**
 * Sistema de temas. Toda a aparência do conteúdo do treinamento deriva destes tokens,
 * convertidos em variáveis CSS por `themeToCssVars`. Blocos nunca guardam cores livres.
 */
export type FontId =
  | "inter"
  | "manrope"
  | "plus-jakarta"
  | "dm-sans"
  | "poppins"
  | "montserrat"
  | "space-grotesk"
  | "ibm-plex"
  | "lora"
  | "merriweather"
  | "playfair"
  | "source-serif"
  | "system";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
}

export interface ThemeTypography {
  headingFont: FontId;
  bodyFont: FontId;
  headingScale: "sm" | "md" | "lg" | "xl";
  bodySize: number; // px
  headingWeight: 500 | 600 | 700 | 800;
  bodyWeight: 300 | 400 | 500;
}

export interface ThemeComponents {
  radius: "none" | "sm" | "md" | "lg" | "xl";
  buttonStyle: "solid" | "soft" | "outline" | "pill";
  shadow: "none" | "sm" | "md" | "lg";
  cardStyle: "flat" | "outlined" | "elevated";
  interactiveStyle: "subtle" | "bold";
}

export interface ThemeLayout {
  contentWidth: "narrow" | "medium" | "wide";
  blockSpacing: "compact" | "normal" | "relaxed";
  navigation: "sidebar" | "top";
  header: "minimal" | "banner" | "hero";
  coverStyle: "full" | "split" | "minimal";
}

export interface Theme {
  presetId: string | null;
  colors: ThemeColors;
  typography: ThemeTypography;
  components: ThemeComponents;
  layout: ThemeLayout;
}
