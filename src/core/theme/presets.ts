import type { Theme } from "./types";

export interface ThemePreset {
  id: string;
  name: string;
  theme: Theme;
}

const base: Theme = {
  presetId: "aurora",
  colors: {
    primary: "#3D5AFE",
    secondary: "#0F172A",
    accent: "#FFB020",
    background: "#FFFFFF",
    surface: "#F4F6FB",
    text: "#141A2B",
    textMuted: "#5B6478",
    border: "#E2E6EF",
    success: "#12A150",
    danger: "#E5484D",
  },
  typography: {
    headingFont: "plus-jakarta",
    bodyFont: "inter",
    headingScale: "md",
    bodySize: 17,
    headingWeight: 700,
    bodyWeight: 400,
  },
  components: {
    radius: "md",
    buttonStyle: "solid",
    shadow: "sm",
    cardStyle: "outlined",
    interactiveStyle: "subtle",
  },
  layout: {
    contentWidth: "medium",
    blockSpacing: "normal",
    navigation: "sidebar",
    header: "banner",
    coverStyle: "full",
  },
};

function preset(id: string, name: string, patch: {
  colors?: Partial<Theme["colors"]>;
  typography?: Partial<Theme["typography"]>;
  components?: Partial<Theme["components"]>;
  layout?: Partial<Theme["layout"]>;
}): ThemePreset {
  return {
    id,
    name,
    theme: {
      presetId: id,
      colors: { ...base.colors, ...patch.colors },
      typography: { ...base.typography, ...patch.typography },
      components: { ...base.components, ...patch.components },
      layout: { ...base.layout, ...patch.layout },
    },
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  preset("aurora", "Aurora", {}),
  preset("grafite", "Grafite", {
    colors: {
      primary: "#7C5CFF", secondary: "#E7E9F0", accent: "#2DD4BF",
      background: "#0E0F13", surface: "#181A21", text: "#ECEEF4", textMuted: "#9AA1B2", border: "#2A2D37",
      success: "#3DD68C", danger: "#FF6369",
    },
    typography: { headingFont: "space-grotesk", bodyFont: "inter" },
    components: { radius: "lg", cardStyle: "outlined", shadow: "none" },
    layout: { header: "hero" },
  }),
  preset("floresta", "Floresta", {
    colors: {
      primary: "#0F7B5F", secondary: "#123A31", accent: "#E9B949",
      background: "#FBFAF6", surface: "#EFF3EC", text: "#18241F", textMuted: "#5A6B63", border: "#DCE3D8",
    },
    typography: { headingFont: "dm-sans", bodyFont: "dm-sans", headingWeight: 700 },
    components: { radius: "lg", buttonStyle: "pill", cardStyle: "elevated", shadow: "md" },
    layout: { coverStyle: "split" },
  }),
  preset("coral", "Coral", {
    colors: {
      primary: "#F2545B", secondary: "#2B2D42", accent: "#3FA7D6",
      background: "#FFFFFF", surface: "#FFF4F1", text: "#22232E", textMuted: "#62657A", border: "#F0E1DC",
    },
    typography: { headingFont: "poppins", bodyFont: "manrope", headingScale: "lg" },
    components: { radius: "xl", buttonStyle: "pill", cardStyle: "elevated", shadow: "md", interactiveStyle: "bold" },
  }),
  preset("editorial", "Editorial", {
    colors: {
      primary: "#1E3A5F", secondary: "#8A5A2B", accent: "#C8553D",
      background: "#FFFDF8", surface: "#F5F0E6", text: "#1F1B16", textMuted: "#6B6257", border: "#E6DED0",
    },
    typography: { headingFont: "playfair", bodyFont: "source-serif", headingScale: "lg", bodySize: 18, headingWeight: 600 },
    components: { radius: "none", buttonStyle: "outline", shadow: "none", cardStyle: "flat" },
    layout: { contentWidth: "narrow", header: "minimal", coverStyle: "minimal", navigation: "top" },
  }),
];

export function defaultTheme(): Theme {
  return structuredClone(THEME_PRESETS[0].theme);
}
